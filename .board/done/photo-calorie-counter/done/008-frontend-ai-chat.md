# Ticket: 008-frontend-ai-chat

## 1. Objective
Implement the AI Nutritionist Chat UI at the bottom of the Journal tabs.

## 2. Requirements
- A chat window that sits inside or at the bottom of each Journal tab.
- When sending a message, it includes the currently selected tab context (Day, Week, Month, All-Time).
- Display chat messages (User vs AI).

## 3. Technical Implementation Details
- Files to modify: `src/components/ChatWidget.tsx`, `src/api/chat.ts`.
- Pass `period` as a parameter to the backend.

## 4. Verification & Testing
- [ ] Verify chat UI behaves correctly and scrolls to bottom on new messages.
- [ ] Verify the correct context period is sent to the backend.
