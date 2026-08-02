import dayjs from 'dayjs';
import utc from 'dayjs/plugin/utc';
import timezone from 'dayjs/plugin/timezone';
import { runAggregations } from '../src/jobs/aggregator';
import { prisma } from '../src/prisma';
import * as gemini from '../src/services/gemini';

dayjs.extend(utc);
dayjs.extend(timezone);

describe('Aggregator Job', () => {
  beforeEach(async () => {
    jest.spyOn(gemini, 'getDailyFeedback').mockResolvedValue('Mocked AI feedback');
    await prisma.recognitionJob.deleteMany();
    await prisma.monthlySummary.deleteMany();
    await prisma.weeklySummary.deleteMany();
    await prisma.dailySummary.deleteMany();
    await prisma.meal.deleteMany();
    await prisma.weightLog.deleteMany();
    await prisma.user.deleteMany();
    jest.clearAllMocks();
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  it('should create a daily summary for the previous day when user local time is midnight', async () => {
    // We will mock dayjs so that when it is called, it returns a specific time
    // But mocking dayjs globally can be tricky. Instead, we can manipulate the user's timezone
    // to match a timezone where it is currently midnight, or use jest.useFakeTimers().
    
    // Let's use fake timers to set system time
    jest.useFakeTimers();
    // Set system time to a known UTC time where it is midnight in Europe/Moscow
    // Europe/Moscow is UTC+3. So 21:00 UTC is 00:00 Moscow time the next day.
    // E.g. 2026-08-01T21:00:00Z -> 2026-08-02T00:00:00 Moscow time.
    jest.setSystemTime(new Date('2026-08-01T21:00:00Z'));

    const user = await prisma.user.create({
      data: {
        email: 'moscow@example.com',
        timezone: 'Europe/Moscow',
      },
    });

    // The previous day for the user is 2026-08-01.
    // Start of day Moscow: 2026-07-31T21:00:00Z
    // End of day Moscow: 2026-08-01T20:59:59.999Z
    
    await prisma.meal.create({
      data: {
        userId: user.id,
        calories: 500,
        protein: 30,
        carbs: 40,
        fat: 10,
        loggedAt: new Date('2026-08-01T12:00:00Z'), // this is 15:00 Moscow time (in the previous day)
      },
    });

    await prisma.meal.create({
      data: {
        userId: user.id,
        calories: 300,
        protein: 20,
        carbs: 30,
        fat: 5,
        loggedAt: new Date('2026-08-01T18:00:00Z'), // this is 21:00 Moscow time
      },
    });

    await runAggregations();

    const dailySummaries = await prisma.dailySummary.findMany({
      where: { userId: user.id },
    });

    expect(dailySummaries.length).toBe(1);
    expect(dailySummaries[0].totalCalories).toBe(800);
    expect(dailySummaries[0].totalProtein).toBe(50);
    expect(dailySummaries[0].totalCarbs).toBe(70);
    expect(dailySummaries[0].totalFat).toBe(15);
    expect(dailySummaries[0].comment).toBe('Mocked AI feedback');
  });

  it('should create weekly and monthly summaries when appropriate', async () => {
    jest.useFakeTimers();
    
    // Set system time to Monday, Aug 31, 2026, 21:00:00Z -> Sept 1, 2026, 00:00:00 Moscow time
    // Previous day: Aug 31 (Monday, so not a Sunday. Last day of month).
    jest.setSystemTime(new Date('2026-08-31T21:00:00Z'));

    const user = await prisma.user.create({
      data: {
        email: 'month_end@example.com',
        timezone: 'Europe/Moscow',
      },
    });

    // Create a meal on Aug 31
    await prisma.meal.create({
      data: {
        userId: user.id,
        calories: 1000,
        loggedAt: new Date('2026-08-31T12:00:00Z'),
      },
    });

    await runAggregations();

    const monthlySummaries = await prisma.monthlySummary.findMany({ where: { userId: user.id } });
    expect(monthlySummaries.length).toBe(1);
    expect(monthlySummaries[0].month).toBe(8); // August
    expect(monthlySummaries[0].year).toBe(2026);
    expect(monthlySummaries[0].totalCalories).toBe(1000);

    // Set time to Monday, Sept 7, 2026, 21:00:00Z -> Sept 8, 2026, 00:00 Moscow. Previous day: Sept 7 (not Sunday)
    // Wait, let's test Sunday. Sunday is Sept 6.
    // So current time must be Monday, Sept 7, 00:00 Moscow time -> Sept 6, 21:00:00Z.
    jest.setSystemTime(new Date('2026-09-06T21:00:00Z'));

    // Create a meal on Sept 6
    await prisma.meal.create({
      data: {
        userId: user.id,
        calories: 500,
        loggedAt: new Date('2026-09-06T12:00:00Z'),
      },
    });

    await runAggregations();

    const weeklySummaries = await prisma.weeklySummary.findMany({ where: { userId: user.id } });
    expect(weeklySummaries.length).toBe(1);
    expect(weeklySummaries[0].totalCalories).toBe(1500);

    jest.useRealTimers();
  });
});
