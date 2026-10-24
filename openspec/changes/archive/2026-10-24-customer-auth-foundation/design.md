# Design

## Context

See [proposal.md](file:///c:/xampp/htdocs/office/az-ecommerce/openspec/changes/customer-auth-foundation/proposal.md) for motivation. The backend (`apps/api`) runs on NestJS with Prisma ORM and PostgreSQL 18. `User` and `UserAddress` tables already exist in `schema.prisma`. Existing authentication (`/api/v1/auth`) implements `argon2id` password hashing and token generation, while CORS in `main.ts` is configured with `credentials: true`. The storefront (`apps/web`) is a Next.js 16 App Router application with Tailwind CSS and Framer Motion, currently missing customer authentication screens and customer dashboard pages.

## Goals / Non-Goals

**Goals:**
- Provide secure session persistence using HTTP-only cookies for refresh tokens (`SameSite=Lax`, `Path=/api/v1/auth`, 7-day TTL).
- Keep the access token short-lived (15 minutes) and stored in-memory on the frontend to protect against XSS.
- Provide transparent token renewal via `api-client.ts` interceptor that queues concurrent failed requests during refresh.
- Deliver dedicated backend modules for Customer Profile inspection/update, password change with multi-device session revocation, and Address Book CRUD.
- Enforce transactional consistency such that each customer has at most one default shipping address and one default billing address.
- Build clean, accessible storefront pages for `/login`, `/register`, and `/account` hub (`/account`, `/account/profile`, `/account/addresses`).

**Non-Goals:**
- Guest cart migration to database (addressed in Phase 4/5 checkout calculation and order creation).
- Order history rendering with real database orders (addressed in Phase 6).
- Database-backed wishlist synchronization (addressed in Phase 7).
- Social login (OAuth via Google/Facebook is deferred to future milestones).

## Decisions

### Decision 1: Dual-Mode HTTP-Only Cookie + Request Body Refresh Token Handling
- **Approach**: `POST /api/v1/auth/login` and `POST /api/v1/auth/register` set `refreshToken` in an HTTP-only cookie and also return it in the JSON response for backward compatibility. `POST /api/v1/auth/refresh` extracts the token first from `req.cookies?.refreshToken`, falling back to `dto?.refreshToken`.
- **Rationale**: Browser clients gain complete XSS immunity for the 7-day refresh token without manual storage management, while mobile apps, Swagger UI, or automated curl scripts can still authenticate using body tokens.
- **Alternatives Considered**:
  - *Pure localStorage storage*: Vulnerable to third-party script XSS exfiltration.
  - *Strict cookie-only*: Breaks existing Swagger test workflows and non-browser clients.

### Decision 2: Isolated `AccountModule` for Customer Domain Operations
- **Approach**: Create `apps/api/src/account` with `AccountController` (`/api/v1/account`) and `AccountAddressesController` (`/api/v1/account/addresses`), rather than expanding admin-oriented `CustomersModule` or `UsersModule`.
- **Rationale**: Isolates customer self-service logic and security bounds from admin customer-management endpoints (`/admin/customers`), preventing authorization bleed and maintaining clean separation of concerns.
- **Alternatives Considered**:
  - *Adding endpoints into `CustomersModule`*: `CustomersModule` currently serves admin role permissions and handles admin filtering/metrics. Blending customer self-service endpoints would complicate route guards.

### Decision 3: Atomic Default Address Flag Resolution via Prisma Transactions
- **Approach**: When an address is created or updated with `isDefaultShipping: true` (or `isDefaultBilling: true`), execute inside a `$transaction`:
  1. `UPDATE "UserAddress" SET isDefaultShipping = false WHERE userId = $1`
  2. Create or update the target address with `isDefaultShipping = true`.
- **Rationale**: Guarantees zero race conditions or multi-default states in PostgreSQL without requiring complex partial database indexes.
- **Alternatives Considered**:
  - *Application-level sequential awaits*: Prone to race conditions during rapid concurrent requests.

### Decision 4: In-Memory Frontend Access Token with Silent Mount Hydration
- **Approach**: `apps/web/lib/api-client.ts` stores `accessToken` in memory. On initial page mount, `AuthContext` calls `POST /api/v1/auth/refresh` with `credentials: 'include'`. If the user has an active `refreshToken` cookie, the session is silently rehydrated and user profile fetched without requiring credentials re-entry.
- **Rationale**: Avoids storing sensitive bearer access tokens in `localStorage`. If the user closes the tab or refreshes, silent refresh restores the session in milliseconds.
- **Alternatives Considered**:
  - *Persisting access token in localStorage*: Readily accessible to malicious injected scripts.

### Decision 5: Session Revocation via `tokenVersion` on Password Change
- **Approach**: When `POST /api/v1/account/change-password` succeeds, the backend increments `User.tokenVersion` in PostgreSQL and clears the current `refreshToken` cookie.
- **Rationale**: All existing refresh tokens issued across any device encode the previous `tokenVersion` and will be rejected with HTTP 401 on their next rotation attempt, achieving instant global logout.

## Risks / Trade-offs

- **Risk**: Cross-site cookie blocked if storefront and API run on different domains in production.
  - **Mitigation**: In local development, `http://localhost:3000` and `http://localhost:3001` share `SameSite=Lax`. In production, storefront and API reside under the same top-level domain (e.g., `store.az-ecommerce.com` and `api.az-ecommerce.com`) with `Domain=.az-ecommerce.com` or reverse proxy routing.
- **Risk**: Request queue starvation during 401 refresh in `api-client.ts` if refresh fails repeatedly.
  - **Mitigation**: Dedicated `isRefreshing` lock flag and promise queue with a 10-second timeout. If refresh fails once, all queued requests reject immediately with `401 Unauthorized` and redirect to `/login`.
- **Risk**: Deleting the current default address leaves customer without a default address.
  - **Mitigation**: When deleting an address marked default, if other addresses exist for that user, the backend automatically promotes the most recently created remaining address to default shipping.

## Migration Plan

1. Install `cookie-parser` and `@types/cookie-parser` in `apps/api`.
2. Register `cookieParser()` in `apps/api/src/main.ts`.
3. Add `AccountModule` to `apps/api/src/app.module.ts`.
4. Implement `api-client.ts` and `AuthContext` in `apps/web`.
5. Create pages `/login`, `/register`, and `/account/*` in `apps/web`.
6. Run unit/e2e tests in backend and build checks in frontend.
