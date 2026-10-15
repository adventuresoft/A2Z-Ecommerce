# Proposal: Product Attributes Module

## Why

The catalog needs a centralized attribute dictionary (e.g., Color, Size, Storage, Material) and predefined attribute values so administrators can define and curate product options once. This enables standardized variant generation and multi-attribute storefront filtering without redundant per-product re-entry. Attributes are the direct prerequisite for the upcoming Products and Variants module (`ProductVariantAttributeValue`), and the admin sidebar already links to `/catalog/attributes`, which currently displays a placeholder status shell.

## What Changes

- **Database Model**: Add `Attribute` and `AttributeValue` models to `apps/api/prisma/schema.prisma` with an `AttributeType` enum (`TEXT`, `COLOR`, `BUTTON`) and a new PostgreSQL migration. Fields follow the catalog dictionary architecture with `name`, `slug`, `type`, `description`, `isActive`, `sortOrder` on `Attribute`, and `value`, `label`, `colorCode` (hex code for color swatches), `sortOrder`, `isActive` on `AttributeValue`.
- **Backend Admin REST Endpoints**: Add protected `/api/v1/admin/attributes` CRUD endpoints (`ADMIN`, `SUPER_ADMIN`) with DTO validation, paginated listing, search (`name`, `slug`), type filter, status filter, whitelisted sorting, slug auto-generation with collision suffixes, and slug stability on rename.
- **Attribute Values Management**: Support inline value creation during attribute creation/update, as well as dedicated endpoints beneath `/api/v1/admin/attributes/:id/values` for creating, updating, and deleting individual values with uniqueness validation on `(attributeId, value)`.
- **Deletion Safeguards**: Add conflict guards preventing deletion of an attribute or attribute value when referenced by products or variants (rejecting with HTTP 409 Conflict; stubbed with a seam returning 0 until the Product and Variant models are introduced), matching category and brand deletion policies.
- **Backend Public REST Endpoints**: Add public `GET /api/v1/attributes` (active attributes with active values, ordered by `sortOrder` then `name`) and `GET /api/v1/attributes/:slug` (public details and active values; 404 for missing or inactive).
- **Admin Dashboard UI**: Add `apps/admin/app/catalog/attributes/` with an AdminLTE data table showing name, slug, type badge, visual values preview (color swatch circles for `COLOR` and text badges for `TEXT`/`BUTTON`), values count, active status switch, and row actions, together with search, type and status filters, sortable headers, pagination, an interactive create/edit modal supporting dynamic value addition with HTML5 color picker, and a delete confirmation modal surfacing 409 conflict messages.
- **Navigation & Seed Data**: Update `apps/admin/config/navigation.ts` to mark Attributes as `Live` with a green badge, and add idempotent demo attributes (e.g., Color, Size, Material) with representative values to `apps/api/prisma/seed.ts`.
- **Data Model Documentation**: Synchronize `docs/data-model.md` to reflect the catalog-level `Attribute` and `AttributeValue` dictionary models.

## Capabilities

### New Capabilities
- `attribute-catalog`: Durable behavior for product attribute and attribute value management — data integrity, display types, slug generation and stability, deletion safeguards, role-guarded admin endpoints, public active listing, and admin attribute management UI.

### Modified Capabilities
*(None. Existing capabilities are unchanged; attributes are an additive catalog foundation.)*

## Impact

- **Affected Code & Paths**:
  - `apps/api/prisma/schema.prisma`, `apps/api/prisma/migrations/`, `apps/api/prisma/seed.ts`
  - `apps/api/src/attributes/` (new module, controllers, service, DTOs, tests)
  - `apps/api/src/app.module.ts` (register `AttributesModule`)
  - `apps/admin/app/catalog/attributes/` (new page and components)
  - `apps/admin/services/attributes.ts` (new API client)
  - `apps/admin/config/navigation.ts` (activate Attributes menu item)
  - `docs/data-model.md` (sync schema documentation)
- **Dependencies**: No new npm packages required; reuses `@nestjs/swagger`, `class-validator`, `class-transformer`, `@prisma/client`, and `bootstrap-icons`.
- **Database**: Adds `AttributeType` enum, `Attribute` table, and `AttributeValue` table with composite unique index on `(attributeId, value)`. Additive, non-destructive migration.
- **Security**: Admin endpoints guarded by `JwtAuthGuard` + `RolesGuard`.
- **Out of Scope**: Direct product-variant SKU assignment (`ProductVariantAttributeValue`) and variant matrix generation (arrives with the upcoming Products and Variants module); storefront catalog filter components.
