# 001 - Backend Production Build

## Goal
Configure the server side to compile TypeScript into JavaScript and run optimally in production, using environment variables tailored for a production environment.

## Requirements
1. **Compilation**: Ensure the `apps/server/package.json` has a working `build` script that uses `tsc` and outputs to a `dist` directory.
2. **Start Script**: Add a `start` script to `apps/server/package.json` that runs `node dist/index.js` (or whichever is the main entry point).
3. **Environment Configuration**: Create a template `.env.production` (or `.env.example`) that includes:
   - `NODE_ENV=production`
   - `JWT_SECRET` (with a note that it must be changed)
   - Database URL pointing to a production SQLite file path (e.g., `file:./prod.db`)
   - Any necessary CORS origins.
4. **Makefile Update**: Add a `build` and `start:prod` command to the root `Makefile` that builds both client and server and starts them.
