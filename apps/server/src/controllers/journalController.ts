import { Response, NextFunction } from 'express';
import { AuthRequest } from '../middleware/auth';
import { AppError } from '../middleware/error';
import * as journalService from '../services/journalService';

export const getJournalData = async (req: AuthRequest, res: Response, next: NextFunction) => {
  const userId = req.user?.id;
  if (!userId) return next(new AppError('Unauthorized', 401));

  const period = req.query.period as string;
  const dateQuery = req.query.date as string | undefined;
  
  const data = await journalService.getJournalData(userId, period, dateQuery);
  res.json(data);
};

export const updateUserNote = async (req: AuthRequest, res: Response, next: NextFunction) => {
  const userId = req.user?.id;
  if (!userId) return next(new AppError('Unauthorized', 401));

  const { period, date, text } = req.body;
  await journalService.updateUserNote(userId, period, date, text);
  res.json({ success: true });
};
