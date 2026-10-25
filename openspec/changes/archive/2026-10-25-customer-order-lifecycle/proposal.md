# Proposal: Customer Order Lifecycle, Dashboard Overview & Self-Service Cancellation

## Why

Following the completion of transactional order placement in Phase 5, customers now create real database orders with reserved inventory. However, customers currently lack an integrated self-service hub to monitor their order lifecycle, inspect itemized invoices and shipping statuses, track courier shipments, or cancel pending orders. Furthermore, the Customer Dashboard overview (`/account`) displays hardcoded zeros and lacks live statistics or recent activity.

This phase implements Phase 6 of the Storefront Integration: delivering full customer visibility over order history, an itemized order detail page with status timeline, self-service order cancellation for `PENDING` orders with automatic stock restoration, and a consolidated account overview API and UI.

## What Changes

- **Backend Account Overview API (`GET /api/v1/account/overview`)**:
  - Exposes customer summary stats: total order count, pending order count, processing order count, completed/delivered order count.
  - Returns up to 5 most recent orders with item count, financial totals, status pills, and creation timestamps.
  - Returns default delivery address summary.
- **Backend Order Cancellation & Security Hardening**:
  - Enforce customer ownership invariants: customers can only view and cancel orders where `userId === currentCustomer.id`.
  - Validate that `POST /api/v1/orders/:id/cancel` strictly succeeds when `orderStatus === 'PENDING'`.
  - Atomically restore reserved inventory (`StockMovement` type `CANCEL_RESTORE`), transition status to `CANCELLED`, and write audit entry in `OrderStatusHistory`.
  - Enforce `400 Bad Request` if attempting to cancel orders in `CONFIRMED`, `PROCESSING`, `SHIPPED`, or `DELIVERED` status.
- **Storefront Dashboard Hub (`apps/web/app/account/page.tsx`)**:
  - Replace static placeholders with live aggregated statistics (Total Orders, Pending Orders, Wishlist Items, Default Address).
  - Render an interactive Recent Orders table/card list with direct navigation to order details.
  - Render a delivery address quick card with shortcut to Address Book.
- **Storefront Order History View (`apps/web/app/account/orders/page.tsx`)**:
  - Filterable tab navigation (`All`, `Pending`, `Processing`, `Delivered`, `Cancelled`).
  - Order cards showing human-friendly Order Number (`AZ-2026-XXXX`), placed date, items preview with thumbnails, total amount in BDT, and semantic status chips.
  - Pagination controls and empty state with shopping CTA when no orders match the selected filter.
- **Storefront Order Details View (`apps/web/app/account/orders/[id]/page.tsx`)**:
  - Responsive layout displaying header with Order Number, placement date, and current status chip.
  - Visual status timeline tracking fulfillment progression (`Placed` -> `Confirmed` -> `Processing` -> `Shipped` -> `Delivered`).
  - Frozen line item breakdown with product thumbnail, variant attributes (color, size), SKU, unit price, quantity, tax, and line total.
  - Financial breakdown card: Subtotal, Shipping Fee, Applied Coupon Discount, VAT/Tax, and Grand Total.
  - Delivery Destination and Shipping Method snapshot card with Courier info and live tracking link when dispatched.
  - Payment details card showing Payment Method (COD, Mobile Banking), transaction reference, and status.
  - Interactive "Cancel Order" modal button: enabled strictly when `orderStatus === 'PENDING'`, prompting for cancellation confirmation and optional reason, with instant UI transition to `CANCELLED`.
- **Navigation & Layout Sync**:
  - Update `apps/web/app/account/layout.tsx` sidebar navigation link from `/account#orders` to `/account/orders`.

## Capabilities

### Modified Capabilities
- `customer-account`: Add Customer Account Overview & Metric Aggregation requirement (`GET /api/v1/account/overview`) providing customer order counts, pending status counters, and recent order history.

## Impact

- **APIs**:
  - `GET /api/v1/account/overview`: New authenticated customer endpoint.
  - `GET /api/v1/orders`: Connected to storefront order history.
  - `GET /api/v1/orders/:id`: Connected to storefront order detail view.
  - `POST /api/v1/orders/:id/cancel`: Connected to storefront order cancellation modal.
- **Frontend Routes**:
  - `apps/web/app/account/page.tsx`: Rewired with live overview API.
  - `apps/web/app/account/orders/page.tsx`: New order history page.
  - `apps/web/app/account/orders/[id]/page.tsx`: New order details view.
  - `apps/web/app/account/layout.tsx`: Updated navigation paths.
- **Dependencies & DB**: No database migrations required (schema models `Order`, `OrderItem`, `OrderStatusHistory`, `Shipment`, `Payment`, `UserAddress`, `Inventory` already support all required attributes).
