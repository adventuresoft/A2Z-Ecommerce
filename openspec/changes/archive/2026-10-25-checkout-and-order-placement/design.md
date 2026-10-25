# Design: Coupon Engine, Pre-Checkout Calculation & Transactional Order Placement

## Context

The backend already contains `OrdersModule`, `ShipmentsModule`, `InventoryService`, and `TaxesService`, but lacks database models for coupons and promotional discounts, as well as an authoritative pre-checkout totals calculation endpoint. Client applications currently compute shipping and discounts client-side with mock constants. See `proposal.md` for business motivation and requirements mapping.

## Goals / Non-Goals

**Goals:**
- Provide complete server authority over pricing, VAT, delivery costs, and coupon deductions via `POST /api/v1/checkout/calculate`.
- Prevent inventory overselling during high-concurrency checkouts using PostgreSQL `SELECT ... FOR UPDATE` row locks inside Prisma `$transaction`.
- Implement `CouponsModule` validating start/end dates, minimum spend thresholds, per-customer limits, and global redemption caps.
- Extend `OrdersService.createOrder` to accept `shippingMethodId`, `couponCode`, `paymentMethod` (`CASH_ON_DELIVERY`, `MOBILE_BANKING`), and `paymentReference`, recording `CouponUsage` and `Payment` records transactionally.
- Support idempotency guards using the `Idempotency-Key` header with deduplication.
- Refactor `StoreContext.tsx`, Cart page (`apps/web/app/cart/page.tsx`), and Checkout page (`apps/web/app/checkout/page.tsx`) to consume live backend calculation and order placement APIs.

**Non-Goals:**
- Customer dashboard order history view and order cancellation (covered in Phase 6).
- Credit card payment gateway integration (SSLCommerz/Stripe) — marked as "Coming Soon" in payment selector.
- Wishlist database sync (covered in Phase 7).

## Decisions

### 1. Prisma Schema: `Coupon` & `CouponUsage`
We introduce:
```prisma
enum DiscountType {
  PERCENTAGE
  FIXED_AMOUNT
}

model Coupon {
  id                String        @id @default(uuid())
  code              String        @unique @db.VarChar(50)
  description       String?       @db.VarChar(255)
  discountType      DiscountType  @default(FIXED_AMOUNT)
  discountValue     Decimal       @db.Decimal(10, 2)
  minOrderAmount    Decimal?      @db.Decimal(10, 2)
  maxDiscountAmount Decimal?      @db.Decimal(10, 2)
  totalUsageLimit   Int?
  perCustomerLimit  Int           @default(1)
  startDate         DateTime
  endDate           DateTime
  isActive          Boolean       @default(true)
  createdAt         DateTime      @default(now())
  updatedAt         DateTime      @updatedAt
  usages            CouponUsage[]
}

model CouponUsage {
  id              String   @id @default(uuid())
  couponId        String
  orderId         String   @unique
  userId          String
  discountApplied Decimal  @db.Decimal(10, 2)
  usedAt          DateTime @default(now())
  coupon          Coupon   @relation(fields: [couponId], references: [id], onDelete: Restrict)
  order           Order    @relation(fields: [orderId], references: [id], onDelete: Cascade)
  user            User     @relation(fields: [userId], references: [id], onDelete: Restrict)
}
```
*Rationale*: A dedicated `CouponUsage` join table enables tracking exact historic discounts applied per order and guarantees customer limit enforcement via relational count queries.

### 2. Pre-Checkout Calculation Endpoint Architecture
- Exposed as `POST /api/v1/checkout/calculate` in a new `CheckoutModule`.
- Accessible by both guest and authenticated users.
- Fetches active variant regular and sale prices from `ProductVariant`, calculates subtotal, checks warehouse inventory availability (`quantity - reservedQuantity`), resolves effective tax class from `TaxesService`, and checks coupon eligibility if `couponCode` is provided.
- Resolves delivery fee: checks `ShippingMethod` by ID or evaluates shipping city (Inside Dhaka: ৳60, Outside Dhaka: ৳120; free if subtotal >= ৳100,000).

### 3. Concurrency & Inventory Reservation
- When placing an order, `OrdersService.createOrder` runs in a Prisma `$transaction`.
- Uses `InventoryService.reserveStock` which locks the inventory row and increments `reservedQuantity`, preventing overselling.
- If inventory is insufficient, the transaction immediately rolls back and throws `BadRequestException('INSUFFICIENT_STOCK')`.

### 4. Idempotency Handling
- Client generates a UUID v4 `Idempotency-Key` per checkout session and sends it in request headers.
- Backend tracks recent idempotency keys in an in-memory TTL map (30-second window) and locks during processing. If a duplicate request arrives, HTTP 409 Conflict is returned.
- On `Payment`, `idempotencyKey` is saved.

### 5. Frontend Storefront Cart and Checkout State
- `StoreContext.tsx`: Update `CartItem` to include `variantId: string`. Ensure `addToCart` accepts `variantId`.
- `apps/web/app/cart/page.tsx`: Triggers debounced call to `POST /api/v1/checkout/calculate` whenever items, shipping zone, or coupon changes. Displays server error toasts and validation badges if any item exceeds inventory.
- `apps/web/app/checkout/page.tsx`:
  - Protects route: if customer is not logged in, redirect to `/login?redirect=/checkout`.
  - Loads saved addresses from `GET /api/v1/account/addresses`, preselecting default shipping address.
  - Allows selecting Cash on Delivery or Mobile Banking (bKash/Nagad).
  - Submits order to `POST /api/v1/orders` with `Idempotency-Key` header, disables submit button, clears cart upon success, and displays animated Order Confirmation view.

## Risks / Trade-offs

- [Risk: Concurrency on high-demand flash deal items] → Handled via database transaction and row-level locking on inventory before confirming order.
- [Risk: Expired access token during checkout] → Axios/Fetch client interceptor automatically refreshes token via `POST /api/v1/auth/refresh` transparently.
- [Risk: MFS fraudulent TrxID submission] → Order is placed in `PaymentStatus: PENDING` with notes containing sender phone and transaction ID; staff verifies payment in admin dashboard before fulfilling order.
