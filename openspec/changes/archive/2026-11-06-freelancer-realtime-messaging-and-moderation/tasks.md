# Tasks

## 1. Backend Moderation & Content Filtering

- [x] 1.1 Implement `ModerationFilterService` for bad words blocking, phone number detection, link extraction, and 24h flag rate-limiting; verify unit tests pass
- [x] 1.2 Implement report and block functionality (`UserBlock`, `MessageReport`) with IDOR checks and query helpers; verify unit tests pass

## 2. Backend Messaging Service & REST API

- [x] 2.1 Implement `MessagingService` with conversation creation, member validation, client vs freelancer send rules, message pagination, and read receipts; verify unit tests pass
- [x] 2.2 Implement `MessagingController` with endpoints `/conversations`, `/conversations/:id/messages`, `/conversations/:id/read`, `/conversations/:id/report`, and user block routes; verify unit tests pass

## 3. WebSocket Gateway & Offline Notifications

- [x] 3.1 Implement `MessagingGateway` with JWT handshake authentication, `user:{id}` room joining, `message:new` and `conversation:unread` broadcasts; verify gateway specs pass
- [x] 3.2 Wire offline notifications: when recipient is not in room, create a `Notification` with type `MESSAGE_NEW`; verify unit tests pass
- [x] 3.3 Register `MessagingModule` in `app.module.ts`; verify `pnpm.cmd --dir apps/api build` passes with zero errors

## 4. Web Socket Client & Messaging Components

- [x] 4.1 Create `lib/messaging-client.ts` and `lib/socket-client.ts` with connection lifecycle management and event subscriptions; verify `pnpm.cmd --dir apps/web check-types` passes
- [x] 4.2 Build `components/Messaging/ConversationList.tsx` and `components/Messaging/ChatRoom.tsx` with responsive layout, bubble formatting, unclickable links, and safety banner
- [x] 4.3 Build `components/Messaging/ReportModal.tsx` and block action confirmation; verify keyboard focus and accessibility
- [x] 4.4 Connect "Send message" buttons in `ContactActions.tsx` and public profile to create or navigate to conversation thread

## 5. Web Routes & Integration

- [x] 5.1 Create `/messages` and `/messages/[id]` routes with authentication gate; verify layout on mobile and desktop
- [x] 5.2 Add conversations shortcut to navigation; verify type checks and lint on web pass (`pnpm.cmd --dir apps/web check-types && pnpm.cmd --dir apps/web lint`)
- [x] 5.3 Verify end-to-end flow: member starts chat, sends text, triggers filters on prohibited words, and receives live messages

## Workflow follow-up

- Sync specs and archive change upon review.
