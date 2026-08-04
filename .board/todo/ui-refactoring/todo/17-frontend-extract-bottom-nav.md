# Ticket 17: Extract Bottom Navigation from Layout

## Goal
Decouple the routing layout from the specific UI representation of the navigation bar.

## Implementation Steps
1. Create `src/components/BottomNav.tsx`.
2. Move the `<nav>` section, including the floating Action (Camera) button and hidden `<input type="file">`, from `MainLayout.tsx` into this new component.
3. Keep the file upload handler logic within `BottomNav.tsx` or expose an event to the layout if needed.
4. Replace the old `<nav>` inside `MainLayout.tsx` with `<BottomNav />`.

## Acceptance Criteria
- `MainLayout.tsx` becomes extremely lightweight, focusing only on the wrapper layout and `<Outlet />`.
- The camera upload and page navigation logic works exactly as before.
