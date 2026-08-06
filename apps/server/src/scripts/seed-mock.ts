import { prisma } from '../prisma';
import dayjs from 'dayjs';
import utc from 'dayjs/plugin/utc';
import timezone from 'dayjs/plugin/timezone';

dayjs.extend(utc);
dayjs.extend(timezone);

const randomInRange = (min: number, max: number) => Math.floor(Math.random() * (max - min + 1)) + min;

async function seed() {
  const users = await prisma.user.findMany();
  if (users.length === 0) {
    console.log('No users found.');
    return;
  }
  const user = users[0];

  const endDate = dayjs().startOf('day').subtract(1, 'day'); // yesterday
  const startDate = endDate.subtract(60, 'day'); // 2 months ago

  let currentWeight = 85.0;

  console.log(`Seeding data for user ${user.email} from ${startDate.format('YYYY-MM-DD')} to ${endDate.format('YYYY-MM-DD')}`);

  for (let d = startDate; d.isBefore(endDate) || d.isSame(endDate, 'day'); d = d.add(1, 'day')) {
    const date = d.toDate();

    // 1. Weight log (every 3 days)
    if (d.diff(startDate, 'day') % 3 === 0) {
      currentWeight += (Math.random() - 0.5) * 0.5; // fluctuation -0.25 to +0.25
      await prisma.weightLog.create({
        data: {
          userId: user.id,
          date,
          weight: parseFloat(currentWeight.toFixed(1)),
        }
      });
    }

    // 2. Meals (3 meals a day)
    let dailyCals = 0, dailyProt = 0, dailyCarbs = 0, dailyFat = 0;
    
    for (let i = 0; i < 3; i++) {
      const cals = randomInRange(300, 700);
      const prot = randomInRange(15, 40);
      const carbs = randomInRange(30, 80);
      const fat = randomInRange(10, 30);
      
      dailyCals += cals;
      dailyProt += prot;
      dailyCarbs += carbs;
      dailyFat += fat;

      await prisma.meal.create({
        data: {
          userId: user.id,
          loggedAt: d.add(8 + i * 5, 'hour').toDate(),
          title: `Meal ${i + 1}`,
          calories: cals,
          protein: prot,
          carbs: carbs,
          fat: fat,
          imageUrl: '',
        }
      });
    }

    // 3. Daily Summary
    await prisma.dailySummary.upsert({
      where: { userId_date: { userId: user.id, date } },
      update: {},
      create: {
        userId: user.id,
        date,
        totalCalories: dailyCals,
        totalProtein: dailyProt,
        totalCarbs: dailyCarbs,
        totalFat: dailyFat,
        comment: 'AI: Good job on hitting your macros today! Keep it up.',
      }
    });

    // 4. Weekly Summary
    if (d.day() === 0) { // Sunday
      const startOfWeek = d.subtract(6, 'day').toDate();
      await prisma.weeklySummary.upsert({
        where: { userId_startDate: { userId: user.id, startDate: startOfWeek } },
        update: {},
        create: {
          userId: user.id,
          startDate: startOfWeek,
          endDate: date,
          totalCalories: dailyCals * 7, // rough estimate
          avgWeight: currentWeight,
          comment: 'AI: This week was solid. Weight is slightly fluctuating but trending well.',
        }
      });
    }

    // 5. Monthly Summary
    if (d.date() === d.endOf('month').date()) {
      await prisma.monthlySummary.upsert({
        where: { userId_month_year: { userId: user.id, month: d.month() + 1, year: d.year() } },
        update: {},
        create: {
          userId: user.id,
          month: d.month() + 1,
          year: d.year(),
          totalCalories: dailyCals * 30, // rough estimate
          avgWeight: currentWeight,
          comment: 'AI: Great month overall. Good consistency in tracking meals and weight.',
        }
      });
    }
  }

  console.log('Done seeding mock data.');
}

seed()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
