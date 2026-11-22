# Tasks

## 1. Orders, Shipment Tracking & PDF Receipts

- [x] 1.1 Create `src/features/orders/utils/invoice-pdf.ts` (HTML-escaped BDT invoice builder + `expo-print` / `expo-sharing` share helper) and unit tests in `src/features/orders/utils/invoice-pdf.test.ts`.
- [x] 1.2 Create `src/features/orders/screens/orders-list-screen.tsx`, `src/features/orders/screens/order-detail-screen.tsx` (status timeline, clipboard tracking copy, cancel `PENDING`, PayStation retry/verify, write review modal, 1-tap reorder, PDF receipt), and `src/features/orders/screens/track-shipment-screen.tsx` + thin Expo Router routes under `src/app/orders/{index,[id]}.tsx` and `src/app/track/[trackingNumber].tsx`.

## 2. Account, Notifications, Push & Deep Linking

- [x] 2.1 Create `src/shared/utils/deep-link.ts` (Zod-sanitized internal route resolver) + unit tests in `src/shared/utils/deep-link.test.ts`, and `src/features/notifications/push-service.ts` (Android channels, post-login token registration, pre-logout deactivation) + `src/features/notifications/screens/notifications-screen.tsx` + `src/app/notifications/index.tsx`.
- [x] 2.2 Create `src/features/account/screens/account-screen.tsx` (Guest & Auth states, quick links, EN ↔ BN toggle, Delete Account dialog, Logout) + wire `src/app/(tabs)/account.tsx`, and wire push lifecycle, notification response routing, and all new stack routes in `src/app/_layout.tsx`.

## 3. RNTL Tests, Maestro E2E Flows, EAS Workflows & Well-Known Templates

- [x] 3.1 Add RNTL v14 async component tests (`src/shared/components/price-text.test.tsx`, `src/features/catalog/components/product-card.test.tsx`).
- [x] 3.2 Create 5 Maestro E2E flows (`apps/mobile/maestro/01-auth-phone-otp.yaml` through `05-checkout-paystation-tracking.yaml`), 3 EAS workflow pipelines (`apps/mobile/.eas/workflows/{pr-check.yml,staging-release.yml,production-release.yml}`), and `.well-known` templates (`apps/web/public/.well-known/{assetlinks.json,apple-app-site-association}`).
- [x] 3.3 Run full monorepo verification (`api`, `@repo/api-client`, `mobile`, `openspec`) and ensure 0 errors and all tests pass.
