# Design: Inventory & Stock Management

## Context

The platform has completed Phase 1 (foundation), Phase 2 (auth, RBAC & admin layout), and Phase 3 (catalog engine, variants, attributes). Currently, `ProductVariant` records exist without any warehouse balance tracking or reservation mechanism. See `proposal.md` for motivation and `specs/inventory-management/spec.md` for behavioral requirements.

Constraints:
- Single-vendor e-commerce architecture utilizing PostgreSQL 18 and Prisma 7 (`@prisma/adapter-pg`).
- Strict requirement that sellable stock calculation $\text{availableQuantity} = \text{quantity} - \text{reservedQuantity} \ge 0$ is preserved under concurrent load.
- Admin frontend built on Next.js 16 (App Router), React 19, and AdminLTE 4 / Bootstrap 5 styling with client-side state management for interactivity.

## Goals / Non-Goals

**Goals:**
- Provide a robust relational schema for warehouse inventory balances (`Inventory`) and an immutable audit ledger (`StockMovement`).
- Prevent overselling through row-level locking (`SELECT ... FOR UPDATE`) during adjustments and reservations.
- Expose administrative REST endpoints for stock balance inspection, manual cycle counts, restocks, damaged write-offs, threshold tuning, and movement auditing.
- Provide internal service hooks (`reserveStock`, `releaseReservedStock`, `fulfillReservedStock`, `restoreStock`) ready for direct invocation by the subsequent Orders module.
- Activate the four navigation views in the admin dashboard: `/inventory`, `/inventory/adjustments`, `/inventory/movements`, and `/inventory/low-stock`.

**Non-Goals:**
- Multi-warehouse or multi-location stock routing (the PRD explicitly scopes v1 to a single physical fulfillment center).
- Automated supplier purchase order (PO) generation or EDI integrations.
- Customer-facing storefront inventory badges (handled in storefront phase).

## Decisions

### Decision 1: Separate `Inventory` Table vs. Embedding in `ProductVariant`
- **Chosen:** Dedicated `Inventory` entity with 1:1 unique relation to `ProductVariant`.
- **Rationale:** Separates marketing/catalog concerns (titles, prices, images, attributes) from fast-mutating warehouse operational concerns (stock, reservations, thresholds). Row-level locking during checkout or restocking does not lock catalog browsing queries.
- **Alternatives Considered:**
  - *Add `stockQuantity` directly to `ProductVariant`:* Rejected because high-frequency locking on variants causes contention with catalog updates, and fails to separate reserved vs on-hand balances cleanly.

### Decision 2: Pessimistic Row Locking (`FOR UPDATE`) for Stock Operations
- **Chosen:** Execute stock modifications inside Prisma `$transaction` using raw SQL `SELECT ... FOR UPDATE` on the affected `Inventory` row.
- **Rationale:** Guarantees zero race conditions or overselling during concurrent checkout requests or simultaneous warehouse adjustments.
- **Alternatives Considered:**
  - *Optimistic locking with version column:* Rejected because high contention on flash sales would cause excessive checkout retries and poor customer experience.

### Decision 3: Append-Only Immutable `StockMovement` Ledger
- **Chosen:** Every balance modification writes a `StockMovement` record with signed delta, previous and new balances, user attribution, and movement reason enum.
- **Rationale:** Meets PRD auditability requirement. Inconsistencies can be traced back to exact timestamps, users, and transactions. No update or delete endpoints are exposed for movements.

### Decision 4: Phased Admin Dashboard Navigation Activation
- **Chosen:** Implement the four dedicated sub-routes under the existing `/inventory` group defined in `apps/admin/config/navigation.ts`:
  1. `/inventory`: Master stock overview data table with search, category filtering, and status badges (In Stock, Low Stock, Out of Stock).
  2. `/inventory/adjustments`: Dedicated restock and write-off form.
  3. `/inventory/movements`: Historical audit ledger table with date range and movement type filters.
  4. `/inventory/low-stock`: Critical alerts view focusing on SKUs at or below threshold.
- **Rationale:** Aligns with AdminLTE design specifications and replaces the placeholder catch-all shell cleanly.

## Risks / Trade-offs

- **[Variant creation without inventory]** → *Mitigation:* Hook into `ProductsService.createVariant` and seed scripts to ensure every variant automatically receives an initialized `Inventory` record (`quantity: 0`, `reservedQuantity: 0`, `lowStockThreshold: 5`).
- **[Deadlocks on multi-item orders]** → *Mitigation:* When batch reservations are executed in future checkout workflows, variant IDs must be sorted alphanumerically before acquiring locks.
- **[Rapid growth of `StockMovement` table]** → *Mitigation:* Compound database indexes on `(variantId, createdAt)` and `(type, createdAt)` ensure fast paginated queries.

## Migration Plan

1. Update `apps/api/prisma/schema.prisma` with `StockMovementType` enum, `Inventory`, and `StockMovement` models.
2. Run Prisma migration: `pnpm --filter api exec prisma migrate dev --name add_inventory_and_stock_movements`.
3. Execute data backfill query to create initial `Inventory` records for all existing product variants.
4. Verify database state with `pnpm --filter api exec prisma validate`.
