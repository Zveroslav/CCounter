import dayjs from 'dayjs';
import utc from 'dayjs/plugin/utc';
import timezone from 'dayjs/plugin/timezone';
import { prisma } from '../prisma';
import * as gemini from './gemini';
import { AppError } from '../middleware/error';
import { buildNutritionistPrompt } from '../config/prompts';

enum Period {
  Day     = 'day',
  Week    = 'week',
  Month   = 'month',
  AllTime = 'all-time',
}

function parsePeriod(value: string): Period | null {
  const normalized = value.toLowerCase() as Period;
  return Object.values(Period).includes(normalized) ? normalized : null;
}

dayjs.extend(utc);
dayjs.extend(timezone);

export const generateChatResponse = async (
  userId: string,
  message: string,
  period: string,
  targetDate?: string
) => {
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) {
    throw new AppError('User not found', 404);
  }

  const userTimezone = user.timezone || 'UTC';
  const refDate = targetDate ? dayjs(targetDate).tz(userTimezone) : dayjs().tz(userTimezone);

  const normalizedPeriod = parsePeriod(String(period));
  if (!normalizedPeriod) {
    throw new AppError(`Invalid period "${period}". Must be one of: ${Object.values(Period).join(', ')}.`, 400);
  }

  let contextData = '';

  if (normalizedPeriod === Period.Day) {
    const startOfDay = refDate.startOf('day').toDate();
    const endOfDay = refDate.endOf('day').toDate();

    const dailySummary = await prisma.dailySummary.findUnique({
      where: {
        userId_date: {
          userId,
          date: startOfDay,
        },
      },
    });

    const meals = await prisma.meal.findMany({
      where: {
        userId,
        loggedAt: { gte: startOfDay, lte: endOfDay },
      },
    });

    const totalCalories = meals.reduce((sum, meal) => sum + (meal.calories || 0), 0);
    const totalProtein = meals.reduce((sum, meal) => sum + (meal.protein || 0), 0);
    const totalCarbs = meals.reduce((sum, meal) => sum + (meal.carbs || 0), 0);
    const totalFat = meals.reduce((sum, meal) => sum + (meal.fat || 0), 0);

    const mealList = meals.map(m =>
      `  - ${m.recognizedText || 'Manual Entry'}: ${m.calories} kcal (P:${m.protein}g F:${m.fat}g C:${m.carbs}g)`
    ).join('\n');

    contextData = `
      Date: ${refDate.format('YYYY-MM-DD')}
      Total Meals Logged: ${meals.length}
      Total Calories: ${dailySummary ? dailySummary.totalCalories : totalCalories} kcal
      Protein: ${dailySummary ? dailySummary.totalProtein : totalProtein}g
      Carbs: ${dailySummary ? dailySummary.totalCarbs : totalCarbs}g
      Fat: ${dailySummary ? dailySummary.totalFat : totalFat}g
      AI Daily Comment (if available): ${dailySummary?.comment || 'None'}
      User's Personal Note/Journal: ${dailySummary?.userNote || 'None'}
      Meals:
${mealList || '  (none)'}
    `;
  } else if (normalizedPeriod === Period.Week) {
    const dayOfWeek = refDate.day();
    const diffToMonday = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
    const startOfWeek = refDate.add(diffToMonday, 'day').startOf('day').toDate();

    const weeklySummary = await prisma.weeklySummary.findUnique({
      where: {
        userId_startDate: {
          userId,
          startDate: startOfWeek,
        },
      },
    });

    if (weeklySummary) {
      const weekMeals = await prisma.meal.findMany({
        where: { userId, loggedAt: { gte: startOfWeek } },
        orderBy: { loggedAt: 'asc' },
      });
      const mealList = weekMeals.map(m =>
        `  - ${m.recognizedText || 'Manual Entry'}: ${m.calories} kcal (P:${m.protein}g F:${m.fat}g C:${m.carbs}g)`
      ).join('\n');

      contextData = `
        Week Starting: ${startOfWeek.toISOString()}
        Total Calories for the Week: ${weeklySummary.totalCalories} kcal
        Average Weight: ${weeklySummary.avgWeight || 'Not logged'}
        User's Personal Note/Journal: ${weeklySummary.userNote || 'None'}
        Meals this week:
${mealList || '  (none)'}
      `;
    } else {
      contextData = 'No aggregated weekly data available for this week yet.';
    }
  } else if (normalizedPeriod === Period.Month) {
    const month = refDate.month() + 1; // 1-indexed
    const year = refDate.year();

    const monthlySummary = await prisma.monthlySummary.findUnique({
      where: {
        userId_month_year: {
          userId,
          month,
          year,
        },
      },
    });

    if (monthlySummary) {
      contextData = `
        Month: ${month}/${year}
        Total Calories for the Month: ${monthlySummary.totalCalories} kcal
        Average Weight: ${monthlySummary.avgWeight || 'Not logged'}
        User's Personal Note/Journal: ${monthlySummary.userNote || 'None'}
      `;
    } else {
      contextData = 'No aggregated monthly data available for this month yet.';
    }
  } else if (normalizedPeriod === Period.AllTime) {
    const allMonthly = await prisma.monthlySummary.findMany({
      where: { userId },
      orderBy: { year: 'asc', month: 'asc' },
    });

    if (allMonthly.length > 0) {
      const totalCals = allMonthly.reduce((sum, ms) => sum + ms.totalCalories, 0);
      contextData = `
        Total Months Logged: ${allMonthly.length}
        All-Time Total Calories: ${totalCals} kcal
      `;
    } else {
      contextData = 'No long-term data available yet.';
    }
  }

  const prompt = buildNutritionistPrompt(user.name, normalizedPeriod, contextData, message);

  const aiResponse = await gemini.chatWithNutritionist(prompt);
  return aiResponse;
};
