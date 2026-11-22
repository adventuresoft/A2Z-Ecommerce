# mobile-cart-checkout Specification

## Purpose
TBD - created by archiving change mobile-cart-checkout-payments. Update Purpose after archive.

## Requirements

### Requirement: Authoritative Cart & Coupon Experience
The mobile cart screen MUST render active guest or server-synced cart items with quantity controls, sync/stock warning banners, an Available Coupons picker backed by `/coupons/active`, and live totals computed by `POST /checkout/calculate` formatted in `BDT `.

#### Scenario: Customer adjusts cart quantity and applies a coupon
- **WHEN** a customer increments item quantity or selects an active coupon from the Available Coupons sheet
- **THEN** the app recalculates totals via `POST /checkout/calculate` and displays updated `subtotal`, `discountAmount`, `shippingFee`, `totalTaxAmount`, and `grandTotal` in `BDT ` format.

#### Scenario: Guest customer taps Proceed to Checkout
- **WHEN** an unauthenticated customer taps Proceed to Checkout on the Cart tab
- **THEN** the app routes through the Auth modal with `redirect=/checkout` and merges guest cart items to the server upon sign-in before landing on Checkout.

### Requirement: Wishlist Management for Guests and Customers
The mobile wishlist tab MUST display saved items for both guests (`/wishlist/guest-items`) and authenticated customers (`/wishlist`) with 1-tap Move to Cart and Remove actions.

#### Scenario: Customer moves a wishlisted product to cart
- **WHEN** a customer taps Move to Cart on a wishlist item
- **THEN** the product is added to the cart (or opens PDP when variant selection is required) and feedback is shown.

### Requirement: Bangladesh Cascading Address Management
Authenticated customers MUST be able to create, edit, set default shipping, and delete saved addresses using cascading Bangladesh Division, District, Thana, and Post Office selectors that auto-populate postal codes.

#### Scenario: Customer creates a Dhaka delivery address
- **WHEN** the customer selects Division, District, Thana, and Post Office and submits the address form
- **THEN** the postal code is auto-filled, the address is saved via `POST /account/addresses`, and it becomes selectable in Checkout.

### Requirement: Single-Page Idempotent Checkout with COD and PayStation Verification
The checkout screen MUST support saved address selection, dynamic shipping method selection, dynamic payment method selection (`CASH_ON_DELIVERY`, `PAYSTATION`, `MOBILE_BANKING`), idempotent `POST /orders` submission with an `idempotency-key` header, and PayStation hosted payment via `expo-web-browser` followed by mandatory server-side verification.

#### Scenario: Customer completes PayStation payment
- **WHEN** a customer places a `PAYSTATION` order and returns from `WebBrowser.openAuthSessionAsync`
- **THEN** the app invokes `POST /payments/paystation/verify` (or `GET /payments/paystation/status/:invoiceNumber` if browser dismissed) and navigates to Order Success only upon verified server response, or presents a retry/status reconciliation view if unpaid.
