# Design

## Context

See `proposal.md` for motivation and capability boundaries. `apps/api` runs NestJS 12 + Express 5 + Prisma 7 (`@prisma/adapter-pg`) + PostgreSQL with existing `User.tokenVersion` session invalidation, `WishlistItem` server sync, `PaystationService`, `NotificationsService`, `StoreSetting`, and local Multer uploads under `apps/api/uploads/`. All changes here must remain strictly backward-compatible with `apps/web` (which relies on `HttpOnly` refresh cookies) and `apps/admin`, while stabilizing `/api/docs-json` for downstream Orval code generation in Change 2 (`packages/api-client` + `apps/mobile`).

## Goals / Non-Goals

**Goals:**
- Introduce minimal, well-indexed PostgreSQL tables (`RefreshSession`, `CartItem`, `DeviceToken`) aligned with existing Prisma naming (`UUID` IDs, PascalCase `@@map(...)`, `onDelete: Cascade`).
- Enforce device-scoped logout while preserving instant global revocation on password change/reset and account deletion.
- Close pre-production security gaps (PayStation auth/ownership + IPN reconciliation, OTP/auth throttling, production secret validation & backdoor blocking).
- Reduce mobile image payload size by >85% on upload via `sharp` WebP derivatives behind a storage adapter.
- Achieve 100% typed Swagger response schemas across customer-facing e-commerce endpoints for zero-churn Orval generation.

**Non-Goals:**
- Building `apps/mobile` or `packages/api-client` (Change 2).
- Migrating existing media storage to Cloudflare R2/AWS S3 now (adapter abstraction only; local disk remains default).
- Adding server-side PDF invoice generation (handled client-side via `expo-print`).
- Refactoring Freelancer Marketplace / Messaging endpoints (deferred to mobile v2).

## Decisions

### 1. Single-Table `CartItem` vs Two-Table `Cart` + `CartItem`
- **Decision:** Use a single **`CartItem`** table (`id`, `userId`, `variantId`, `quantity`, `createdAt`, `updatedAt`, `@@unique([userId, variantId])`, `@@index([userId])`, `@@index([variantId])`), mirroring `WishlistItem`.
- **Rationale:** Coupon application, VAT extraction, and shipping calculation are already authoritatively handled by `POST /api/v1/checkout/calculate`. A single table eliminates an unnecessary join on every read/write and keeps `POST /api/v1/cart/sync` atomic and fast.
- **Alternative Considered:** Two-table `Cart` + `CartItem` (adds extra header management and joins without immediate business need since single-vendor customers have one active cart).

### 2. Per-Device `RefreshSession` + Retained `User.tokenVersion`
- **Decision:** Add `RefreshSession (id, userId, deviceId, tokenHash, userAgent, expiresAt, revokedAt, createdAt, updatedAt)` with `@@index([userId, deviceId])`, `@@index([userId, revokedAt])`, and `@@index([expiresAt])`. Store only a SHA-256 hash of the refresh token (`tokenHash`, `@unique`). Keep `User.tokenVersion` in the JWT payload as a fast global kill-switch.
- **Rationale:**
  - `POST /api/v1/auth/logout` accepts optional `{ refreshToken, deviceId }` (or falls back to the `refreshToken` cookie) and sets `revokedAt = now()` on only that session — preserving other devices (e.g., Web stays signed in when Mobile logs out).
  - Rotating tokens on `POST /api/v1/auth/refresh` updates `tokenHash` in place (or creates a rotated child and revokes the old one); reuse of an already-rotated token immediately revokes that session family.
  - Password change, password reset, and `DELETE /api/v1/account` increment `User.tokenVersion` AND bulk-revoke all `RefreshSession` rows for that user.
  - Backward compatibility: Web clients sending no `deviceId` automatically receive a generated session ID encoded inside the refresh JWT (`sid`), so cookie-based web refresh/logout works seamlessly without modifying `apps/web`.
- **Alternative Considered:** Keeping `User.tokenVersion` alone (breaks multi-device UX) or moving sessions to Redis (introduces unnecessary operational infrastructure when PostgreSQL already handles auth scale cleanly).

### 3. Push Notification Transport: `DeviceToken` + `expo-server-sdk`
- **Decision:** Add `DeviceToken (id, userId, token @unique, platform Enum ANDROID|IOS, deviceId, isActive, lastUsedAt, createdAt, updatedAt)` with `@@index([userId, isActive])`. Dispatch notifications asynchronously using `expo-server-sdk` inside a fire-and-forget wrapper (caught & logged, never throwing into callers) triggered from `NotificationsService.createNotification()` for `ORDER_STATUS`, `PAYMENT`, and `PROMOTION`.
- **Rationale:** One unified SDK covers both FCM v1 (Android) and APNs (iOS) with automatic chunking, receipt inspection, and `DeviceNotRegistered` token deactivation. Token ownership transfer on upsert (`token @unique`) prevents cross-account leakage on shared phones.
- **Alternative Considered:** Direct `firebase-admin` + APNs integration (duplicates platform delivery logic and increases credential maintenance).

### 4. Account Deletion (`DELETE /api/v1/account`) via PII Anonymization
- **Decision:** Require `{ password }` (for password-authenticated accounts) or `{ verificationToken }` (verified phone OTP token). Inside a single `prisma.$transaction`:
  1. Anonymize `User`: `name = 'Deleted User'`, `email = null`, `phone = null`, `passwordHash = <random unmatchable argon2 hash>`, `isActive = false`, `tokenVersion += 1`.
  2. Revoke all `RefreshSession` rows (`revokedAt = now()`).
  3. Delete all `DeviceToken`, `UserAddress`, `WishlistItem`, and `CartItem` rows for `userId`.
  4. Preserve `Order`, `OrderItem`, `Payment`, and `Refund` records untouched (referential & accounting integrity).
