# 002 - Frontend Production Build & Static Serving

## Goal
Serve the compiled React/Vite client directly from the Express backend in production mode to simplify deployment.

## Requirements
1. **Express Static Middleware**: In `apps/server/src/index.ts`, check if `process.env.NODE_ENV === 'production'`. If true:
   - Use `express.static` to serve files from `../../client/dist`.
   - Add a catch-all route (`*`) that sends `../../client/dist/index.html` to support React Router's client-side routing.
2. **API Path Precedence**: Ensure that the `/api` routes and `/webhook` routes are registered *before* the catch-all wildcard route, so API requests are not overridden by the React frontend.
3. **Frontend API URL**: Ensure the Vite build (via `.env.production` in `apps/client`) points to the correct production API endpoint (e.g. `/api` relative path instead of `http://localhost:3000/api`).
