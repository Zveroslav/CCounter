import { Response, NextFunction } from 'express';
import { AuthRequest } from '../middleware/auth';
import { AppError } from '../middleware/error';
import * as userService from '../services/userService';

export const getProfile = async (req: AuthRequest, res: Response, next: NextFunction) => {
  const userId = req.user?.id;
  if (!userId) return next(new AppError('Unauthorized', 401));

  const profile = await userService.getProfile(userId);
  res.json(profile);
};

export const updateProfile = async (req: AuthRequest, res: Response, next: NextFunction) => {
  const userId = req.user?.id;
  if (!userId) return next(new AppError('Unauthorized', 401));

  const user = await userService.updateProfile(userId, req.body);
  res.json({ message: 'Profile updated successfully', user });
};

export const logWeight = async (req: AuthRequest, res: Response, next: NextFunction) => {
  const userId = req.user?.id;
  if (!userId) return next(new AppError('Unauthorized', 401));

  const weightLog = await userService.logWeight(userId, req.body.weight);
  res.json({ message: 'Weight logged successfully', weightLog });
};