- **Rationale:** `Order.userId` is non-nullable and financial records cannot be cascade-deleted; anonymization satisfies Apple App Store Guideline 5.1.1(v) and privacy expectations cleanly.

### 5. PayStation Security & IPN Reconciliation
- **Decision:**
  - Protect `POST /api/v1/payments/paystation/initiate` with `@UseGuards(JwtAuthGuard)`. Verify `order.userId === user.sub` (or admin role), `order.paymentStatus !== 'PAID'`, and `order.orderStatus !== 'CANCELLED'`. Validate `callbackUrl` against an allowlist of configured web/deep-link origins (`CORS_ORIGIN` / `PAYSTATION_ALLOWED_CALLBACK_ORIGINS`).
  - Add `POST /api/v1/payments/paystation/callback` (and `GET` alias) accepting `invoice_number` from PayStation, immediately invoking `PaystationService.verifyPayment(invoice_number)` (server-to-server `/transaction-status`) so forged query params can never mark orders paid.
  - Keep `POST /api/v1/payments/paystation/verify` idempotent via Prisma transaction guard checking `paymentStatus !== 'PAID'` before transitioning `PENDING -> CONFIRMED`.

### 6. Rate Limiting & Production Guardrails
- **Decision:** Install `@nestjs/throttler` with global sensible baseline (`120 req/min` per IP) and strict route-level `@Throttle(...)` overrides:
  - `POST /auth/phone/send-otp`: 3 req/min per IP + DB-backed **60-second cooldown** check on latest `OtpCode.createdAt` per normalized phone number (returns `429` with `retryAfterSeconds`).
  - `POST /auth/login`, `POST /auth/phone/login`, `POST /auth/phone/verify-otp`: 10 req/min per IP.
  - `POST /auth/refresh`: 20 req/min per IP.
- Enforce strict `env.validation.ts`: when `NODE_ENV === 'production'`, reject startup if `JWT_ACCESS_SECRET`, `JWT_REFRESH_SECRET`, PayStation, or MobiReach secrets are missing or equal to dev placeholders; strip `devOtp` from responses; disable `customer@az-ecommerce.local` dev bypass in `AuthService`.

### 7. Image Optimization Pipeline (`sharp` + `MediaStorageAdapter`)
- **Decision:** Flip `sharp: true` in `pnpm-workspace.yaml` and add `sharp` to `apps/api`. Introduce `MediaStorageAdapter` interface (`LocalDiskStorageAdapter` default, R2/S3 swap-ready). On raster upload (`jpg|jpeg|png|webp`), write:
  - Primary optimized WebP (`max 1600px`, quality 85)
  - Medium WebP (`800px` width, quality 82, suffix `-md.webp`)
  - Thumbnail WebP (`400px` width, quality 78, suffix `-thumb.webp`)
  Bypass raster processing cleanly for `image/svg+xml`. Keep returning relative `/uploads/<folder>/<filename>.webp` URLs so existing DB columns and `apps/web` continue working without schema churn.

### 8. OpenAPI Schema Completion & Consistent Bearer Security
- **Decision:** Standardize `@ApiBearerAuth()` name in `apps/api/src/main.ts` (`addBearerAuth(undefined, 'bearer')` matching controllers) and add explicit response DTO classes + `@ApiResponse({ status, type })` annotations to `AuthController`, `AccountController`, `AccountAddressesController`, `CollectionsPublicController`, `SettingsController`, `CartController`, and `NotificationsUserController`. Add an npm script `pnpm --filter api openapi:export` to dump `/api/docs-json` deterministically for Orval in Change 2.

## Risks / Trade-offs

- **[`sharp` native binary build on Windows / Linux]** -> Setting `sharp: true` in `pnpm-workspace.yaml` allows `sharp` to pull official prebuilt libvips binaries (`@img/sharp-win32-x64` / `@img/sharp-linux-x64`). Mitigation: verify `pnpm install` + upload unit test on Windows immediately during implementation and document Linux container parity.
- **[Backward compatibility for existing logged-in `apps/web` users during `RefreshSession` rollout]** -> Pre-migration refresh cookies will not have a `sid` claim. Mitigation: after migration, legacy tokens without `sid` return `401` once (prompting a clean re-login) OR gracefully verify via `tokenVersion` only during a brief transition; clean re-login on deploy is safest and eliminates dual-path security bugs.
- **[PayStation `callbackUrl` validation rejecting staging/mobile deep links]** -> Mitigation: configure `PAYSTATION_ALLOWED_CALLBACK_ORIGINS` env variable supporting configured storefront HTTPS domains and `azecommerce://` custom scheme.
- **[Expo Push rate/network latency slowing order status updates]** -> Mitigation: dispatch pushes asynchronously outside the Prisma transaction with a strict 5-second timeout and non-throwing error logger.

## Migration Plan

1. Update `pnpm-workspace.yaml` (`sharp: true`) and install `@nestjs/throttler`, `expo-server-sdk`, and `sharp` in `apps/api`.
2. Add `RefreshSession`, `CartItem`, `DeviceToken`, and `DevicePlatform` enum to `apps/api/prisma/schema.prisma`, generate and apply migration (`prisma migrate dev --name mobile_backend_prerequisites`).
3. Update `apps/api/prisma/seed.ts` (idempotent upsert) for `mobile.min_supported_version = "1.0.0"` and `mobile.latest_version = "1.0.0"` (`isPublic: true`, `group: "GENERAL"`).
4. Roll back strategy: all 3 new tables are additive and isolated; reverting the release simply reverts application code without destructive column drops on existing tables.
