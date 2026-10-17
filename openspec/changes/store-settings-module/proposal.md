# Proposal: Store Settings Management Module

## Why

Every e-commerce platform requires centralized, configurable system parameters that govern global store behavior without hardcoding or requiring application re-deployment. Currently, configuration values such as store profile details, contact info, default currency and localization, order rules, inventory thresholds, free shipping thresholds, notification channels, and maintenance toggles are static or unmanaged.

Implementing the Store Settings Management module introduces a robust, extensible key-value settings system backed by PostgreSQL (`StoreSetting` model) and typed NestJS REST APIs as defined in PRD §5.10 and data-model.md §4.10. It also provides public settings consumption for storefront clients and an AdminLTE 4 tabbed administrative interface for store administrators at `/system/settings`.

## What Changes

- **Store Settings Relational Schema**: Introduce the `StoreSetting` model in `apps/api/prisma/schema.prisma` with `key` (PK), `value`, `dataType` (`STRING`, `NUMBER`, `BOOLEAN`, `JSON`), `group` (`GENERAL`, `LOCALIZATION`, `ORDER`, `INVENTORY`, `SHIPPING`, `NOTIFICATION`, `SECURITY`), `isPublic`, `description`, `createdAt`, and `updatedAt`.
- **Database Seed Defaults**: Seed standard default store configuration entries covering all operational groups (e.g., store name, contact email, default currency BDT, currency symbol ৳, order prefix AZ-, low-stock threshold 5, guest checkout toggle, maintenance mode, etc.).
- **Backend Store Settings Module**:
  - `SettingsService`: Key lookup, group querying, bulk update, individual setting upsert/delete, and public settings caching/filtering.
  - `AdminSettingsController` (`/api/v1/admin/settings`): Protected by `JwtAuthGuard` and `RolesGuard` (`SUPER_ADMIN`, `ADMIN`), with action guards preventing unauthorized modifications.
  - `SettingsController` (`/api/v1/settings`): Public endpoint returning non-sensitive, public store parameters (store name, currency, contact info, maintenance state) for storefront and guest consumers.
  - Comprehensive DTO validation (`class-validator`), Swagger OpenAPI documentation, and unit tests.
- **Admin Dashboard Settings Screens**:
  - Implement `apps/admin/services/settings.ts` with typed methods for fetching settings by group, updating individual or batch settings, and resetting to defaults.
  - Implement full AdminLTE 4 tabbed view at `apps/admin/app/system/settings/page.tsx` with clean tabs:
    1. **General Store Information** (Store Name, Legal Entity Name, Contact Email, Support Phone, Store Address, City, Postal Code, Country, Store Logo URL, Favicon URL).
    2. **Localization & Currency** (Default Currency Code, Currency Symbol, Symbol Position, Timezone, Date Format).
    3. **Order & Checkout Rules** (Order Number Prefix, Min Order Subtotal, Max Order Subtotal, Enable Cash on Delivery, Enable Guest Checkout, Auto-cancel Unpaid Orders in Hours).
    4. **Inventory & Catalog Rules** (Default Low-Stock Alert Threshold, Track Inventory Balance, Allow Backorders / Out of Stock Purchases).
    5. **Shipping & Delivery Policies** (Free Shipping Subtotal Threshold, Estimated Order Processing Days, Customer Return Window in Days).
    6. **Notification & Contact Channels** (Order Confirmation Customer Notification, Low-Stock Admin Notification, Sender Email, Sender Display Name).
    7. **System & Maintenance** (Maintenance Mode toggle, Customer Registration Allowed toggle, Store Meta Title, Store Meta Description).
  - Add toast feedback, unsaved changes indicators, input validations, and confirmation for system-critical toggles (e.g. Maintenance Mode).
  - Update `apps/admin/config/navigation.ts` to activate Store Settings with a "Live" badge.

## Capabilities

### New Capabilities

- `store-settings`: Extensible key-value store configuration engine with group classification, public vs. private visibility, data type validation (`STRING`, `NUMBER`, `BOOLEAN`, `JSON`), bulk update transactions, public storefront endpoint, and administrative CRUD operations.

### Modified Capabilities

- `admin-layout`: Activate live AdminLTE 4 Store Settings view at `/system/settings` with tabbed configuration panels, replacing the development placeholder shell and adding "Live" status badge in navigation config.

## Impact

- **Database**: Adds `StoreSetting` table to PostgreSQL via Prisma.
- **Backend API (`apps/api`)**: Adds `SettingsModule` (`SettingsService`, `SettingsController`, `AdminSettingsController`, DTOs, tests, and registration in `AppModule`).
- **Admin Frontend (`apps/admin`)**: Implements `apps/admin/services/settings.ts`, live UI page at `apps/admin/app/system/settings/page.tsx`, and updates `navigation.ts`.
