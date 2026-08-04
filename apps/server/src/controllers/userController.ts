import { Request, Response, NextFunction } from 'express';
import { prisma } from '../prisma';
import { AuthRequest } from '../middleware/auth';
import { AppError } from '../middleware/error';

export const getProfile = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const userId = req.user?.id;
    if (!userId) return next(new AppError('Unauthorized', 401));

    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        weightLogs: {
          orderBy: { date: 'desc' },
          take: 1,
        }
      }
    });

    if (!user) return next(new AppError('User not found', 404));

    res.json({
      id: user.id,
      email: user.email,
      name: user.name,
      timezone: user.timezone,
      targetCalories: user.targetCalories,
      targetProteinPct: user.targetProteinPct,
      targetFatPct: user.targetFatPct,
      targetCarbsPct: user.targetCarbsPct,
      latestWeight: user.weightLogs.length > 0 ? user.weightLogs[0].weight : null,
    });
  } catch (error) {
    next(error);
  }
};

export const updateProfile = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const userId = req.user?.id;
    if (!userId) return next(new AppError('Unauthorized', 401));

    const { name, timezone, targetCalories, targetProteinPct, targetFatPct, targetCarbsPct } = req.body;

    // Validate: if all three macro pct fields are present, they must sum to 100
    const hasPct = targetProteinPct !== undefined && targetFatPct !== undefined && targetCarbsPct !== undefined;
    if (hasPct) {
      const sum = Number(targetProteinPct) + Number(targetFatPct) + Number(targetCarbsPct);
      if (Math.abs(sum - 100) > 0.01) {
        return next(new AppError('Total macro percentages must equal 100%', 400));
      }
    }

    const user = await prisma.user.update({
      where: { id: userId },
      data: {
        name: name !== undefined ? String(name) : undefined,
        timezone: timezone !== undefined ? String(timezone) : undefined,
        targetCalories: targetCalories !== undefined ? Number(targetCalories) : undefined,
        targetProteinPct: targetProteinPct !== undefined ? Number(targetProteinPct) : undefined,
        targetFatPct: targetFatPct !== undefined ? Number(targetFatPct) : undefined,
        targetCarbsPct: targetCarbsPct !== undefined ? Number(targetCarbsPct) : undefined,
      }
    });

    res.json({ message: 'Profile updated successfully', user });
  } catch (error) {
    next(error);
  }
};

export const logWeight = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const userId = req.user?.id;
    if (!userId) return next(new AppError('Unauthorized', 401));

    const { weight } = req.body;
    if (!weight) return next(new AppError('Weight is required', 400));

    const weightLog = await prisma.weightLog.create({
      data: {
        userId,
        weight: Number(weight),
        date: new Date(),
      }
    });

    res.json({ message: 'Weight logged successfully', weightLog });
  } catch (error) {
    next(error);
  }
};
