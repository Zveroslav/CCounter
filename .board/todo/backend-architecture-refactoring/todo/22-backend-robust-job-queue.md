# Ticket 22: Robust Job Queue for AI Processing

## Goal
Replace the in-memory IIFE `(async () => {})()` used for background image processing with a robust queue system to prevent job loss on server restarts and handle retries/failures gracefully.

## Implementation Steps
1. Evaluate a queue solution (e.g. BullMQ with Redis, or if avoiding Redis, a robust DB-backed polling worker).
2. Move the background execution logic from `recognizeMeal` into a dedicated worker process or queue processor.
3. Update the `recognizeMeal` endpoint to simply enqueue the image path and meal ID, then immediately return a 202 Accepted response.
4. Ensure the queue processor handles cleanup (deleting the temporary image file) regardless of success or failure.

## Acceptance Criteria
- Uploaded images are processed reliably in the background.
- If the Node process crashes mid-processing, the job can be resumed or properly marked as failed upon restart.
- No dangling files are left in the filesystem after processing completes or fails.
