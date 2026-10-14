# Proposal: Product Brands Module

## Why

The catalog needs a manufacturer/brand dimension so storefront shoppers can browse and filter by brand and administrators can curate brand identity (logo, website, visibility). Brands are a prerequisite for the upcoming Products module (`Product.brandId`), and the admin sidebar already links to `/catalog/brands`, which currently has no live page.

## What Changes

- **Database Model**: Add a `Brand` model to `apps/api/prisma/schema.prisma` with a new PostgreSQL migration. Fields follow `docs/data-model.md` (`id`, `name`, `slug`, `logoUrl`, `website`, `isActive`, timestamps) plus two additions: `description` (optional text) and `sortOrder` (integer, default `0`) for curated ordering (e.g., featured brand strips).
- **Backend Admin REST Endpoints**: Add protected `/api/v1/admin/brands` CRUD endpoints (`ADMIN`, `SUPER_ADMIN`) with DTO validation, paginated listing, search, status filter, whitelisted sorting, slug auto-generation with collision suffixes, and slug stability on rename.
- **Deletion Safeguard**: `DELETE /api/v1/admin/brands/:id` rejects with HTTP 409 when products reference the brand (enforced once the Product model exists); admins deactivate brands instead. This intentionally overrides the `Set Null` note in `docs/data-model.md`, matching the category deletion policy.
- **Logo Upload**: Add `POST /api/v1/admin/brands/upload-logo`, served from `/uploads/brands/`.
- **Shared Upload Helper (refactor)**: Extract the image upload Multer configuration currently inlined in `CategoriesAdminController` into a reusable helper under `apps/api/src/common/uploads/`, used by both categories and brands. Category upload behavior and response shape remain unchanged.
- **Backend Public REST Endpoints**: Add public `GET /api/v1/brands` (active brands, ordered by `sortOrder` then `name`) and `GET /api/v1/brands/:slug` (404 for missing or inactive).
- **Admin Dashboard UI**: Add `apps/admin/app/catalog/brands/` with an AdminLTE data table (logo, name, slug, website, status toggle, actions), search and status filters, sortable headers, pagination, a create/edit modal with logo upload or URL preview, and a delete confirmation modal surfacing 409 messages.
- **Seed Data**: Add idempotent demo brands to `apps/api/prisma/seed.ts`.

## Capabilities

### New Capabilities
- `brand-catalog`: Durable behavior for brand management — data integrity, slug generation and stability, deletion safeguards, role-guarded admin endpoints, logo upload, public active-brand listing and slug lookup, and the admin brand management UI.

### Modified Capabilities
*(None. `category-catalog` requirements are unchanged; the shared upload helper is an internal refactor that preserves category upload behavior.)*

## Impact

- **Affected Code & Paths**:
  - `apps/api/prisma/schema.prisma`, `apps/api/prisma/migrations/`, `apps/api/prisma/seed.ts`
  - `apps/api/src/brands/` (new module, controllers, service, DTOs, tests)
  - `apps/api/src/common/uploads/` (new shared image upload helper)
  - `apps/api/src/categories/categories.admin.controller.ts` (switch to shared helper)
  - `apps/api/src/main.ts` (ensure `uploads/brands` directory exists)
  - `apps/api/src/app.module.ts` (register `BrandsModule`)
  - `apps/admin/app/catalog/brands/` (new page and components)
  - `apps/admin/services/brands.ts` (new API client)
- **Dependencies**: No new packages; reuses `@nestjs/platform-express`/`multer`, `class-validator`, `@nestjs/swagger`, `@prisma/client`, `bootstrap-icons`.
- **Database**: Adds `Brand` table (additive, non-destructive migration).
- **Security**: Admin endpoints guarded by `JwtAuthGuard` + `RolesGuard`; uploads restricted to image MIME types and 5 MB.
- **Out of Scope**: Product–brand linkage (`Product.brandId`) and product counts arrive with the Products module; brand-scoped category associations; storefront UI.
