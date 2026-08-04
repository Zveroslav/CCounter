# Ticket: 14-backend-thumbnail-generation

## 1. Objective
Add database support and backend logic to generate and save a 120x120 WebP thumbnail when a user confirms a meal.

## 2. Requirements
- Install `sharp` and `@types/sharp` dependencies in `apps/server`.
- Update the Prisma schema to add `thumbnailUrl String?` to the `Meal` model and generate a migration.
- Create an image service to handle resizing, format conversion (WebP), and saving per-user thumbnails.
- Integrate the thumbnail generation into the `updateMeal` controller.

## 3. Technical Implementation Details
- Files to modify: `apps/server/package.json`, `apps/server/prisma/schema.prisma`, `apps/server/src/controllers/mealsController.ts`
- Files to create: `apps/server/src/services/imageService.ts`
- Expected changes:
  - **Prisma**: Add `thumbnailUrl String?` to `Meal` model. Run `npx prisma migrate dev --name add_thumbnail_url`.
  - **imageService**: Create `generateAndSaveThumbnail(userId: string, imagePath: string): Promise<string>`. This function should ensure the directory `uploads/thumbnails/${userId}/` exists, read the original image from `imagePath`, use `sharp` to resize to 120x120 (`fit: 'cover'`, `position: 'center'`), output as `webp({ quality: 65 })`, and save it as `${Date.now()}.webp`. It should return the relative path (e.g. `/uploads/thumbnails/${userId}/${fileName}`).
  - **mealsController**: In `updateMeal`, before doing `fs.unlink(meal.imageUrl)`, check if `meal.imageUrl` exists. If so, await `generateAndSaveThumbnail(userId, meal.imageUrl)`. Save the returned path to `thumbnailUrl` in the `prisma.meal.update` data. Still set `imageUrl: null` and still delete the original temporary file to save space.
  - **Static files**: Ensure `uploads` folder is served via `express.static` in `index.ts`. (Add `app.use('/uploads', express.static(path.join(__dirname, '../../uploads')));` if missing).

## 4. Verification & Testing
- [ ] Verify `npm run build` succeeds in the server.
- [ ] Upload an image and confirm the meal; verify a `.webp` file is created in `uploads/thumbnails/{userId}/`.
- [ ] Verify the database `Meal` record has `thumbnailUrl` populated and `imageUrl` nullified.
- [ ] Verify the original image is deleted from the root uploads directory.
