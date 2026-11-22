# mobile-auth-catalog Specification

## Purpose
Delivers mobile customer authentication (BD phone OTP + email login with secure refresh rotation and return-redirect route guards) and high-performance product catalog discovery (Home merchandising, Category tree, Search with recent history, Faceted Filters/Sorting, and PDP variant selection).

## Requirements

### Requirement: Phone-First and Email Authentication with Secure Session Lifecycle
The mobile app SHALL provide phone-first authentication (checking registration via `POST /auth/phone/check`, routing new numbers to 4-digit OTP verification + registration and existing numbers to password login, plus an email login toggle), store refresh tokens exclusively in `expo-secure-store`, hold access tokens in memory, and redirect authenticated users back to their intended protected destination after sign-in.

#### Scenario: Existing phone user signs in and returns to protected route
- **WHEN** a guest attempts to access `/checkout` and completes phone password login on `/(auth)/login?redirect=/checkout`
- **THEN** the app persists the refresh token in `expo-secure-store`, sets the in-memory access token, identifies the user for analytics, and navigates directly to `/checkout`

#### Scenario: Single-device logout clears local tokens without logging out other devices
- **WHEN** an authenticated customer taps Sign Out
- **THEN** the app calls `POST /auth/logout` with the current device session identifier, clears `expo-secure-store` and in-memory tokens, resets authenticated queries, and returns to guest browsing mode

### Requirement: Merchandised Home, Category Tree, and FlashList Product Catalog
The mobile app SHALL render Home banners, category shortcuts, dynamic collections, and curated product rails (hiding empty sections), a navigable Category tree, and 2-column `@shopify/flash-list` product grids using `expo-image` WebP thumbnails and `BDT` price formatting.

#### Scenario: Empty homepage section is hidden cleanly
- **WHEN** a curated section or collection returns zero products
- **THEN** the Home screen omits that section rather than displaying an empty placeholder

### Requirement: Debounced Search, Recent Searches, and Faceted Filter Sheet
The mobile app SHALL provide a Search screen with 300ms debounced suggestions (`GET /products/search-suggestions`), MMKV-persisted recent searches (up to 10 items with clear controls), and a Material 3 Filter & Sort sheet populated dynamically from API facets.

#### Scenario: Customer filters search results by price range and stock
- **WHEN** a customer sets min/max `BDT` price, toggles `In Stock`, and selects `Price: Low to High` in the Filter sheet
- **THEN** the catalog queries `GET /products` with matching query parameters and displays active filter count badges

### Requirement: Interactive Product Variant Selection and Smart Quick-Add
The mobile app SHALL display product variant swatches (`COLOR`) and option chips (`BUTTON`/`TEXT`) on PDP and Quick-Add sheets, updating live SKU, `BDT` price, discount badge, variant image, and stock status while preventing selection of out-of-stock variants.

#### Scenario: Selecting a variant updates live price and stock status
- **WHEN** a customer selects a different size or color attribute on PDP
- **THEN** the resolved variant's `BDT` price, SKU, stock badge, and primary image update immediately
