# Proposal: Coupon Engine, Pre-Checkout Calculation & Transactional Order Placement

## Why

Currently, the storefront cart and checkout calculate shipping fees and discounts entirely client-side using hardcoded mock values, while the backend order creation endpoint hardcodes flat shipping and does not support promotional coupons, selectable shipping methods, or alternative payment methods (such as bKash/Nagad Mobile Financial Services). To ensure 100% financial calculation authority, eliminate inventory race conditions, and complete Phases 4 and 5 of the integration requirements, we must introduce a server-authoritative coupon and pre-checkout calculation engine and wire transactional customer checkout with atomic inventory reservation, idempotency protection, and Cash on Delivery / Mobile Banking order placement.

## What Changes

- **Coupon Engine & Database Schema**:
  - Add `Coupon` and `CouponUsage` models with `DiscountType` (`PERCENTAGE`, `FIXED_AMOUNT`) in Prisma schema.
  - Create `CouponsModule` with coupon validation service (date validity, minimum order spend, per-customer limits, global total usage limits, active toggle).
  - Add migration or db push and seed initial coupons (e.g., `AZDEAL` - ৳500 off, `TECH10` - 10% off).
- **Server-Authoritative Pre-Checkout Calculation (`POST /api/v1/checkout/calculate`)**:
  - Accept `{ items: [{ variantId, quantity }], shippingMethodId?, shippingCity?, couponCode? }`.
  - Fetch active database variant prices and inventory balances, evaluate line item availability, resolve active shipping method fees (e.g. Inside Dhaka ৳60 / Outside Dhaka ৳120 / free over ৳100,000), reverse-extract VAT, apply verified coupon discounts, and calculate exact totals.
- **Cart Page Live Integration**:
  - Update `StoreContext.tsx` to handle variant UUIDs alongside products.
  - Connect `apps/web/app/cart/page.tsx` to `POST /api/v1/checkout/calculate` for live calculated totals.
  - Implement coupon apply/remove feedback and stock quantity guards with clear UI notices.
- **Enhanced Transactional Order Placement (`POST /api/v1/orders`)**:
  - Update `CreateOrderDto` with `shippingMethodId`, optional `couponCode`, `paymentMethod` (`CASH_ON_DELIVERY` or `MOBILE_BANKING`), and `paymentReference`.
  - Enforce request idempotency using `Idempotency-Key` header with 30-second window deduplication.
  - Execute order placement inside PostgreSQL transaction with pessimistic row-level lock (`FOR UPDATE`), atomic `reservedQuantity` increment, `StockMovement` of `PURCHASE_RESERVE`, snapshot address freezing, and `CouponUsage` record creation.
  - Create initial `Payment` record with method and reference (`transactionRef` e.g., bKash TrxID).
- **Checkout Page Live Integration**:
  - Update `apps/web/app/checkout/page.tsx` to enforce mandatory authentication (redirect unauthenticated users to `/login?redirect=/checkout`).
  - Integrate saved address selection from `UserAddress` API or inline new address creation.
  - Provide live Shipping Method selector (Standard Delivery vs Express) with zone-based pricing.
  - Provide Payment Method selector: Cash on Delivery preselected; bKash/Nagad with recipient phone and TrxID input; Card marked "Coming Soon".
  - Prevent double submission with loading state, and redirect/render Order Confirmation screen displaying order number `AZ-2026-XXXX`.

## Capabilities

### New Capabilities
- `coupon-promotions`: Defines promotional coupon creation, validation engine, limits enforcement, discount computation, and redemption usage tracking.
- `checkout-calculation`: Defines server-authoritative pre-checkout validation and calculation endpoint evaluating cart items, stock balances, active shipping zones/methods, taxes, and coupon discounts.

### Modified Capabilities
- `order-management`: Updates order placement to validate shipping methods, enforce checkout idempotency, record coupon usages transactionally, and support mobile financial services payment references.

## Impact

- **Database**: New tables `Coupon` and `CouponUsage`, foreign key relations on `User` and `Order`.
- **Backend API**: New `CouponsModule`, `CheckoutModule` (`POST /api/v1/checkout/calculate`), updated `OrdersService.createOrder` and `CreateOrderDto`.
- **Frontend Web**: Refactored `StoreContext.tsx` (real variant UUIDs), `apps/web/app/cart/page.tsx` wired to calculation API, and `apps/web/app/checkout/page.tsx` wired to live address book, calculation, and order submission.
