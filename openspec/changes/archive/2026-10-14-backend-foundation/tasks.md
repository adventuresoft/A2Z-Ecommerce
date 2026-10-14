# Tasks: Backend Foundation

## 1. Dependencies & Environment Configuration

- [x] 1.1 Remove `@nestjs/observe` from `apps/api/package.json` and install `@nestjs/config`, `@prisma/adapter-pg`, `pg`, `@types/pg`, `@nestjs/swagger`, `class-validator`, `class-transformer`, and `helmet`; verify installation via `pnpm --filter api list`.
- [x] 1.2 Implement environment configuration schema and validation in `apps/api/src/config/env.validation.ts` checking `DATABASE_URL`, `PORT`, `NODE_ENV`, and `CORS_ORIGIN`; verify startup failure when `DATABASE_URL` is missing.

## 2. ESM & Database Connection Fixes

- [x] 2.1 Standardize explicit `.js` import paths in `apps/api/src/prisma/index.ts` (`./prisma.service.js`, `./prisma.module.js`); verify ESM resolution loads without `ERR_MODULE_NOT_FOUND`.
- [x] 2.2 Refactor `PrismaService` in `apps/api/src/prisma/prisma.service.ts` to initialize `pg.Pool` and `@prisma/adapter-pg` `PrismaPg`, handling connection pool disposal in `onModuleDestroy()`; verify successful connection to local PostgreSQL 18.

## 3. Global HTTP Pipeline & Security

- [x] 3.1 Create global exception filter `AllExceptionsFilter` in `apps/api/src/common/filters/all-exceptions.filter.ts`; verify error responses adhere to standard JSON shape (`statusCode`, `message`, `error`, `timestamp`, `path`).
- [ ] 3.2 Configure `apps/api/src/main.ts` with global prefix `api/v1`, CORS origins for `localhost:3000` and `localhost:3002`, `helmet` headers, global `ValidationPipe`, and OpenAPI Swagger Explorer mounted at `/api/docs`; verify Swagger loads at `/api/docs`.

## 4. Health Check Endpoint & Verification

- [ ] 4.1 Implement `HealthModule` and `HealthController` at `GET /api/v1/health` returning service uptime, timestamp, and database connectivity status; verify `GET /api/v1/health` returns HTTP 200 with `status: ok` and `database: connected`.
- [ ] 4.2 Run `pnpm --filter api build` and execute backend test suite to verify clean compilation, zero decorator metadata errors, and clean shutdown.

## Workflow follow-up

- Review implementation diffs and test results.
- Archive the change after verification.
