# Technical Specification: Robust Job Queue for AI Processing

## Context
Currently, the `recognizeMeal` endpoint triggers AI image processing asynchronously using an in-memory IIFE `(async () => {})()`. If the Node.js server crashes or restarts during processing, active jobs are lost without recovery. Furthermore, error handling and temporary file cleanup are unmanaged in failure scenarios.

## Task
Replace the in-memory IIFE in `recognizeMeal` with a robust DB-backed polling queue system built on SQLite/Prisma. 
- The worker will run in-process alongside the API server.
- The `recognizeMeal` endpoint will enqueue jobs into the database and immediately return a `202 Accepted` response.
- The background worker will pick up pending jobs, handle retries on failure, record status transitions, retain images upon success (to support `reanalyzeMeal`), and delete temporary image files only when processing fails or the associated meal is deleted.
- On server startup, stuck `PROCESSING` jobs will be recovered and either reset to `PENDING` or marked `FAILED` if retry limits are exceeded.

---

## Files to Modify

1. **`apps/server/prisma/schema.prisma`**
   - Define the `Job` (or `MealJob`) model and enum statuses (`PENDING`, `PROCESSING`, `COMPLETED`, `FAILED`).
   - Add relations or foreign key links to `Meal` if applicable.

2. **`apps/server/src/routes/meal.controller.ts`** (or `meal.router.ts`)
   - Update `recognizeMeal` controller to:
     1. Create a `Job` record in `PENDING` state with `mealId` and `imagePath`.
     2. Return HTTP `202 Accepted` immediately with the created job/meal metadata.

3. **`apps/server/src/services/meal.service.ts`**
   - Decouple the AI image processing execution logic from HTTP handler context so it can be called by the background job worker.

4. **`apps/server/src/index.ts`** (or `server.ts`)
   - Initialize and start the background worker interval on application startup.
   - Execute startup recovery logic to handle stuck jobs left in `PROCESSING` state from previous crashes.
   - Register graceful shutdown hooks to stop polling cleanly.

---

## New Files

1. **`apps/server/src/jobs/queue.service.ts`**
   - Provides methods to:
     - `enqueue(mealId: string, imagePath: string)`: Create a job in DB.
     - `fetchNextPendingJob()`: Atomically fetch and lock (mark as `PROCESSING`) the next pending job.
     - `recoverStuckJobs()`: Reset `PROCESSING` jobs on startup.

2. **`apps/server/src/jobs/queue.worker.ts`**
   - Polling worker class/loop that periodically queries for `PENDING` jobs.
   - Executes AI image processing with try/catch logic.
   - Updates job status (`COMPLETED` or `FAILED`), increments `attempts`, and records error messages.
   - Handles file deletion logic on job failure.

3. **`apps/server/tests/jobs/queue.worker.spec.ts`**
   - Unit and integration tests covering queue execution, retries, startup recovery, and file cleanup.

---

## Tests to Write

### 1. HTTP Endpoint Tests (`recognizeMeal`)
- **Immediate Acceptance**: Verify POST requests return `202 Accepted` with job metadata without awaiting AI processing completion.
- **Database Enqueue**: Verify a `Job` entry with status `PENDING` is created in SQLite with correct `mealId` and `imagePath`.

### 2. Worker Execution & Processing Tests
- **Happy Path**: Worker picks up `PENDING` job, transitions to `PROCESSING`, runs AI service, updates Meal data, transitions job to `COMPLETED`, and leaves the image file intact.
- **Failure & Retries**: When AI processing throws an error:
  - If `attempts < maxAttempts`: increment `attempts`, set status back to `PENDING` (or keep for retry), retain file.
  - If `attempts >= maxAttempts`: transition status to `FAILED`, record `lastError`, and **delete** the temporary image file from disk.
- **Meal Deletion Cleanup**: Deleting a meal removes associated image files regardless of job state.

### 3. Server Restart & Recovery Tests
- **Stuck Job Reset**: If server restarts with jobs in `PROCESSING` status:
  - Jobs with `attempts < maxAttempts` are reset to `PENDING`.
  - Jobs with `attempts >= maxAttempts` are updated to `FAILED` and their files are deleted.

---

## Edge Cases

1. **File Missing Before Processing**:
   - If the uploaded image file is deleted from disk before the worker processes the job, the worker must catch `ENOENT`, set job status to `FAILED`, and log the error without crashing the process.
2. **Orphan Jobs (Meal Deleted Mid-Flight)**:
   - If a user deletes a `Meal` while its job is `PENDING` or `PROCESSING`, the worker checks for meal existence before calling AI logic. If missing, the job is canceled/marked `FAILED` and cleaned up.
3. **SQLite Race Conditions**:
   - Atomic status updates (`UPDATE ... WHERE id = ? AND status = 'PENDING'`) ensure polling ticks do not re-fetch or duplicate job execution.
4. **Unhandled AI Provider Timeouts/Network Errors**:
   - Network errors are caught in the worker loop, triggering the standard retry backoff and preventing unhandled promise rejections.

---

## Out of Scope

- Integrating external queue systems (e.g. Redis, BullMQ, RabbitMQ).
- Running worker logic in a separate OS process or multi-threaded cluster (worker remains in-process within Node.js API server).
- Deleting uploaded images on successful AI processing (images must be retained for `reanalyzeMeal`).

---

## Decisions (Trade-offs Noted)

| Decision | Selected Approach | Trade-off / Rationale |
| :--- | :--- | :--- |
| **Queue Backend** | DB-backed Polling Worker (SQLite + Prisma) | **Trade-off:** Minimal DB polling overhead vs. **Benefit:** Zero extra infrastructure (no Redis dependency required). |
| **Worker Architecture** | In-Process Worker | **Trade-off:** Shares CPU/event loop with API server vs. **Benefit:** Simple process lifecycle and deployment. |
| **File Retention Strategy** | Delete ONLY on error or Meal deletion | **Trade-off:** Storage used for successful uploads vs. **Benefit:** Preserves images for `reanalyzeMeal` functionality. |
| **Crash Recovery** | Server Startup Reset (`PROCESSING` -> `PENDING` / `FAILED`) | **Trade-off:** Job retry occurs after server restart delay vs. **Benefit:** Simple and reliable recovery without distributed locks. |
