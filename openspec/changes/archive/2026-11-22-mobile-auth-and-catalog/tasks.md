# Tasks

## 1. Auth Session Engine & Screens

- [x] 1.1 Implement `src/features/auth/auth-store.ts`, `src/features/auth/auth-service.ts` (cold-start SecureStore hydration, single-flight 401 refresh handler wired into `@repo/api-client`, post-login sync hook registry, device-scoped logout), and `src/features/auth/use-require-auth.ts`; verify session hydration, token refresh, and single-device logout via Jest unit tests (`auth-service.test.ts`).
- [x] 1.2 Implement Phone-First Login, Email Login toggle, 4-Digit OTP Verification (with 60s countdown), Registration, and Reset Password screens under `src/features/auth/screens/` + thin Expo Router routes under `src/app/(auth)/` using React Hook Form + Zod; verify form schemas and screen rendering via Jest/RNTL tests.

## 2. Catalog, Search, Filters & PDP with Variant Selection

- [x] 2.1 Implement `src/features/catalog/utils/variant-resolver.ts` (pure attribute-group extractor, stock status classifier, active variant matcher), `product-card.tsx` (1:1 `expo-image` WebP thumb, `PriceText`, Wishlist heart, Smart Quick-Add), and `quick-variant-sheet.tsx`; verify variant resolution edge cases via Jest unit tests (`variant-resolver.test.ts`).
- [x] 2.2 Implement Home screen (`src/features/catalog/screens/home-screen.tsx`), Category tree (`categories-screen.tsx`), Category/Collection listing screens (`catalog-listing-screen.tsx` using `@shopify/flash-list` + infinite scroll), Search screen (`src/features/search/screens/search-screen.tsx` with 300ms debounce + MMKV recent searches), and Material 3 Faceted Filter/Sort modal (`filter-sheet.tsx`).
- [x] 2.3 Implement Product Detail Page (`src/features/catalog/screens/product-detail-screen.tsx` + `src/app/product/[slug].tsx`) with image gallery, variant swatches/chips, specs/warranty/reviews, delivery preview, and sticky `Add to Cart` / `Buy Now` bar; wire all routes in `src/app/_layout.tsx` and verify `pnpm --filter mobile check-types` and `pnpm --filter mobile test` pass cleanly.
