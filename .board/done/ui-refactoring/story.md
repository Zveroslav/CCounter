# UI Refactoring & Component Extraction

## Business Goal
While the primary page architectures (Dashboard, Refinement, Profile) have been successfully modularized, the lower-level UI components and secondary layouts still have room for improvement. By creating a unified Design System (UI Kit) and extracting remaining monolithic components (e.g. Chat Messages, Navigation), we improve code maintainability, reusability, and reduce the risk of UI bugs across the application.

## User Experience
- **Consistency**: The application will have a unified look and feel by sharing a common UI Kit.
- **Maintainability**: Developers can iterate faster by reusing foundational components (Buttons, Inputs, Cards).

## High-Level Implementation Steps
1. **Build the UI Kit**: Extract standard Tailwind classes into reusable React components (`Button`, `Input`, `Card`).
2. **Extract BottomNav**: Refactor `MainLayout.tsx` to separate the navigation logic from the grid wrapper.
3. **Extract ChatMessage**: Refactor the `.map` iteration inside `ChatWidget.tsx` into a dedicated message bubble component.
