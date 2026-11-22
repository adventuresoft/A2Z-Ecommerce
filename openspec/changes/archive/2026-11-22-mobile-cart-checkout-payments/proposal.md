# Proposal: Mobile Cart, Wishlist, Checkout & PayStation Payments

## Why
Customers browsing products in `apps/mobile` need a complete conversion funnel: managing guest and server-synced carts with live authoritative pricing, curating wishlists, selecting Bangladesh administrative addresses with cascading location pickers, redeeming coupons, and paying reliably via Cash on Delivery (COD) or PayStation (bKash/Nagad/Cards) with mandatory server-side verification and idempotency protection.

## What Changes
- **Cart Screen (`/(tabs)/cart`)**: Guest MMKV & server-synced cart items, quantity steppers, item removal, stock/sync warning banners, coupon entry + Available Coupons bottom sheet, live `POST /checkout/calculate` totals in `BDT`, offline checkout block, and auth-gated `Proceed to Checkout`.
- **Wishlist Screen (`/(tabs)/wishlist`)**: Displays guest (`/wishlist/guest-items`) or authenticated (`/wishlist`) saved products with 1-tap `Move to Cart` and remove actions.
- **Bangladesh Address Book & Cascading Picker (`/addresses` + reusable modal)**: Saved addresses CRUD (`GET/POST/PATCH/DELETE /account/addresses`) + BD cascading Division → District → Thana → Post Office auto-filling postal codes.
- **1-Page Material 3 Checkout & Payments (`/checkout`, `/checkout/payment-callback`, `/checkout/success`)**: Address picker, dynamic shipping methods, coupon redemption, live debounced `POST /checkout/calculate`, dynamic payment methods (COD, PayStation, manual Mobile Banking), stable UUID `idempotency-key` header on `POST /orders`, and `expo-web-browser` PayStation hosted checkout session with deep-link return and mandatory `POST /payments/paystation/verify` + fallback `GET /payments/paystation/status/:invoiceNumber`.

## Impact
- **Affected packages**: `apps/mobile` only (consumes existing `@repo/api-client` hooks and `apps/api` endpoints built in Change 1 & Change 2).
- **Backward compatibility**: Fully additive; zero breaking changes to backend or web storefront.
