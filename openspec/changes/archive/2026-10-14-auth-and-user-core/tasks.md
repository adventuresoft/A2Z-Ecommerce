# Tasks

## 1. Dependencies & Database Schema Migration

- [x] 1.1 Add `argon2` to `apps/api/package.json` and configure `pnpm.onlyBuiltDependencies` in root `package.json`, verifying package installation via `pnpm install`
- [x] 1.2 Add `@nestjs/jwt` and `@types/jsonwebtoken` to `apps/api/package.json` and verify dependencies resolve without peer warnings
- [x] 1.3 Update `apps/api/prisma/schema.prisma` with `Role` enum and the finalized `User` model (`passwordHash`, `role`, `isActive`, `tokenVersion`), generating the client and running migration `init_auth_users` via `pnpm --filter api exec prisma migrate dev --name init_auth_users`

## 2. Password & Token Security Infrastructure

- [x] 2.1 Implement `PasswordService` with `argon2id` hashing and verification functions, verifying with unit tests in `apps/api/src/auth/password.service.spec.ts`
- [x] 2.2 Extend environment schema in `apps/api/src/config/env.validation.ts` for `JWT_SECRET`, `JWT_ACCESS_EXPIRES_IN`, `JWT_REFRESH_SECRET`, and `JWT_REFRESH_EXPIRES_IN`, verifying with unit tests in `apps/api/src/config/env.validation.spec.ts`
- [x] 2.3 Implement `TokenService` managing access/refresh token pair signing and verification against user `tokenVersion`, verifying with unit tests in `apps/api/src/auth/token.service.spec.ts`

## 3. Users Module & Data Access

- [x] 3.1 Implement `UsersService` providing repository methods for user lookup by id and email, user creation with role defaults, and atomic `tokenVersion` incrementation, verifying with unit tests in `apps/api/src/users/users.service.spec.ts`
- [x] 3.2 Implement `UsersModule` and export `UsersService` for consumption by the authentication domain, verifying NestJS module resolution

## 4. Authentication Endpoints & Flow

- [x] 4.1 Define DTOs (`RegisterDto`, `LoginDto`, `RefreshTokenDto`) with `class-validator` rules and OpenAPI `@ApiProperty` metadata, verifying validation constraints
- [x] 4.2 Implement `AuthService` handling registration, credential verification, token rotation, logout revocation, and profile fetching, verifying with unit tests in `apps/api/src/auth/auth.service.spec.ts`
- [x] 4.3 Implement `AuthController` with endpoints for `POST /api/v1/auth/register`, `POST /api/v1/auth/login`, `POST /api/v1/auth/refresh`, `POST /api/v1/auth/logout`, and `GET /api/v1/auth/me`, verifying Swagger UI annotations and route contracts in `apps/api/src/auth/auth.controller.spec.ts`

## 5. Role Authorization & Route Protection

- [x] 5.1 Implement `JwtAuthGuard` and `@CurrentUser()` decorator to extract authenticated user claims from Authorization Bearer headers, verifying guard behavior in `apps/api/src/auth/guards/jwt-auth.guard.spec.ts`
- [x] 5.2 Implement `@Roles()` decorator and `RolesGuard` validating user role against endpoint requirements, verifying role access and `403 Forbidden` rejections in `apps/api/src/auth/guards/roles.guard.spec.ts`
- [x] 5.3 Register `AuthModule` and `UsersModule` in `apps/api/src/app.module.ts`, verifying startup without dependency injection errors

## 6. Super Admin Seeder & Full-Stack Verification

- [x] 6.1 Create database seeder script in `apps/api/prisma/seed.ts` to provision initial `SUPER_ADMIN` credentials idempotently, verifying execution via `pnpm --filter api db:seed`
- [x] 6.2 Write and execute integration/e2e test suite covering registration, login, token rotation, logout invalidation, and role restrictions, verifying all test scenarios pass
- [x] 6.3 Run monorepo typecheck, lint, and build commands (`pnpm turbo run check-types lint build`) and verify clean build with zero regressions
