# Proposal

## Why

With `@repo/api-client` and the Material Design 3 mobile foundation in place, customers need seamless Bangladesh phone-first authentication (with email fallback and secure JWT refresh lifecycle) alongside a fast, guest-friendly shopping discovery experience (Home, Categories, Search, Faceted Filters/Sorting, Product Detail Page, and Smart Variant Quick-Add).

## What Changes

- **Auth Session & Token Lifecycle (`src/features/auth`):** Implement `authStore` (in-memory access token + authenticated user state), cold-start hydration via `expo-secure-store` refresh token + `POST /auth/refresh`, single-flight 401 refresh binding into `configureApiClient`, per-device logout (`POST /auth/logout` with `deviceId` & `refreshToken`), and `useRequireAuth()` redirect-return hook.
- **Phone-First Auth Screens (`src/app/(auth)/*`):** Implement Login (phone check -> auto-route to password or 4-digit OTP signup + email login toggle), OTP Verification (4-digit input with 60s resend countdown), Registration completion, and Forgot/Reset Password using React Hook Form + Zod.
- **Home, Categories & Catalog Discovery (`src/features/catalog`, `src/features/search`):** Implement Home screen (sticky Searchbar, Hero Banner Carousel from `settings/public`, Category Shortcuts, Dynamic Collections `/collections/home`, Curated rails `/products/curated`, empty-section hiding), Categories tree tab, 2-column `@shopify/flash-list` product grids with `expo-image` WebP thumbnails, Search with 300ms debounce + MMKV recent searches, and Material 3 Faceted Filter & Sort Bottom Sheet.
- **Product Detail Page & Smart Variant Selector (`src/app/product/[slug].tsx`):** Implement multi-image gallery (variant photo sync), interactive `COLOR` swatches & `BUTTON`/`TEXT` chips with live SKU/BDT price/stock updates, disabled out-of-stock combinations, specifications/warranty/reviews, sticky `Add to Cart` + `Buy Now` bar, and Smart Quick-Add / Variant Bottom Sheet on product cards.

## Capabilities

### New Capabilities
- `mobile-auth-catalog`: Phone-first & email authentication with secure token lifecycle, protected route redirect guard, Home/Category discovery, debounced Search with recent history, Material 3 Faceted Filter/Sort, and interactive PDP with variant selection.

### Modified Capabilities

## Impact

- **New Feature Modules:** `apps/mobile/src/features/auth/*`, `apps/mobile/src/features/catalog/*`, `apps/mobile/src/features/search/*`.
- **Routes Added/Upgraded:** `src/app/(auth)/*`, `src/app/(tabs)/index.tsx`, `src/app/(tabs)/categories.tsx`, `src/app/search.tsx`, `src/app/category/[slug].tsx`, `src/app/collection/[slug].tsx`, `src/app/product/[slug].tsx`.
