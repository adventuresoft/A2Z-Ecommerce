# Proposal: Mobile Orders, PDF Receipts, Account, Push Notifications & Release Automation

## Why
To complete the v1 customer experience and ship safely to Google Play and Apple App Store, `apps/mobile` needs post-purchase order management (history, status timeline, shipment tracking, cancel, PayStation retry, product reviews, 1-tap reorder, and on-device PDF invoice receipts), full account management (profile, EN/BN language toggle, App Store/Play Store compliant in-app account deletion, single-device logout), push notifications with sanitized deep-link routing, RNTL component tests, 5 Maestro E2E flows, `.well-known` App Links/Universal Links templates, and `.eas/workflows/` CI/CD pipelines.

## What Changes
- **Orders & Shipment Tracking (`/orders`, `/orders/[id]`, `/track/[trackingNumber]`)**: Paginated order history with status filter chips, visual Material 3 status timeline, copyable courier tracking (`expo-clipboard`), cancel `PENDING` orders, PayStation retry/verify, write review modal for `DELIVERED` orders, 1-tap reorder, public shipment tracking screen, and on-device HTML-to-PDF invoice receipt generation (`expo-print` + `expo-sharing`).
- **Account & Notifications (`/(tabs)/account`, `/notifications`)**: Guest sign-in card or authenticated profile overview, quick links (Orders, Addresses, Notifications, Track Shipment), EN ↔ BN language switcher, in-app Delete Account dialog calling `DELETE /api/v1/account`, single-device logout, and paginated notification inbox with mark-read / mark-all-read.
- **Push Notifications & Deep Link Sanitizer**: Android channels (`orders`, `promotions`), post-login Expo push token registration, pre-logout token deactivation, notification tap handler with Zod-sanitized internal route allowlist (`src/shared/utils/deep-link.ts`).
- **Testing & Release Pipeline**: RNTL v14 async component tests (`price-text.test.tsx`, `product-card.test.tsx`), unit tests (`invoice-pdf.test.ts`, `deep-link.test.ts`), 5 Maestro E2E YAML flows under `apps/mobile/maestro/`, 3 EAS Workflows under `apps/mobile/.eas/workflows/`, and `.well-known` templates under `apps/web/public/.well-known/`.

## Impact
- **Affected packages**: `apps/mobile`, `apps/web/public/.well-known` (static verification templates).
- **Backward compatibility**: Fully additive; zero breaking changes to backend or web storefront.
