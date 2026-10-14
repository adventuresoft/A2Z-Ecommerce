# Tasks: Product Category Module

## 1. Database Schema & Migration

- [x] 1.1 Add `Category` model to `apps/api/prisma/schema.prisma` with self-referencing hierarchy and verify schema validity with `pnpm --filter api exec prisma validate`
- [x] 1.2 Generate and execute PostgreSQL migration `add_category_model` using `pnpm --filter api exec prisma migrate dev --name add_category_model` and verify table exists
- [x] 1.3 Regenerate Prisma Client using `pnpm --filter api exec prisma generate` and verify `Category` type exports correctly

## 2. Backend DTOs & Service Layer

- [x] 2.1 Create category DTOs (`CreateCategoryDto`, `UpdateCategoryDto`, `CategoryQueryDto`, `CategoryResponseDto`) with class-validator constraints and Swagger annotations
- [x] 2.2 Implement `CategoriesService` with 3-level hierarchy depth enforcement, cycle prevention, auto-slug generation, collision resolution, and deletion dependency safeguards
- [x] 2.3 Author unit tests in `categories.service.spec.ts` and verify tests pass with `pnpm --filter api test categories.service.spec.ts`

## 3. Backend Controllers & API Registration

- [x] 3.1 Implement `CategoriesAdminController` (`/api/v1/admin/categories`) with CRUD, pagination, filtering, search, and parent-options endpoints guarded by `@Roles('ADMIN', 'SUPER_ADMIN')`
- [x] 3.2 Implement `CategoriesPublicController` (`/api/v1/categories`) providing `/categories/tree` and `/:slug` endpoints
- [x] 3.3 Register `CategoriesModule` in `apps/api/src/app.module.ts` and verify OpenAPI docs render category endpoints at `http://localhost:3001/api/docs`
- [x] 3.4 Author controller tests in `categories.controller.spec.ts` and verify passing status

## 4. Admin Dashboard Frontend Interface

- [x] 4.1 Create category API client service in `apps/admin/services/categories.ts` handling typed REST requests, query params, and auth headers
- [x] 4.2 Build `CategoriesTable` component supporting keyword search, status filter, parent category filter, sortable columns, and pagination
- [x] 4.3 Build `CategoryFormModal` for creating and editing categories with field validation, parent category dropdown, and live image URL preview
- [x] 4.4 Build `CategoryDeleteModal` with subcategory dependency warnings and conflict error display
- [x] 4.5 Update `apps/admin/app/catalog/categories/page.tsx` to render the live Category management interface

## 5. Verification & Integration Checks

- [x] 5.1 Run backend test suite with `pnpm --filter api test` and confirm all tests pass
- [x] 5.2 Run type checks and build on admin dashboard with `pnpm --filter admin run build` and resolve any compiler issues
- [x] 5.3 Perform end-to-end smoke check verifying category creation, tree retrieval, and deletion prevention via API and UI

## Workflow follow-up

- Run `/openspec-apply-change` to execute the tracked implementation tasks.
- Archive the completed change after verification with `/openspec-archive-change`.
