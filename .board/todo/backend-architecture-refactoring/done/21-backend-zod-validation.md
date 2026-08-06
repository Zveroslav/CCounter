# Ticket 21: Zod Data Validation Layer

## Goal
Enforce strict type safety and request validation at the HTTP boundary before requests reach the controllers.

## Implementation Steps
1. Install `zod` and write a validation middleware (e.g. `validateRequest(schema)`).
2. Create Zod schemas for all API payloads (e.g., `updateMealSchema`, `reanalyzeMealSchema`, `updateProfileSchema`).
3. Apply the validation middleware to the corresponding routes in the `src/routes/` directory.
4. Remove manual type checks (like `if (!prompt || typeof prompt !== 'string')`) and fallback casting (`String(title)`, `Number(calories)`) from the controllers/services.

## Acceptance Criteria
- Invalid requests automatically return a 400 Bad Request with detailed validation errors.
- Controllers can safely assume that `req.body` exactly matches the expected TypeScript interface.
