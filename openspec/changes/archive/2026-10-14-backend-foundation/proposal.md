# Proposal: Backend Foundation

## Why

The NestJS backend (`apps/api`) currently fails at boot time due to extensionless ESM imports in `src/prisma/index.ts` and the lack of a PostgreSQL driver adapter required by Prisma 7. Furthermore, unauthorized external telemetry calls with placeholder credentials (`@nestjs/observe`) are active, and production baseline requirements mandated by PRD §2, §7, and §8—such as the `/api/v1` version prefix, Swagger documentation, global request validation, CORS, security headers, standardized error responses, and health monitoring—are missing. Establishing this foundation unblocks development across the monorepo and provides a robust runtime for upcoming feature slices.

## What Changes

- **Fix ESM Module Resolution**: Update relative import paths in `apps/api/src/prisma/*` to use explicit `.js` extensions compatible with Node ESM.
- **Prisma 7 Driver Adapter Integration**: Install `@prisma/adapter-pg` and `pg` (with `@types/pg`), refactor `PrismaService` to manage a pooled `pg.Pool` connection, and verify connection to local PostgreSQL 18.
- **Telemetry Removal & Configuration Management**: Remove `@nestjs/observe` completely; install `@nestjs/config` and configure strict environment variable validation (`DATABASE_URL`, `PORT`, `CORS_ORIGIN`, `NODE_ENV`).
- **REST API Global Prefix & Versioning**: Configure global prefix `api/v1` in `apps/api/src/main.ts`.
- **OpenAPI / Swagger Documentation**: Install `@nestjs/swagger` and expose interactive API documentation at `/api/docs`.
- **Global Validation Pipe**: Enable `ValidationPipe` with `whitelist: true`, `forbidNonWhitelisted: true`, and `transform: true` using `class-validator` and `class-transformer`.
- **Security & CORS**: Configure `@nestjs/platform-express` with `helmet` security headers and CORS allowing Storefront (`http://localhost:3000`) and Admin Dashboard (`http://localhost:3002`).
- **Standardized Error Handling**: Implement an `AllExceptionsFilter` providing consistent JSON error responses (`statusCode`, `message`, `error`, `timestamp`, `path`).
- **Health Check Endpoint**: Provide a `/api/v1/health` endpoint reporting service uptime, environment, and database connectivity status.

## Capabilities

### New Capabilities
- `api-core`: Defines durable baseline requirements for the NestJS API runtime, including global route versioning (`/api/v1`), Swagger documentation, request payload validation, unified error responses, CORS policy, and service health checks.

### Modified Capabilities
<!-- None. Greenfield baseline. -->

## Impact

- **Affected App**: `apps/api`
- **Dependencies**:
  - Added: `@prisma/adapter-pg`, `pg`, `@types/pg`, `@nestjs/config`, `@nestjs/swagger`, `class-validator`, `class-transformer`, `helmet`
  - Removed: `@nestjs/observe`
- **APIs**:
  - New endpoints: `GET /api/v1/health`, `GET /api/docs` (Swagger UI)
  - Existing `GET /` migrated under `/api/v1/` or replaced by health/welcome.
- **Breaking Changes**: Moving API endpoints under `/api/v1` changes the base URL path from root `/`.
