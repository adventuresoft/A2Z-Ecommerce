# Proposal: Order Management & Fulfillment Lifecycle

## Why

With products, variants, and stock balances operational in the backend catalog and inventory subsystems, the platform currently lacks the ability for customers to place orders, snapshot purchased line items with frozen pricing, or manage the order fulfillment lifecycle. Without an order domain, physical stock cannot be reserved for active customer checkouts, admins cannot view or transition order fulfillment statuses, and customers have no audit trail of their historical purchases. Implementing the order module establishes the transactional order placement engine, three-axis status tracking (`OrderStatus`, `PaymentStatus`, `ShipmentStatus`), immutable line item snapshots, customer order cancellation, and administrative fulfillment controls specified in PRD §5.5 and data-model.md §4.5.

## What Changes

- **Relational Order Schema**: Implement `Order`, `OrderItem`, and `OrderStatusHistory` models in Prisma schema with enums `OrderStatus`, `PaymentStatus`, and `ShipmentStatus`, complete with foreign keys, indexes, and frozen recipient address snapshots (`recipientName`, `recipientPhone`, `shippingStreet`, `shippingCity`, `shippingState`, `shippingPostalCode`).
- **Financial & Item Immutability**: Freeze `OrderItem.unitPrice`, `OrderItem.productTitle`, `OrderItem.sku`, and `OrderItem.variantAttributes` at checkout time, preventing retroactive alterations from downstream product catalog edits.
- **Transactional Order Creation & Stock Reservation**: Customer checkout endpoint (`POST /api/v1/orders`) that verifies variant availability and regular/sale prices from the database (never trusting client-submitted prices or grand totals), executes within a database transaction, calculates subtotal and grand total, generates a human-readable order number (`AZ-YYYY-XXXX`), and commits stock reservations via `InventoryService.reserveStock()`.
- **Three-Axis Lifecycle & Status Transitions**: Model `OrderStatus` (`PENDING`, `CONFIRMED`, `PROCESSING`, `SHIPPED`, `DELIVERED`, `CANCELLED`, `RETURNED`), `PaymentStatus` (`PENDING`, `PAID`, `FAILED`, `REFUNDED`), and `ShipmentStatus` independently. Provide administrative status transition endpoint (`PATCH /api/v1/admin/orders/:id/status`) enforcing valid state transitions, automatic stock fulfillment deduction (`fulfillReservedStock` on transition to `SHIPPED`), and recording audit history in `OrderStatusHistory`.
- **Order Cancellation & Stock Restoration**: Support customer order cancellation (`POST /api/v1/orders/:id/cancel`) for eligible orders in `PENDING` status, automatically releasing reserved stock via `InventoryService.releaseReservedStock()` and recording reason notes in status history.
- **Administrative Order Management Endpoints**:
  - `GET /api/v1/admin/orders`: Paginated order list with search (order number, customer name, recipient phone), status filtering (`orderStatus`, `paymentStatus`, `shipmentStatus`), date range filter, and sorting.
  - `GET /api/v1/admin/orders/:id`: Full order details including customer info, frozen recipient address, immutable line items, status history log, payment summary, and shipment status.
  - `PATCH /api/v1/admin/orders/:id/status`: Transition order status with admin notes.
- **Customer Order Endpoints**:
  - `POST /api/v1/orders`: Create order with address snapshot and items.
  - `GET /api/v1/orders`: List authenticated customer's past orders with pagination.
  - `GET /api/v1/orders/:id`: View customer order details.
  - `POST /api/v1/orders/:id/cancel`: Cancel order if eligible.
- **Admin Dashboard Order Screens**: Activate live AdminLTE 4 views at `apps/admin/app/orders/page.tsx` (all orders data table with search, status filters, and metrics) and `apps/admin/app/orders/[id]/page.tsx` (order details view with three-axis status badges, customer snapshot, line items breakdown, status transition modal/timeline), replacing the `[...slug]` placeholder.

## Capabilities

### New Capabilities

- `order-management`: Core order lifecycle, transactional checkout creation, immutable line item snapshots, three-axis order/payment/shipment statuses, order status history auditing, customer cancellation, and administrative fulfillment controls.

### Modified Capabilities

- `inventory-management`: Integrate transactional stock reservation, release on cancellation, and stock deduction on fulfillment with the order lifecycle.
- `admin-layout`: Activate live AdminLTE 4 order management data tables and details views, updating navigation config and route guards.

## Impact

- **Database**: Adds `OrderStatus`, `PaymentStatus`, and `ShipmentStatus` enums, plus `Order`, `OrderItem`, and `OrderStatusHistory` models to `apps/api/prisma/schema.prisma`.
- **Backend API (`apps/api`)**: Introduces `OrdersModule` with `OrdersService`, `OrdersController` (customer API), `AdminOrdersController` (admin API), DTOs with `class-validator`, unit/controller test specs, and Swagger documentation.
- **Admin Frontend (`apps/admin`)**: Implements `apps/admin/services/orders.ts`, live orders list table (`apps/admin/app/orders/page.tsx`), order details page (`apps/admin/app/orders/[id]/page.tsx`), and updates navigation config badges.
