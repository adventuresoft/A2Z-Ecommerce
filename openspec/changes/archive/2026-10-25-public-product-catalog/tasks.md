# Tasks

## 1. Backend Public Products API

- [x] 1.1 Create DTOs (`PublicProductQueryDto`, `PublicProductSummaryDto`, `PublicProductDetailDto`, `SearchSuggestionsDto`) in `apps/api/src/products/dto` and verify input validation
- [x] 1.2 Implement `findPublicProducts`, `findPublicProductBySlug`, and `getSearchSuggestions` in `ProductsService` and verify unit tests pass
- [x] 1.3 Create `ProductsPublicController` (`/api/v1/products`) exposing `GET /`, `GET /:slug`, and `GET /search-suggestions` and register it in `ProductsModule`
- [x] 1.4 Add controller unit/e2e tests in `apps/api` covering catalog filtering, slug resolution, and search autocomplete, and verify they pass

## 2. Frontend Catalog & PDP Migration

- [x] 2.1 Rename route `apps/web/app/products/[id]` to `apps/web/app/products/[slug]` and update metadata generation
- [x] 2.2 Update `ProductCatalogView.tsx` to fetch `GET /api/v1/products` with live filters, pagination, and URL query synchronization
- [x] 2.3 Connect `apps/web/app/category/[slug]/page.tsx` and `apps/web/app/archive/page.tsx` to live public products API
- [x] 2.4 Update `ProductDetailView.tsx` to fetch product by slug from `GET /api/v1/products/:slug`, supporting dynamic variant switching, live stock checks, and approved reviews
- [x] 2.5 Connect `Header.tsx` search bar to debounced autocomplete via `GET /api/v1/products/search-suggestions`
- [x] 2.6 Update `ProductCard.tsx` and storefront product links to use canonical slug URLs (`/products/${product.slug}`)

## 3. Integration Verification

- [x] 3.1 Run `turbo check-types` and `turbo lint` across the monorepo and verify zero TypeScript or lint errors
- [x] 3.2 Verify automated tests and end-to-end public catalog flow (Catalog Listing -> Search Suggestions -> Product Detail View)
