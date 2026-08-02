import { Request, Response, NextFunction } from 'express';
import { prisma } from '../prisma';
import fs from 'fs';
import { recognizeMealFromImage } from '../services/gemini';
import { AuthRequest } from '../middleware/auth';
import { AppError } from '../middleware/error';

export const recognizeMeal = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return next(new AppError('Unauthorized', 401));
    }

    if (!req.file) {
      return next(new AppError('No image uploaded', 400));
    }

    const imagePath = req.file.path;

    // Create a pending job
    const job = await prisma.recognitionJob.create({
      data: {
        // We temporarily create a meal with empty data to attach the job to it
        meal: {
          create: {
            userId,
            loggedAt: new Date(),
            calories: 0,
          },
        },
        status: 'PENDING',
      },
      include: {
        meal: true,
      }
    });

    res.status(202).json({
      message: 'Image received, recognition started',
      jobId: job.id,
      mealId: job.mealId,
    });

    // Run recognition in background
    (async () => {
      try {
        const result = await recognizeMealFromImage(imagePath);
        
        await prisma.meal.update({
          where: { id: job.mealId },
          data: {
            calories: result.calories,
            protein: result.protein,
            carbs: result.carbs,
            fat: result.fat,
            // Assuming we could save health warnings in a notes field or similar.
            // Since Meal model doesn't have a direct field, let's put it in recognizedText
            recognizedText: result.health_warnings,
          },
        });

        await prisma.recognitionJob.update({
          where: { id: job.id },
          data: {
            status: 'COMPLETED',
            result: JSON.stringify(result),
          },
        });
      } catch (err) {
        console.error('Background recognition failed:', err);
        await prisma.recognitionJob.update({
          where: { id: job.id },
          data: {
            status: 'FAILED',
          },
        });
      } finally {
        // Clean up the temporary file
        fs.unlink(imagePath, (err) => {
          if (err) console.error('Failed to delete temp file:', err);
        });
      }
    })();

  } catch (error) {
    // If something fails early, cleanup the file
    if (req.file) {
      fs.unlink(req.file.path, () => {});
    }
    next(error);
  }
};

export const getJobStatus = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const id = req.params.id as string;
    
    const job = await prisma.recognitionJob.findUnique({
      where: { id },
    });

    if (!job) {
      return next(new AppError('Job not found', 404));
    }

    res.json({
      jobId: job.id,
      status: job.status,
      result: job.result ? JSON.parse(job.result) : null,
    });
  } catch (error) {
    next(error);
  }
};
