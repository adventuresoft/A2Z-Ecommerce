# Proposal

## Why

The storefront currently operates with mock catalog data, static header mockups, and client-only `localStorage` state without real customer identity or persistence. Meanwhile, the backend authentication service (`/api/v1/auth`) exists but lacks HTTP-only cookie support for secure refresh token handling, customer profile mutation endpoints, and customer address book CRUD APIs.

Establishing customer authentication, HTTP-only cookie session persistence, customer profile management, and saved addresses is the essential foundation for subsequent phases, including server-authoritative checkout, multi-device wishlist synchronization, and customer self-service order tracking.

## What Changes

- **Backend Auth HTTP-Only Cookie Support**:
  - Install `cookie-parser` and register cookie middleware in `apps/api/src/main.ts`.
  - Update `POST /api/v1/auth/login` and `POST /api/v1/auth/register` to issue the long-lived `refreshToken` via an `HttpOnly`, `SameSite=Lax`, `Path=/api/v1/auth` cookie while returning the short-lived `accessToken` in the response body.
  - Update `POST /api/v1/auth/refresh` to extract the refresh token from HTTP-only request cookies (with fallback to request body for non-browser clients), rotate the refresh token cookie, and return a fresh access token.
  - Update `POST /api/v1/auth/logout` to clear the `refreshToken` cookie and increment `User.tokenVersion` to revoke existing sessions.
- **Backend Customer Account Module (`/api/v1/account`)**:
  - Implement `AccountController`:
    - `GET /api/v1/account/profile`: Retrieve profile details of authenticated customer (`id`, `email`, `name`, `phone`, `role`, `createdAt`).
    - `PATCH /api/v1/account/profile`: Update customer display name and phone number with validation.
    - `POST /api/v1/account/change-password`: Verify current password via `argon2id`, validate new password complexity, update `passwordHash`, and increment `tokenVersion` to invalidate other active sessions.
  - Implement `AccountAddressesController`:
    - `GET /api/v1/account/addresses`: List customer's saved addresses, ordered by default shipping first.
    - `POST /api/v1/account/addresses`: Create a new delivery address with transactional default flag handling.
    - `PATCH /api/v1/account/addresses/:id`: Update address fields with strict ownership verification.
    - `DELETE /api/v1/account/addresses/:id`: Delete address with ownership verification.
    - `PUT /api/v1/account/addresses/:id/default-shipping`: Atomically set default shipping address.
    - `PUT /api/v1/account/addresses/:id/default-billing`: Atomically set default billing address.
- **Frontend HTTP Client & Auth State (`apps/web`)**:
  - Create `apps/web/lib/api-client.ts` with `credentials: 'include'` and automated 401 interceptor that transparently invokes `/api/v1/auth/refresh`, replaying queued requests upon token renewal.
  - Create `apps/web/context/AuthContext.tsx` providing customer state, silent authentication verification on initial page mount, login, registration, logout, and profile update actions.
- **Frontend Storefront UI Pages & Components**:
  - Build `apps/web/app/login/page.tsx` with redirect parameter support (`?redirect=/checkout`).
  - Build `apps/web/app/register/page.tsx` with input validation, password strength indicator, and auto-login.
  - Build Customer Dashboard shell `apps/web/app/account/layout.tsx` with authenticated route guard and responsive sidebar navigation.
  - Build `apps/web/app/account/page.tsx` (Dashboard Overview) with welcome banner, summary stat cards, default delivery address summary, and recent orders placeholder.
  - Build `apps/web/app/account/profile/page.tsx` with personal information editor and change password card.
  - Build `apps/web/app/account/addresses/page.tsx` with address cards, default badges, and "Add/Edit Address" modal.
  - Update `apps/web/components/Navbar/Header.tsx`, `MobileBottomBar.tsx`, and `MobileDrawer.tsx` to reflect authenticated customer status, display customer name and avatar, and provide quick navigation to account pages and sign-out.

## Capabilities

### New Capabilities
- `customer-account`: Customer self-service profile updates, password change with session invalidation, and transactional address book management (`UserAddress`) with default shipping and billing destinations.

### Modified Capabilities
- `user-auth`: Enhance refresh token lifecycle with HTTP-only cookie transmission, automatic cookie renewal on rotation, cookie clearing on logout, and dual-mode cookie/body extraction.

## Impact

- **Backend (`apps/api`)**:
  - New dependency: `cookie-parser` and `@types/cookie-parser`.
  - Added module: `AccountModule` registered in `AppModule`.
  - Updated controllers: `AuthController` and `main.ts` cookie middleware registration.
- **Frontend (`apps/web`)**:
  - New library: `apps/web/lib/api-client.ts`.
  - New context: `apps/web/context/AuthContext.tsx` integrated into `app/layout.tsx`.
  - New routes: `/login`, `/register`, `/account`, `/account/profile`, `/account/addresses`.
  - Updated components: `Header.tsx`, `MobileBottomBar.tsx`, `MobileDrawer.tsx`.
- **Breaking Changes**: None. Existing API endpoints remain backward compatible, and existing admin auth flows remain intact.
