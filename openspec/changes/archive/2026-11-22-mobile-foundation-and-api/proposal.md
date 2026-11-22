# Proposal

## Why

With `apps/api` hardened and exporting a complete OpenAPI contract (`apps/api/openapi.json`), we need the shared type-safe API client package (`packages/api-client`) and the Expo React Native mobile foundation (`apps/mobile`) so all shopping, checkout, and order features build on one unified Material Design 3 theme, navigation shell, storage layer, localization engine, and observability pipeline.

## What Changes

- **Shared Orval API Client (`packages/api-client`):** Configure Orval (`mode: 'tags-split'`, `client: 'react-query'`, `httpClient: 'fetch'`) filtered strictly to customer e-commerce tags from `apps/api/openapi.json`, paired with a pluggable custom HTTP mutator supporting Bearer tokens, single-flight 401 refresh hook injection, timeout handling, pagination normalization, and NestJS error parsing.
- **Expo CNG Mobile App Foundation (`apps/mobile`):** Scaffold `apps/mobile` inside the Turborepo + `pnpm` monorepo with Expo Router (`src/app/` routes-only), monorepo-aware `metro.config.js`, 3-environment dynamic `app.config.ts` (`development`, `staging`, `production` with distinct Bundle IDs and Zod runtime env validation), and `eas.json` profiles.
- **AZ Material Design 3 Theme & Reusable Primitives (`src/shared/theme`, `src/shared/components`):** Configure `react-native-paper` v5 MD3 theme using AZ brand tokens (`#1D4ED8`, `#0F172A`, `#EA580C`, `#C2410C` WCAG AA orange text, `#F8FAFC`, `#FFFFFF`), `Inter` + `Hind Siliguri` fonts, `BDT` South Asian price formatting (`formatBDT`), Skeleton shimmers, EmptyState, ErrorBoundary, and `resolveMediaUrl()`.
- **Core Infrastructure:** Set up `i18next` (`en` + `bn` persisted in MMKV), synchronous MMKV storage wrapper (`src/shared/storage/mmkv.ts`), secure token wrapper (`src/shared/storage/secure-store.ts`), TanStack Query v5 + selective MMKV persister, `@react-native-community/netinfo` `onlineManager` + OfflineBanner, Sentry (`@sentry/react-native`), PostHog behind `analytics.track()`, and 5-tab Material bottom navigation (`Home`, `Categories`, `Cart`, `Wishlist`, `Account`).

## Capabilities

### New Capabilities
- `mobile-foundation`: Shared Orval customer API client (`packages/api-client`), Expo CNG monorepo app shell (`apps/mobile`), Material Design 3 AZ theme, EN/BN i18n, `BDT` formatting, 5-tab Expo Router layout, offline/resilience primitives, and Sentry/PostHog observability hooks.

### Modified Capabilities

## Impact

- **New Packages/Apps:** `packages/api-client/*`, `apps/mobile/*`.
- **Root Config:** `turbo.json` updated with safe mobile `check-types`, `lint`, and `test` task outputs; `apps/mobile/metro.config.js` isolates pnpm monorepo resolution.
- **Zero Impact on Existing Apps:** `apps/api`, `apps/web`, and `apps/admin` remain untouched and operational.
