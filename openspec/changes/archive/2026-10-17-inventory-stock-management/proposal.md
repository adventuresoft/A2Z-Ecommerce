# Proposal: Inventory & Stock Management

## Why

With master products, categories, brands, and physical SKUs (`ProductVariant`) fully operational in the catalog engine, there is currently no mechanism to record on-hand warehouse stock, track reserved quantities, or maintain an audit trail of stock adjustments. Without an inventory domain, physical products cannot be safely stocked, out-of-stock or low-stock alerts cannot be triggered, and checkout cannot safely reserve stock without risking overselling. Implementing the inventory and stock movements module establishes the physical stock balances, low-stock alerting, and concurrency-safe ledger auditing required by PRD Phase 4 and directly unlocks the order placement lifecycle in subsequent phases.

## What Changes

- **Inventory Balances Model**: Introduce `Inventory` model in Prisma schema with a 1:1 relation to `ProductVariant`, maintaining physical `quantity` (on-hand warehouse balance), `reservedQuantity` (stock committed to active checkouts/orders), and `lowStockThreshold` (default: 5), enforcing the critical invariant $\text{availableQuantity} = \text{quantity} - \text{reservedQuantity} \ge 0$.
- **Immutable Stock Movement Ledger**: Introduce `StockMovement` model with `StockMovementType` enum (`INITIAL`, `RESTOCK`, `PURCHASE_RESERVE`, `ORDER_FULFILL`, `CANCEL_RESTORE`, `RETURN_RESTORE`, `MANUAL_ADJUSTMENT`, `DAMAGED`) capturing historical deltas, before/after balances, reference identifiers (PO#, order ID, audit cycle count), administrative notes, and staff attribution (`performedByUserId`).
- **Automatic Variant Inventory Seeding**: Automatically initialize an `Inventory` record with default 0 on-hand quantity and default threshold 5 when new variants are created or via a database migration script for existing variants.
- **Administrative Inventory API**: Expose `/api/v1/admin/inventory` endpoints supporting:
  - Paginated inventory balance overview with search (SKU, product title), category filter, and low-stock filter.
  - Variant-specific inventory details and stock history.
  - Concurrency-safe stock adjustment endpoint (`POST /api/v1/admin/inventory/adjust`) executing within PostgreSQL transactions with row-level locking (`SELECT ... FOR UPDATE`).
  - Low-stock threshold updates (`PATCH /api/v1/admin/inventory/:variantId/threshold`).
  - Paginated stock movement audit ledger (`GET /api/v1/admin/inventory/movements`).
  - Filtered low-stock alert summary (`GET /api/v1/admin/inventory/low-stock`).
- **Internal Service Methods for Future Orders**: Provide transaction-safe reservation (`reserveStock`), release (`releaseReservedStock`), fulfillment deduction (`fulfillReservedStock`), and replenishment (`restoreStock`) helper methods within `InventoryService` for consumption by future cart/order checkout workflows.
- **Admin Dashboard Screens**: Activate the live AdminLTE-styled `/inventory` overview data table, `/inventory/adjustments` restock/adjustment form, `/inventory/movements` audit log view, and `/inventory/low-stock` alerts view, replacing the Phase 3 placeholder routes.

## Capabilities

### New Capabilities

- `inventory-management`: Physical stock balance tracking per SKU, low-stock threshold configuration and alerting, concurrency-safe inventory adjustments (restock, damaged write-offs, manual corrections), immutable stock movement audit ledger, and transaction-safe stock reservation interfaces.

### Modified Capabilities

*(None. Existing capabilities remain backward-compatible.)*

## Impact

- **Database**: Adds `StockMovementType` enum, `Inventory` model, and `StockMovement` model to `apps/api/prisma/schema.prisma` with foreign keys to `ProductVariant` and `User`.
- **Backend API (`apps/api`)**: Adds `inventory` module including `inventory.service.ts`, `inventory.admin.controller.ts`, DTOs with `class-validator`, and Swagger documentation.
- **Admin Dashboard (`apps/admin`)**: Replaces the `[...slug]` placeholder for `/inventory`, `/inventory/adjustments`, `/inventory/movements`, and `/inventory/low-stock` with live AdminLTE 4 components, data tables, and forms.
- **Dependencies**: No external runtime packages needed; uses existing NestJS, Prisma 7, PostgreSQL, and Bootstrap/AdminLTE 4.
