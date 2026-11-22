# Design

## Context

See `proposal.md` and `docs/mobile-app.md` (Sections 4–9, 15, 17, 19). `apps/api/openapi.json` now exports 257 paths and 316 typed schemas. `apps/mobile` lives inside the existing Turborepo + `pnpm` workspace alongside `apps/web` (Next.js 16) and `apps/api` (NestJS 12).

## Goals / Non-Goals

**Goals:**
- Generate strongly typed customer API hooks and DTOs into `packages/api-client` via Orval (`tags-split` mode, customer e-commerce tags only).
- Provide a clean, fast, zero-runtime-overhead Material Design 3 theme (`react-native-paper` v5) with AZ brand tokens, EN/BN localization, and `BDT` South Asian grouping.
- Establish strict storage separation: MMKV for non-sensitive preferences/cache, `expo-secure-store` for refresh tokens, in-memory for access tokens.
- Support 3 isolated environments (`development`, `staging`, `production`) with side-by-side Android Package / iOS Bundle IDs and Zod-validated runtime configuration.
- Keep `src/app/` strictly routes-only (kebab-case filenames, bottom `StyleSheet.create`, colocated `.test.ts` files).

**Non-Goals:**
- Full feature screens (Auth/Catalog in Change 3, Cart/Checkout/Payments in Change 4, Orders/Push/Maestro/EAS Workflows in Change 5).

## Decisions

1. **Orval Configuration (`packages/api-client`):** Use `mode: 'tags-split'`, `client: 'react-query'`, `httpClient: 'fetch'`, filtering strictly to customer e-commerce tags (`Authentication`, `Account`, `Account Addresses`, `Customer Cart`, `Customer Wishlist`, `Public Products`, `Public Categories`, `Public Brands`, `Public Attributes`, `Public Tags`, `Public Collections`, `Public Reviews`, `Checkout & Calculations`, `Coupons`, `Orders`, `Shipping & Tracking`, `Public Payment Methods`, `PayStation Gateway`, `Locations`, `Store Settings`, `User Notifications`). Provide a configurable `customFetch` mutator (`configureApiClient(...)`) so `apps/mobile` injects its base URL, Bearer access token, single-flight 401 refresh handler, and 15s timeout without coupling `packages/api-client` to React Native APIs.
2. **Storage Abstraction (`src/shared/storage`):** Wrap `react-native-mmkv` v4 (`createMMKV`) with an automatic in-memory fallback when running under Jest/Node tests, ensuring 100% deterministic unit tests without native Nitro crashes.
3. **Theme & Currency:** Single source of truth in `src/shared/theme/index.ts` extending `MD3LightTheme` with AZ tokens (`#1D4ED8`, `#0F172A`, `#EA580C`, `#C2410C`, `#F8FAFC`, `#FFFFFF`). `formatBDT()` formats using South Asian lakh/crore grouping (`BDT 1,25,000` or `BDT 1,25,000.50`) with English digits `0–9` across EN and BN.
4. **Navigation Shell:** Expo Router `src/app/_layout.tsx` wraps GestureHandlerRootView, SafeAreaProvider, PaperProvider, QueryClientProvider, ErrorBoundary, and OfflineBanner; `src/app/(tabs)/_layout.tsx` renders 5 Material bottom tabs (`Home`, `Categories`, `Cart`, `Wishlist`, `Account`).
5. **Observability Abstraction:** `src/shared/analytics/index.ts` exposes `analytics.track()`, `analytics.screen()`, `analytics.identify()`, and `analytics.reset()` forwarding to PostHog and Sentry breadcrumbs, with PII redaction inside Sentry `beforeSend`.

## Risks / Trade-offs

- **[pnpm strict symlinks & Expo Metro resolution]** -> Configure `apps/mobile/metro.config.js` with `watchFolders`, `nodeModulesPaths`, and `unstable_enablePackageExports` so workspace packages (`@repo/api-client`) resolve cleanly without colliding with `apps/web`'s React version.
- **[Jest + React Native / Expo v58 transform config]** -> Use `jest-expo` preset with `transformIgnorePatterns` covering `react-native-paper`, `expo-*`, `@repo/api-client`, and `@tanstack/*`.
