# Ticket 20: Service Layer Extraction

## Goal
Implement a "Thin Controller, Fat Service" architecture by moving business logic, Prisma calls, and file system operations out of the Express controllers.

## Implementation Steps
1. Create a `src/services/mealService.ts` (or similar domain services).
2. Move the core logic from `mealsController.ts` (such as `updateMeal`, `deleteMeal`, `reanalyzeMeal`) into pure TypeScript functions inside the service layer.
3. The controller should only be responsible for: extracting data from `req` (params, body, user), passing it to the service, and returning `res.json()`.
4. Repeat this pattern for `userController.ts`, `chatController.ts`, and `journalController.ts`.

## Acceptance Criteria
- Controllers do not import `prisma` directly.
- Controllers do not contain complex business logic or file system (`fs`) manipulations.
- All core business operations are exposed as service functions.
