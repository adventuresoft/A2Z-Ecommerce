# Design: Mobile Cart, Wishlist, Checkout & Payments

## Architectural Decisions
1. **Single Authoritative Price Source**: Client never trusts local math for final totals. Cart and Checkout always call `POST /api/v1/checkout/calculate` whenever cart items, shipping method, destination city, or coupon code changes (debounced 250ms), rendering server-returned `subtotal`, `discountAmount`, `shippingFee`, `totalTaxAmount` (reverse-extracted VAT included), `grandTotal`, and per-item `itemsValidation` warnings.
2. **Idempotent Order Submission**: Checkout generates one stable UUID v4 `idempotencyKey` per cart/address/payment checkout attempt and passes it via `idempotency-key` HTTP header to `POST /api/v1/orders`. Retries after flaky cellular drops return the same order without duplicate charges or double stock deduction; key regenerates only when cart items or checkout inputs meaningfully change.
3. **PayStation Secure Mobile Flow**:
   - After `POST /orders` succeeds with `paymentMethod: 'PAYSTATION'`, call `POST /payments/paystation/initiate` with `callbackUrl: 'azecommerce://checkout/payment-callback'`.
   - Open `payment_url` via `WebBrowser.openAuthSessionAsync(payment_url, 'azecommerce://checkout/payment-callback')` (Chrome Custom Tabs / ASWebAuthenticationSession).
   - Never trust browser redirect query params alone: extract `invoice_number` (or use the initiated `invoice_number`) and call `POST /payments/paystation/verify`.
   - If the user closes/dismisses the browser before redirect, automatically fall back to `GET /payments/paystation/status/:invoiceNumber` to reconcile authoritative status.
4. **Bangladesh Administrative Location Cascade**: Reusable `AddressFormModal` uses `useLocationsControllerGetDivisions`, `Districts`, `Thanas`, and `PostOffices` with `STALE_TIMES.LOCATIONS` (24h). Picking a Post Office auto-populates `postalCode` while preserving manual override.
5. **Offline Mutation Guard**: Checkout and Place Order disable submission and display localized offline guidance when NetInfo reports offline.
