import { Response, NextFunction } from 'express';
import fs from 'fs';
import { AuthRequest } from '../middleware/auth';
import { AppError } from '../middleware/error';
import * as mealService from '../services/mealService';

export const recognizeMeal = async (req: AuthRequest, res: Response, next: NextFunction) => {
  const userId = req.user?.id;
  if (!userId) return next(new AppError('Unauthorized', 401));
  if (!req.file) return next(new AppError('No image uploaded', 400));

  const imagePath = req.file.path;

  try {
    const job = await mealService.createRecognitionJob(userId, imagePath);

    res.status(202).json({
      message: 'Image received, recognition started',
      jobId: job.id,
      mealId: job.mealId,
    });
  } catch (error) {
    fs.unlink(imagePath, () => { });
    throw error;
  }
};

export const getJobStatus = async (req: AuthRequest, res: Response, next: NextFunction) => {
  const id = req.params.id as string;
  const status = await mealService.getJobStatus(id);
  res.json(status);
};

export const updateMeal = async (req: AuthRequest, res: Response, next: NextFunction) => {
  const id = req.params.id as string;
  const userId = req.user?.id;
  if (!userId) return next(new AppError('Unauthorized', 401));

  const updatedMeal = await mealService.updateMeal(userId, id, req.body);
  res.json({ message: 'Meal updated successfully', meal: updatedMeal });
};

export const deleteMeal = async (req: AuthRequest, res: Response, next: NextFunction) => {
  const id = req.params.id as string;
  const userId = req.user?.id;
  if (!userId) return next(new AppError('Unauthorized', 401));

  await mealService.deleteMeal(userId, id);
  res.json({ message: 'Meal cancelled and deleted successfully' });
};

export const reanalyzeMeal = async (req: AuthRequest, res: Response, next: NextFunction) => {
  const id = req.params.id as string;
  const userId = req.user?.id;
  if (!userId) return next(new AppError('Unauthorized', 401));

  const { updatedMeal, result } = await mealService.reanalyzeMeal(userId, id, req.body.prompt);
  
  res.json({
    message: 'Meal re-analyzed successfully',
    meal: updatedMeal,
    result,
  });
};
