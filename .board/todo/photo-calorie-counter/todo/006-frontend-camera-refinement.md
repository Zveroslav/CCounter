# Ticket: 006-frontend-camera-refinement

## 1. Objective
Implement the massive camera button and the Refinement Loop UI.

## 2. Requirements
- `<input type="file" capture="environment" />` for taking photos.
- Upload photo to backend, show loading spinner while polling `GET /api/meals/jobs/:id`.
- Show Refinement screen: Display Macros (Calories, P, F, C), Health Warnings.
- Allow user to add text comments and request re-analysis, or save to journal.

## 3. Technical Implementation Details
- Files to modify: `src/components/CaptureButton.tsx`, `src/views/RefinementView.tsx`, `src/api/meals.ts`.
- Ensure fluid UX during polling.

## 4. Verification & Testing
- [ ] Test taking a photo, polling for status, and displaying the result.
- [ ] Verify the user can edit macros or send a refinement prompt.
