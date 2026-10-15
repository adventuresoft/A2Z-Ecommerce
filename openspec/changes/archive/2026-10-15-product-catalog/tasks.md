# Tasks

## 1. Database Schema & Migrations

- [x] 1.1 Add `Product`, `ProductImage`, `ProductVariant`, and `ProductVariantAttributeValue` models to `apps/api/prisma/schema.prisma` and verify schema syntax with `pnpm --filter api exec prisma validate`
- [x] 1.2 Apply schema changes to PostgreSQL database via `pnpm --filter api db:push` and generate Prisma client with `pnpm --filter api exec prisma generate`

## 2. Backend API: Products & Media Gallery

- [x] 2.1 Create DTOs for product creation, updating, querying, and response serialization in `apps/api/src/products/dto/` and verify validation rules
- [x] 2.2 Implement `ProductsService` in `apps/api/src/products/products.service.ts` with auto-slug generation, pagination, category/brand validation, and relational eager loading
- [x] 2.3 Implement multi-file gallery upload and deletion handling with `uploads/products` disk storage cleanup and cover image logic in `ProductsService`
- [x] 2.4 Implement `ProductsAdminController` under `/api/v1/admin/products` with JWT auth, role guards (`ADMIN`, `SUPER_ADMIN`), and Swagger decorators
- [x] 2.5 Register `ProductsModule` in `apps/api/src/app.module.ts` and verify API boots cleanly with `pnpm --filter api build`

## 3. Backend API: Variants & Attribute Matrix

- [x] 3.1 Implement variant creation, matrix expansion, and `ProductVariantAttributeValue` persistence with duplicate SKU and pricing checks in `ProductsService`
- [x] 3.2 Implement variant image linkage enforcing that `ProductVariant.imageId` must belong to the parent product, with automatic null reset on image deletion
- [x] 3.3 Implement `VariantsAdminController` under `/api/v1/admin/variants` for cross-product SKU indexing, quick status toggles, and price updates
- [x] 3.4 Create comprehensive automated tests in `apps/api/test/products.e2e-spec.ts` covering product CRUD, slug collisions, gallery uploads, variant matrix generation, and deletion safeguards

## 4. Admin Dashboard: Product Catalog & Media Gallery

- [x] 4.1 Implement product API client methods in `apps/admin/lib/api/` for products, variants, and gallery management with TypeScript interfaces
- [x] 4.2 Build `/catalog/products` data table page with search, category/brand filters, status toggles, thumbnail covers, and pagination
- [x] 4.3 Build `/catalog/products/new` and `[id]/edit` form with general details, category/brand selects, and rich description fields
- [x] 4.4 Build `MediaGallery` dropzone component supporting multi-file uploads, primary cover selector, alt text inputs, and photo deletion
- [x] 4.5 Build `VariantMatrixGenerator` component supporting attribute selection (e.g. Size, Color), matrix combination generation, SKU/pricing inputs, and variant photo assignment (Option B)

## 5. Admin Dashboard: Cross-Product Variant View & Polish

- [x] 5.1 Implement `/catalog/variants` cross-product SKU table with search by SKU/barcode, status badges, price displays, and direct links to parent product forms
- [x] 5.2 Update `apps/admin/config/navigation.ts` to mark `/catalog/products` and `/catalog/variants` with `badge: { text: "Live", variant: "success" }`
- [x] 5.3 Run typecheck, lint, and build across monorepo (`pnpm turbo run check-types lint build`) and verify zero errors
