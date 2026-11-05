## Context

Phase 3 delivered the marketplace directory, public profile, and membership-gated phone reveals. Contact action "Send Message" was stubbed pending messaging implementation. The database schema already includes `Conversation`, `Message`, `MessageReport`, `UserBlock`, and `FilterTerm` models in Prisma. NestJS packages `@nestjs/websockets`, `@nestjs/platform-socket.io`, `socket.io`, and `@nestjs/schedule` have been installed for the API, and `socket.io-client` for the Next.js web application.

## Goals / Non-Goals

**Goals:**
- Provide secure real-time bidirectional messaging between clients and approved freelancers.
- Enforce business rules: only active members can initiate conversations and send messages; freelancers can always reply even if the client's plan expires.
- Automated safety filtering: bad words rejected, contact info (phone/link) flagged, abuse rate-limiting, reporting, and user blocking.
- Reliable dual transport: DB write first via REST, instant push via Socket.IO, with WebSocket reconnect and fallback.
- Polished, responsive, accessible chat interface matching the marketplace design language.

**Non-Goals:**
- File or attachment uploads in chat (text-only MVP up to 2000 characters).
- Voice or video calls.
- Multi-party group chats (1-on-1 client & freelancer only).
- Multiple server clustering via Redis adapter (single-node MVP; architecture prepared for socket-io redis adapter).

## Decisions

**D1. Architecture & Transport: REST + WebSocket Broadcast**
Clients submit messages via `POST /conversations/:id/messages`. The server validates authorization, membership rules, rate limits, and content filters in a transactional DB write. Upon success, the server emits `message:new` to recipient's socket room `user:{recipientId}`.
*Rationale:* Ensures database consistency, avoids lost messages on network disconnects, and simplifies error handling and offline delivery.

**D2. Gateway Authentication & Room Scoping**
`MessagingGateway` authenticates the socket connection via JWT passed in `auth.token` or `headers.authorization`. Once validated, the socket joins `user:{userId}`.
*Events:*
- Server-to-Client: `message:new` (new message payload), `conversation:unread` (updated unread counter).
- Client-to-Server: `message:typing` (ephemeral typing indicators).

**D3. Automated Moderation & Flag Tracking**
`ModerationFilterService` checks message text against:
1. Prohibited terms (from `FilterTerm` table and core Bangla/English abusive wordlist). Matches cause immediate 400 rejection.
2. Contact regex: Bangladeshi mobile numbers (`(?:\+?880|0)1[3-9]\d{8}`) and URL patterns. If found, message is allowed but marked with flags `['PHONE']` or `['LINK']`.
3. 24-Hour Abuse Threshold: If a user has sent 3 or more flagged messages within 24 hours, any further message attempt is blocked for 1 hour.

**D4. Membership Access Enforcement on Messaging**
- When a user initiates `POST /conversations`: verify user has active subscription via `membershipsService.checkUserAccess`.
- When `POST /conversations/:id/messages` is called:
  - If sender is the client: enforce `checkUserAccess(senderId)`. If expired, reject with 403.
  - If sender is the freelancer: verify profile ownership and allow message unconditionally.

**D5. Web Client & UI Architecture**
- `lib/socket-client.ts`: Singleton Socket.IO client manager with automatic reconnection, JWT token attachment, and listener multiplexing.
- `apps/web/app/messages`: Responsive two-panel messenger interface:
  - Left pane: thread list with search, avatar, status dot, and unread badge.
  - Right pane: active chat conversation, message bubbles (client vs freelancer alignment), safety notice banner, report modal, and block toggle.
- Wire "Send Message" buttons in `ContactActions.tsx` and `FreelancerProfileView.tsx` to directly open or create the conversation thread.

## Risks / Trade-offs

- **Offline Users:** If a recipient is disconnected, WebSocket emits are missed. Addressed by checking socket room occupancy and creating an in-app `Notification` record (`MESSAGE_NEW`) for offline recipients.
- **Clock Drift on Expiry:** Expiry uses server database time (`NOW()`), avoiding client timestamp discrepancies.
