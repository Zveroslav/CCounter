import request from 'supertest';
import app from '../src/index';
import jwt from 'jsonwebtoken';
import { prisma } from '../src/prisma';
import path from 'path';
import fs from 'fs';
import * as cp from 'child_process';

describe('Meals Routes', () => {
  let validToken: string;
  let testUserId: string;

  beforeAll(async () => {
    process.env.CLI_COMMAND_TEMPLATE = "echo '{\"calories\": 500, \"protein\": 30, \"carbs\": 45, \"fat\": 20, \"health_warnings\": \"Contains nuts\"}'";

    // Create a test user in SQLite
    const user = await prisma.user.create({
      data: {
        email: 'mealtest@example.com',
      }
    });
    testUserId = user.id;

    const secret = process.env.JWT_SECRET || 'test-secret';
    validToken = jwt.sign({ id: user.id, email: user.email }, secret);
  });

  afterAll(async () => {
    // Cleanup DB
    await prisma.recognitionJob.deleteMany({});
    await prisma.meal.deleteMany({});
    await prisma.user.deleteMany({ where: { email: 'mealtest@example.com' } });
    jest.restoreAllMocks();
  });

  it('should upload an image and create a recognition job', async () => {
    // Create a dummy image file
    const dummyImagePath = path.join(__dirname, 'dummy.jpg');
    fs.writeFileSync(dummyImagePath, 'dummy content');

    const res = await request(app)
      .post('/api/meals/recognize')
      .set('Authorization', `Bearer ${validToken}`)
      .attach('image', dummyImagePath);

    fs.unlinkSync(dummyImagePath);

    expect(res.status).toBe(202);
    expect(res.body.message).toBe('Image received, recognition started');
    expect(res.body.jobId).toBeDefined();

    // Wait for the background process to complete (poll up to 5 times, 500ms each)
    let jobRes;
    for (let i = 0; i < 5; i++) {
      await new Promise(r => setTimeout(r, 500));
      jobRes = await request(app)
        .get(`/api/meals/jobs/${res.body.jobId}`)
        .set('Authorization', `Bearer ${validToken}`);
      if (jobRes.body.status !== 'PENDING') break;
    }

    expect(jobRes!.status).toBe(200);
    expect(jobRes!.body.status).toBe('COMPLETED');
    expect(jobRes!.body.result.calories).toBe(500);
    expect(jobRes!.body.result.health_warnings).toBe('Contains nuts');
  });

  it('should mark job FAILED and clean up temporary meal when recognition fails', async () => {
    process.env.CLI_COMMAND_TEMPLATE = "invalid_command_nonexistent_xyz 123";

    const dummyImagePath = path.join(__dirname, 'dummy_fail.jpg');
    fs.writeFileSync(dummyImagePath, 'dummy content');

    const res = await request(app)
      .post('/api/meals/recognize')
      .set('Authorization', `Bearer ${validToken}`)
      .attach('image', dummyImagePath);

    if (fs.existsSync(dummyImagePath)) fs.unlinkSync(dummyImagePath);

    expect(res.status).toBe(202);
    const createdMealId = res.body.mealId;

    let jobRes;
    for (let i = 0; i < 5; i++) {
      await new Promise(r => setTimeout(r, 500));
      jobRes = await request(app)
        .get(`/api/meals/jobs/${res.body.jobId}`)
        .set('Authorization', `Bearer ${validToken}`);
      if (jobRes.body.status !== 'PENDING') break;
    }

    expect(jobRes!.status).toBe(200);
    expect(jobRes!.body.status).toBe('FAILED');

    // Verify the temporary meal was deleted from database
    const meal = await prisma.meal.findUnique({ where: { id: createdMealId } });
    expect(meal).toBeNull();
  });
});
