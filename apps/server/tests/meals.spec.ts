import request from 'supertest';
import app from '../src/index';
import jwt from 'jsonwebtoken';
import { prisma } from '../src/prisma';
import path from 'path';
import fs from 'fs';
import * as cp from 'child_process';
import { queueWorker } from '../src/jobs/queue.worker';

describe('Meals Routes', () => {
  let validToken: string;
  let testUserId: string;

  beforeAll(async () => {
    queueWorker.start();
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

  beforeEach(() => {
    process.env.CLI_COMMAND_TEMPLATE = "echo '{\"calories\": 500, \"protein\": 30, \"carbs\": 45, \"fat\": 20, \"health_warnings\": \"Contains nuts\"}'";
  });

  afterAll(async () => {
    queueWorker.stop();
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
    for (let i = 0; i < 15; i++) {
      await new Promise(r => setTimeout(r, 300));
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

  it('should reanalyze a meal with a custom prompt', async () => {
    process.env.CLI_COMMAND_TEMPLATE = "echo '{\"calories\": 750, \"protein\": 45, \"carbs\": 60, \"fat\": 30, \"health_warnings\": \"Updated macros with extra chicken\"}'";

    const tempImg = path.join(__dirname, 'temp_reanalyze.jpg');
    fs.writeFileSync(tempImg, 'image content');

    const meal = await prisma.meal.create({
      data: {
        userId: testUserId,
        loggedAt: new Date(),
        calories: 500,
        imageUrl: tempImg,
      }
    });

    const res = await request(app)
      .post(`/api/meals/${meal.id}/reanalyze`)
      .set('Authorization', `Bearer ${validToken}`)
      .send({ prompt: 'Add 100g chicken breast' });

    expect(res.status).toBe(200);
    expect(res.body.meal.calories).toBe(750);
    expect(res.body.result.health_warnings).toBe('Updated macros with extra chicken');

    if (fs.existsSync(tempImg)) fs.unlinkSync(tempImg);
  });

  it('should handle custom prompts containing single quotes, double quotes, and special characters', async () => {
    process.env.CLI_COMMAND_TEMPLATE = "echo '{{PROMPT}}' > /dev/null && echo '{\"calories\": 800, \"protein\": 50, \"carbs\": 70, \"fat\": 35, \"health_warnings\": \"Handled special prompt\"}'";

    const tempImg = path.join(__dirname, 'temp_reanalyze_quotes.jpg');
    fs.writeFileSync(tempImg, 'image content');

    const meal = await prisma.meal.create({
      data: {
        userId: testUserId,
        loggedAt: new Date(),
        calories: 500,
        imageUrl: tempImg,
      }
    });

    const res = await request(app)
      .post(`/api/meals/${meal.id}/reanalyze`)
      .set('Authorization', `Bearer ${validToken}`)
      .send({ prompt: "Добавь 50g сыра 'Гауда' & 100% $5 соус" });

    expect(res.status).toBe(200);
    expect(res.body.meal.calories).toBe(800);

    if (fs.existsSync(tempImg)) fs.unlinkSync(tempImg);
  });

  it('should delete (cancel) a meal and clean up its image file', async () => {
    const tempImg = path.join(__dirname, 'temp_delete.jpg');
    fs.writeFileSync(tempImg, 'image content');

    const meal = await prisma.meal.create({
      data: {
        userId: testUserId,
        loggedAt: new Date(),
        calories: 300,
        imageUrl: tempImg,
      }
    });

    const res = await request(app)
      .delete(`/api/meals/${meal.id}`)
      .set('Authorization', `Bearer ${validToken}`);

    expect(res.status).toBe(200);
    expect(res.body.message).toBe('Meal cancelled and deleted successfully');
    expect(fs.existsSync(tempImg)).toBe(false);

    const deletedMeal = await prisma.meal.findUnique({ where: { id: meal.id } });
    expect(deletedMeal).toBeNull();
  });
});
