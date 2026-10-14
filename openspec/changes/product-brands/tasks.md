# Tasks

## 1. Database Model & Seed

- [ ] 1.1 Add the `Brand` model (fields and `@@index([isActive, sortOrder])` per design D6) to `apps/api/prisma/schema.prisma` and verify `npx prisma validate` passes
- [ ] 1.2 Run `npx prisma migrate dev --name add_brand` in `apps/api` and verify a new migration folder creates only the `Brand` table and the Prisma client regenerates
- [ ] 1.3 Add idempotent demo brands (for example Apple, Samsung, Sony, Nike, Adidas, Levi's, plus one inactive brand) to `apps/api/prisma/seed.ts` using `upsert` on `slug`, and verify that running `npx prisma db seed` twice leaves the same brand count
- [ ] 1.4 Update the `Product.brandId` row in `docs/data-model.md` from `Set Null` to `Restrict` (design D3) and verify the doc no longer contradicts the `brand-catalog` deletion requirement

## 2. Shared Image Upload Helper (refactor)

- [ ] 2.1 Create `apps/api/src/common/uploads/image-upload.ts` with `createImageUploadOptions(subdir, prefix)` and `ensureUploadDirs(subdirs)` (design D2) and verify unit tests in `image-upload.spec.ts` cover MIME accept/reject, filename format `<prefix>_<uuid><ext>`, and the 5 MB limit
- [ ] 2.2 Refactor `CategoriesAdminController.uploadImage` to use `createImageUploadOptions('categories', 'cat')` and verify that the existing `categories.*.spec.ts` tests pass and the response shape is unchanged
- [ ] 2.3 Replace the hard-coded category upload dir creation in `apps/api/src/main.ts` with `ensureUploadDirs(['categories', 'brands'])` and verify both directories exist after API start-up

## 3. Brands API Module

- [ ] 3.1 Create DTOs in `apps/api/src/brands/dto/` (`CreateBrandDto`, `UpdateBrandDto` via `PartialType`, `BrandQueryDto` with the `isActive` `@Transform` fix and `sortBy` whitelist, `BrandResponseDto`, `PublicBrandDto`, `PaginatedBrandResponseDto`, `index.ts`) and verify DTO validation tests cover invalid website, over-length name, bad slug format, `isActive=false` parsing, and rejected `sortBy`
- [ ] 3.2 Implement `BrandsService` (slugify, unique slug generation, create, `findAllAdmin`, `findOneAdmin`, update with slug stability, remove with the `countBrandProducts` `TODO(products)` seam, mapping of Prisma `P2002` to 409, `findAllPublic`, `findBySlug`) and verify `brands.service.spec.ts` covers every scenario in the `brand-catalog` spec's slug, deletion (including mocked count > 0 returning 409), listing, and public requirements
- [ ] 3.3 Implement `BrandsAdminController` (`admin/brands`, guards + `@Roles(ADMIN, SUPER_ADMIN)`, `POST upload-logo` via the shared helper, CRUD with Swagger decorators) and verify `brands.controller.spec.ts` asserts the guard/role metadata and delegation to the service
- [ ] 3.4 Implement `BrandsPublicController` (`GET brands`, `GET brands/:slug`) and verify controller tests cover the list and the 404 path
- [ ] 3.5 Create `BrandsModule`, register it in `apps/api/src/app.module.ts`, and verify `npm run build` and `npm run lint` pass in `apps/api` and the brand endpoints appear at `/api/docs`

## 4. Admin UI

- [ ] 4.1 Create `apps/admin/services/brands.ts` (types, list, get, create, update, delete, toggle status, `uploadLogo`) mirroring `services/categories.ts`, and verify it type-checks with `npx tsc --noEmit` in `apps/admin`
- [ ] 4.2 Build `BrandsTable.tsx` (logo thumbnail, name, slug, website link, status switch with revert-on-failure, actions, sortable headers, pagination) and verify it renders seeded brands at `/catalog/brands`
- [ ] 4.3 Build `BrandFormModal.tsx` (name, optional slug, description, website, sortOrder, isActive, logo upload or URL with live preview, server validation errors shown inline) and verify a brand can be created and edited from the UI with the logo preview shown
- [ ] 4.4 Build `BrandDeleteModal.tsx` that shows server 409/404 messages and verify that deleting an unreferenced brand removes it from the table
- [ ] 4.5 Assemble `apps/admin/app/catalog/brands/page.tsx` (AdminLTE card, search with debounce, status filter, "Add Brand" button) and verify the sidebar "Brands" link opens it and `npm run lint` and `npm run build` pass in `apps/admin`

## 5. Integration Verification

- [ ] 5.1 With the API running, exercise the admin and public brand endpoints end to end (create without slug, collision suffix, rename keeps slug, `isActive=false` filter, logo upload valid/invalid/oversized, public list excludes inactive, inactive slug returns 404, `CUSTOMER` token returns 403), and verify each matches the `brand-catalog` spec
- [ ] 5.2 Re-test category image upload from the admin UI after the refactor and verify the uploaded image is still served from `/uploads/categories/`
- [ ] 5.3 Run `openspec validate product-brands` and the full API test suite (`npm test` in `apps/api`) and verify both pass

## Workflow follow-up

- Archive the change with `/openspec-archive-change` once it has been reviewed.
- Follow-up change: fix `CategoryQueryDto.isActive` parsing (`?isActive=false` currently resolves to `true`).
- Products change: replace `countBrandProducts` with a real count and set `Product.brandId` `onDelete: Restrict`.
