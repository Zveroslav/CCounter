import dayjs from 'dayjs';
import utc from 'dayjs/plugin/utc';
import timezone from 'dayjs/plugin/timezone';
import { prisma } from '../prisma';
import { AppError } from '../middleware/error';

dayjs.extend(utc);
dayjs.extend(timezone);

export const getJournalData = async (userId: string, period: string, dateQuery?: string) => {
  const user = await prisma.user.findUnique({ where: { id: userId } });
  const userTimezone = user?.timezone || 'UTC';

  const refDate = dateQuery ? dayjs(dateQuery).tz(userTimezone) : dayjs().tz(userTimezone);

  let startDate: Date;
  let endDate: Date;

  if (period === 'day') {
    startDate = refDate.startOf('day').toDate();
    endDate = refDate.endOf('day').toDate();
  } else if (period === 'week') {
    const dayOfWeek = refDate.day();
    const diffToMonday = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
    startDate = refDate.add(diffToMonday, 'day').startOf('day').toDate();
    endDate = dayjs(startDate).add(6, 'day').endOf('day').toDate();
  } else if (period === 'month') {
    startDate = refDate.startOf('month').toDate();
    endDate = refDate.endOf('month').toDate();
  } else {
    // all-time
    startDate = new Date(0);
    endDate = new Date();
  }

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

  const dailySummaries = await prisma.dailySummary.findMany({
    where: {
      userId,
      date: { gte: startDate, lte: endDate },
    },
    orderBy: { date: 'asc' },
  });

  let periodSummary = null;
  if (period === 'day') {
    periodSummary = await prisma.dailySummary.findUnique({
      where: { userId_date: { userId, date: startDate } }
    });
  } else if (period === 'week') {
    periodSummary = await prisma.weeklySummary.findUnique({
      where: { userId_startDate: { userId, startDate } }
    });
  } else if (period === 'month') {
    periodSummary = await prisma.monthlySummary.findUnique({
      where: { userId_month_year: { userId, month: refDate.month() + 1, year: refDate.year() } }
    });
  }

  return {
    period,
    startDate,
    endDate,
    meals,
    dailySummaries,
    periodSummary,
  };
};

export const updateUserNote = async (userId: string, period: string, date: string, text: string) => {
  const user = await prisma.user.findUnique({ where: { id: userId } });
  const userTimezone = user?.timezone || 'UTC';

  const refDate = dayjs(date).tz(userTimezone);
  
  if (period === 'day') {
    const start = refDate.startOf('day').toDate();
    await prisma.dailySummary.upsert({
      where: { userId_date: { userId, date: start } },
      update: { userNote: text },
      create: { userId, date: start, userNote: text }
    });
  } else if (period === 'week') {
    const dayOfWeek = refDate.day();
    const diffToMonday = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
    const start = refDate.add(diffToMonday, 'day').startOf('day').toDate();
    const end = dayjs(start).add(6, 'day').endOf('day').toDate();
    await prisma.weeklySummary.upsert({
      where: { userId_startDate: { userId, startDate: start } },
      update: { userNote: text },
      create: { userId, startDate: start, endDate: end, userNote: text }
    });
  } else if (period === 'month') {
    const month = refDate.month() + 1;
    const year = refDate.year();
    await prisma.monthlySummary.upsert({
      where: { userId_month_year: { userId, month, year } },
      update: { userNote: text },
      create: { userId, month, year, userNote: text }
    });
  } else {
    throw new AppError('Invalid period', 400);
  }
};
