# Ticket: 003-backend-cron-aggregation

## 1. Objective
Implement the `node-cron` background scheduler to aggregate daily, weekly, and monthly summaries per user timezone.

## 2. Requirements
- Use `node-cron` to run every hour at `:00`.
- Use `dayjs` to calculate local time for each user based on their `timezone`.
- At 00:00 local time: aggregate all `Meal` records into `DailySummary` and fetch a short AI comment from Gemini.
- At Sunday midnight: aggregate 7 `DailySummary` into `WeeklySummary`.
- At 1st of the month: aggregate into `MonthlySummary`.

## 3. Technical Implementation Details
- Files to modify: `src/jobs/aggregator.ts`, `src/index.ts`.
- Iterate through all users, check their local time, and run necessary aggregations within transactions.

## 4. Verification & Testing
- [ ] Unit test: Verify `dayjs` correctly identifies users at midnight.
- [ ] E2E Test: Force the cron job to run and verify `DailySummary` is created.
