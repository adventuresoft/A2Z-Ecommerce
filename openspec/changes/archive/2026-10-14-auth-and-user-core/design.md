# Design

## Context

The backend is built with NestJS 12 and Prisma 7 (`@prisma/adapter-pg`) on PostgreSQL 18. The current `User` model in `schema.prisma` is a minimal placeholder lacking role management, password hashing constraints, and token security fields. The Admin dashboard (`apps/admin`) and future storefront (`apps/web`) require authentic token-based session handling and role-based route protection.

## Goals / Non-Goals

**Goals:**
- Provide robust credential authentication and JWT token lifecycle (access + refresh) under `/api/v1/auth`.
- Establish argon2id password hashing compliant with modern OWASP password storage recommendations.
- Enable instantaneous refresh token revocation on logout using an integer `tokenVersion` column.
- Enforce role-based access control via `@Roles(Role.ADMIN, Role.SUPER_ADMIN)` and NestJS guards.
- Provide an automated, idempotent `SUPER_ADMIN` seeder.

**Non-Goals:**
- Dynamic database-driven RBAC tables (`Permission`, `RolePermission`, etc.) — pruned per `admin-dashboard-decisions.md` (Decision 8).
- Third-party OAuth / Social Logins (Google, Facebook) — deferred to future customer portal enhancement.
- Live email transmission via SMTP for email confirmation — tokens and verification fields are modeled, but actual email transport is deferred to the notifications phase.

## Decisions

### Decision 1: Password Hashing with `argon2` (argon2id)
- **Choice**: Use `argon2` with the `argon2id` variant.
- **Rationale**: OWASP specifically recommends `argon2id` over `bcrypt` for modern applications due to memory-hard computational complexity resisting GPU-based brute-force attacks.
- **Alternatives Considered**: `bcrypt` (familiar, but vulnerable to hardware acceleration and limited to 72-byte inputs).

### Decision 2: Instant Token Revocation via `tokenVersion`
- **Choice**: Add an integer `tokenVersion` column (default `0`) to the `User` model. Include `tokenVersion` inside the signed refresh token payload.
- **Rationale**: Creating a separate `RefreshToken` table introduces continuous database writes, indexing overhead, and requires cron jobs for periodic pruning. With `tokenVersion`, a user logout or password reset simply executes `UPDATE "User" SET "tokenVersion" = "tokenVersion" + 1 WHERE id = $1`, which immediately invalidates all outstanding refresh tokens in O(1) time without extra tables.
- **Alternatives Considered**: Dedicated `RefreshToken` relational table (added complexity and disk bloat); Redis blacklist (requires external Redis service not currently in monorepo).

### Decision 3: Role Authorization Architecture
- **Choice**: Declare `enum Role { SUPER_ADMIN, ADMIN, CUSTOMER }` directly in Prisma and embed `role` inside the signed JWT access token.
- **Rationale**: Single-vendor e-commerce requires only three distinct tiers:
  - `SUPER_ADMIN`: Team management, store configuration, audit logs.
  - `ADMIN`: Catalog, inventory, order processing, customer support.
  - `CUSTOMER`: Storefront shopping, personal address book, orders, reviews.
  Embedding the role in the JWT allows `RolesGuard` to evaluate permissions synchronously without hitting PostgreSQL on every HTTP request.

### Decision 4: JWT Strategy and Token Expirations
- **Access Token**: Lifespan 15 minutes (`JWT_ACCESS_EXPIRES_IN=15m`). Payload: `{ sub: userId, email: string, role: Role }`.
- **Refresh Token**: Lifespan 7 days (`JWT_REFRESH_EXPIRES_IN=7d`). Payload: `{ sub: userId, tokenVersion: number }`.

### Decision 5: Prisma Schema Alignment
- Model `User` mapped to table `"User"` matching `docs/data-model.md §4.1`:
  - `id`: UUID (PK, `default(uuid())`)
  - `email`: String (Unique)
  - `passwordHash`: String
  - `name`: String
  - `phone`: String?
  - `role`: Role (`default(CUSTOMER)`)
  - `isActive`: Boolean (`default(true)`)
  - `tokenVersion`: Int (`default(0)`)
  - `emailVerifiedAt`: DateTime?
  - `createdAt`: DateTime (`default(now())`)
  - `updatedAt`: DateTime (`updatedAt`)

## Risks / Trade-offs

- **[Risk] Native compilation of `argon2` on Windows** → Register `argon2` under `pnpm.onlyBuiltDependencies` in root `package.json` so pnpm allows prebuilt native binaries to install cleanly.
- **[Risk] Refresh Token reuse / theft** → Token rotation is enforced during `POST /api/v1/auth/refresh`. When a refresh token is presented, a new access and refresh token pair is issued. If an invalidated or older `tokenVersion` is submitted, access is immediately revoked.
- **[Risk] High-frequency brute-force attacks on login** → Rate-limit authentication routes using NestJS throttler or reverse-proxy protection.
