# Ticket: 002-backend-gemini-integration

## 1. Objective
Implement the integration using the local terminal client and the `POST /api/meals/recognize` pipeline.

## 2. Requirements
- Create a service utility that executes the terminal client via Node's `child_process.exec` (or similar).
- Implement `POST /api/meals/recognize` to handle image upload, run the terminal client without saving the image permanently, and parse the JSON response.
- Use Zod to validate the JSON response (Calories, Macros, Health Warnings).
- Implement `GET /api/meals/jobs/:id` for polling the recognition job status.
- Implement `POST /api/meals/:id/refine` for adding text context or extra photos.

## 3. Technical Implementation Details
- Files to modify: `src/services/gemini.ts`, `src/controllers/mealsController.ts`, `src/routes/meals.ts`.
- Delete the photo immediately after feeding it to the terminal client.

## 4. Verification & Testing
- [ ] E2E Test: Upload a mock image and verify the job is created.
- [ ] Verify the terminal client returns correctly structured Zod-validated JSON.
