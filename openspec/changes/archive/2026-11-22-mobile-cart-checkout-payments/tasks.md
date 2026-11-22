# Tasks

## 1. Cart, Coupons & Wishlist Screens

- [x] 1.1 Create `src/features/cart/components/coupons-sheet.tsx` (Available Coupons bottom sheet calling `/coupons/active` + code validation) and `src/features/cart/screens/cart-screen.tsx` + wire `src/app/(tabs)/cart.tsx` with guest/server cart items, quantity controls, sync/stock banners, live `POST /checkout/calculate` summary in `BDT `, offline guard, and `useRequireAuth('/checkout')`.
- [x] 1.2 Create `src/features/wishlist/screens/wishlist-screen.tsx` + wire `src/app/(tabs)/wishlist.tsx` supporting guest & authenticated wishlist display, 1-tap `Move to Cart`, and remove.
- [x] 1.3 Add Jest unit tests in `src/features/cart/cart-store.test.ts` verifying guest add/update/remove and post-login `POST /cart/sync` merge + warning capture.

## 2. BD Cascading Addresses, 1-Page Checkout & PayStation Payments

- [x] 2.1 Create `src/features/checkout/utils/checkout-utils.ts` (stable checkout idempotency key generator, address-to-order payload mapper, PayStation callback URL parser & reconciliation helper) + unit tests in `src/features/checkout/utils/checkout-utils.test.ts`.
- [x] 2.2 Create `src/features/checkout/components/address-form-modal.tsx` (BD Division → District → Thana → Post Office cascade with auto postal code) and `src/features/account/screens/addresses-screen.tsx` + `src/app/addresses/index.tsx`.
- [x] 2.3 Create `src/features/checkout/screens/checkout-screen.tsx`, `src/features/checkout/screens/payment-callback-screen.tsx`, and `src/features/checkout/screens/order-success-screen.tsx` + thin Expo Router routes under `src/app/checkout/{index,payment-callback,success}.tsx`; register routes in `src/app/_layout.tsx` and verify `pnpm --filter mobile check-types` and `pnpm --filter mobile test` pass cleanly.
