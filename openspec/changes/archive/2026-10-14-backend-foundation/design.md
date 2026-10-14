# Design: Backend Foundation

## Context

See [proposal.md](file:///c:/xampp/htdocs/office/az-ecommerce/openspec/changes/backend-foundation/proposal.md) for motivation and problem background.

`apps/api` is built on NestJS 12.1.2, TypeScript 6.0.3, and Node ESM (`"type": "module"`). It interfaces with a local PostgreSQL 18 instance via Prisma 7.10.0. The application currently fails to initialize due to Node ESM extensionless imports and missing Prisma 7 driver adapters.

## Goals / Non-Goals

**Goals:**
- Resolve all runtime startup crashes in `apps/api` under Node ESM.
- Configure Prisma 7 with `@prisma/adapter-pg` and connection pooling via `pg.Pool`.
- Cleanly replace `@nestjs/observe` telemetry with `@nestjs/config` and strict environment validation.
- Standardize all endpoints under `/api/v1` with Swagger at `/api/docs`.
- Enforce input hygiene via a global `ValidationPipe` and secure origins via CORS and Helmet.
- Establish a consistent JSON error format and a `/api/v1/health` probe.

**Non-Goals:**
- Business domain endpoints (Authentication, Products, Categories, Orders) — these are delivered in subsequent atomic proposals.
- Generating database migrations for the full e-commerce schema — schema migration begins in the Category vertical slice.
- Modifying frontend applications (`apps/admin` or `apps/web`).

## Decisions

### Decision 1: Explicit `.js` Relative Imports for Node ESM
- **Choice:** Append explicit `.js` extensions to all relative module imports within `apps/api/src/prisma/*.ts` and other backend source files.
- **Rationale:** In Node ESM (`"type": "module"` with `moduleResolution: nodenext` or `preserve`), Node requires file extensions. TypeScript emits paths verbatim or verifies them against ESM resolution.
- **Alternatives Considered:** Bundling with Webpack or reverting to CommonJS. Rejected because NestJS 12 and current repository setup are already configured for ESM.

### Decision 2: Prisma 7 Driver Adapter with `pg.Pool`
- **Choice:** Install `@prisma/adapter-pg` and `pg`. In `PrismaService`, construct a `pg.Pool` using `DATABASE_URL` from `ConfigService`, wrap it in `new PrismaPg(pool)`, and pass it to `super({ adapter })`.
- **Rationale:** Prisma 7 deprecates internal Rust binary engine query dispatch in favor of driver adapters. `pg.Pool` provides robust connection lifecycle management on PostgreSQL 18.
- **Lifecycle Cleanliness:** `PrismaService.onModuleDestroy()` calls `this.$disconnect()` and `await this.pool.end()` to prevent connection leaks during hot-reloads and tests.
- **Alternatives Considered:** Downgrading to Prisma 6. Rejected as Prisma 7 is already locked in workspace dependencies.

### Decision 3: Remove `@nestjs/observe` and Enforce Strict Config Validation
- **Choice:** Remove `@nestjs/observe`. Install `@nestjs/config` and implement an environment configuration validation schema using `class-validator` (or `zod`).
- **Required Variables:**
  - `PORT`: Number, default `3001`
  - `NODE_ENV`: String (`development`, `production`, `test`), default `development`
  - `DATABASE_URL`: String, required PostgreSQL connection URI
  - `CORS_ORIGIN`: Comma-delimited origins, default `http://localhost:3000,http://localhost:3002`
- **Rationale:** Stops unauthorized external HTTP calls and prevents runtime errors caused by missing environment variables.

### Decision 4: Global Middleware & Pipeline Configuration in `main.ts`
- **Global Prefix:** `app.setGlobalPrefix('api/v1', { exclude: ['api/docs', 'api/docs-json'] })`
- **CORS:** Enabled with origins parsed from `CORS_ORIGIN`, credentials set to `true`.
- **Helmet:** Standard HTTP response headers applied via `helmet()`.
- **Validation Pipe:**
  ```typescript
  new ValidationPipe({
    whitelist: true,
    forbidNonWhitelisted: true,
    transform: true,
    transformOptions: { enableImplicitConversion: true },
  })
  ```
- **OpenAPI Setup:** Configure `DocumentBuilder` with title `"AZ E-Commerce API"`, version `"1.0"`, and attach Bearer auth definition for future endpoints.

### Decision 5: Standardized Error Filter (`AllExceptionsFilter`)
- **Choice:** Global exception filter intercepting `HttpException` and unhandled exceptions.
- **Standardized Response Body:**
  ```json
  {
    "statusCode": 400,
    "message": "Validation failed",
    "error": "Bad Request",
    "timestamp": "2026-10-13T15:00:00.000Z",
    "path": "/api/v1/health"
  }
  ```

## Risks / Trade-offs

- **[Risk] Connection Pool Leakage During Testing** → *Mitigation:* Ensure `PrismaService.onModuleDestroy()` explicitly ends `pg.Pool`.
- **[Risk] TypeScript 6 Decorator Metadata Reflection** → *Mitigation:* Maintain `import 'reflect-metadata';` at top of `main.ts` and keep `"experimentalDecorators": true` and `"emitDecoratorMetadata": true` in `tsconfig.json`.
- **[Risk] Port Clashes in Dev** → *Mitigation:* Explicitly bind `process.env.PORT || 3001` matching the workspace port allocation matrix.
