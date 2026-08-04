import { Response } from 'express';
import dayjs from 'dayjs';
import utc from 'dayjs/plugin/utc';
import timezone from 'dayjs/plugin/timezone';
import { prisma } from '../prisma';
import * as gemini from '../services/gemini';
import { AuthRequest } from '../middleware/auth';

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

    // Normalize & validate period (case-insensitive via shared enum)
    const normalizedPeriod = parsePeriod(String(period));
    if (!normalizedPeriod) {
      res.status(400).json({ error: `Invalid period "${period}". Must be one of: ${Object.values(Period).join(', ')}.` });
      return;
    }

    let contextData = '';

    if (normalizedPeriod === Period.Day) {
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
        // Also load meals for the week for richer context
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

    const prompt = `
You are an empathetic, expert AI Nutritionist analyzing the user's dietary data and personal journal.
Your goal is to provide concise, actionable, and insightful feedback based on the context.

CRITICAL RULES:
1. DO NOT simply repeat or list the user's macros, calories, or meals. The user already sees this data on their screen.
2. Focus on synthesis: correlate their data with their personal notes/feelings (e.g., if their stomach hurts, look for possible causes like heavy meals, large portions, or specific foods).
3. Provide a very short, synthesized conclusion of their progress for the period.
4. Offer 1-2 practical, actionable recommendations tailored to their message and data.
5. Keep your response brief, friendly, and conversational.
6. ABSOLUTELY NO MARKDOWN: Do not use *, **, ###, or bullet points. Use plain text and simple newlines only.

Context Period requested: ${normalizedPeriod}
Context Data for this period:
${contextData}

User's message: "${message}"

Respond clearly, concisely, and helpfully following the rules above.
`;

    const aiResponse = await gemini.chatWithNutritionist(prompt);

    res.status(200).json({ response: aiResponse });
  } catch (error) {
    console.error('Error handling chat:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};
