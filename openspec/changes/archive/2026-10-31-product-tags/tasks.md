# Tasks

## 1. Database Schema & Migration

- [x] 1.1 Add `Tag` and `ProductTag` models to `apps/api/prisma/schema.prisma` and update the `Product` model with the `tags ProductTag[]` relation
- [x] 1.2 Run Prisma client generation and apply database migration, verifying schema integrity

## 2. Backend Tags Module

- [x] 2.1 Implement Tag DTOs (`create-tag.dto.ts`, `update-tag.dto.ts`, `tag-query.dto.ts`, `tag-response.dto.ts`) in `apps/api/src/tags/dto`
- [x] 2.2 Implement `TagsService` in `apps/api/src/tags/tags.service.ts` with CRUD, automated slug derivation, collision suffixes, and tagged product counts
- [x] 2.3 Implement `TagsAdminController` (`/api/v1/admin/tags`) and `TagsPublicController` (`/api/v1/tags`) with Swagger annotations and role guards
- [x] 2.4 Register `TagsModule` in `apps/api/src/app.module.ts` and verify tag controller and service tests pass

## 3. Products Backend Integration with Tags

- [x] 3.1 Update `CreateProductDto`, `UpdateProductDto`, `ProductQueryDto`, and `PublicProductQueryDto` in `apps/api/src/products/dto` to support `tagIds`, `tags`, and tag filters
- [x] 3.2 Update `ProductsService` to resolve existing tags and create new tags on-the-fly within an atomic Prisma transaction during product creation and update
- [x] 3.3 Update `ProductsService` product queries (`findAll`, `findOne`, and public endpoints) to include tags in responses and filter by `tagId` or `tags`
- [x] 3.4 Add unit/integration tests covering product tag creation, on-the-fly tag resolution, tag filtering, and safe detach deletion

## 4. Admin Dashboard Tag Management & Product Form Multi-Select

- [x] 4.1 Create Tags API client service (`apps/admin/services/tags.ts`)
- [x] 4.2 Build reusable `TagMultiSelect` component supporting badge pill previews, dropdown search, and quick-creation of new tags
- [x] 4.3 Build dedicated **Catalog > Tags** management page (`apps/admin/app/catalog/tags/page.tsx`) with data table, color picker, and create/edit/delete modals
- [x] 4.4 Integrate `TagMultiSelect` into Product Create (`/catalog/products/new`) and Edit (`/catalog/products/[id]/edit`) pages
- [x] 4.5 Add tag badges and tag filtering to Admin Products table (`/catalog/products`) and add Tags to Admin Sidebar navigation

## 5. Verification & Quality Assurance

- [x] 5.1 Run linter, type-check, and automated tests across `apps/api` and `apps/admin` to verify complete system integrity

## Workflow follow-up

- Sync specs and archive the change after implementation and verification are complete.
