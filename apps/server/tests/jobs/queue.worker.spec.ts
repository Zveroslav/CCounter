import request from 'supertest';
import app from '../../src/index';
import jwt from 'jsonwebtoken';
import { prisma } from '../../src/prisma';
import path from 'path';
import fs from 'fs';
import * as queueService from '../../src/jobs/queue.service';
import { QueueWorker } from '../../src/jobs/queue.worker';

describe('Job Queue & Worker Specification Tests', () => {
  let validToken: string;
  let testUserId: string;

  beforeAll(async () => {
    process.env.CLI_COMMAND_TEMPLATE = "echo '{\"calories\": 500, \"protein\": 30, \"carbs\": 45, \"fat\": 20, \"health_warnings\": \"None\"}'";

    const user = await prisma.user.create({
      data: {
        email: 'queue_worker_test@example.com',
      },
    });
    testUserId = user.id;

    const secret = process.env.JWT_SECRET || 'test-secret';
    validToken = jwt.sign({ id: user.id, email: user.email }, secret);
  });

  beforeEach(async () => {
    await prisma.recognitionJob.deleteMany({});
    await prisma.meal.deleteMany({});
  });

  afterAll(async () => {
    await prisma.recognitionJob.deleteMany({});
    await prisma.meal.deleteMany({});
    await prisma.user.deleteMany({ where: { email: 'queue_worker_test@example.com' } });
    jest.restoreAllMocks();
  });

  describe('HTTP Endpoint (recognizeMeal)', () => {
    it('returns 202 Accepted immediately with job metadata and creates PENDING job in DB', async () => {
      const dummyImagePath = path.join(__dirname, 'test_immediate.jpg');
      fs.writeFileSync(dummyImagePath, 'test image content');

      const res = await request(app)
        .post('/api/meals/recognize')
        .set('Authorization', `Bearer ${validToken}`)
        .attach('image', dummyImagePath);

      if (fs.existsSync(dummyImagePath)) fs.unlinkSync(dummyImagePath);

      expect(res.status).toBe(202);
      expect(res.body.jobId).toBeDefined();
      expect(res.body.mealId).toBeDefined();

      const job = await prisma.recognitionJob.findUnique({
        where: { id: res.body.jobId },
      });

      expect(job).not.toBeNull();
      expect(job?.status).toBe('PENDING');
      expect(job?.mealId).toBe(res.body.mealId);
      expect(job?.imagePath).toBeDefined();

      // Clean up created meal & job file
      if (job?.imagePath && fs.existsSync(job.imagePath)) {
        fs.unlinkSync(job.imagePath);
      }
    });
  });

  describe('Worker Execution & Processing', () => {
    it('Happy path: worker processes job, marks COMPLETED, and retains image file', async () => {
      process.env.CLI_COMMAND_TEMPLATE = "echo '{\"calories\": 600, \"protein\": 40, \"carbs\": 50, \"fat\": 15, \"health_warnings\": \"Tasty\"}'";

      const testImg = path.join(__dirname, 'happy_path.jpg');
      fs.writeFileSync(testImg, 'happy path image');

      const job = await queueService.enqueue(testUserId, testImg);
      expect(job.status).toBe('PENDING');

      const worker = new QueueWorker({ pollIntervalMs: 100 });
      await worker.processNextJob();

      const updatedJob = await prisma.recognitionJob.findUnique({
        where: { id: job.id },
      });
      expect(updatedJob?.status).toBe('COMPLETED');
      expect(updatedJob?.result).toBeDefined();

      const updatedMeal = await prisma.meal.findUnique({
        where: { id: job.mealId! },
      });
      expect(updatedMeal?.calories).toBe(600);

      // Verify image file is retained for reanalyzeMeal
      expect(fs.existsSync(testImg)).toBe(true);

      // Cleanup
      if (fs.existsSync(testImg)) fs.unlinkSync(testImg);
    });

    it('Failure & Retries: retries when attempts < maxAttempts and retains file', async () => {
      process.env.CLI_COMMAND_TEMPLATE = "invalid_command_nonexistent_123";

      const testImg = path.join(__dirname, 'retry_path.jpg');
      fs.writeFileSync(testImg, 'retry path image');

      const job = await queueService.enqueue(testUserId, testImg);
      expect(job.status).toBe('PENDING');

      const worker = new QueueWorker({ pollIntervalMs: 100 });

      // First execution attempt
      await worker.processNextJob();

      const jobAfterAttempt1 = await prisma.recognitionJob.findUnique({
        where: { id: job.id },
      });
      expect(jobAfterAttempt1?.attempts).toBe(1);
      expect(jobAfterAttempt1?.status).toBe('PENDING'); // set back to PENDING for retry
      expect(jobAfterAttempt1?.lastError).toBeDefined();
      expect(fs.existsSync(testImg)).toBe(true);

      // Cleanup
      if (fs.existsSync(testImg)) fs.unlinkSync(testImg);
    });

    it('Failure & Retries: marks FAILED and deletes temporary image file when max attempts reached', async () => {
      process.env.CLI_COMMAND_TEMPLATE = "invalid_command_nonexistent_123";

      const testImg = path.join(__dirname, 'fail_max_path.jpg');
      fs.writeFileSync(testImg, 'max attempt fail image');

      const job = await queueService.enqueue(testUserId, testImg);

      // Manually set attempts to 2 out of max 3
      await prisma.recognitionJob.update({
        where: { id: job.id },
        data: { attempts: 2 },
      });

      const worker = new QueueWorker({ pollIntervalMs: 100 });
      await worker.processNextJob();

      const jobAfterFinalAttempt = await prisma.recognitionJob.findUnique({
        where: { id: job.id },
      });
      expect(jobAfterFinalAttempt?.attempts).toBe(3);
      expect(jobAfterFinalAttempt?.status).toBe('FAILED');
      expect(jobAfterFinalAttempt?.lastError).toBeDefined();

      // Verify temporary image file was deleted
      expect(fs.existsSync(testImg)).toBe(false);

      // Verify empty meal was cleaned up
      const meal = await prisma.meal.findUnique({ where: { id: job.mealId! } });
      expect(meal).toBeNull();
    });

    it('File missing before processing: catches ENOENT, marks FAILED without crashing worker', async () => {
      const missingImg = path.join(__dirname, 'nonexistent_file.jpg');
      if (fs.existsSync(missingImg)) fs.unlinkSync(missingImg);

      const job = await queueService.enqueue(testUserId, missingImg);

      const worker = new QueueWorker({ pollIntervalMs: 100 });
      await expect(worker.processNextJob()).resolves.not.toThrow();

      const updatedJob = await prisma.recognitionJob.findUnique({
        where: { id: job.id },
      });
      expect(updatedJob?.status).toBe('FAILED');
      expect(updatedJob?.lastError).toMatch(/ENOENT|file not found|missing/i);
    });

    it('Orphan jobs (Meal deleted mid-flight): handles missing meal gracefully', async () => {
      const testImg = path.join(__dirname, 'orphan_img.jpg');
      fs.writeFileSync(testImg, 'orphan test image');

      const job = await queueService.enqueue(testUserId, testImg);

      // Delete the meal mid-flight
      await prisma.meal.delete({ where: { id: job.mealId! } });

      const worker = new QueueWorker({ pollIntervalMs: 100 });
      await expect(worker.processNextJob()).resolves.not.toThrow();

      const updatedJob = await prisma.recognitionJob.findUnique({
        where: { id: job.id },
      });
      expect(updatedJob?.status).toBe('FAILED');
      expect(updatedJob?.lastError).toMatch(/meal deleted|meal not found/i);
      expect(fs.existsSync(testImg)).toBe(false);
    });
  });

  describe('Server Restart & Startup Recovery', () => {
    it('Stuck job reset: resets PROCESSING jobs with attempts < maxAttempts to PENDING', async () => {
      const testImg = path.join(__dirname, 'stuck_pending.jpg');
      fs.writeFileSync(testImg, 'stuck pending image');

      const job = await queueService.enqueue(testUserId, testImg);

      // Simulate server crash while job was in PROCESSING state
      await prisma.recognitionJob.update({
        where: { id: job.id },
        data: { status: 'PROCESSING', attempts: 1 },
      });

      await queueService.recoverStuckJobs();

      const recoveredJob = await prisma.recognitionJob.findUnique({
        where: { id: job.id },
      });
      expect(recoveredJob?.status).toBe('PENDING');
      expect(fs.existsSync(testImg)).toBe(true);

      // Cleanup
      if (fs.existsSync(testImg)) fs.unlinkSync(testImg);
    });

    it('Stuck job reset: marks PROCESSING jobs with attempts >= maxAttempts as FAILED and deletes image file', async () => {
      const testImg = path.join(__dirname, 'stuck_failed.jpg');
      fs.writeFileSync(testImg, 'stuck failed image');

      const job = await queueService.enqueue(testUserId, testImg);

      // Simulate server crash on final attempt
      await prisma.recognitionJob.update({
        where: { id: job.id },
        data: { status: 'PROCESSING', attempts: 3 },
      });

      await queueService.recoverStuckJobs();

      const recoveredJob = await prisma.recognitionJob.findUnique({
        where: { id: job.id },
      });
      expect(recoveredJob?.status).toBe('FAILED');
      expect(recoveredJob?.lastError).toBeDefined();
      expect(fs.existsSync(testImg)).toBe(false);
    });
  });
});
