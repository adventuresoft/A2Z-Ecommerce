# Tasks

## 1. Shared Orval API Client (`packages/api-client`)

- [x] 1.1 Create `packages/api-client` (`@repo/api-client`) with `orval.config.ts` (`mode: 'tags-split'`, `client: 'react-query'`, `httpClient: 'fetch'`, customer e-commerce tag filters), configurable `customFetch` mutator with single-flight 401 refresh lock, `ApiError` parser, `normalizePage`, and `resolveMediaUrl`; run Orval generation from `apps/api/openapi.json` and verify generated TypeScript compiles cleanly (`pnpm --filter @repo/api-client check-types`).
- [x] 1.2 Write Vitest/Jest unit tests in `packages/api-client` verifying single-flight 401 refresh concurrency (3 parallel 401s trigger exactly 1 refresh call), error message extraction, pagination normalization, and `resolveMediaUrl`; verify all tests pass (`pnpm --filter @repo/api-client test`).

## 2. Expo Mobile Foundation (`apps/mobile`)

- [x] 2.1 Scaffold `apps/mobile` with Expo CNG (`package.json`, `tsconfig.json`, `babel.config.js`, `metro.config.js` monorepo setup, 3-environment `app.config.ts`, `eas.json`) and install core React Native / Expo / Material 3 / Query / Zustand / MMKV / Sentry / PostHog / Testing dependencies; verify installation succeeds without breaking `apps/api` or `apps/web`.
- [x] 2.2 Implement core shared modules in `apps/mobile/src/shared/`: Zod-validated `config/env.ts`, AZ Material Design 3 theme (`theme/index.ts`), `storage/mmkv.ts` & `storage/secure-store.ts`, `i18n/` (`en.json`, `bn.json` + MMKV-persisted language store), `utils/format-bdt.ts` & `utils/bd-phone.ts`, `api/query-client.ts` (TanStack Query v5 + selective MMKV persister + `NetInfo` `onlineManager`), `analytics/index.ts` (Sentry PII-redacted init + PostHog facade), and reusable MD3 components (`price-text.tsx`, `skeleton.tsx`, `empty-state.tsx`, `offline-banner.tsx`, `error-boundary.tsx`); verify unit tests for `formatBDT`, `bdPhone`, `env`, and `mmkv` pass.
- [x] 2.3 Implement Expo Router root layout (`src/app/_layout.tsx`) with providers & Remote Version Gate check hook, and 5-tab Material bottom navigation (`src/app/(tabs)/_layout.tsx` + `index.tsx`, `categories.tsx`, `cart.tsx`, `wishlist.tsx`, `account.tsx` shells) with WCAG AA accessibility labels and `testID`s; verify `pnpm --filter mobile check-types` and `pnpm --filter mobile test` pass cleanly.
