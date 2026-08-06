import { prisma } from '../prisma';
import fs from 'fs';
import { recognizeMealFromImage } from './gemini';
import { generateAndSaveThumbnail } from './imageService';
import { AppError } from '../middleware/error';
import * as queueService from '../jobs/queue.service';

export const createRecognitionJob = async (userId: string, imagePath: string) => {
  return queueService.enqueue(userId, imagePath);
};

export const processRecognitionJob = async (jobId: string, mealId: string, imagePath: string) => {
  try {
    const result = await recognizeMealFromImage(imagePath);

    await prisma.meal.update({
      where: { id: mealId },
      data: {
        calories: result.calories,
        protein: result.protein,
        carbs: result.carbs,
        fat: result.fat,
        title: result.title,
        recognizedText: result.description,
      },
    });

    await prisma.recognitionJob.update({
      where: { id: jobId },
      data: {
        status: 'COMPLETED',
        result: JSON.stringify(result),
      },
    });
  } catch (err) {
    console.error('Background recognition failed:', err);
    await prisma.recognitionJob.update({
      where: { id: jobId },
      data: { status: 'FAILED' },
    });
    
    if (mealId) {
      try {
        await prisma.meal.delete({ where: { id: mealId } });
      } catch (deleteErr) {
        console.error('Failed to delete empty meal on job failure:', deleteErr);
      }
    }
    
    fs.unlink(imagePath, (unlinkErr) => {
      if (unlinkErr && unlinkErr.code !== 'ENOENT') {
        console.error('Failed to delete temp file:', unlinkErr);
      }
    });
  }
};

export const getJobStatus = async (jobId: string) => {
  const job = await prisma.recognitionJob.findUnique({
    where: { id: jobId },
  });

  if (!job) {
    throw new AppError('Job not found', 404);
  }

  return {
    jobId: job.id,
    status: job.status,
    result: job.result ? JSON.parse(job.result) : null,
    mealId: job.mealId,
  };
};

export const updateMeal = async (
  userId: string,
  mealId: string,
  data: {
    title?: string;
    calories?: number;
    protein?: number;
    fat?: number;
    carbs?: number;
    recognizedText?: string;
  }
) => {
  const meal = await prisma.meal.findUnique({ where: { id: mealId } });
  if (!meal) throw new AppError('Meal not found', 404);
  if (meal.userId !== userId) throw new AppError('Forbidden', 403);

  let thumbnailUrl: string | undefined;
  if (meal.imageUrl) {
    try {
      thumbnailUrl = await generateAndSaveThumbnail(userId, meal.imageUrl);
    } catch (err) {
      console.error('Failed to generate thumbnail:', err);
    }
    fs.unlink(meal.imageUrl, (err) => {
      if (err && err.code !== 'ENOENT') {
        console.error('Failed to delete temp image on meal update:', err);
      }
    });
  }

  const updatedMeal = await prisma.meal.update({
    where: { id: mealId },
    data: {
      title: data.title !== undefined ? data.title : meal.title,
      calories: data.calories !== undefined ? data.calories : meal.calories,
      protein: data.protein !== undefined ? data.protein : meal.protein,
      fat: data.fat !== undefined ? data.fat : meal.fat,
      carbs: data.carbs !== undefined ? data.carbs : meal.carbs,
      recognizedText: data.recognizedText !== undefined ? data.recognizedText : meal.recognizedText,
      imageUrl: null,
      ...(thumbnailUrl && { thumbnailUrl }),
    }
  });

  return updatedMeal;
};

export const deleteMeal = async (userId: string, mealId: string) => {
  const meal = await prisma.meal.findUnique({
    where: { id: mealId },
    include: { recognitionJob: true }
  });

  if (!meal) throw new AppError('Meal not found', 404);
  if (meal.userId !== userId) throw new AppError('Forbidden', 403);

  const pathsToDelete = new Set<string>();
  if (meal.imageUrl) pathsToDelete.add(meal.imageUrl);
  if (meal.recognitionJob?.imagePath) pathsToDelete.add(meal.recognitionJob.imagePath);

  pathsToDelete.forEach((filePath) => {
    fs.unlink(filePath, (err) => {
      if (err && err.code !== 'ENOENT') {
        console.error('Failed to delete image file on meal delete:', err);
      }
    });
  });

  if (meal.recognitionJob) {
    await prisma.recognitionJob.delete({ where: { id: meal.recognitionJob.id } });
  }

  await prisma.meal.delete({ where: { id: mealId } });
};

export const reanalyzeMeal = async (userId: string, mealId: string, prompt: string) => {
  const meal = await prisma.meal.findUnique({
    where: { id: mealId },
    include: { recognitionJob: true }
  });

  if (!meal) throw new AppError('Meal not found', 404);
  if (meal.userId !== userId) throw new AppError('Forbidden', 403);

  if (!meal.imageUrl || !fs.existsSync(meal.imageUrl)) {
    throw new AppError('Original image not available for re-analysis', 400);
  }

  const result = await recognizeMealFromImage(meal.imageUrl, prompt);

  const updatedMeal = await prisma.meal.update({
    where: { id: mealId },
    data: {
      calories: result.calories,
      protein: result.protein,
      carbs: result.carbs,
      fat: result.fat,
      title: result.title,
      recognizedText: result.description,
    }
  });

  if (meal.recognitionJob) {
    await prisma.recognitionJob.update({
      where: { id: meal.recognitionJob.id },
      data: {
        status: 'COMPLETED',
        result: JSON.stringify(result),
      }
    });
  }

  return { updatedMeal, result };
};
