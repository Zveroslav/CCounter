import request from 'supertest';
import app from '../src/index';
import jwt from 'jsonwebtoken';
import { prisma } from '../src/prisma';

describe('Validation Layer Route Integration Tests (Ticket 21)', () => {
  let validToken: string;
  let testUserId: string;

  beforeAll(async () => {
    const user = await prisma.user.upsert({
      where: { email: 'zodtest@example.com' },
      update: {},
      create: {
        email: 'zodtest@example.com',
        name: 'Zod Test User',
      },
    });
    testUserId = user.id;

    const secret = process.env.JWT_SECRET || 'test-secret';
    validToken = jwt.sign({ id: user.id, email: user.email }, secret);
  });

  afterAll(async () => {
    await prisma.weightLog.deleteMany({ where: { userId: testUserId } });
    await prisma.recognitionJob.deleteMany({ where: { meal: { userId: testUserId } } });
    await prisma.meal.deleteMany({ where: { userId: testUserId } });
    await prisma.user.deleteMany({ where: { id: testUserId } });
    await prisma.$disconnect();
  });

  describe('Route Params (UUID Validation)', () => {
    it('returns HTTP 400 when malformed UUID parameter is passed to GET /api/meals/jobs/:id', async () => {
      const res = await request(app)
        .get('/api/meals/jobs/invalid-uuid-123')
        .set('Authorization', `Bearer ${validToken}`);

      expect(res.status).toBe(400);
      expect(res.body).toEqual({
        status: 'error',
        message: 'Validation error',
        errors: [
          {
            path: 'params.id',
            message: 'Invalid UUID format',
          },
        ],
      });
    });

    it('returns HTTP 400 when malformed UUID parameter is passed to PUT /api/meals/:id', async () => {
      const res = await request(app)
        .put('/api/meals/12345')
        .set('Authorization', `Bearer ${validToken}`)
        .send({ calories: 500 });

      expect(res.status).toBe(400);
      expect(res.body.status).toBe('error');
      expect(res.body.errors[0].path).toBe('params.id');
    });
  });

  describe('Meal Endpoints Validation', () => {
    let validMealId: string;

    beforeAll(async () => {
      const meal = await prisma.meal.create({
        data: {
          userId: testUserId,
          calories: 400,
          protein: 20,
          carbs: 40,
          fat: 10,
          loggedAt: new Date(),
        },
      });
      validMealId = meal.id;
    });

    it('accepts valid partial update on PUT /api/meals/:id', async () => {
      const res = await request(app)
        .put(`/api/meals/${validMealId}`)
        .set('Authorization', `Bearer ${validToken}`)
        .send({ calories: 550, title: 'Updated Lunch' });

      expect(res.status).toBe(200);
      expect(res.body.meal.calories).toBe(550);
      expect(res.body.meal.title).toBe('Updated Lunch');
    });

    it('coerces string numbers in PUT /api/meals/:id body fields', async () => {
      const res = await request(app)
        .put(`/api/meals/${validMealId}`)
        .set('Authorization', `Bearer ${validToken}`)
        .send({ calories: '600', protein: '30' });

      expect(res.status).toBe(200);
      expect(res.body.meal.calories).toBe(600);
      expect(res.body.meal.protein).toBe(30);
    });

    it('returns HTTP 400 when malformed payload is passed to PUT /api/meals/:id', async () => {
      const res = await request(app)
        .put(`/api/meals/${validMealId}`)
        .set('Authorization', `Bearer ${validToken}`)
        .send({ calories: 'not-a-number' });

      expect(res.status).toBe(400);
      expect(res.body.status).toBe('error');
      expect(res.body.message).toBe('Validation error');
      expect(res.body.errors[0].path).toBe('body.calories');
    });

    it('returns HTTP 400 when missing required prompt on POST /api/meals/:id/reanalyze', async () => {
      const res = await request(app)
        .post(`/api/meals/${validMealId}/reanalyze`)
        .set('Authorization', `Bearer ${validToken}`)
        .send({});

      expect(res.status).toBe(400);
      expect(res.body.status).toBe('error');
      expect(res.body.errors[0].path).toBe('body.prompt');
    });
  });

  describe('Profile Endpoints Validation & Preprocessing', () => {
    it('preprocesses string whitespace on PUT /api/user/profile', async () => {
      const res = await request(app)
        .put('/api/user/profile')
        .set('Authorization', `Bearer ${validToken}`)
        .send({
          name: '  Jane Doe  ',
          timezone: '  America/New_York  ',
        });

      expect(res.status).toBe(200);
      expect(res.body.user.name).toBe('Jane Doe');
      expect(res.body.user.timezone).toBe('America/New_York');
    });

    it('coerces numeric strings in profile target fields', async () => {
      const res = await request(app)
        .put('/api/user/profile')
        .set('Authorization', `Bearer ${validToken}`)
        .send({
          targetCalories: '2500',
          targetProteinPct: '30',
          targetFatPct: '30',
          targetCarbsPct: '40',
        });

      expect(res.status).toBe(200);
      expect(res.body.user.targetCalories).toBe(2500);
    });

    it('preserves domain macro percentage sum validation in userService.ts', async () => {
      const res = await request(app)
        .put('/api/user/profile')
        .set('Authorization', `Bearer ${validToken}`)
        .send({
          targetProteinPct: 50,
          targetFatPct: 50,
          targetCarbsPct: 50,
        });

      expect(res.status).toBe(400);
      expect(res.body.message).toMatch(/Total macro percentages must equal 100%/);
    });

    it('validates weight endpoint POST /api/user/weight with numeric string coercion', async () => {
      const res = await request(app)
        .post('/api/user/weight')
        .set('Authorization', `Bearer ${validToken}`)
        .send({ weight: '72.5' });

      expect(res.status).toBe(200);
      expect(res.body.weightLog.weight).toBe(72.5);
    });

    it('returns HTTP 400 for invalid weight on POST /api/user/weight', async () => {
      const res = await request(app)
        .post('/api/user/weight')
        .set('Authorization', `Bearer ${validToken}`)
        .send({ weight: -10 });

      expect(res.status).toBe(400);
      expect(res.body.status).toBe('error');
    });
  });

  describe('Journal & Query String Preprocessing', () => {
    it('normalizes uppercase query parameters (e.g. DAY -> day) in GET /api/journal', async () => {
      const res = await request(app)
        .get('/api/journal?period=DAY')
        .set('Authorization', `Bearer ${validToken}`);

      expect(res.status).toBe(200);
      expect(res.body.period).toBe('day');
    });

    it('returns HTTP 400 for invalid period in GET /api/journal', async () => {
      const res = await request(app)
        .get('/api/journal?period=INVALID')
        .set('Authorization', `Bearer ${validToken}`);

      expect(res.status).toBe(400);
      expect(res.body.status).toBe('error');
    });
  });
});
