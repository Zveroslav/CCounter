# Ticket: 012-backend-meal-reanalysis-and-cleanup

## 1. Objective
Implement backend endpoints and image persistence for meal cancellation and AI re-analysis with additional user prompts.

## 2. Requirements
- Do not immediately delete uploaded meal images upon initial AI recognition completion; keep image path accessible for re-analysis while the meal draft exists.
- Add `DELETE /meals/:id` endpoint to discard an unconfirmed meal draft, delete associated `RecognitionJob`, and unlink the image file.
- Add `POST /meals/:id/reanalyze` endpoint accepting `{ prompt: string }` to re-trigger Gemini Vision analysis with the stored image and updated prompt, returning updated macro estimates.
- Clean up temp image files upon meal deletion (`DELETE /meals/:id`) or final meal confirmation (`PUT /meals/:id`).
- Ensure unit and E2E tests are added for deletion and re-analysis.

## 3. Technical Implementation Details
- **Files to modify**:
  - `apps/server/src/controllers/mealsController.ts`
  - `apps/server/src/routes/meals.ts`
  - `apps/server/src/services/gemini.ts`
  - `openapi.yaml`
- **Expected changes**:
  - Update `recognizeMeal` to preserve `imagePath` in `Meal` or job metadata until cleaned up.
  - Implement `reanalyzeMeal` in `mealsController.ts` and `gemini.ts` to support optional custom prompt.
  - Implement `deleteMeal` endpoint in `mealsController.ts`.

## 4. Verification & Testing
- [ ] Integration tests in `apps/server/tests/meals.test.ts` or `meals.spec.ts` for `DELETE /meals/:id` and `POST /meals/:id/reanalyze`.
- [ ] Verify image file is properly cleaned up on deletion and save.
