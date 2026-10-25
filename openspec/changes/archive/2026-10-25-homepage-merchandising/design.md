# Design: Homepage Merchandising & Admin Hero Banner Management

## Context

Phase 2 established public catalog listing, search autocomplete, and canonical slug-based PDP resolution. However, the storefront homepage (`apps/web/app/page.tsx`) still relies on static mock data from `mock-catalog.ts`, and the hero slider cannot be configured dynamically by administrators.

Phase 3 introduces live curated shelves and a visual hero banner manager in Admin Settings, allowing store managers to orchestrate homepage merchandising directly from the Admin Dashboard.

## Goals / Non-Goals

**Goals:**
- Provide a high-performance backend endpoint `GET /api/v1/products/curated` returning `flashDeals`, `featured`, `newArrivals`, and `bestSellers` in a single parallelized round-trip.
- Expose `GET /api/v1/settings/public` delivering active hero banners, store identity, and trust policies.
- Build a visual Hero Banners manager in Admin Settings (`apps/admin/app/system/settings`) supporting banner creation, editing, sorting, and active toggling.
- Update Storefront Homepage components (`HeroSlider`, `FlashSaleSection`, `FeaturedSection`, `NewArrivalsSection`, `BestSellersTopViewSection`, `BrandStrip`) to consume live data and hide empty shelves gracefully.

**Non-Goals:**
- User-specific algorithmic recommendation engines or machine learning personalization.
- Full checkout order placement and coupon validation (covered in Phases 4 & 5).

## Decisions

### 1. Consolidated Curated Products Endpoint (`GET /api/v1/products/curated`)
- **Rationale**: Homepage load time is critical for storefront conversion and Core Web Vitals. Rather than forcing the client to fire 4 separate requests (`/products?hasDiscount=true`, `/products?sort=featured`, etc.), `getCuratedProducts` executes all 4 queries concurrently on the server using `Promise.all` and returns a consolidated response.
- **Alternative considered**: Client-side multi-fetching with separate SWR/React Query hooks. Rejected due to connection contention and waterfall layout shifting on mobile networks.

### 2. Structured JSON for Hero Banners in `store_settings`
- **Rationale**: The `StoreSetting` table already supports a `JSON` data type with group scoping. Storing `storefront.hero_banners` as a validated array of banner objects (`{ id, title, subtitle, imageUrl, linkUrl, badgeText, sortOrder, isActive }`) avoids creating a redundant database table and leverages existing settings caching.
- **Alternative considered**: Dedicated `HeroBanner` Prisma table. Rejected as unnecessary overhead for a feature containing 3-6 slides that changes infrequently.

### 3. Visual Admin Hero Banner Manager
- **Rationale**: Editing raw JSON strings in admin settings is error-prone for non-technical store operators. Providing a dedicated visual editor with preview thumbnails, text inputs, link selectors, and drag/order controls ensures schema validity and operational simplicity.

### 4. Dynamic Shelf Hiding
- **Rationale**: If a store has no products on sale, displaying an empty flash sale countdown with no products looks broken. Each homepage section inspects its respective curated collection and returns `null` if the array is empty.

## Risks / Trade-offs

- **[Risk: Slow response if best-seller aggregation queries large order volumes]** → *Mitigation*: Query top products with index-backed order item groupings, and fall back to high-demand active products if order volume is low.
- **[Risk: Admin enters broken image URLs]** → *Mitigation*: Client components supply fallback placeholder styling if image loading encounters an error.

## Migration Plan

No schema migrations are required because `store_settings` already supports JSON entries and `products`/`variants` tables contain all required fields (`isActive`, `isFeatured`, `salePrice`, `regularPrice`, `createdAt`).
