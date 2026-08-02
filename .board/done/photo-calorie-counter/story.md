# Story: photo-calorie-counter

## 1. Business Logic & Goal
Create a PWA application "Счётчик калорий по фото" that allows users to track their daily nutrition (calories, macros) by simply taking a photo of their meal. It uses the Gemini API via a local CLI for intelligent recognition and providing health warnings. It includes an AI Nutritionist chat for insights based on aggregated periods (day/week/month/all-time).

## 2. Technical Architecture
- **Frontend**: React (Vite) + TypeScript + Tailwind CSS + PWA (Service Worker, Web App Manifest), optimized for iOS Safari (online-only).
- **Backend**: Node.js + Express + TypeScript.
- **Database**: Prisma ORM + SQLite.
- **AI**: Terminal CLI integration (calling the local terminal client via `child_process` in the background).
- **Auth**: JWT (token saved in user profile).
- **Scheduled Jobs**: `node-cron` + `dayjs` for aggregating meals into summaries and generating AI comments.

## 3. Assumptions & Constraints
- Photos are not stored; they are recognized and deleted immediately (in-memory or tmp files).
- The PWA is strictly online-only, no offline sync logic.
- The UI is designed for one-handed use on iOS Safari (huge capture button).
- Missing days in weekly graphs are charted as reaching the maximum daily norm.

## 4. Ticket Breakdown
- [ ] 001-backend-setup.md
- [ ] 002-backend-gemini-integration.md
- [ ] 003-backend-cron-aggregation.md
- [ ] 004-backend-chat-api.md
- [ ] 005-frontend-shell-pwa.md
- [ ] 006-frontend-camera-refinement.md
- [ ] 007-frontend-journal-profile.md
- [ ] 008-frontend-ai-chat.md
