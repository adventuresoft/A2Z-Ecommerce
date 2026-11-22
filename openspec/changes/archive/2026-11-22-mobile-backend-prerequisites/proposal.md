# Proposal

## Why

The upcoming A to Z Ecommerce React Native mobile application (`apps/mobile`) relies on `apps/api` as its production backend and Swagger/OpenAPI source for type-safe Orval client generation (`packages/api-client`). A full repository audit identified critical backend prerequisites—missing server-side cart sync, missing push notification device registration, global multi-device logout revocation, unguarded PayStation initiation, unthrottled SMS OTP endpoints, unoptimized multi-megabyte image uploads, missing Apple-mandated account deletion, and incomplete OpenAPI response schemas—that must be resolved cleanly before mobile client scaffolding begins so downstream mobile work has a final, secure, zero-churn API contract.

## What Changes

- **Per-Device Session Management & Auth Hardening (`apps/api/src/auth`):** Introduce a `RefreshSession` Prisma model so `POST /api/v1/auth/logout` revokes only the active device session instead of logging out all devices (while keeping `tokenVersion` revocation on password change/reset). Add `@nestjs/throttler` rate limiting on OTP and auth endpoints and disable hardcoded development fallback credentials and demo login backdoors in production (`NODE_ENV=production`).
- **PayStation Security & IPN Verification (`apps/api/src/payments`):** Protect `POST /api/v1/payments/paystation/initiate` with `JwtAuthGuard` and strict order ownership verification (`order.userId === user.sub`), validate ownership on authenticated verification lookups, and add a server-to-server PayStation IPN/callback handler so interrupted mobile payments still reconcile reliably.
- **Server-Synced Cart (`apps/api/src/cart`):** Introduce a single-table `CartItem` Prisma model (`@@unique([userId, variantId])`) and REST endpoints (`GET /api/v1/cart`, `POST /api/v1/cart/items`, `PATCH /api/v1/cart/items/:variantId`, `DELETE /api/v1/cart/items/:variantId`, `DELETE /api/v1/cart`, `POST /api/v1/cart/sync`) enabling cross-device Web/Mobile cart synchronization and guest-to-authenticated merge on login.
- **Push Notification Foundation (`apps/api/src/notifications`):** Introduce a `DeviceToken` Prisma model, registration/deregistration endpoints (`POST /api/v1/notifications/device-tokens`, `DELETE /api/v1/notifications/device-tokens/:token`), and non-blocking Expo Push dispatch (`expo-server-sdk`) triggered by `NotificationsService` for order status, payment, and promotional notifications.
- **Self-Service Account Deletion (`apps/api/src/account`):** Add `DELETE /api/v1/account` requiring password or verified OTP re-authentication, anonymizing personal data (`name`, `email`, `phone`, `isActive=false`) and deleting sessions, device tokens, addresses, wishlist items, and cart items while preserving historical `Order` financial records for Apple App Store compliance.
- **Image WebP Optimization, OpenAPI DTO Completion & Mobile Version Settings:** Enable `sharp` in `pnpm-workspace.yaml` to auto-generate WebP responsive thumbnails (`400px` card, `800px` PDP) on upload behind a storage adapter abstraction; complete missing Swagger `@ApiResponse({ type })` DTO annotations on `Auth`, `AccountAddresses`, `Collections`, and `Settings` controllers; seed public `mobile.min_supported_version` and `mobile.latest_version` settings in `StoreSetting`.

## Capabilities

### New Capabilities
- `server-cart`: Authenticated customer shopping cart persistence (`CartItem`) with CRUD operations, stock-aware quantity limits, and guest-to-user cart merge synchronization.
- `push-notifications`: Mobile device push token lifecycle management (`DeviceToken`) and non-blocking Expo Push delivery integrated with store notification events.
- `paystation-security`: Authenticated and ownership-enforced PayStation payment initiation and resilient server-to-server payment reconciliation for store orders.

### Modified Capabilities
- `user-auth`: Transition single-device logout from global `tokenVersion` revocation to per-device `RefreshSession` invalidation, enforce rate limiting on OTP and credential endpoints, and prohibit development backdoors or fallback credentials in production.
- `customer-account`: Add authenticated self-service account deletion (`DELETE /api/v1/account`) with re-verification and PII anonymization while preserving financial order history.
- `store-settings`: Seed and expose public mobile application version gate keys (`mobile.min_supported_version` and `mobile.latest_version`) through `GET /api/v1/settings/public`.
- `api-core`: Require typed OpenAPI response schemas across all customer-facing REST controllers for deterministic client code generation and optimize uploaded images into WebP derivatives on ingestion.

## Impact

- **Affected Code:** `apps/api/prisma/schema.prisma` (3 new models + migration), `apps/api/src/auth/*`, `apps/api/src/account/*`, `apps/api/src/cart/*` (new module), `apps/api/src/notifications/*`, `apps/api/src/payments/*`, `apps/api/src/collections/*`, `apps/api/src/settings/*`, `apps/api/src/common/uploads/*`, `apps/api/prisma/seed.ts`, `pnpm-workspace.yaml`.
- **Dependencies:** `@nestjs/throttler`, `expo-server-sdk`, `sharp` (with `sharp: true` in `pnpm-workspace.yaml`).
- **Compatibility:** Strictly backward-compatible with `apps/web` and `apps/admin`; existing cookie-based web refresh tokens continue working seamlessly alongside per-device mobile sessions.
- **Out of Scope:** Scaffolding `apps/mobile` or `packages/api-client` (Change 2), Freelancer Marketplace mobile APIs (v2), S3/Cloudflare R2 migration (adapter-ready only), and backend PDF invoice generation.
