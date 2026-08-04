# Backend Architecture Refactoring

## Business Goal
As the application scales, the backend needs a solid, maintainable foundation. Currently, the Express controllers handle everything from HTTP transport and validation to direct database queries and in-memory background processing. This story aims to implement a robust, enterprise-grade architecture (Thin Controllers, Fat Services) to improve testability, error handling, and reliability of AI recognition jobs.

## System Improvements
- **Reliability**: Background jobs (AI image recognition) won't be lost on server restarts.
- **Maintainability**: Clear separation of concerns (Controllers, Services, Validation).
- **Clean Code**: Reduction of `try/catch` boilerplate across the entire API layer.

## High-Level Implementation Steps
1. **Async Error Handling**: Implement `express-async-errors` or a custom `catchAsync` wrapper to eliminate repetitive `try/catch` blocks in controllers.
2. **Service Layer Extraction**: Refactor controller logic (especially in `mealsController`) out into dedicated services (`MealService`, `JobService`).
3. **Validation Layer**: Introduce Zod for request validation (body, query, params) via middleware.
4. **Robust Job Queue**: Replace the in-memory IIFE `(async () => {})()` pattern with a persistent or resumable job queue for AI image processing to prevent hanging PENDING jobs.
