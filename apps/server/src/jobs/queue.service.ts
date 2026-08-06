import { prisma } from '../prisma';
import { JobStatus, RecognitionJob } from '@prisma/client';
import fs from 'fs';

export const enqueue = async (userId: string, imagePath: string): Promise<RecognitionJob> => {
  const job = await prisma.recognitionJob.create({
    data: {
      imagePath,
      status: JobStatus.PENDING,
      meal: {
        create: {
          userId,
          loggedAt: new Date(),
          calories: 0,
          imageUrl: imagePath,
        },
      },
    },
    include: {
      meal: true,
    },
  });

  return job;
};

export const fetchNextPendingJob = async (): Promise<RecognitionJob | null> => {
  const pendingJob = await prisma.recognitionJob.findFirst({
    where: { status: JobStatus.PENDING },
    orderBy: { createdAt: 'asc' },
  });

  if (!pendingJob) return null;

  // Atomic update to lock job and prevent race conditions
  const updated = await prisma.recognitionJob.updateMany({
    where: {
      id: pendingJob.id,
      status: JobStatus.PENDING,
    },
    data: {
      status: JobStatus.PROCESSING,
      attempts: { increment: 1 },
    },
  });

  if (updated.count === 0) {
    return null;
  }

  return prisma.recognitionJob.findUnique({
    where: { id: pendingJob.id },
  });
};

export const recoverStuckJobs = async (): Promise<void> => {
  const stuckJobs = await prisma.recognitionJob.findMany({
    where: { status: JobStatus.PROCESSING },
  });

  for (const job of stuckJobs) {
    if (job.attempts < job.maxAttempts) {
      await prisma.recognitionJob.update({
        where: { id: job.id },
        data: { status: JobStatus.PENDING },
      });
    } else {
      await prisma.recognitionJob.update({
        where: { id: job.id },
        data: {
          status: JobStatus.FAILED,
          lastError: 'Server restarted while processing (max attempts reached)',
        },
      });

      if (job.imagePath) {
        fs.unlink(job.imagePath, (err) => {
          if (err && err.code !== 'ENOENT') {
            console.error('Failed to delete temp file on stuck job recovery:', err);
          }
        });
      }

      if (job.mealId) {
        try {
          const meal = await prisma.meal.findUnique({ where: { id: job.mealId } });
          if (meal && meal.calories === 0 && !meal.title) {
            await prisma.meal.delete({ where: { id: job.mealId } });
          }
        } catch (err) {
          // ignore cleanup errors
        }
      }
    }
  }
};
