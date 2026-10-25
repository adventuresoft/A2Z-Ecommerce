# Proposal

## Why

The storefront currently displays mock products from hardcoded fixture files (`mock-catalog.ts`) and uses non-canonical mock IDs (`fs-1`, `phone-1`). The backend has administrative product CRUD but lacks public REST endpoints for product catalog filtering, debounced search suggestions, and full product details by URL-friendly slug. To connect the Next.js storefront to PostgreSQL 18 and complete Phase 2 of the Storefront–Backend integration requirements, we need dedicated public catalog APIs and full storefront component integration.

## What Changes

- Add public endpoints under `/api/v1/products`:
  - `GET /api/v1/products`: Paginated public catalog listing with faceted filtering (`categorySlug`/`categoryId`, `brandSlug`/`brandId`, `minPrice`, `maxPrice`, `inStock`, `hasDiscount`, `sort`, `page`, `limit`).
  - `GET /api/v1/products/:slug`: Canonical slug-based product detail resolver returning product master, images, active variants with attributes, real-time stock balances, and approved customer reviews.
  - `GET /api/v1/products/search-suggestions`: Debounced search autocomplete returning top matching products and categories.
- Migrate storefront routing from `apps/web/app/products/[id]` to `apps/web/app/products/[slug]`.
- Connect storefront catalog views (`/shop`, `/category/[slug]`, `/archive`) to `GET /api/v1/products` with URL query parameter synchronization.
- Connect `ProductDetailView` to `GET /api/v1/products/:slug` with dynamic variant selector, live stock checks, and image gallery.
- Connect storefront header search to `GET /api/v1/products/search-suggestions`.
- Update `ProductCard` to use canonical slug URLs (`/products/${product.slug}`).

## Capabilities

### New Capabilities
<!-- None -->

### Modified Capabilities
- `product-catalog`: Add requirements for public catalog listing with faceted filtering, public slug-based product detail resolution, and public search suggestions autocomplete.

## Impact

- **Backend (`apps/api`)**:
  - New `ProductsPublicController` registered in `ProductsModule`.
  - Public querying methods added to `ProductsService` with optimized Prisma queries.
  - Swagger documentation and unit/e2e tests for public product endpoints.
- **Frontend (`apps/web`)**:
  - Route renamed from `app/products/[id]` to `app/products/[slug]`.
  - API integration in `ProductCatalogView.tsx`, `ProductDetailView.tsx`, `Header.tsx`, `ProductCard.tsx`.
  - Dynamic category and brand facet resolution from live backend.
