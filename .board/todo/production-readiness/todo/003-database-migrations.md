# 003 - Database Migrations

## Goal
Establish a safe process for updating the database schema in a production environment using Prisma migrations.

## Requirements
1. **Initial Migration**: Since the dev environment has been using `prisma db push`, run `npx prisma migrate dev --name init` (or document the exact command) to generate the baseline migration folder.
2. **Production Scripts**: Add a script to `apps/server/package.json` called `db:deploy` that runs `prisma migrate deploy`.
3. **Documentation/Setup**: Document that on the production server, before starting the application (or during the build phase), `npm run db:deploy` must be executed so that the schema is applied strictly through migration files and no data is lost.
