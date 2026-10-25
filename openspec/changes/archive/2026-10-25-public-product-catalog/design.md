# Design

## Context

See `proposal.md` for background. The backend already contains Prisma models for `Product`, `ProductVariant`, `Inventory`, `ProductImage`, `Attribute`, `AttributeValue`, and `Review`, with seeds already in place. The storefront frontend has catalog views (`/shop`, `/category/[slug]`, `/archive`) and a single product page (`/products/[id]`) that previously relied on static data fixtures (`mock-catalog.ts`).

## Goals / Non-Goals

**Goals:**
- Provide fast, unauthenticated public REST endpoints for product catalog filtering, search suggestions, and full single product resolution by slug.
- Enable full dynamic server-driven browsing on `/shop`, `/category/[slug]`, `/archive`, and `/products/[slug]`.
- Provide real inventory availability (`quantity - reservedQuantity > 0`) per variant on PDP.
- Debounce header search input with live autocomplete suggestions.

**Non-Goals:**
- Cart and checkout submission (handled in Phase 4 and Phase 5).
- Wishlist database sync (handled in Phase 7).
- Homepage curated merchandise shelves and admin banner management (handled in Phase 3).

## Decisions

### Decision 1: Dedicated Public Controller (`ProductsPublicController`)
- **Rationale**: Administrative operations (`/api/v1/admin/products`) require `Roles(Role.ADMIN, Role.SUPER_ADMIN)` and return administrative metadata (cost price, full inventory movements, deleted records). Creating a dedicated `ProductsPublicController` under `/api/v1/products` ensures clean route separation, public rate limiting, and guarantees that inactive products or unpublished drafts cannot leak to public shoppers.
- **Alternatives Considered**: Adding public methods to `ProductsAdminController` or making role guards optional per route. Rejected due to security risks and code cleanliness.

### Decision 2: Canonical `/products/[slug]` Routing
- **Rationale**: E-commerce best practices and SEO require human-readable, canonical URL slugs (e.g., `/products/apple-macbook-pro-16-m3-max`). The database already enforces unique slugs on the `Product` table.
- **Alternatives Considered**: Dual routing (`/products/[id]` and `/products/[slug]`). Rejected as redundant and dilutes SEO indexing.

### Decision 3: Prisma Query Architecture for Facets and Real Inventory
- **Rationale**: For public catalog listing, variants must be queried with their active prices and current inventory balances to accurately evaluate in-stock status (`quantity > reservedQuantity`). Prisma queries will fetch active products with primary images, categories, brands, and variant price ranges.
- **Alternatives Considered**: Pre-aggregating min/max price into columns on `Product`. Deferred until high-traffic indexing demands it, since current catalog size is well within PostgreSQL single-query performance thresholds (<20ms).

### Decision 4: URL State Synchronization for Storefront Catalog
- **Rationale**: Users expect back-button navigation, bookmarking, and link sharing to preserve catalog filters (`?categorySlug=...&brandSlug=...&minPrice=...&sort=...`). Next.js `useRouter` and `useSearchParams` will synchronize the UI state with query parameters.

## Risks / Trade-offs

- **[Risk] Heavy Variant and Review Payload on Catalog List** → Mitigation: `GET /api/v1/products` returns lightweight product summaries (primary image, price range, category name, brand name). The heavy payload (all gallery images, complete attribute matrix, full review comments) is returned only on `GET /api/v1/products/:slug`.
- **[Risk] Slow Autocomplete on Large Databases** → Mitigation: `GET /api/v1/products/search-suggestions` limits results to top 5 products and top 3 categories, selecting only `id`, `title`, `slug`, and `primaryImage`.
