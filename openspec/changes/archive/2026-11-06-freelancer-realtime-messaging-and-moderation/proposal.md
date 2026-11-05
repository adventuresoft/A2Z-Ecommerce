# Proposal

## Why

Active members have discovered approved professionals and can reveal their phone numbers, but in-app communication is currently locked with "Messaging is coming soon". To complete the core hiring journey while protecting user safety and preventing platform abuse, real-time messaging with strict moderation (bad words blocking, phone/link flagging, daily conversation limits, reporting, blocking) is required.

## What Changes

- Add real-time WebSocket gateway and REST endpoints for messaging (`apps/api/src/messaging`):
  - `POST /conversations` (gated by `MembershipGuard` for client initiators, or between existing participants)
  - `GET /conversations` (lists customer/freelancer conversation threads with unread counts)
  - `GET /conversations/:id/messages` (cursor-paginated messages, participant authorization check)
  - `POST /conversations/:id/messages` (send message with text limits, active membership check if client, abuse filtering)
  - `POST /conversations/:id/read` (mark unread messages as read)
  - Socket.IO gateway (`message:new`, `unread:update`, JWT handshake, user-scoped room joining)
- Add Automated Moderation & Safety controls:
  - Text-only messages (max 2000 chars)
  - Bad-words filter: blocked with 400 error (checking `FilterTerm` table and fallback list)
  - Contact detection: phone numbers and URLs detected and flagged (`PHONE`, `LINK`), links rendered unclickable
  - 3 flags per 24 hours rate-limits user for 1 hour
  - Abuse reporting (`POST /conversations/:id/report`) and user blocking (`POST /users/:id/block`, `DELETE /users/:id/block`)
  - Offline message push notifications via existing `Notification` model (`MESSAGE_NEW`)
- Add Web UI (`apps/web`):
  - Customer conversations interface (`/messages` and thread `/messages/:id`)
  - Integration with Freelancer Dashboard messages tab (`/freelancer/dashboard?tab=messages`)
  - "Send Message" modal / navigation from Freelancer cards and profile view
  - Real-time live chat widget / thread view with Socket.IO reconnection and fallback polling
  - In-chat Report modal and Block action

## Capabilities

### New Capabilities
- `freelancer-messaging`: real-time message exchange, conversation lifecycle, abuse filter, report/block safety controls, and chat UI.

### Modified Capabilities

## Impact

- API: new `apps/api/src/messaging` module with controller, service, gateway, filter service, DTOs, and specs. Registered in `app.module.ts`. Reuses `MembershipGuard`, `NotificationsService`, `PrismaService`.
- Web: new routes `/messages`, `/messages/[id]`, shared chat component `components/Messaging/ChatRoom.tsx`, socket client `lib/socket-client.ts`, `lib/messaging-client.ts`. "Send message" buttons in `ContactActions.tsx` wired to open chat.
- Safe, non-breaking: no changes to e-commerce, checkout, or catalog tables.
