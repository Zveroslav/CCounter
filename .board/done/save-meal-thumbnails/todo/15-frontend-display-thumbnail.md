# Ticket: 15-frontend-display-thumbnail

## 1. Objective
Display the generated meal thumbnail in the UI using Tailwind styling and utilize a dedicated environment variable for the API base URL.

## 2. Requirements
- Configure the frontend to use `VITE_API_URL` instead of hardcoded `localhost:3000`.
- Update `MealCard` to conditionally display `thumbnailUrl` (or `imageUrl` if pending).
- Apply specific Tailwind CSS filters and styles to blend the thumbnail naturally into the UI.

## 3. Technical Implementation Details
- Files to modify: `apps/client/.env`, `apps/client/src/pages/Dashboard.tsx`
- Expected changes:
  - Add `VITE_API_URL=http://localhost:3000` to the client's `.env` file (create it if missing). Update Vite env config if needed.
  - In `Dashboard.tsx` (and `MealCard` component), define a helper to get the base URL, e.g., `const API_BASE_URL = import.meta.env.VITE_API_URL || '';`.
  - In `MealCard`, change the image source logic: 
    ```tsx
    const imagePath = meal.thumbnailUrl || meal.imageUrl;
    // ...
    {imagePath ? (
      <img src={`${API_BASE_URL}${imagePath}`} alt="Meal" className="w-12 h-12 object-cover rounded-2xl border border-gray-200 opacity-90 saturate-50" />
    ) : (
      <div className="w-full h-full flex items-center justify-center text-gray-300 text-2xl">🍽️</div>
    )}
    ```
  - Note: You may need to adjust the container classes for the image to match the `w-12 h-12` specification (e.g. remove conflicting classes on the wrapper or adjust them so the image looks correct).

## 4. Verification & Testing
- [ ] Verify the `.env` variable successfully replaces the hardcoded string.
- [ ] Verify that a meal with a `thumbnailUrl` correctly displays the image.
- [ ] Verify that the CSS classes properly format the image (square, highly rounded, desaturated, slight opacity).
- [ ] Verify that a meal without an image still displays the default generic plate icon.
