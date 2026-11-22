# mobile-orders-release Specification

## Purpose
TBD - created by archiving change mobile-orders-push-release. Update Purpose after archive.

## Requirements

### Requirement: Order History, Timeline, Actions & PDF Invoice Receipt
Authenticated customers MUST be able to view paginated order history filtered by status, inspect full order details with a visual status timeline, copy shipment tracking numbers, cancel `PENDING` orders, retry unpaid `PAYSTATION` orders, submit product reviews for `DELIVERED` orders, reorder items in one tap, and generate/share a PDF invoice receipt on-device.

#### Scenario: Customer downloads a PDF invoice receipt
- **WHEN** a customer taps Download PDF Receipt on an order detail screen
- **THEN** the app builds an HTML-escaped `BDT ` invoice document, generates a PDF via `expo-print`, and opens the native share sheet via `expo-sharing`.

#### Scenario: Customer tracks a shipment publicly
- **WHEN** a user navigates to `/track/[trackingNumber]`
- **THEN** the app queries `GET /shipments/track/:trackingNumber` and renders courier details and chronological shipment status history.

### Requirement: Account Management, Language Switch & In-App Account Deletion
The Account tab MUST support EN ↔ BN language switching persisted in MMKV, navigation to Orders, Addresses, Notifications, and Shipment Tracking, single-device Sign Out, and in-app Delete Account calling `DELETE /api/v1/account` followed by local credential cleanup.

#### Scenario: Customer switches language to Bangla
- **WHEN** a customer selects Bangla (বাংলা) in the Account tab
- **THEN** `usePreferencesStore.setLocale('bn')` persists the choice in MMKV and updates visible UI copy immediately.

### Requirement: Push Notification Lifecycle & Sanitized Deep Links
The mobile app MUST configure Android notification channels (`orders`, `promotions`), register Expo push tokens post-login, deactivate them pre-logout, display a paginated notification inbox with read-state mutations, and sanitize all deep-link URLs against an explicit internal route allowlist.

#### Scenario: Malformed or external deep link URL is rejected
- **WHEN** a notification payload contains an external domain or path traversal string
- **THEN** `resolveSafeInternalRoute` returns `null` and does not navigate outside allowlisted app routes.

### Requirement: Automated Tests, Maestro E2E Flows & EAS CI/CD Workflows
The repository MUST include passing RNTL v14 component tests, 5 Maestro E2E YAML test flows under `apps/mobile/maestro/`, 3 EAS workflow YAML pipelines under `apps/mobile/.eas/workflows/`, and `.well-known` templates for Android App Links and iOS Universal Links.

#### Scenario: Verification suite executes cleanly across workspaces
- **WHEN** `pnpm --filter mobile check-types` and `pnpm --filter mobile test` run
- **THEN** all TypeScript checks pass with 0 errors and all Jest + RNTL v14 suites pass.
