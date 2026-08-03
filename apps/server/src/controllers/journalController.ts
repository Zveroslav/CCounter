import { Request, Response, NextFunction } from 'express';
import { prisma } from '../prisma';
import { AuthRequest } from '../middleware/auth';
import { AppError } from '../middleware/error';
import { startOfDay, endOfDay, startOfWeek, endOfWeek, startOfMonth, endOfMonth, parseISO } from 'date-fns';

export const getJournalData = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const userId = req.user?.id;
    if (!userId) return next(new AppError('Unauthorized', 401));

    const period = (req.query.period as string) || 'day';
    const dateQuery = req.query.date as string;
    const targetDate = dateQuery ? parseISO(dateQuery) : new Date();

    let startDate: Date;
    let endDate: Date;

    if (period === 'day') {
      startDate = startOfDay(targetDate);
      endDate = endOfDay(targetDate);
    } else if (period === 'week') {
      startDate = startOfWeek(targetDate, { weekStartsOn: 1 });
      endDate = endOfWeek(targetDate, { weekStartsOn: 1 });
    } else if (period === 'month') {
      startDate = startOfMonth(targetDate);
      endDate = endOfMonth(targetDate);
    } else {
      // all-time
      startDate = new Date(0);
      endDate = new Date();
    }

    // Fetch meals only for day/week — for month/all-time it's not needed
    const fetchMeals = period === 'day' || period === 'week';
    const meals = fetchMeals
      ? await prisma.meal.findMany({
          where: {
            userId,
            loggedAt: { gte: startDate, lte: endDate },
          },
          orderBy: { loggedAt: 'desc' },
        })
      : [];

    // Fetch daily summaries in period (useful for charts)
    const dailySummaries = await prisma.dailySummary.findMany({
      where: {
        userId,
        date: { gte: startDate, lte: endDate },
      },
      orderBy: { date: 'asc' },
    });

    res.json({
      period,
      startDate,
      endDate,
      meals,
      dailySummaries,
    });
  } catch (error) {
    next(error);
  }
};
