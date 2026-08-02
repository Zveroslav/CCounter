import request from 'supertest';
import express from 'express';
import dayjs from 'dayjs';
import utc from 'dayjs/plugin/utc';
import timezone from 'dayjs/plugin/timezone';
import { prisma } from '../src/prisma';
import jwt from 'jsonwebtoken';

// 1. Setup the mock FIRST
jest.mock('../src/services/gemini', () => ({
  __esModule: true,
  chatWithNutritionist: jest.fn().mockResolvedValue('Hello, I am your nutritionist.'),
  getDailyFeedback: jest.fn().mockResolvedValue(''),
  recognizeMealFromImage: jest.fn(),
}));

// 2. Require the router and services AFTER the mock
const chatRoutes = require('../src/routes/chat').default;
const gemini = require('../src/services/gemini');

dayjs.extend(utc);
dayjs.extend(timezone);

const app = express();
app.use(express.json());
app.use('/api/chat', chatRoutes);

describe('Chat API', () => {
  let userId: string;
  let token: string;

  beforeEach(async () => {
    jest.clearAllMocks();
    
    await prisma.meal.deleteMany();
    await prisma.dailySummary.deleteMany();
    await prisma.weeklySummary.deleteMany();
    await prisma.monthlySummary.deleteMany();
    await prisma.user.deleteMany();

    const user = await prisma.user.create({
      data: {
        email: 'chat@example.com',
        timezone: 'UTC',
      },
    });
    userId = user.id;
    token = jwt.sign({ id: user.id, email: user.email }, process.env.JWT_SECRET || 'test-secret');
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  it('should return 400 if message or period is missing', async () => {
    const res = await request(app)
      .post('/api/chat')
      .set('Authorization', `Bearer ${token}`)
      .send({ period: 'Day' });

    expect(res.status).toBe(400);
    expect(res.body.error).toBe('message and period are required');
  });

  it.skip('should construct prompt with day context and return AI response', async () => {
    jest.useFakeTimers();
    jest.setSystemTime(new Date('2026-08-02T12:00:00Z'));

    await prisma.meal.create({
      data: {
        userId,
        calories: 500,
        loggedAt: new Date('2026-08-02T08:00:00Z'),
      },
    });

    const res = await request(app)
      .post('/api/chat')
      .set('Authorization', `Bearer ${token}`)
      .send({ message: 'How am I doing today?', period: 'Day' });

    expect(res.status).toBe(200);
    expect(res.body.response).toBe('Hello, I am your nutritionist.');

    // We can check if the mock was called with the right prompt
    expect(gemini.chatWithNutritionist).toHaveBeenCalled();
    const callArg = gemini.chatWithNutritionist.mock.calls[0][0];
    expect(callArg).toContain('Context Period requested: Day');
    expect(callArg).toContain('Total Calories: 500');
    expect(callArg).toContain('How am I doing today?');

    jest.useRealTimers();
  });

  it.skip('should fetch context for a specific targetDate if provided', async () => {
    // We create a daily summary for yesterday 2026-08-01
    await prisma.dailySummary.create({
      data: {
        userId,
        date: new Date('2026-08-01T00:00:00Z'),
        totalCalories: 2000,
        comment: 'Great day',
      },
    });

    const res = await request(app)
      .post('/api/chat')
      .set('Authorization', `Bearer ${token}`)
      .send({ message: 'How was yesterday?', period: 'Day', targetDate: '2026-08-01T12:00:00Z' });

    expect(res.status).toBe(200);
    const callArg = gemini.chatWithNutritionist.mock.calls[0][0];
    expect(callArg).toContain('Total Calories: 2000');
    expect(callArg).toContain('AI Daily Comment (if available): Great day');
  });
});
