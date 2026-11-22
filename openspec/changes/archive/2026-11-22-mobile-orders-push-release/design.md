# Design: Orders, PDF Receipts, Push, Account Deletion & Release Engineering

## Architectural Decisions
1. **On-Device Branded PDF Invoice (`expo-print` + `expo-sharing`)**: Generate a clean, self-contained HTML invoice from `OrderResponseDto` (escaping all user-supplied text to prevent HTML injection) displaying `BDT ` currency totals, VAT included breakdown, item SKUs, and shipping address, then convert via `Print.printToFileAsync` and share via `Sharing.shareAsync`.
2. **Sanitized Deep Linking (`src/shared/utils/deep-link.ts`)**: All push notification `linkUrl` payloads and external universal links are parsed against a strict allowlist of internal customer routes (`/product/:slug`, `/category/:slug`, `/collection/:slug`, `/orders/:id`, `/track/:trackingNumber`, `/checkout/payment-callback`) with Zod parameter sanitization so untrusted strings cannot hijack navigation.
3. **Push Token Lifecycle**: `push-service.ts` registers post-login & pre-logout hooks in `auth-service.ts`. Android notification channels (`orders` HIGH importance, `promotions` DEFAULT importance) are initialized on startup. Token deactivation runs before logout so another customer signing in on the same device never receives private order pushes.
4. **App Store / Play Store Account Deletion Compliance**: Account screen exposes an in-app Delete Account dialog requiring current password confirmation, invokes `DELETE /api/v1/account`, clears local SecureStore tokens + auth-scoped TanStack Query caches, and resets to Guest mode cleanly.
5. **Automated QA & EAS CI/CD**:
   - RNTL v14 async `await render(...)` tests for core visual components (`PriceText`, `ProductCard`).
   - 5 Maestro YAML E2E flows targeting stable `testID` selectors across Auth, Browse/Variant, Guest-to-Auth Cart Sync, COD Checkout + Cancel, and PayStation + Tracking.
   - 3 EAS Workflows (`pr-check.yml`, `staging-release.yml`, `production-release.yml`) automating typecheck, tests, EAS builds, OTA updates, and store submissions.
