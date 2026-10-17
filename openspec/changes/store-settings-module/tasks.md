# Tasks

## 1. Database Schema & Prisma Migration

- [ ] 1.1 Add `StoreSetting` model in `apps/api/prisma/schema.prisma` with `key`, `value`, `dataType`, `group`, `isPublic`, `description`, `createdAt`, and `updatedAt`.
- [ ] 1.2 Synchronize database schema with PostgreSQL using `pnpm --filter api exec prisma db push` and verify Prisma client generation.
- [ ] 1.3 Update `apps/api/prisma/seed.ts` to seed standard default store configuration entries across all operational groups and verify seed execution.

## 2. Backend Store Settings Module Core & DTOs

- [ ] 2.1 Create store setting DTOs (`create-setting.dto.ts`, `update-setting.dto.ts`, `batch-update-settings.dto.ts`, `query-settings.dto.ts`, `setting-response.dto.ts`) with `class-validator` rules and Swagger decorators.
- [ ] 2.2 Implement `SettingsService` supporting key lookup, group filtering, single upsert, atomic transaction batch updates, and typed public settings dictionary formatting.

## 3. Backend REST Controllers & Swagger

- [ ] 3.1 Implement administrative controller `AdminSettingsController` (`/api/v1/admin/settings`) secured with `JwtAuthGuard`, `RolesGuard`, and role permissions.
- [ ] 3.2 Implement public controller `SettingsController` (`/api/v1/settings`) for unauthenticated storefront consumers returning only public parameters.
- [ ] 3.3 Register `SettingsModule` in `AppModule` and verify API endpoints and Swagger documentation compile cleanly.

## 4. Backend Automated Testing

- [ ] 4.1 Write comprehensive unit tests in `apps/api/src/settings/settings.service.spec.ts` covering key lookups, group queries, batch updates, and public settings mapping.
- [ ] 4.2 Write controller unit tests in `apps/api/src/settings/settings.controller.spec.ts` and verify test suite passes.

## 5. Admin Frontend Store Settings Service & Views

- [ ] 5.1 Implement `apps/admin/services/settings.ts` with typed methods for fetching settings, updating individual or batch settings, and fetching public settings.
- [ ] 5.2 Build live AdminLTE 4 tabbed interface at `apps/admin/app/system/settings/page.tsx` with clean tabs for General Info, Localization & Currency, Orders & Checkout, Inventory Rules, Shipping Policies, Notification Channels, and Maintenance/SEO.
- [ ] 5.3 Update `apps/admin/config/navigation.ts` to activate the Store Settings navigation item with a "Live" badge.

## 6. Verification & Monorepo Build Check

- [ ] 6.1 Run backend unit tests (`pnpm --filter api test`) and ensure all tests pass.
- [ ] 6.2 Run TypeScript type-checking across `apps/admin` (`pnpm --filter admin check-types`) and verify zero errors.
- [ ] 6.3 Run production build for `apps/api` and `apps/admin` and verify clean compilation.
