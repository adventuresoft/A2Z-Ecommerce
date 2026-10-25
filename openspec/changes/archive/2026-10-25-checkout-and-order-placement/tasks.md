# Tasks: Coupon Engine, Pre-Checkout Calculation & Transactional Order Placement

## 1. Database Schema & Models

- [x] 1.1 Add `Coupon` and `CouponUsage` models, `DiscountType` enum, and relations on `User` and `Order` to `apps/api/prisma/schema.prisma`, execute database push/migration, and generate Prisma client.
- [x] 1.2 Seed baseline promotional coupons (e.g., `AZDEAL` - ৳500 off min ৳1000, `TECH10` - 10% off max ৳2000) in database.

## 2. Coupons Module & Pre-Checkout Calculation API

- [x] 2.1 Implement `CouponsModule` with `CouponsService` validating date range, active state, minimum spend, per-customer limits, and global caps.
- [x] 2.2 Implement `CheckoutModule` and `CheckoutCalculationController` (`POST /api/v1/checkout/calculate`) validating items, calculating subtotal, extracting line-item taxes, resolving shipping fees by zone/method, and applying coupon discounts.
- [x] 2.3 Add unit tests covering coupon validation and pre-checkout calculation logic.

## 3. Transactional Order Placement & Idempotency

- [x] 3.1 Update `CreateOrderDto` to accept `shippingMethodId`, optional `couponCode`, `paymentMethod` (`CASH_ON_DELIVERY`, `MOBILE_BANKING`), and optional `paymentReference`.
- [x] 3.2 Update `OrdersService.createOrder` to execute in Prisma transaction: enforce idempotency, fetch variant prices authoritatively, lock inventory rows with `reserveStock`, record `CouponUsage`, snapshot address and line-item taxes, and create initial `Payment` record with method and reference.
- [x] 3.3 Add unit and integration tests for transactional order creation, stock reservation, and idempotency.

## 4. Storefront Cart Integration (`apps/web`)

- [x] 4.1 Refactor `StoreContext.tsx` to handle variant UUIDs in `CartItem` alongside products.
- [x] 4.2 Connect `apps/web/app/cart/page.tsx` to `POST /api/v1/checkout/calculate` for live totals, coupon apply/remove feedback, and stock quantity warnings.

## 5. Storefront Checkout & Order Placement Integration (`apps/web`)

- [x] 5.1 Enforce authentication guard on `/checkout` redirecting unauthenticated guests to `/login?redirect=/checkout`.
- [x] 5.2 Integrate saved address book selection (`UserAddress`) with default address auto-selection or inline add address form.
- [x] 5.3 Wire Shipping Method selector and Payment Method selector (Cash on Delivery preselected; bKash/Nagad with TrxID input; Card marked "Coming Soon").
- [x] 5.4 Submit order to `POST /api/v1/orders` with `Idempotency-Key` header, disable submit button during processing, clear cart on success, and render Order Confirmation screen with generated order number (`AZ-2026-XXXX`).

## 6. Verification & Monorepo Validation

- [x] 6.1 Run test suites in `apps/api` and verify all tests pass.
- [x] 6.2 Run `turbo check-types` across the monorepo to verify zero TypeScript errors.

## Workflow follow-up

- Archive the change after the project's review requirements are satisfied.
