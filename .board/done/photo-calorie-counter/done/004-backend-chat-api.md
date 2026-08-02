# Ticket: 004-backend-chat-api

## 1. Objective
Implement the `POST /api/chat` endpoint for the AI Nutritionist.

## 2. Requirements
- The endpoint must accept user messages and a context period (Day, Week, Month, All-Time).
- It should fetch the relevant aggregations from the database and feed them into the Gemini context.
- Stream or return the AI response to the user.

## 3. Technical Implementation Details
- Files to modify: `src/controllers/chatController.ts`, `src/routes/chat.ts`.
- Ensure prompts clearly state the user is asking about the selected period.

## 4. Verification & Testing
- [x] E2E Test: Send a chat message with period=Day and ensure daily meals are included in the prompt construction.
