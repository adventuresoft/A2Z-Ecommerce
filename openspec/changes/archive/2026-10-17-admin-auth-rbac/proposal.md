# Proposal

## Why

The e-commerce platform currently lacks an administrative login interface, allowing unauthenticated browser access to administrative screens. Furthermore, the role system only supports a rigid three-role enum without module-level action constraints. To secure administrative operations and support differentiated business personas, the application requires an AdminLTE-styled sign-in flow, a password recovery UI shell, support for a `SHOP_MANAGER` role, a module-based permission policy matrix, dynamic sidebar navigation filtering, and granular action guards preventing non-super-admin users from destructive operations.

## What Changes

- Add Admin sign-in screen at `/login` with email/password validation and JWT token management.
- Add Admin forgot password UI placeholder at `/forgot-password` (ready for future email reset token integration).
- Expand database `Role` enum to support `SHOP_MANAGER` alongside `SUPER_ADMIN`, `ADMIN`, and `CUSTOMER`.
- Introduce a central Module Permission Policy Matrix mapping roles (`SUPER_ADMIN`, `ADMIN`, `SHOP_MANAGER`, `CUSTOMER`) to module actions (`create`, `read`, `update`, `delete`).
- Enforce backend role and action permissions via a dedicated `@RequirePermission()` decorator and guard, rejecting unauthorized operations (such as `ADMIN` attempting any `DELETE` request).
- Update admin sidebar navigation to dynamically filter visible items based on the authenticated user's module permissions.
- Introduce client-side action guards to hide or disable "Delete" actions in catalog tables for users without delete privileges.
- Add an idempotent database seed script creating demo accounts for each role:
  - `superadmin@az-ecommerce.local` (`SUPER_ADMIN`)
  - `admin@az-ecommerce.local` (`ADMIN`)
  - `shopmanager@az-ecommerce.local` (`SHOP_MANAGER`)
  - `customer@az-ecommerce.local` (`CUSTOMER`)

## Capabilities

### New Capabilities
<!-- None: Reusing and expanding existing cohesive capabilities -->

### Modified Capabilities
- `user-auth`: Add `SHOP_MANAGER` role, module-based permission validation on protected routes, and expanded demo user seeding.
- `admin-layout`: Add `/login` route, `/forgot-password` shell, auth state context, dynamic permission-filtered sidebar navigation, and table action visibility guards.

## Impact

- **Database**: Prisma schema enum `Role` updated to include `SHOP_MANAGER`; database migration applied.
- **Backend API (`apps/api`)**: `AuthModule` and `UsersModule` updated with new role, permission guard, and seed script.
- **Admin Frontend (`apps/admin`)**: Auth service/context created, `/login` and `/forgot-password` routes implemented, route protection middleware/guard added, and navigation configuration dynamically filtered.
