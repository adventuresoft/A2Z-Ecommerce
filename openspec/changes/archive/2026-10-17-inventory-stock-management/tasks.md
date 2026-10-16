# Tasks: Inventory & Stock Management

## 1. Database & Prisma Schema

- [x] 1.1 Add `StockMovementType` enum, `Inventory` model, and `StockMovement` model to `apps/api/prisma/schema.prisma` with foreign key relations to `ProductVariant` and `User` and necessary indexes. Verify syntax and schema with `pnpm --filter api exec prisma validate`.
- [x] 1.2 Generate and execute Prisma database migration `add_inventory_and_stock_movements` and backfill default `Inventory` records (quantity 0, reservedQuantity 0, lowStockThreshold 5) for all existing product variants. Verify by querying that `Inventory` records exist for all variants in the database.
- [x] 1.3 Update variant creation logic in `apps/api/src/products/products.service.ts` to automatically initialize an associated `Inventory` record whenever a new product variant is created. Verify with unit test or service execution.

## 2. Backend Inventory API & Services

- [x] 2.1 Implement inventory DTOs in `apps/api/src/inventory/dto` (`AdjustStockDto`, `UpdateThresholdDto`, `QueryInventoryDto`, `QueryMovementsDto`) with `class-validator` rules and Swagger annotations. Verify clean TypeScript compilation.
- [x] 2.2 Implement `InventoryService` in `apps/api/src/inventory/inventory.service.ts` featuring transaction-safe stock adjustments using raw SQL `FOR UPDATE` pessimistic locks, immutable ledger recording in `StockMovement`, and internal reservation helper methods (`reserveStock`, `releaseReservedStock`, `fulfillReservedStock`, `restoreStock`). Verify with unit tests testing negative stock guards, reserved stock constraints, and ledger entries.
- [x] 2.3 Implement `InventoryAdminController` in `apps/api/src/inventory/inventory.admin.controller.ts` providing `/api/v1/admin/inventory`, `/api/v1/admin/inventory/:variantId`, `/api/v1/admin/inventory/adjust`, `/api/v1/admin/inventory/:variantId/threshold`, `/api/v1/admin/inventory/movements`, and `/api/v1/admin/inventory/low-stock`, restricted to `ADMIN` and `SUPER_ADMIN` roles. Verify endpoints are documented in Swagger.
- [x] 2.4 Register `InventoryModule` in `apps/api/src/app.module.ts`. Verify API build and test execution with `pnpm --filter api run build`.

## 3. Admin UI — Inventory Views & Interactivity

- [x] 3.1 Create shared API client utilities and TypeScript types for inventory endpoints in `apps/admin/lib/api/inventory.ts`. Verify types match backend contracts.
- [x] 3.2 Build the Master Stock Overview page at `apps/admin/app/inventory/page.tsx` featuring an AdminLTE data table with search, category filtering, on-hand quantity, reserved quantity, available quantity, stock status badges (In Stock, Low Stock, Out of Stock), and quick adjust actions. Verify page renders live inventory data.
- [x] 3.3 Build the Stock Adjustments / Restock view at `apps/admin/app/inventory/adjustments/page.tsx` featuring a form with variant selector, adjustment action (`RESTOCK`, `MANUAL_ADJUSTMENT`, `DAMAGED`), quantity input, reference ID, and notes. Verify form submission updates stock and triggers success feedback.
- [x] 3.4 Build the Historical Audit Ledger view at `apps/admin/app/inventory/movements/page.tsx` displaying paginated movement records with movement type badges, quantity deltas, previous and new balances, reference code, and staff attribution. Verify records display chronologically.
- [x] 3.5 Build the Low Stock Alerts view at `apps/admin/app/inventory/low-stock/page.tsx` displaying only SKUs at or below their low stock threshold with direct restocking links. Verify filter accurately isolates low-stock items.

## 4. End-to-End Verification & Quality Checks

- [x] 4.1 Perform end-to-end verification of the full inventory lifecycle: restock a variant, verify updated balances on overview, confirm movement log in audit ledger, and verify status change in low-stock alerts.
- [x] 4.2 Run monorepo type checking and lint validation with `pnpm run check-types` and `pnpm run lint`. Verify zero errors across all workspaces.

## Workflow follow-up

- Archive the change after the project's review requirements are satisfied.
- Verify the archived result.
