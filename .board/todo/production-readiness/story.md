# Story: production-readiness

## 1. Business Logic & Goal
Prepare the CCounter application for production deployment on a VPS without using Docker. This includes compiling TypeScript to JavaScript, optimizing the frontend, serving the frontend via the Node.js backend, handling database migrations properly instead of brute-force pushes, and implementing HTTPS directly or via standard practices to ensure the PWA can be installed.

## 2. Technical Architecture
- **Frontend**: Vite build to generate static assets (`dist`).
- **Backend**: Compile TypeScript to JS, configure Express to serve the frontend static files.
- **Database**: Prisma Migrations (`migrate deploy`) for safe schema updates.
- **Security & PWA**: HTTPS setup (required for Service Workers and PWA installation).
- **Environment Variables**: Use `.env.production` for secure secrets and configuration.

## 3. Assumptions & Constraints
- Docker is explicitly excluded per user request.
- The backend Express server will handle both API requests and static file serving for simplicity.
- The user will deploy this on a VPS manually or via a simple Git-based deployment script.

## 4. Ticket Breakdown
- [ ] 001-backend-production-build.md
- [ ] 002-frontend-build-and-serve.md
- [ ] 003-database-migrations.md
- [ ] 004-https-and-pwa-security.md
