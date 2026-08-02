# Ticket: 005-frontend-shell-pwa

## 1. Objective
Initialize the React Vite frontend, setup Tailwind CSS, and configure the PWA shell (online-only).

## 2. Requirements
- Setup Vite + React + TypeScript + Tailwind CSS.
- Configure Web App Manifest and Service Worker (PWA setup), but without offline data caching.
- Optimize for iOS Safari: disable pull-to-refresh on forms, handle safe-areas.
- Create basic layout: Bottom navigation, large floating capture button.
- Implement dummy JWT injection for API calls (to be configured in Profile).

## 3. Technical Implementation Details
- Files to modify: `vite.config.ts`, `public/manifest.json`, `src/App.tsx`, `src/index.css`.
- Ensure layout matches "one-handed use" constraints.

## 4. Verification & Testing
- [ ] Build and verify Lighthouse PWA score (ignoring offline capabilities if necessary).
- [ ] Test layout on simulated iOS Safari.
