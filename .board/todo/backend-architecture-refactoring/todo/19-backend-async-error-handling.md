# Ticket 19: Global Async Error Handling

## Goal
Remove repetitive `try/catch` boilerplate across all Express controllers.

## Implementation Steps
1. Install a library like `express-async-errors` OR implement a generic `catchAsync` wrapper function (e.g. `const catchAsync = fn => (req, res, next) => Promise.resolve(fn(req, res, next)).catch(next);`).
2. If using the wrapper, apply it to all route definitions in the `src/routes/` directory.
3. Remove all `try { ... } catch (error) { next(error) }` blocks from the controllers (e.g. `mealsController.ts`, `userController.ts`, `chatController.ts`, `journalController.ts`).

## Acceptance Criteria
- Controllers are significantly shorter and cleaner.
- Unhandled promise rejections inside async controllers are successfully caught and passed to the existing global error middleware.
