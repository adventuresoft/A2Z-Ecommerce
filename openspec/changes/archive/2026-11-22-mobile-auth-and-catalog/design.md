# Design

## Context

See `proposal.md` and `docs/mobile-app.md` (Sections 7, 8, 10). All endpoints consume generated functions/hooks from `@repo/api-client`.

## Goals / Non-Goals

**Goals:**
- Keep refresh tokens strictly inside `expo-secure-store` and access tokens strictly in memory.
- Provide guest-friendly catalog browsing with zero login wall; gate protected destinations cleanly via `redirect` query param.
- Ensure 60 FPS scrolling on budget BD Android devices via `@shopify/flash-list` + `expo-image` (`-thumb.webp` derivatives + `recyclingKey`).
- Resolve variant combinations cleanly via a pure, unit-tested `resolveVariantSelection` engine.

**Non-Goals:**
- Server Cart sync & Checkout/PayStation flows (Change 4 — here Add-to-Cart delegates to a clean cart bridge hook wired in Change 4).

## Decisions

1. **Auth Hydration (`src/features/auth/auth-service.ts`):** On app boot, `hydrateSession()` retrieves `deviceId` and `refreshToken` from `expo-secure-store`, configures `@repo/api-client` mutator callbacks (`getAccessToken`, `getDeviceId`, `onRefreshToken`, `onAuthFailure`), and silently refreshes to hydrate `user` via `GET /auth/me`.
2. **Variant Matrix Resolver (`src/features/catalog/utils/variant-resolver.ts`):** Pure function mapping `variants[]` into unique attribute groups (`COLOR`, `BUTTON`, `TEXT`), calculating selected variant match, available options for partial selections, effective `BDT` price, discount %, and stock badge (`IN_STOCK` / `LOW_STOCK` / `OUT_OF_STOCK`).
3. **Filter & Sort State (`src/features/search/components/filter-sheet.tsx`):** Modal Material 3 sheet driven dynamically by `GET /products` response `facets` (brands, categories, attributes, min/max BDT price, inStock, hasDiscount, sortBy).
