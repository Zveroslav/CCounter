# Ticket: 013-frontend-refinement-modal-and-cancel

## 1. Objective
Add Cancel button and Edit clarification modal on `RefinementView` to support discarding meal drafts and AI re-analysis.

## 2. Requirements
- Add a **Cancel** button on `RefinementView.tsx` that calls the backend meal cancellation API and redirects user to Home (`/`).
- Add an **Edit** button on `RefinementView.tsx` that triggers a modal dialog.
- The modal dialog must contain:
  - Textarea for user's clarification prompt (e.g., "Add 50g chicken breast", "This was skimmed milk").
  - "Submit / Recalculate" button which calls the backend re-analysis API.
  - Loading spinner state during AI recalculation.
- Upon receiving recalculated macros from backend, update form state in `RefinementView.tsx` and close modal.

## 3. Technical Implementation Details
- **Files to modify**:
  - `apps/client/src/api/meals.ts` (add `deleteMeal` and `reanalyzeMeal` client API functions).
  - `apps/client/src/pages/RefinementView.tsx` (add Cancel button, Edit button, modal state, loading states).

## 4. Verification & Testing
- [ ] Unit/Component tests for `RefinementView` or helper logic if applicable.
- [ ] Verify modal opens/closes cleanly.
- [ ] Verify Cancel button properly discards draft and navigates back.
