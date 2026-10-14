# Proposal: Product Category Module

## Why

The e-commerce platform requires an organized, searchable product catalog taxonomy so customers can easily browse physical goods and store administrators can structure, update, and manage catalog categories. Implementing the Category module delivers the very first vertical business slice—spanning database migration, NestJS REST API endpoints, and a live AdminLTE management interface—unblocking subsequent catalog milestones such as Brands, Attributes, and Products.

## What Changes

- **Database Model**: Add the `Category` model to Prisma schema (`apps/api/prisma/schema.prisma`) with PostgreSQL migration, including self-referencing hierarchy (`parentId`), unique slug, active status, and display sort order.
- **Backend Admin REST Endpoints**: Add protected `/api/v1/admin/categories` CRUD endpoints with role authorization (`ADMIN`, `SUPER_ADMIN`), DTO payload validation, server-side pagination, search, status filtering, parent filtering, and dependency checks preventing deletion of categories containing subcategories or products.
- **Backend Parent Selection Endpoint**: Add `/api/v1/admin/categories/parent-options` returning eligible Level 1 and Level 2 parent categories while enforcing the 3-level max depth rule and cycle prevention.
- **Backend Public REST Endpoints**: Add public `/api/v1/categories/tree` (hierarchical active tree for navigation) and `/api/v1/categories/:slug` (category details with breadcrumb ancestors).
- **Admin Dashboard UI**: Replace the Phase 1 placeholder in `apps/admin/app/catalog/categories/page.tsx` with a full AdminLTE card interface featuring a data table, search bar, status & parent filters, sortable columns, pagination controls, and a category modal for creation and updates with live image preview.

## Capabilities

### New Capabilities
- `category-catalog`: Defines durable system behavior for product category taxonomy management, hierarchical tree navigation, strict deletion integrity safeguards, slug stability rules, and role-based administrative catalog controls.

### Modified Capabilities
*(None. Existing core capabilities `api-core`, `user-auth`, and `admin-layout` remain intact and unmodified).*

## Impact

- **Affected Code & Paths**:
  - `apps/api/prisma/schema.prisma`
  - `apps/api/prisma/migrations/`
  - `apps/api/src/categories/` (new module, controllers, service, DTOs)
  - `apps/api/src/app.module.ts` (register CategoriesModule)
  - `apps/admin/app/catalog/categories/` (live UI implementation)
  - `apps/admin/services/` or `apps/admin/lib/` (category API client)
- **Dependencies**: Uses existing `@nestjs/swagger`, `class-validator`, `class-transformer`, `argon2`, `@prisma/client`, and `bootstrap-icons`. No new external packages required.
- **Database**: Adds `Category` table in PostgreSQL 18.
- **Security & Authorization**: Admin endpoints guarded by `JwtAuthGuard` and `RolesGuard`.
