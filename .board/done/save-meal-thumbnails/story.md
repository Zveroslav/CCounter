# Story: save-meal-thumbnails

## 1. Business Logic & Goal
When a user uploads a food photo and confirms the meal, the system should generate and save a small compressed thumbnail (120x120 WebP) of the image. This thumbnail will be displayed on the user's dashboard in the meal cards instead of the generic default icon, providing a much richer user experience.

## 2. Technical Architecture
- **Database:** A new field `thumbnailUrl` will be added to the `Meal` model to store the path to the thumbnail.
- **Backend:** We will introduce a new `imageService` using `sharp` to resize and compress the image. This will be integrated into the `updateMeal` controller (which is called when the user confirms the meal). The original temporary image (`imageUrl`) will still be deleted to save space, but the thumbnail will persist.
- **Frontend:** The `MealCard` component will be updated to display the image using the new `thumbnailUrl` (or `imageUrl` as fallback), utilizing `VITE_API_URL` for absolute paths instead of hardcoded localhost. CSS classes will be applied to visually integrate the photo into the UI.

## 3. Assumptions & Constraints
- `sharp` needs to be installed on the server.
- The `uploads/thumbnails/${userId}/` directory must be dynamically created if it doesn't exist.
- Backwards compatibility: Existing meals without a `thumbnailUrl` will continue to show the default generic icon.
- Re-analysis (`reanalyzeMeal`) will only work before confirmation (as it is now), because the original high-res image is deleted after saving.

## 4. Ticket Breakdown
- [ ] 14-backend-thumbnail-generation.md
- [ ] 15-frontend-display-thumbnail.md
