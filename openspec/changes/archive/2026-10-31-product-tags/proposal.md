# Proposal: Product Tags Management

## Why

Currently, products in the e-commerce catalog are organized only by category and brand, lacking flexible merchandising labels, seasonal collections, and discovery tags (e.g., "Trending", "Summer Collection", "New Arrival", "Best Seller"). Store administrators need a way to assign multiple tags to products with on-the-fly tag creation, and manage tags centrally with color badges.

## What Changes

- Add a relational `Tag` entity with unique slug and optional UI badge color code.
- Add a `ProductTag` many-to-many relationship join table linking products and tags with cascading deletions on tag removal (safe detach without deleting products).
- Update Product API endpoints (`POST /api/v1/admin/products`, `PUT /api/v1/admin/products/:id`) to accept multiple tags (`tagIds` and/or `tags`), resolving existing tags and creating new ones on the fly in an atomic transaction.
- Update public product catalog endpoints (`GET /api/v1/products`) to return assigned tags and allow filtering by tag slug(s).
- Introduce a dedicated Tag Management admin API (`/api/v1/admin/tags`) and public tags list endpoint (`/api/v1/tags`).
- Add a dedicated **Catalog > Tags** management page in the Admin Dashboard (`apps/admin/app/catalog/tags/page.tsx`).
- Introduce a multi-select Tag component with tag badge styling and quick-creation in the Admin Product create/edit forms.
- Update the Admin Products table with tag badges and a tag filter.

## Capabilities

### New Capabilities
- `tag-catalog`: Manages the lifecycle of product tags including CRUD, slug generation, optional color codes, product usage counts, and public tag listing.

### Modified Capabilities
- `product-catalog`: Extends product creation, updating, detail retrieval, listing, and filtering to support multiple associated tags.

## Impact

- **Database:** Prisma schema updated with `Tag` and `ProductTag` models, followed by Prisma migration.
- **Backend API (`apps/api`):** New `TagsModule` created; `ProductsModule` and DTOs extended with tag mapping and filtering.
- **Admin Frontend (`apps/admin`):** New `TagMultiSelect` component, new `Catalog > Tags` management screen, updated Product forms and Products table.
- **Public API:** Storefront product catalog responses now include tag objects and support `?tags=` filtering.
