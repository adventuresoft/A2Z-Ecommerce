# mobile-foundation Specification

## Purpose
Establishes the shared type-safe customer API client package (`packages/api-client`) and the Expo React Native Material Design 3 mobile application foundation (`apps/mobile`) with 3-environment configuration, EN/BN localization, `BDT` formatting, 5-tab Expo Router shell, offline resilience primitives, and Sentry/PostHog observability hooks.

## Requirements

### Requirement: Shared Orval Customer API Client Package
The monorepo SHALL provide a `@repo/api-client` workspace package generated via Orval from `apps/api/openapi.json` covering customer e-commerce endpoints, exposing typed TanStack Query v5 hooks, TypeScript DTO models, a configurable HTTP mutator supporting Bearer authentication and 401 refresh callbacks, and pagination/error normalization helpers.

#### Scenario: Generating typed customer hooks from exported OpenAPI JSON
- **WHEN** `pnpm --filter @repo/api-client generate` runs against `apps/api/openapi.json`
- **THEN** Orval outputs domain-split TypeScript models and React Query hooks for customer e-commerce endpoints while excluding admin-only and freelancer endpoints

#### Scenario: Single-flight 401 refresh handling in HTTP mutator
- **WHEN** multiple concurrent API calls receive HTTP 401 Unauthorized while a refresh handler is configured
- **THEN** the mutator invokes the refresh callback exactly once, queues concurrent callers, and retries each caller once with the newly issued access token

### Requirement: Three-Environment Dynamic Expo Configuration
`apps/mobile` SHALL configure `app.config.ts` dynamically by `APP_ENV` (`development`, `staging`, `production`) with distinct Android package names and iOS bundle identifiers (`com.atozecommerce.app.dev`, `com.atozecommerce.app.staging`, `com.atozecommerce.app`) and validate runtime public environment variables with Zod at startup.

#### Scenario: Side-by-side environment isolation
- **WHEN** `APP_ENV` is set to `development`, `staging`, or `production`
- **THEN** `app.config.ts` resolves distinct app names, package/bundle identifiers, deep link schemes, and HTTPS cleartext policies (disabled in staging and production)

### Requirement: Material Design 3 Brand Theme, Bilingual i18n, and BDT Formatting
`apps/mobile` SHALL provide a Material Design 3 theme (`react-native-paper` v5) using AZ brand tokens (`#1D4ED8`, `#0F172A`, `#EA580C`, `#C2410C`, `#F8FAFC`, `#FFFFFF`), runtime English/Bangla (`en`/`bn`) switching persisted in MMKV, and a `formatBDT` utility formatting amounts with the `BDT ` prefix and South Asian lakh/crore grouping.

#### Scenario: Formatting BDT prices with South Asian grouping
- **WHEN** `formatBDT(125000)` or `formatBDT(125000.5)` is called
- **THEN** it returns `"BDT 1,25,000"` and `"BDT 1,25,000.50"` respectively using English numerals regardless of active locale

### Requirement: Five-Tab Expo Router Shell and Resilience Primitives
`apps/mobile` SHALL expose a 5-tab Material bottom navigation layout (`Home`, `Categories`, `Cart`, `Wishlist`, `Account`) under `src/app/(tabs)/` wrapped in Root providers including ErrorBoundary, OfflineBanner wired to `NetInfo` + TanStack Query `onlineManager`, Sentry crash reporting with PII redaction, and an abstracted analytics facade.

#### Scenario: Displaying offline indicator when network connectivity drops
- **WHEN** device network connectivity transitions to offline
- **THEN** the root layout displays a non-blocking offline banner without crashing cached screens
