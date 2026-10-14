# Design: Product Brands Module

## Context

See `proposal.md` for motivation. Relevant current state:

- `apps/api/src/categories/` is the reference vertical slice: split `CategoriesAdminController` (`admin/categories`, `JwtAuthGuard` + `RolesGuard`, `@Roles(ADMIN, SUPER_ADMIN)`) and `CategoriesPublicController`, a `CategoriesService` with private `slugify` / `generateUniqueSlug` helpers, `class-validator` DTOs, and Jest unit tests for service and controller.
- Image upload is inlined in `CategoriesAdminController.uploadImage` (Multer `diskStorage` into `uploads/categories`, MIME regex, 5 MB limit). `main.ts` creates only `uploads/categories` and serves `/uploads` statically.
- No `Product` model exists yet. Categories already hard-code `counts.products: 0` and cannot enforce their product deletion guard.
- `CategoryQueryDto.isActive` uses `@Type(() => Boolean)`, which converts the string `"false"` to `true`.
- The admin app uses Next.js App Router with an AdminLTE/Bootstrap UI; `apps/admin/app/catalog/categories/` (page + `CategoriesTable`, `CategoryFormModal`, `CategoryDeleteModal`) and `apps/admin/services/categories.ts` (fetch client on `NEXT_PUBLIC_API_URL`) are the UI patterns. The sidebar already links to `/catalog/brands`.

## Goals / Non-Goals

**Goals:**
- Mirror the category module's structure so both catalog modules read the same way.
- Remove upload duplication before it spreads to a second module.
- Make the product-reference deletion guard a single, clearly marked seam that the Products module can switch on.

**Non-Goals:**
- Extracting a generic shared slug utility (only two call sites; can be revisited when Products adds a third).
- Fixing the category `isActive` query-parsing bug (noted under Risks; separate change).
- Deleting orphaned logo files when a brand's logo is replaced or the brand is deleted.

## Decisions

### D1. Module layout mirrors categories
`apps/api/src/brands/` contains `brands.module.ts`, `brands.admin.controller.ts`, `brands.public.controller.ts`, `brands.service.ts`, `dto/` (`create-brand`, `update-brand` via `PartialType`, `brand-query`, `brand-response`, `index.ts`), and `*.spec.ts` files. Imports use the project's `.js` ESM suffix convention.
- *Alternative*: a single controller with per-route guards. Rejected because it diverges from categories and makes it easy to forget a guard on new admin routes.

### D2. Shared image upload helper
Add `apps/api/src/common/uploads/image-upload.ts` exporting:
- `createImageUploadOptions(subdir: string, filePrefix: string): MulterOptions` — `diskStorage` into `uploads/<subdir>`, UUID filenames `<prefix>_<uuid><ext>`, the existing image MIME filter, and the 5 MB limit.
- `ensureUploadDirs(subdirs: string[])` — used by `main.ts` to create `uploads/categories` and `uploads/brands`.

`CategoriesAdminController` switches to `FileInterceptor('file', createImageUploadOptions('categories', 'cat'))` with an unchanged route and response shape; `BrandsAdminController` uses `('brands', 'brand')` on `POST upload-logo` and returns `{ logoUrl, filename, originalName, size }`.
- *Alternative*: a dedicated `UploadsModule`/`POST /admin/uploads` endpoint. Rejected for now: it changes the category API contract and is over-scoped; the helper keeps the door open.

### D3. Deletion guard seam
`BrandsService.remove` calls a private `countBrandProducts(id): Promise<number>` that returns `0` with a `TODO(products)` comment. When the count is above zero, it throws `ConflictException` with the count and a "deactivate instead" hint. The Products change replaces the body with `prisma.product.count({ where: { brandId } })`, and its migration uses `onDelete: Restrict` on `Product.brandId` so the database backs the 409 rule. `docs/data-model.md` is updated from `Set Null` to `Restrict` in this change to remove the contradiction.
- *Alternative*: `Set Null` (the original data-model note). Rejected by user decision. Silently stripping brand from products loses catalog data.

### D4. Validation details
- `website`: `@IsUrl({ protocols: ['http','https'], require_protocol: true })`, max 255.
- `logoUrl`: plain string, max 255. It accepts either `/uploads/brands/...` relative paths or absolute URLs, matching category `imageUrl`.
- `BrandQueryDto.isActive`: `@Transform(({ value }) => value === 'true' || value === true ? true : value === 'false' || value === false ? false : value)` + `@IsBoolean()`, so `?isActive=false` works correctly.
- `sortBy` whitelist `['name','sortOrder','createdAt']`, default `sortOrder`; `sortOrder` (direction) default `asc`. The admin list adds `name asc` as a secondary order for stable pagination.

### D5. Response shape
`BrandResponseDto` = all model fields + `counts: { products: number }` (always `0` until Products). Public endpoints return a slimmer `PublicBrandDto` (`id, name, slug, description, logoUrl, website, sortOrder`) and omit `isActive`/timestamps.

### D6. Prisma model

```prisma
model Brand {
  id          String   @id @default(uuid())
  name        String   @db.VarChar(100)
  slug        String   @unique @db.VarChar(120)
  description String?  @db.Text
  logoUrl     String?  @db.VarChar(255)
  website     String?  @db.VarChar(255)
  isActive    Boolean  @default(true)
  sortOrder   Int      @default(0)
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt

  @@index([isActive, sortOrder])
  @@map("Brand")
}
```

The composite index serves the public listing (`WHERE isActive ORDER BY sortOrder`). The separate `slug` index used on Category is redundant with `@unique` and is omitted.

### D7. Admin UI
`apps/admin/app/catalog/brands/page.tsx` plus `components/BrandsTable.tsx`, `BrandFormModal.tsx`, and `BrandDeleteModal.tsx`, structurally cloned from the category components but without the parent filter or parent dropdown. `apps/admin/services/brands.ts` mirrors `services/categories.ts` (list, get, create, update, delete, toggle status, `uploadLogo`). Logo previews resolve relative `/uploads/...` paths against the API origin, the same way category images do.

## Risks / Trade-offs

- [The 409 guard is inert until Products exists] → It is an explicit `TODO(products)` seam with a unit test asserting the 409 path via a mocked count; the Products change task list must include wiring it up.
- [Refactoring the category upload could regress it] → Keep route, field name, filename prefix, and response identical, and add a unit test for the helper (MIME filter accept/reject, filename format). Manually re-test category image upload.
- [Orphaned logo files accumulate on replace/delete] → Accepted for now; the files are small, and cleanup can come with a future media/uploads module.
- [Category `isActive=false` filter bug persists] → Out of scope; flagged as a follow-up so it can get its own fix and test.
- [Concurrent creates can race the slug uniqueness check] → The DB `@unique` constraint still protects integrity. The service maps Prisma `P2002` to HTTP 409.

## Migration Plan

1. `prisma migrate dev --name add_brand` (additive table only; no data changes).
2. Re-run `prisma db seed` (brand seeding is idempotent via `upsert` on `slug`).
3. Rollback: drop the `Brand` table via a down migration or `prisma migrate reset` in development. No other tables depend on it yet.
