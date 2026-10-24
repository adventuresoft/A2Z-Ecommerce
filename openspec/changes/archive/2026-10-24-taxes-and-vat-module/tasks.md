# Tasks

## 1. Database Schema & Prisma Migration

- [x] 1.1 Add `TaxClass` model, relations on `Category` and `Product`, snapshot columns on `OrderItem` (`taxRate`, `taxAmount`, `taxClassName`), and `totalTaxAmount` on `Order` in `apps/api/prisma/schema.prisma`, verifying with `pnpm --filter api exec prisma validate`.
- [x] 1.2 Generate and apply the Prisma database migration and verify table generation and foreign key constraints in PostgreSQL.
- [x] 1.3 Add seed data for baseline tax classes ("Standard Electronics VAT" at 5.00% and "General VAT" at 15.00%) in `apps/api/prisma/seed.ts` and verify records exist in the database.

## 2. Backend API & Calculation Engine

- [x] 2.1 Implement `TaxesModule`, `TaxesService`, `TaxesAdminController`, and DTOs under `apps/api/src/taxes` for `/api/v1/admin/taxes` and verify unit tests in `taxes.service.spec.ts`.
- [x] 2.2 Implement tax inheritance resolution (`Product` override -> `Category` default -> store default) and tax-inclusive reverse-calculation utilities, verifying edge cases and rounding in unit tests.
- [x] 2.3 Integrate tax calculation and snapshot freezing into `OrdersService` during order creation, and verify `OrderItem.taxAmount` and `Order.totalTaxAmount` are persisted correctly.
- [x] 2.4 Verify Swagger OpenAPI documentation at `/api/docs` and confirm `pnpm --filter api check-types` passes.

## 3. Admin Dashboard UI & Navigation

- [x] 3.1 Create `TaxesService` in `apps/admin/services/taxes.ts` for API interaction with full TypeScript interfaces, verifying type safety.
- [x] 3.2 Implement the Tax Classes management screen at `apps/admin/app/system/taxes/page.tsx` using AdminLTE 4 components with data table, rate badges, status toggle, and create/edit modal.
- [x] 3.3 Register the "Taxes & VAT" link under the System group in the admin sidebar navigation and verify navigation routing.
- [x] 3.4 Verify the admin dashboard builds cleanly with `pnpm --filter admin check-types`.

## 4. Documentation & Verification

- [x] 4.1 Update `docs/data-model.md` to document the `TaxClass` entity, category/product foreign keys, and order tax snapshot fields.
- [x] 4.2 Perform an end-to-end checkout and admin management verification test confirming VAT-exempt shipping and accurate tax-inclusive extraction.
