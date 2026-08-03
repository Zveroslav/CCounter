# Story: refine-meal-photo

## 1. Business Logic & Goal
Allow users on the meal refinement screen (`RefinementView`) to either cancel the current dish logging process entirely or edit/refine the meal estimation by submitting an additional text prompt to Gemini Vision using the same photo context.

## 2. Technical Architecture
- **Backend (`apps/server`)**:
  - Keep uploaded food images in temporary storage while the meal/job is pending confirmation.
  - Implement meal cancellation / draft deletion endpoint `DELETE /meals/:id` (or cancel job) which deletes the draft `Meal` and `RecognitionJob` and unlinks the uploaded image file.
  - Implement meal re-analysis endpoint `POST /meals/:id/reanalyze` (or `POST /meals/jobs/:id/reanalyze`) that accepts a `prompt` string, executes Gemini Vision CLI with the existing image path and new prompt, and updates the meal macros / health warnings.
- **Frontend (`apps/client`)**:
  - Update [`RefinementView.tsx`](file:///root/CCounter/apps/client/src/pages/RefinementView.tsx) to add:
    - **Cancel** button: Triggers cancellation API and navigates back to Home.
    - **Edit** button: Opens a modal with a text input allowing the user to specify extra clarification details (e.g. "Add 50g olive oil"), then triggers re-analysis without requiring photo re-upload.

## 3. Assumptions & Constraints
- Temp image files must be cleaned up on Cancel, on final Save, or if re-analysis fails/is cancelled.
- Follow the BACKEND-FIRST RULE: Backend API changes and tests must be completed before frontend implementation.

## 4. Ticket Breakdown
- [ ] 012-backend-meal-reanalysis-and-cleanup.md
- [ ] 013-frontend-refinement-modal-and-cancel.md
