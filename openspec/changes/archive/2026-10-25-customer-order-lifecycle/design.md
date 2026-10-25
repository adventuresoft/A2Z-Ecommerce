# Design: Customer Order Lifecycle, Dashboard Overview & Order Cancellation

## Context

See `proposal.md` for business motivation and requirements context.

Following Phase 5, the transactional order placement creates fully hydrated `Order`, `OrderItem`, `Payment`, and `OrderStatusHistory` records with inventory reservation. In the backend, `OrdersController` and `OrdersService` already contain foundational customer methods (`getCustomerOrders`, `getCustomerOrderById`, `cancelCustomerOrder`), but `AccountController` lacks the consolidated overview endpoint (`GET /api/v1/account/overview`), and the frontend currently has no `/account/orders` page, no `/account/orders/[id]` detail page, and a static `/account` dashboard.

This design document establishes the technical architecture, API contracts, security invariants, and distinctive frontend visual design for Phase 6.

## Goals / Non-Goals

**Goals:**
- Provide `GET /api/v1/account/overview` aggregating order metrics (`total`, `pending`, `processing`, `delivered`), up to 5 recent orders, and default delivery address.
- Provide full storefront Order History view (`/account/orders`) with status tab filtering, pagination, and quick order tracking.
- Provide comprehensive Order Details view (`/account/orders/[id]`) with interactive timeline, frozen line-item pricing, courier tracking links, and financial summaries.
- Enable self-service cancellation exclusively for orders in `PENDING` status, atomically releasing reserved stock via `StockMovement` type `CANCEL_RESTORE` and updating UI seamlessly.
- Implement distinctive, accessible UI adhering to the `frontend-design` principles: clear visual hierarchy, purposeful typography, restrained colors, and informative layout.

**Non-Goals:**
- Payment gateway webhooks or external refund processing (Phase 5 Mobile Banking manual review is preserved; refunds remain admin-driven).
- Return or exchange requests for delivered orders (out of Phase 6 scope).
- Guest order tracking by email (Phase 6 strictly scopes authenticated customer access).

## Decisions

### 1. Account Overview Aggregation Endpoint (`GET /api/v1/account/overview`)
- **Choice**: Add `getAccountOverview(userId)` to `AccountService` and expose `GET /api/v1/account/overview` in `AccountController`.
- **Details**: Runs concurrent queries via `prisma.$transaction` or `Promise.all`:
  1. Count total orders (`userId`)
  2. Group counts by `orderStatus` (counts for `PENDING`, `CONFIRMED`, `PROCESSING`, `SHIPPED`, `DELIVERED`, `CANCELLED`)
  3. Query latest 5 orders with items, shipment, and payment relations
  4. Query default shipping address from `UserAddress`
- **Alternative Considered**: Having the frontend make 3 separate HTTP requests (`/orders`, `/orders?status=PENDING`, `/addresses`). Rejected because it creates client-side waterfall requests and unnecessary network latency on initial dashboard load.

### 2. Frontend Design Token System & Aesthetic Direction
- Following `frontend-design` instructions:
  - **Palette**:
    - Slate Ink: `#0f172a` (Primary typography, order numbers, bold emphasis)
    - Clean Canvas: `#ffffff` and `#f8fafc` (Backgrounds and distinct surface elevation)
    - Action Royal: `#2563eb` (Brand accent for primary interactions and active tabs)
    - Emerald Success: `#059669` (For `DELIVERED` status and positive completion states)
    - Amber Attention: `#d97706` (For `PENDING` orders awaiting confirmation)
    - Indigo In-Flight: `#4f46e5` (For `PROCESSING` and `SHIPPED` orders)
    - Rose Destructive: `#e11d48` (For `CANCELLED` status and Cancel Order confirmation modal)
    - Subdued Slate: `#64748b` (Meta information, timestamps, secondary labels)
  - **Typography & Details**:
    - Heading scale: clear sentence case with intentional weights (`font-semibold`, `font-bold`).
    - Monospace badges: `AZ-2026-XXXX` order numbers rendered with `font-mono tracking-wider font-semibold text-slate-800` for effortless legibility.
    - Status Pills: Subtle background tints with high-contrast text (`bg-amber-50 text-amber-700 border-amber-200/60`, `bg-emerald-50 text-emerald-700 border-emerald-200/60`, etc.).
  - **Visual Hierarchy & Layout**:
    - **Dashboard Overview**: Welcome banner with live customer name, 4-card metric strip (`Total Orders`, `Pending Orders`, `Processing Orders`, `Delivered Orders`), 2-column layout pairing a Recent Orders summary table with quick Delivery Destination info.
    - **Order History**: Filter tabs (`All`, `Pending`, `Processing`, `Delivered`, `Cancelled`), clean cards with item thumbnail strips, date, financial totals, and direct "View Order Details" CTA.
    - **Order Details**: Full fulfillment timeline stepper (`Order Placed` -> `Confirmed` -> `Processing` -> `Shipped` -> `Delivered`), itemized frozen invoice table with product thumbnails, attributes, and tax amounts, alongside a sidebar containing courier tracking details and financial breakdown.

