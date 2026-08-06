import { Response, NextFunction } from 'express';
import { AuthRequest } from '../middleware/auth';
import { AppError } from '../middleware/error';
import * as chatService from '../services/chatService';

export const handleChat = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  const userId = req.user?.id;
  if (!userId) return next(new AppError('Unauthorized', 401));

  const { message, period, targetDate } = req.body;
  
  const responseText = await chatService.generateChatResponse(
    userId,
    message,
    period,
    targetDate
  );
  
  res.status(200).json({ response: responseText });
};
