# Tasks: Product Attributes Module

## 1. Database Schema & Migration

- [x] 1.1 Add `AttributeType` enum, `Attribute`, and `AttributeValue` models to `apps/api/prisma/schema.prisma` and verify with `pnpm --filter api exec prisma validate`
- [x] 1.2 Generate and apply PostgreSQL migration `add_attribute_and_attribute_value` using `pnpm --filter api exec prisma migrate dev --name add_attribute_and_attribute_value` and verify table creation in DB
- [x] 1.3 Add idempotent seed data for demo attributes (e.g., Color with hex codes, Size, Material) to `apps/api/prisma/seed.ts` and verify execution with `pnpm --filter api seed`

## 2. Backend API Module & Tests

- [x] 2.1 Create DTOs (`create-attribute`, `update-attribute`, `attribute-query`, `attribute-response`, `attribute-value`) with `class-validator` rules and verify validation behavior with unit tests in `apps/api/src/attributes/dto/dto.spec.ts`
- [x] 2.2 Implement `AttributesService` in `apps/api/src/attributes/attributes.service.ts` with slug auto-generation, transaction-based atomic inline value creation, and deletion safeguard seams; verify with `apps/api/src/attributes/attributes.service.spec.ts`
- [x] 2.3 Implement `AttributesAdminController` (`/api/v1/admin/attributes`) with `JwtAuthGuard` + `RolesGuard` (`ADMIN`, `SUPER_ADMIN`), Swagger documentation, and nested value endpoints; verify with `apps/api/src/attributes/attributes.admin.controller.spec.ts`
- [x] 2.4 Implement `AttributesPublicController` (`/api/v1/attributes`) for public active attribute listing and slug lookup; verify with controller tests
- [x] 2.5 Register `AttributesModule` in `apps/api/src/app.module.ts` and verify all backend unit tests pass with `pnpm --filter api test`

## 3. Admin Dashboard UI & Navigation

- [x] 3.1 Create typed API client in `apps/admin/services/attributes.ts` covering administrative CRUD and value management endpoints
- [x] 3.2 Build AdminLTE UI components in `apps/admin/app/catalog/attributes/components/`: `AttributesTable.tsx` (swatches, badges, sorting, pagination), `AttributeFormModal.tsx` (dynamic value rows with HTML5 color picker), and `AttributeDeleteModal.tsx`
- [x] 3.3 Create the main page in `apps/admin/app/catalog/attributes/page.tsx` integrating table, search, filters, modals, and toast notifications
- [x] 3.4 Update `apps/admin/config/navigation.ts` to mark Attributes as `Live` with a green badge
- [x] 3.5 Update `docs/data-model.md` to reflect the catalog-level `Attribute` and `AttributeValue` dictionary specification

## 4. Verification & Quality Assurance

- [x] 4.1 Run full typecheck and lint across workspaces (`pnpm turbo check-types`, `pnpm --filter api test`, and `pnpm --filter admin build`) and verify all checks pass without errors
