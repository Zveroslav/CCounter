import cron from 'node-cron';
import dayjs from 'dayjs';
import utc from 'dayjs/plugin/utc';
import timezone from 'dayjs/plugin/timezone';
import { prisma } from '../prisma';
import { getDailyFeedback, getWeeklyFeedback, getMonthlyFeedback } from '../services/gemini';

dayjs.extend(utc);
dayjs.extend(timezone);

export const runAggregations = async () => {
  console.log('Running aggregations...');
  const users = await prisma.user.findMany();

  for (const user of users) {
    try {
      const now = dayjs().tz(user.timezone || 'UTC');
      
      // If it is midnight (00:00 - 00:59)
      if (now.hour() === 0) {
        console.log(`Processing aggregations for user ${user.id} at their local midnight.`);
        
        const prevDay = now.subtract(1, 'day');
        const startOfDay = prevDay.startOf('day').toDate();
        const endOfDay = prevDay.endOf('day').toDate();

        // 1. Daily Summary
        const meals = await prisma.meal.findMany({
          where: {
            userId: user.id,
            loggedAt: {
              gte: startOfDay,
              lte: endOfDay,
            },
          },
        });
        
        console.log(`Meals found: ${meals.length} between ${startOfDay.toISOString()} and ${endOfDay.toISOString()}`);

        const totalCalories = meals.reduce((sum, meal) => sum + (meal.calories || 0), 0);
        const totalProtein = meals.reduce((sum, meal) => sum + (meal.protein || 0), 0);
        const totalCarbs = meals.reduce((sum, meal) => sum + (meal.carbs || 0), 0);
        const totalFat = meals.reduce((sum, meal) => sum + (meal.fat || 0), 0);

        let comment = null;
        if (meals.length > 0) {
          comment = await getDailyFeedback(totalCalories, totalProtein, totalCarbs, totalFat);
        }
        
        console.log('AI Comment generated:', comment);

        const dailySummary = await prisma.dailySummary.upsert({
          where: {
            userId_date: {
              userId: user.id,
              date: startOfDay,
            },
          },
          update: {
            totalCalories,
            totalProtein,
            totalCarbs,
            totalFat,
            comment,
          },
          create: {
            userId: user.id,
            date: startOfDay,
            totalCalories,
            totalProtein,
            totalCarbs,
            totalFat,
            comment,
          },
        });

        // 2. Weekly Summary
        // If the previous day was a Sunday (0 in dayjs), the week is complete.
        if (prevDay.day() === 0) {
          const startOfWeek = prevDay.subtract(6, 'day').startOf('day').toDate();
          const dailySummaries = await prisma.dailySummary.findMany({
            where: {
              userId: user.id,
              date: {
                gte: startOfWeek,
                lte: startOfDay, // prevDay start
              },
            },
          });

          const weeklyCalories = dailySummaries.reduce((sum, ds) => sum + ds.totalCalories, 0);
          const weeklyProtein = dailySummaries.reduce((sum, ds) => sum + ds.totalProtein, 0);
          const weeklyCarbs = dailySummaries.reduce((sum, ds) => sum + ds.totalCarbs, 0);
          const weeklyFat = dailySummaries.reduce((sum, ds) => sum + ds.totalFat, 0);

          const weightLogs = await prisma.weightLog.findMany({
            where: { userId: user.id, date: { gte: startOfWeek, lte: endOfDay } },
            orderBy: { date: 'asc' }
          });

          let avgWeight: number | null = null;
          let startWeight: number | undefined;
          let endWeight: number | undefined;

          if (weightLogs.length > 0) {
            startWeight = weightLogs[0].weight;
            endWeight = weightLogs[weightLogs.length - 1].weight;
            avgWeight = weightLogs.reduce((sum, w) => sum + w.weight, 0) / weightLogs.length;
          }

          let comment = null;
          if (dailySummaries.length > 0) {
            comment = await getWeeklyFeedback(weeklyCalories / 7, weeklyProtein / 7, weeklyCarbs / 7, weeklyFat / 7, startWeight, endWeight);
          }

          await prisma.weeklySummary.upsert({
            where: {
              userId_startDate: {
                userId: user.id,
                startDate: startOfWeek,
              },
            },
            update: {
              totalCalories: weeklyCalories,
              avgWeight,
              comment,
            },
            create: {
              userId: user.id,
              startDate: startOfWeek,
              endDate: endOfDay,
              totalCalories: weeklyCalories,
              avgWeight,
              comment,
            },
          });
        }

        // 3. Monthly Summary
        // If the previous day was the last day of the month
        if (prevDay.date() === prevDay.endOf('month').date()) {
          const startOfMonth = prevDay.startOf('month').toDate();
          const dailySummaries = await prisma.dailySummary.findMany({
            where: {
              userId: user.id,
              date: {
                gte: startOfMonth,
                lte: startOfDay,
              },
            },
          });

          const monthlyCalories = dailySummaries.reduce((sum, ds) => sum + ds.totalCalories, 0);
          const monthlyProtein = dailySummaries.reduce((sum, ds) => sum + ds.totalProtein, 0);
          const monthlyCarbs = dailySummaries.reduce((sum, ds) => sum + ds.totalCarbs, 0);
          const monthlyFat = dailySummaries.reduce((sum, ds) => sum + ds.totalFat, 0);
          const daysInMonth = prevDay.endOf('month').date();

          const weightLogs = await prisma.weightLog.findMany({
            where: { userId: user.id, date: { gte: startOfMonth, lte: endOfDay } },
            orderBy: { date: 'asc' }
          });

          let avgWeight: number | null = null;
          let startWeight: number | undefined;
          let endWeight: number | undefined;

          if (weightLogs.length > 0) {
            startWeight = weightLogs[0].weight;
            endWeight = weightLogs[weightLogs.length - 1].weight;
            avgWeight = weightLogs.reduce((sum, w) => sum + w.weight, 0) / weightLogs.length;
          }

          let comment = null;
          if (dailySummaries.length > 0) {
            comment = await getMonthlyFeedback(monthlyCalories / daysInMonth, monthlyProtein / daysInMonth, monthlyCarbs / daysInMonth, monthlyFat / daysInMonth, startWeight, endWeight);
          }

          await prisma.monthlySummary.upsert({
            where: {
              userId_month_year: {
                userId: user.id,
                month: prevDay.month() + 1, // dayjs months are 0-indexed
                year: prevDay.year(),
              },
            },
            update: {
              totalCalories: monthlyCalories,
              avgWeight,
              comment,
            },
            create: {
              userId: user.id,
              month: prevDay.month() + 1,
              year: prevDay.year(),
              totalCalories: monthlyCalories,
              avgWeight,
              comment,
            },
          });
        }
      }
    } catch (error) {
      console.error(`Error processing aggregations for user ${user.id}:`, error);
    }
  }
};

export const startCronJobs = () => {
  // Run at minute 0 of every hour
  cron.schedule('0 * * * *', () => {
    runAggregations();
  });
  console.log('Cron jobs started.');
};
