# Tasks: Customer Order Lifecycle, Dashboard Overview & Order Cancellation

## 1. Backend Account Overview API & Verification

- [x] 1.1 Implement `GET /api/v1/account/overview` in `AccountController` and `AccountService` returning aggregated order counts (`totalOrders`, `pendingOrders`, `processingOrders`, `deliveredOrders`), up to 5 recent orders, and default delivery address, and verify with unit tests.
- [x] 1.2 Verify customer order endpoints (`GET /api/v1/orders`, `GET /api/v1/orders/:id`, `POST /api/v1/orders/:id/cancel`) in `OrdersController` and `OrdersService` enforcing strict customer ownership and PENDING-only cancellation with inventory restoration, and verify with unit tests.

## 2. Storefront Account Dashboard Overview

- [x] 2.1 Update `apps/web/app/account/layout.tsx` sidebar navigation to point "My Orders" to `/account/orders`.
- [x] 2.2 Wire `apps/web/app/account/page.tsx` to `GET /api/v1/account/overview` displaying live metric stat cards (Total Orders, Pending Orders, In-Cart Items, Saved Wishlist Items).
- [x] 2.3 Render live Recent Orders table/list on `/account` with order number, date, item count, total price in BDT, status pill, and "View Details" link.

## 3. Storefront Order History Page

- [x] 3.1 Create `apps/web/app/account/orders/page.tsx` with filter tabs (`All`, `Pending`, `Processing`, `Delivered`, `Cancelled`) and pagination query sync.
- [x] 3.2 Render order cards displaying formatted Order Number (`AZ-2026-XXXX`), item thumbnails preview strip, grand total in BDT, and semantic status pills.
- [x] 3.3 Render empty state with clear call to action ("Explore Products") when no orders match the selected filter.

## 4. Storefront Order Details View & Cancellation Modal

- [x] 4.1 Create `apps/web/app/account/orders/[id]/page.tsx` fetching `GET /api/v1/orders/:id` with loading skeleton and error boundary.
- [x] 4.2 Render visual fulfillment progress timeline stepper (`Placed` -> `Confirmed` -> `Processing` -> `Dispatched` -> `Delivered`) reflecting live order and shipment status.
- [x] 4.3 Render frozen line-item table with product thumbnail, variant attributes, SKU, quantity, tax amount, and line item total.
- [x] 4.4 Render financial breakdown card, shipping address card, and payment details card.
- [x] 4.5 Implement "Cancel Order" modal button: enabled strictly when `orderStatus === 'PENDING'`, dispatching cancellation request, updating status to `CANCELLED`, and showing confirmation feedback.

## 5. Verification & Monorepo Validation

- [x] 5.1 Run `pnpm --filter api test` and verify all backend unit and integration tests pass cleanly.
- [x] 5.2 Run `turbo check-types` across monorepo to ensure zero TypeScript errors.

## Workflow follow-up

- Archive the change after the project's review requirements are satisfied.
