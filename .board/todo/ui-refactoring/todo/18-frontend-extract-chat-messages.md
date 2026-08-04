# Ticket 18: Extract Chat Message Component

## Goal
Improve the readability of `ChatWidget.tsx` by extracting the message rendering logic out of the mapping array.

## Implementation Steps
1. Create `src/components/ChatMessage.tsx` (or place it alongside `ChatWidget`).
2. Move the conditional styling logic (blue background for user vs gray background for AI) into this component.
3. Update `ChatWidget.tsx` to render `<ChatMessage key={msg.id} message={msg} />` inside the `.map()` loop.
4. (Optional) Create a `TypingIndicator.tsx` or handle the `isSending` state component inside `ChatMessage` as well.

## Acceptance Criteria
- `ChatWidget.tsx` only handles state (sending requests to the API and managing the message history array).
- Individual chat bubbles are rendered via the new `ChatMessage` component.