```
+-----------------------------------------------------------------------------------+
|  Order AZ-2026-X8K2M9               [Status: PENDING]             [Cancel Order]  |
|  Placed on Oct 25, 2026 at 4:30 PM  |  Payment: Cash on Delivery (PENDING)        |
+-----------------------------------------------------------------------------------+
|  [✓] Placed  --->  [✓] Confirmed  --->  [ ] Processing  --->  [ ] Shipped  --->  [ ] Delivered
+------------------------------------------------------+----------------------------+
|  Items in Order                                      |  Financial Summary         |
|  +------------------------------------------------+  |  Subtotal:         ৳24,500 |
|  | [Img] Apple MacBook Air M2 - 16GB / Space Gray |  |  Shipping Fee:         ৳60 |
|  |       SKU: MBA-M2-16-SG | Qty: 1 | Tax: ৳1,200 |  |  Coupon (TECH10):  -৳2,000 |
|  |       ৳24,500                                  |  |  VAT Included:      ৳1,200 |
|  +------------------------------------------------+  |  ------------------------- |
|                                                      |  Grand Total:      ৳22,560 |
|  Courier & Delivery Destination                      |                            |
|  Recipient: John Doe (01711000000)                   |  Payment Status            |
|  Address: House 12, Road 5, Dhanmondi, Dhaka         |  Method: Mobile Banking    |
|  Courier: Steadfast Courier (Trx: SF-99120) [Track]  |  TrxID: 9X88127391         |
+------------------------------------------------------+----------------------------+
```

### 3. Customer Order Cancellation Flow & State Machine Invariant
- **Rule**: Customer can cancel an order IF AND ONLY IF `orderStatus === 'PENDING'`.
- If order is already `CONFIRMED`, `PROCESSING`, `SHIPPED`, or `DELIVERED`, cancellation is strictly prohibited (`400 Bad Request`).
- When cancellation executes:
  1. Transaction begins.
  2. Reserved stock is restored via `InventoryService.releaseReservedStock` (`StockMovement` type `CANCEL_RESTORE`).
  3. `Order.orderStatus` is updated to `CANCELLED`.
  4. New entry added to `OrderStatusHistory` with `notes: reason || 'Cancelled by customer'`.
  5. Transaction commits and mapped order response is returned.

## Risks / Trade-offs

| Risk | Mitigation |
|---|---|
| Customer attempts to cancel an order after shop manager confirms it in admin | Server checks status inside database transaction; if status is no longer `PENDING`, throws `400 Bad Request` with clear explanation. UI handles error gracefully and refreshes order status. |
| Customer navigates to `/account/orders/[id]` for an order belonging to another customer | `OrdersService.getCustomerOrderById` enforces `where: { id, userId }`. If not owned by requesting customer, throws `404 Not Found`, preventing unauthorized visibility. |
| Large volume of orders causes sluggish overview load | Overview query limits recent orders to 5 with targeted `select` fields, using database indexed fields (`userId`, `createdAt`). |
