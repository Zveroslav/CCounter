# Ticket 16: Frontend UI Kit Extraction

## Goal
Extract inline Tailwind classes from common elements (buttons, inputs) into a dedicated UI component library to build a unified Design System.

## Implementation Steps
1. Create a `src/components/ui/` directory.
2. Create `Button.tsx`: A reusable button that accepts variants (e.g. `primary`, `secondary`, `danger`) and sizes, moving all hover/active state tailwind classes inside.
3. Create `Input.tsx`: A reusable form input wrapper.
4. Replace existing `<button>` and `<input>` usages across `Profile/index.tsx`, `RefinementForm.tsx`, and `ChatWidget.tsx` with these new components.
5. Verify UI visually to ensure styling remains identical.

## Acceptance Criteria
- Repeated Tailwind classes for basic primitives are centralized.
- Components can be updated in one place to reflect across the entire app.
