import fs from 'fs';
import { prisma } from '../prisma';
import { JobStatus, RecognitionJob } from '@prisma/client';
import { fetchNextPendingJob } from './queue.service';
import { recognizeMealFromImage } from '../services/gemini';

export interface QueueWorkerOptions {
  pollIntervalMs?: number;
}

export class QueueWorker {
  private timer: NodeJS.Timeout | null = null;
  private isRunning: boolean = false;
  private isProcessing: boolean = false;
  private pollIntervalMs: number;

  constructor(options: QueueWorkerOptions = {}) {
    this.pollIntervalMs = options.pollIntervalMs ?? 1000;
  }

  public start(): void {
    if (this.isRunning) return;
    this.isRunning = true;
    this.scheduleNextTick();
  }

  public stop(): void {
    this.isRunning = false;
    if (this.timer) {
      clearTimeout(this.timer);
      this.timer = null;
    }
  }

  private scheduleNextTick(): void {
    if (!this.isRunning) return;
    this.timer = setTimeout(async () => {
      await this.tick();
      this.scheduleNextTick();
    }, this.pollIntervalMs);
    // Unref timer so Node process is not prevented from exiting gracefully
    if (this.timer && typeof this.timer.unref === 'function') {
      this.timer.unref();
    }
  }

  public async tick(): Promise<void> {
    if (this.isProcessing) return;
    try {
      this.isProcessing = true;
      await this.processNextJob();
    } catch (err) {
      console.error('Error during worker tick:', err);
    } finally {
      this.isProcessing = false;
    }
  }

  public async processNextJob(): Promise<boolean> {
    const job = await fetchNextPendingJob();
    if (!job) return false;

    await this.processJob(job);
    return true;
  }

  private async processJob(job: RecognitionJob): Promise<void> {
    const imagePath = job.imagePath;

    // Edge Case 2: Orphan Job (Meal deleted mid-flight)
    if (!job.mealId) {
      await this.handleJobFailure(job, 'Meal deleted', true);
      return;
    }

    const meal = await prisma.meal.findUnique({ where: { id: job.mealId } });
    if (!meal) {
      await this.handleJobFailure(job, 'Meal not found or deleted', true);
      return;
    }

    // Edge Case 1: File Missing Before Processing
    if (!imagePath || !fs.existsSync(imagePath)) {
      await this.handleJobFailure(job, 'File not found (ENOENT)', true);
      return;
    }

    try {
      // AI Image Processing
      const result = await recognizeMealFromImage(imagePath);

      // Update Meal on success
      await prisma.meal.update({
        where: { id: job.mealId },
        data: {
          calories: result.calories,
          protein: result.protein,
          carbs: result.carbs,
          fat: result.fat,
          title: result.title,
          recognizedText: result.description,
        },
      });

      // Update Job status to COMPLETED
      await prisma.recognitionJob.update({
        where: { id: job.id },
        data: {
          status: JobStatus.COMPLETED,
          result: JSON.stringify(result),
        },
      });

      // RETAIN image file on success for reanalyzeMeal
    } catch (err: any) {
      const errorMessage = err?.message || String(err);
      console.error(`Job ${job.id} processing failed (attempt ${job.attempts}/${job.maxAttempts}):`, errorMessage);

      const hasReachedMaxAttempts = job.attempts >= job.maxAttempts;

      if (hasReachedMaxAttempts) {
        await this.handleJobFailure(job, errorMessage, true);
      } else {
        // Reset status to PENDING for retry, record error
        await prisma.recognitionJob.update({
          where: { id: job.id },
          data: {
            status: JobStatus.PENDING,
            lastError: errorMessage,
          },
        });
        // RETAIN image file on retry
      }
    }
  }

  private async handleJobFailure(job: RecognitionJob, errorMessage: string, deleteFileAndMeal: boolean): Promise<void> {
    await prisma.recognitionJob.update({
      where: { id: job.id },
      data: {
        status: JobStatus.FAILED,
        lastError: errorMessage,
      },
    });

    if (deleteFileAndMeal) {
      // Delete temporary image file
      if (job.imagePath) {
        fs.unlink(job.imagePath, (err) => {
          if (err && err.code !== 'ENOENT') {
            console.error('Failed to delete temp file on job failure:', err);
          }
        });
      }

      // Delete temporary empty Meal if applicable
      if (job.mealId) {
        try {
          const meal = await prisma.meal.findUnique({ where: { id: job.mealId } });
          if (meal && meal.calories === 0 && !meal.title) {
            await prisma.meal.delete({ where: { id: job.mealId } });
          }
        } catch (deleteErr) {
          console.error('Failed to delete empty meal on job failure:', deleteErr);
        }
      }
    }
  }
}

// Global worker instance singleton
export const queueWorker = new QueueWorker();
