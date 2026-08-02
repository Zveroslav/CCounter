# Ticket: 007-frontend-journal-profile

## 1. Objective
Implement the Journal tabs (Day, Week, Month, All-Time) and the User Profile page.

## 2. Requirements
- Build 4 tabs for the Journal with corresponding charts/graphs (using a charting library like Recharts or Chart.js).
- Ensure missing days in the weekly view are charted at the user\'s maximum daily norm (0 calories ingested, but visually hits the top).
- Profile view: Set JWT token, Name, Timezone, Daily Goals (KBJU), and manual Weight logging.

## 3. Technical Implementation Details
- Files to modify: `src/views/JournalView.tsx`, `src/views/ProfileView.tsx`, `src/api/user.ts`.
- Save JWT token to localStorage so it persists.

## 4. Verification & Testing
- [ ] Verify Journal day view lists meals.
- [ ] Verify Week view chart displays missing days as the max norm.
- [ ] Verify Profile properly saves the JWT token.
