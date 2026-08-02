# Ticket: 001-backend-setup

## 1. Objective
Initialize the Node.js backend, setup Express, TypeScript, Prisma ORM with SQLite, and basic JWT auth flow.

## 2. Requirements
- Setup Node.js + Express + TypeScript skeleton.
- Setup Prisma ORM with SQLite.
- Define Prisma schema for `User`, `WeightLog`, `Meal`, `DailySummary`, `WeeklySummary`, `MonthlySummary`, `RecognitionJob`.
- Setup global error handling and JWT-based authentication middleware (reads JWT from request).

## 3. Technical Implementation Details
- Files to modify: `schema.prisma`, `src/index.ts`, `src/middleware/auth.ts`.
- Ensure Prisma schema supports timezone on User model.

## 4. Verification & Testing
- [ ] Verify `npm run dev` starts the server without errors.
- [ ] Verify Prisma migrations can be applied.
- [ ] Verify JWT middleware correctly rejects unauthorized requests.
