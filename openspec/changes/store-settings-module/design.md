# Technical Design: Store Settings Management Module

## Context

See `proposal.md` for background and business drivers.

The backend is built with NestJS 12, Prisma 7 with PostgreSQL 18 driver adapter (`@prisma/adapter-pg`), class-validator for input DTOs, and JWT role-based access control (`SUPER_ADMIN`, `ADMIN`, `CUSTOMER`). The admin dashboard is an App Router application with AdminLTE 4 and Bootstrap 5.3 styling.

Currently, configuration parameters for store details, currency formatting, order thresholds, inventory low-stock alerts, and free delivery thresholds are scattered or hardcoded. The platform requires a persistent, typed, and structured key-value store setting model (`StoreSetting`) compliant with `docs/data-model.md §4.10`, along with both administrative management APIs and public storefront query endpoints.

## Goals / Non-Goals

**Goals:**
- Implement `StoreSetting` database model with typed keys, values, data type hints, groups, descriptions, and public visibility flags.
- Seed sensible standard settings covering all primary operational categories so the system is immediately usable out-of-the-box.
- Provide a robust NestJS `SettingsModule` with key retrieval, group retrieval, individual upsert, atomic bulk update, and public settings aggregation.
- Expose secure administrative endpoints under `/api/v1/admin/settings` protected by `JwtAuthGuard` and `RolesGuard`.
- Expose an unauthenticated public endpoint `GET /api/v1/settings` returning only keys where `isPublic === true` formatted as a convenient key-value map for the storefront and client apps.
- Implement an intuitive, responsive AdminLTE 4 tabbed management view in Next.js at `apps/admin/app/system/settings/page.tsx` with field-level validations, tab switching, and instant feedback.

**Non-Goals:**
- Dynamic user-created arbitrary custom database schemas beyond key-value configuration.
- Multi-tenant or multi-store configuration (the system is single-vendor).
- Live payment gateway secret exchange via settings (payment gateway credentials will be managed via environment variables and dedicated payment provider config).

## Decisions

### 1. Data Model Structure: Key-Value with DataType Hint & Logical Grouping
- **Decision:** Implement `StoreSetting` with `key` as Primary Key (`VARCHAR(100)`), `value` as `TEXT`, `dataType` (`STRING`, `NUMBER`, `BOOLEAN`, `JSON`), `group` (`VARCHAR(50)`), and `isPublic` (`BOOLEAN`).
- **Rationale:** A key-value approach provides maximum flexibility to introduce new configuration items without executing database migrations for each new setting. Adding `group` allows partitioning settings across UI tabs and API queries cleanly. The `dataType` hint enables clients and services to parse numbers, booleans, and JSON structures reliably.
- **Alternatives Considered:**
  - *Single JSON blob column on a singleton Store table:* Rejected because atomic partial updates would require complex JSON patching and merge-conflict handling, with no per-setting descriptions or indexing.
  - *Hardcoded TypeScript constants or .env only:* Rejected because store owners and administrators must be able to change store policies, business hours, contact numbers, and currency symbols at runtime without devops intervention.

### 2. Standard Setting Groups & Seed Keys
- **Decision:** Organize settings into 7 standardized operational groups:
  1. `GENERAL`: `store_name`, `store_legal_name`, `store_tagline`, `contact_email`, `contact_phone`, `support_hotline`, `store_address`, `store_city`, `store_postal_code`, `store_country`, `store_logo_url`, `store_favicon_url`.
  2. `LOCALIZATION`: `default_currency`, `currency_symbol`, `currency_symbol_position` (`BEFORE`/`AFTER`), `timezone`, `date_format`.
  3. `ORDER`: `order_number_prefix`, `min_order_subtotal`, `max_order_subtotal`, `enable_cod`, `enable_guest_checkout`, `auto_cancel_unpaid_hours`.
  4. `INVENTORY`: `default_low_stock_threshold`, `track_inventory_ledger`, `allow_backorders`.
  5. `SHIPPING`: `free_shipping_threshold`, `estimated_processing_days`, `return_window_days`.
  6. `NOTIFICATION`: `customer_order_placed_notify`, `admin_low_stock_notify`, `system_sender_email`, `system_sender_name`.
  7. `SECURITY`: `maintenance_mode`, `allow_registration`.

### 3. Public vs. Private Settings Exposure
- **Decision:** Maintain a strict separation between public and private settings:
  - `GET /api/v1/settings`: Public endpoint returning a key-value dictionary `Record<string, any>` containing exclusively records where `isPublic === true`, parsing typed values (numbers, booleans).
  - `GET /api/v1/admin/settings`: Administrative endpoint returning the full detailed setting entity list (or filtered by `group`), requiring `SUPER_ADMIN` or `ADMIN` roles.
- **Rationale:** Protects internal configurations, admin notifications, and business thresholds while giving storefront clients instantaneous access to store branding, currency indicators, and maintenance flags.

### 4. Admin UI Architecture: AdminLTE 4 Tabbed Configuration Form
- **Decision:** Build `apps/admin/app/system/settings/page.tsx` using native Bootstrap 5 / AdminLTE 4 card tabs (`nav-tabs` and `card-body`) managed entirely by React state (`activeTab`). Provide tab-specific Save buttons that submit only the active group's modified settings (or all modified settings), showing loading spinners and toast notifications.
- **Rationale:** Avoids sprawling 100-field forms, keeps operations organized by domain, and allows operators to adjust General info or Localization without wading through unrelated notification or inventory settings.

## Risks / Trade-offs

- **[Risk: Type coercion mismatch]** A string `"100"` might be saved for a `NUMBER` setting.
  - *Mitigation:* The API validate logic and DTO rules verify the payload conforms to the declared `dataType` when updating, and client-side form controls bind to appropriate HTML input types (`number`, `checkbox`, `text`).
- **[Risk: Maintenance mode lockout]** Enabling `maintenance_mode` could accidentally block admin operations.
  - *Mitigation:* Maintenance mode rules apply only to customer storefront routes; administrative `/api/v1/admin/*` endpoints remain permanently accessible to authenticated staff.

## Migration Plan

1. Update `apps/api/prisma/schema.prisma` with `StoreSetting` model.
2. Run `pnpm --filter api exec prisma db push` to synchronize PostgreSQL.
3. Update `apps/api/prisma/seed.ts` with comprehensive seed entries for all standard setting keys.
4. Implement NestJS backend `SettingsModule` and admin service/UI in Next.js.
5. Verify test suites and run build validation.
