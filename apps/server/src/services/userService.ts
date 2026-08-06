import { prisma } from '../prisma';
import { AppError } from '../middleware/error';

export const getProfile = async (userId: string) => {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: {
      weightLogs: {
        orderBy: { date: 'desc' },
        take: 1,
      }
    }
  });

  if (!user) {
    throw new AppError('User not found', 404);
  }

  return {
    id: user.id,
    email: user.email,
    name: user.name,
    timezone: user.timezone,
    targetCalories: user.targetCalories,
    targetProteinPct: user.targetProteinPct,
    targetFatPct: user.targetFatPct,
    targetCarbsPct: user.targetCarbsPct,
    latestWeight: user.weightLogs.length > 0 ? user.weightLogs[0].weight : null,
  };
};

export const updateProfile = async (
  userId: string,
  data: {
    name?: string;
    timezone?: string;
    targetCalories?: number;
    targetProteinPct?: number;
    targetFatPct?: number;
    targetCarbsPct?: number;
  }
) => {
  const hasPct = data.targetProteinPct !== undefined && data.targetFatPct !== undefined && data.targetCarbsPct !== undefined;
  if (hasPct) {
    const sum = data.targetProteinPct! + data.targetFatPct! + data.targetCarbsPct!;
    if (Math.abs(sum - 100) > 0.01) {
      throw new AppError('Total macro percentages must equal 100%', 400);
    }
  }

  const user = await prisma.user.update({
    where: { id: userId },
    data: {
      name: data.name,
      timezone: data.timezone,
      targetCalories: data.targetCalories,
      targetProteinPct: data.targetProteinPct,
      targetFatPct: data.targetFatPct,
      targetCarbsPct: data.targetCarbsPct,
    }
  });

  return user;
};

export const logWeight = async (userId: string, weight: number) => {
  const weightLog = await prisma.weightLog.create({
    data: {
      userId,
      weight,
      date: new Date(),
    }
  });

  return weightLog;
};
