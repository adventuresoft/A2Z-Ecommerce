# Tasks

## 1. Dependencies, Prisma Schema & Seed Setup

- [x] 1.1 Update `pnpm-workspace.yaml` to set `sharp: true` and install `@nestjs/throttler`, `expo-server-sdk`, and `sharp` in `apps/api`; verify `pnpm install` completes cleanly on Windows with working `sharp` native bindings (`node -e "import('sharp').then(m => console.log(typeof m.default))"`).
- [x] 1.2 Add `DevicePlatform` enum (`ANDROID`, `IOS`), `RefreshSession`, `CartItem`, and `DeviceToken` models with required unique constraints and indexes to `apps/api/prisma/schema.prisma`, generate and apply migration `mobile_backend_prerequisites`, and verify `pnpm --filter api prisma:generate` succeeds cleanly.
- [x] 1.3 Seed public mobile version gate keys (`mobile.min_supported_version = "1.0.0"`, `mobile.latest_version = "1.0.0"`, `isPublic: true`) idempotently in `apps/api/prisma/seed.ts` and verify `GET /api/v1/settings/public` exposes both keys in a unit test for `SettingsService`.

## 2. Per-Device Sessions, Rate Limiting & Production Security Guardrails

- [x] 2.1 Implement per-device `RefreshSession` creation, SHA-256 token hash rotation (with token-reuse detection), and device-scoped `POST /api/v1/auth/logout` (preserving other devices' sessions while keeping `tokenVersion` + bulk revocation on password change/reset) in `apps/api/src/auth/*`, and verify with unit tests covering multi-device logout and rotated-token replay rejection (`pnpm --filter api test src/auth`).
- [x] 2.2 Configure `@nestjs/throttler` in `AppModule` with route-level limits on `/auth/phone/send-otp`, `/auth/phone/verify-otp`, `/auth/phone/login`, `/auth/login`, and `/auth/refresh` plus DB-backed 60-second per-phone OTP resend cooldown returning HTTP 429; verify cooldown and throttling behavior via Vitest unit tests.
- [x] 2.3 Harden `apps/api/src/config/env.validation.ts`, `AuthService`, `PaystationService`, and `MobiReachSmsService` so `NODE_ENV=production` rejects missing/placeholder secrets, omits `devOtp`, and disables the `customer@az-ecommerce.local` development bypass; verify production-mode guards with Vitest unit tests.

## 3. PayStation Security & Server-to-Server Reconciliation

- [x] 3.1 Protect `POST /api/v1/payments/paystation/initiate` with `JwtAuthGuard`, verify `order.userId === user.sub` (or admin role), block already-paid or cancelled orders, and validate `callbackUrl` against configured allowed origins; verify 401/403/400 rejection cases in `payments.controller.spec.ts` / `paystation.service.spec.ts`.
- [x] 3.2 Add server-to-server `POST /api/v1/payments/paystation/callback` (and `GET` alias) invoking authoritative `PaystationService.verifyPayment(invoice_number)` idempotently without trusting raw query status parameters; verify idempotent PAID reconciliation and spoofed-callback rejection with unit tests (`pnpm --filter api test src/payments`).

## 4. Server-Synced Cart Module (`apps/api/src/cart`)

- [x] 4.1 Create `CartModule`, `CartController`, `CartService`, and typed Swagger DTOs implementing `GET /api/v1/cart`, `POST /api/v1/cart/items`, `PATCH /api/v1/cart/items/:variantId`, `DELETE /api/v1/cart/items/:variantId`, and `DELETE /api/v1/cart` with live product/variant pricing and warehouse stock guardrails; verify CRUD and stock limit enforcement via Vitest unit tests (`pnpm --filter api test src/cart`).
- [x] 4.2 Implement `POST /api/v1/cart/sync` merging guest `{ variantId, quantity }` payloads atomically with existing `CartItem` rows, capping quantities at available stock, skipping unavailable variants, and returning structured warnings; verify merge deduplication, stock capping, and skipped-item reporting via Vitest unit tests.

## 5. Push Notifications Foundation (`DeviceToken` & Expo Push)

- [x] 5.1 Add `POST /api/v1/notifications/device-tokens` (upsert with shared-device ownership transfer) and `DELETE /api/v1/notifications/device-tokens/:token` to `NotificationsUserController` / `NotificationsService` with typed Swagger DTOs; verify registration, reassignment, and deactivation in `notifications.service.spec.ts`.
- [x] 5.2 Integrate `expo-server-sdk` non-blocking push dispatch into `NotificationsService` for `ORDER_STATUS`, `PAYMENT`, and `PROMOTION` notifications (including deep-link `route` payload metadata and automatic deactivation of `DeviceNotRegistered` tokens); verify push failures never break originating operations via mocked `expo-server-sdk` unit tests (`pnpm --filter api test src/notifications`).

## 6. Self-Service Account Deletion (`DELETE /api/v1/account`)

- [x] 6.1 Implement `DELETE /api/v1/account` in `AccountController` and `AccountService` requiring current password (or verified phone reset token) confirmation, transactionally anonymizing `User` PII (`name = "Deleted User"`, `email = null`, `phone = null`, `isActive = false`, `tokenVersion += 1`), revoking all `RefreshSession` rows, deleting `DeviceToken`, `UserAddress`, `WishlistItem`, and `CartItem` rows while preserving historical `Order` records; verify full deletion, invalid password rejection, and preserved order history via Vitest unit tests (`pnpm --filter api test src/account`).

## 7. Image WebP Pipeline & Complete OpenAPI Contract

- [x] 7.1 Refactor `apps/api/src/common/uploads/image-upload.ts` to introduce `MediaStorageAdapter` (local disk implementation) and `sharp` raster optimization generating primary WebP (`max 1600px`), medium (`800px`), and thumbnail (`400px`) derivatives while safely bypassing SVGs; verify raster WebP conversion and SVG pass-through with unit tests.
- [x] 7.2 Standardize Swagger bearer auth naming in `apps/api/src/main.ts`, complete explicit `@ApiResponse({ type })` DTO schemas across `AuthController`, `AccountController`, `AccountAddressesController`, `CollectionsPublicController`, and `SettingsController`, and add an `openapi:export` script in `apps/api/package.json`; verify exported OpenAPI JSON contains concrete `components.schemas` entries for all customer endpoints.

## 8. Final Integration & Verification

- [x] 8.1 Run full backend verification suite (`pnpm --filter api test`, `pnpm --filter api lint`, `pnpm --filter api build`, and `pnpm --filter api openapi:export`) and confirm all tests pass with zero TypeScript or lint errors and backward compatibility with existing `apps/web` API calls.

## Workflow follow-up

- Archive the change (`openspec archive mobile-backend-prerequisites`) once implementation and review checks pass.
- Proceed to Change 2 (`mobile-foundation-and-api`) using the exported OpenAPI JSON to generate `packages/api-client` via Orval.
