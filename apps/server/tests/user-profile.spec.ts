import request from 'supertest';
import app from '../src/index';
import jwt from 'jsonwebtoken';
import { prisma } from '../src/prisma';

describe('User Profile — Macro Percentages', () => {
  const secret = process.env.JWT_SECRET || 'test-secret';
  const testUserId = 'test-macro-user';
  const validToken = jwt.sign({ id: testUserId, email: 'macro@test.com' }, secret);

  beforeAll(async () => {
    await prisma.user.upsert({
      where: { id: testUserId },
      update: {},
      create: {
        id: testUserId,
        email: 'macro@test.com',
        name: 'Macro Test',
      },
    });
  });

  afterAll(async () => {
    await prisma.user.deleteMany({ where: { id: testUserId } });
    await prisma.$disconnect();
  });

  it('returns 400 when macro percentages do not sum to 100', async () => {
    const res = await request(app)
      .put('/api/user/profile')
      .set('Authorization', `Bearer ${validToken}`)
      .send({
        targetProteinPct: 40,
        targetFatPct: 40,
        targetCarbsPct: 40,
      });

    expect(res.status).toBe(400);
    expect(res.body.message).toMatch(/100/);
  });

  it('accepts valid macro percentages summing to 100', async () => {
    const res = await request(app)
      .put('/api/user/profile')
      .set('Authorization', `Bearer ${validToken}`)
      .send({
        targetProteinPct: 30,
        targetFatPct: 30,
        targetCarbsPct: 40,
      });

    expect(res.status).toBe(200);
    expect(res.body.message).toBe('Profile updated successfully');
  });

  it('allows partial update without macro validation', async () => {
    const res = await request(app)
      .put('/api/user/profile')
      .set('Authorization', `Bearer ${validToken}`)
      .send({ name: 'Test User' });

    expect(res.status).toBe(200);
    expect(res.body.message).toBe('Profile updated successfully');
  });

  it('returns Pct fields in GET /api/user/profile', async () => {
    const res = await request(app)
      .get('/api/user/profile')
      .set('Authorization', `Bearer ${validToken}`);

    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('targetProteinPct');
    expect(res.body).toHaveProperty('targetFatPct');
    expect(res.body).toHaveProperty('targetCarbsPct');
    // Old fields should NOT be present
    expect(res.body).not.toHaveProperty('targetProtein');
    expect(res.body).not.toHaveProperty('targetFat');
    expect(res.body).not.toHaveProperty('targetCarbs');
  });
});
