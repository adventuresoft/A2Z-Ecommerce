# Proposal

## Why

The backend currently lacks user authentication, password hashing, and role authorization. This blocks the administrative dashboard from securing login and session state, and prevents all downstream business domains (Catalog, Orders, Inventory) from enforcing role-based permissions (`SUPER_ADMIN`, `ADMIN`, `CUSTOMER`). Additionally, the existing Prisma `User` schema has drifted from the finalized data model, leaving the database without role fields, account status flags, or token invalidation support.

## What Changes

- **Database Model Update & Migration**: Replace the disposable legacy `User` model with the finalized entity schema from `docs/data-model.md §4.1`, adding `Role` enum (`SUPER_ADMIN`, `ADMIN`, `CUSTOMER`), `passwordHash`, `phone`, `isActive`, `emailVerifiedAt`, and an explicit `tokenVersion` integer for instant refresh token revocation.
- **Password Security Engine**: Integrate `argon2` (argon2id variant) for secure, memory-hard credential hashing and verification.
- **JWT Authentication Infrastructure**: Implement dual-token issuance (short-lived access tokens and longer-lived refresh tokens) with configurable expiration and secret keys via `@nestjs/config`.
- **Authentication Endpoints**: Expose REST endpoints beneath `/api/v1/auth`:
  - `POST /api/v1/auth/register` (customer registration)
  - `POST /api/v1/auth/login` (credential verification, issuing access & refresh tokens and user profile summary)
  - `POST /api/v1/auth/refresh` (refresh token rotation with `tokenVersion` validation)
  - `POST /api/v1/auth/logout` (token invalidation by incrementing user's `tokenVersion`)
  - `GET /api/v1/auth/me` (authenticated user profile retrieval)
- **Role-Based Access Control (RBAC)**: Implement `@Roles(...)` metadata decorator and `RolesGuard`, integrating with `JwtAuthGuard` to protect administrative endpoints based on user role.
- **Initial Super Admin Seeder**: Provide an executable database seed script that safely provisions the root `SUPER_ADMIN` user when bootstrapping a fresh environment.

## Capabilities

### New Capabilities
- `user-auth`: Manages user credential verification, password hashing, dual-token JWT lifecycle (issuance, refresh, revocation), authenticated profile retrieval, and role authorization enforcement.

### Modified Capabilities
<!-- None: existing api-core capability remains unchanged -->

## Impact

- **Affected Systems**: `apps/api` (Prisma schema, new AuthModule, UsersModule, Common guards/decorators).
- **APIs**: New endpoints under `/api/v1/auth/*` documented in Swagger UI (`/api/docs`).
- **Dependencies**: Adds `argon2` to `apps/api`, registered in pnpm workspace `allowBuilds` for native compilation.
- **Database**: Creates migration `init_auth_users` replacing table `users` with model `User` and `Role` enum.
