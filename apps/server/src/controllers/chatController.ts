import { Response } from 'express';
import dayjs from 'dayjs';
import utc from 'dayjs/plugin/utc';
import timezone from 'dayjs/plugin/timezone';
import { prisma } from '../prisma';
import * as gemini from '../services/gemini';
import { AuthRequest } from '../middleware/auth';

dayjs.extend(utc);
dayjs.extend(timezone);

export const handleChat = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { message, period, targetDate } = req.body;
    
    if (!message || !period) {
      res.status(400).json({ error: 'message and period are required' });
      return;
    }

    const userId = req.user!.id;
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) {
      res.status(404).json({ error: 'User not found' });
      return;
    }

    // Determine the reference date. Defaults to now if targetDate not provided.
    const userTimezone = user.timezone || 'UTC';
    const refDate = targetDate ? dayjs(targetDate).tz(userTimezone) : dayjs().tz(userTimezone);
    
    let contextData = '';

    if (period === 'Day') {
      const startOfDay = refDate.startOf('day').toDate();
      const endOfDay = refDate.endOf('day').toDate();

      // Check if we have a DailySummary for this day (usually generated at midnight for the previous day)
      const dailySummary = await prisma.dailySummary.findUnique({
        where: {
          userId_date: {
            userId,
            date: startOfDay,
          },
        },
      });

      // If we are asking about "today" and the cron hasn't run, we should sum the meals dynamically
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

      contextData = `
        Date: ${refDate.format('YYYY-MM-DD')}
        Total Meals Logged: ${meals.length}
        Total Calories: ${dailySummary ? dailySummary.totalCalories : totalCalories} kcal
        Protein: ${dailySummary ? dailySummary.totalProtein : totalProtein}g
        Carbs: ${dailySummary ? dailySummary.totalCarbs : totalCarbs}g
        Fat: ${dailySummary ? dailySummary.totalFat : totalFat}g
        AI Daily Comment (if available): ${dailySummary?.comment || 'None'}
      `;
    } else if (period === 'Week') {
      // Find the start of the week for the reference date (assuming week starts on Monday)
      // dayjs day() 0 is Sunday, 1 is Monday.
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
        contextData = `
          Week Starting: ${startOfWeek.toISOString()}
          Total Calories for the Week: ${weeklySummary.totalCalories} kcal
          Average Weight: ${weeklySummary.avgWeight || 'Not logged'}
        `;
      } else {
        contextData = 'No aggregated weekly data available for this week yet.';
      }
    } else if (period === 'Month') {
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
        `;
      } else {
        contextData = 'No aggregated monthly data available for this month yet.';
      }
    } else if (period === 'All-Time') {
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
    } else {
      res.status(400).json({ error: 'Invalid period. Must be Day, Week, Month, or All-Time.' });
      return;
    }

    const prompt = `
You are an expert AI Nutritionist. The user is asking you a question.
Context Period requested: ${period}
Context Data for this period:
${contextData}

User's message: "${message}"

Please respond clearly, concisely, and helpfully based on the data provided above.
`;

    const aiResponse = await gemini.chatWithNutritionist(prompt);

    res.status(200).json({ response: aiResponse });
  } catch (error) {
    console.error('Error handling chat:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};
