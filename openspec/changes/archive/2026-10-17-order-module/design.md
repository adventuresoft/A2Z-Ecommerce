# Design: Order Management & Fulfillment Lifecycle

## Context

See [proposal.md](file:///c:/xampp/htdocs/office/az-ecommerce/openspec/changes/order-module/proposal.md). The platform has operational modules for Authentication, Role-based Access Control, Categories, Brands, Attributes, Products, Variants, and Inventory Management (`apps/api/src/inventory`). `InventoryService` already provides internal transaction-aware helpers (`reserveStock`, `releaseReservedStock`, `fulfillReservedStock`, `restoreStock`) built specifically for consumption by the Order and Checkout pipeline.

## Goals / Non-Goals

**Goals:**
- Schema modeling for `Order`, `OrderItem`, and `OrderStatusHistory` in Prisma with enums `OrderStatus`, `PaymentStatus`, and `ShipmentStatus`.
- Transactional checkout order placement verifying prices and reserving inventory stock.
- Immutable freezing of line item metadata (`title`, `sku`, `attributes`, `unitPrice`) and recipient shipping address.
- Customer order retrieval (`GET /api/v1/orders`, `GET /api/v1/orders/:id`) and customer cancellation (`POST /api/v1/orders/:id/cancel`).
- Admin order management (`GET /api/v1/admin/orders`, `GET /api/v1/admin/orders/:id`, `PATCH /api/v1/admin/orders/:id/status`) with status transition validation, audit notes, and automatic fulfillment stock deduction.
- AdminLTE 4 styled admin screens at `/orders` (data table) and `/orders/[id]` (details, line items, status change modal/timeline).

**Non-Goals:**
- Shopping Cart session persistence (`Cart` and `CartItem` models will connect to checkout in subsequent phase).
- Online payment gateway integration (SSLCommerz/Stripe; payment status is managed directly with Cash on Delivery default).
- Third-party courier API webhooks (Steadfast/Pathao/RedX integration will be implemented in the Shipping module).

## Decisions

### 1. Data Model & Foreign Key Constraints
- **`Order`**: Holds `userId` (FK to `User`), `orderNumber` (unique string, e.g. `AZ-2026-A1B2C3`), three status enums, financial decimals (`subtotal`, `discountAmount`, `shippingFee`, `grandTotal`), and frozen recipient address (`recipientName`, `recipientPhone`, `shippingStreet`, `shippingCity`, `shippingState`, `shippingPostalCode`, `customerNotes`).
- **`OrderItem`**: Holds `orderId` (FK to `Order` cascade), `variantId` (FK to `ProductVariant` set null), snapshot fields (`productTitle`, `sku`, `variantAttributes`, `unitPrice`), `quantity`, and `totalPrice`.
- **`OrderStatusHistory`**: Audit trail of every `OrderStatus` transition, capturing `orderId`, `fromStatus`, `toStatus`, `notes`, `changedByUserId`, and `createdAt`.

### 2. Server-Authoritative Price Calculation & Stock Reservation
- The client checkout request provides only an array of `{ variantId, quantity }` and shipping address fields.
- The server loads every `ProductVariant` inside a PostgreSQL transaction:
  - Fetches the active `salePrice ?? regularPrice`.
  - Computes `itemTotal = unitPrice * quantity`.
  - Accumulates `subtotal`.
  - Calculates `grandTotal = subtotal + shippingFee - discountAmount`.
  - Invokes `InventoryService.reserveStock(variantId, quantity, order.id, tx)` which performs pessimistic row-level locking (`SELECT ... FOR UPDATE`).
- If any variant has insufficient stock or is inactive, the transaction immediately rolls back with `400 Bad Request`.

### 3. Order Number Generation
- Generated as `AZ-${new Date().getFullYear()}-${nanoid(6).toUpperCase()}` or random alphanumeric sequence (e.g. `AZ-2026-K9F2D1`).
- Guarantees uniqueness, brevity, and prevents competitor order volume scraping.

### 4. Status Transitions & Fulfillment Coupling
- Allowed `OrderStatus` transitions:
  - `PENDING` -> `CONFIRMED` or `CANCELLED`
  - `CONFIRMED` -> `PROCESSING` or `CANCELLED`
  - `PROCESSING` -> `SHIPPED`
  - `SHIPPED` -> `DELIVERED` or `RETURNED`
  - `DELIVERED` -> `RETURNED`
  - `CANCELLED` and `RETURNED` are terminal states.
- Stock coupling:
  - When transitioning to `SHIPPED`: System invokes `InventoryService.fulfillReservedStock()`, deducting physical quantity and clearing reserved quantity.
  - When transitioning to `CANCELLED`: System invokes `InventoryService.releaseReservedStock()`, releasing reserved quantity back to available stock.

### 5. Admin Frontend Architecture
- Replaces the `[...slug]` placeholder for `/orders` and `/orders/[id]`.
- Implements `apps/admin/services/orders.ts` utilizing the standard auth token handling.
- `apps/admin/app/orders/page.tsx`: AdminLTE data table with search, status filter pills, pagination, and date range.
- `apps/admin/app/orders/[id]/page.tsx`: Two-column layout with Order Summary, Status Badges, Customer & Shipping Card, Line Items Table, and Status Transition History Timeline with an Update Status Modal.

## Risks / Trade-offs

- **[Risk: Race condition during concurrent checkout on low stock]** -> **Mitigation**: Inventory reservation uses pessimistic `SELECT ... FOR UPDATE` inside `InventoryService.reserveStock()`, ensuring atomic serial validation.
- **[Risk: Client sends fabricated order total]** -> **Mitigation**: Client totals are ignored; all monetary totals are computed server-side from database prices.
- **[Risk: Deleted product breaks historical order line items]** -> **Mitigation**: `OrderItem.variantId` is `onDelete: SetNull`, and all textual attributes (`productTitle`, `sku`, `variantAttributes`, `unitPrice`) are permanently snapshot on the line item.
