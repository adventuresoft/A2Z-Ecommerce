# Tasks

## 1. Database & Demo Accounts

- [x] 1.1 Update Prisma schema `Role` enum to include `SHOP_MANAGER` and synchronize database schema via `pnpm --filter api exec prisma db push`.
- [x] 1.2 Update seed script `apps/api/src/prisma/seed.ts` to provision demo accounts for `SUPER_ADMIN`, `ADMIN`, `SHOP_MANAGER`, and `CUSTOMER` with password `Password123!`.
- [x] 1.3 Execute `pnpm --filter api run seed` and verify all 4 demo users exist in the PostgreSQL database with proper role assignments.

## 2. Backend Permission Policy & Action Guard

- [x] 2.1 Define centralized permission types and `ROLE_PERMISSIONS` matrix in `apps/api/src/auth/constants/permissions.constant.ts`.
- [x] 2.2 Implement `@RequirePermission(module, action)` decorator and `PermissionsGuard` in `apps/api/src/auth/guards/permissions.guard.ts`.
- [x] 2.3 Apply `PermissionsGuard` and `@RequirePermission` on existing catalog deletion endpoints (Categories, Brands, Attributes, Products, Variants) to block `delete` for `ADMIN`.
- [x] 2.4 Add automated tests in `apps/api/src/auth/guards/permissions.guard.spec.ts` verifying `SUPER_ADMIN` allows all, `ADMIN` rejects delete with 403, and `SHOP_MANAGER` allows product delete but rejects category delete.

## 3. Admin Auth State & Context

- [x] 3.1 Implement auth API client service in `apps/admin/services/auth.ts` supporting `login`, `refreshToken`, `getProfile`, and `logout`.
- [x] 3.2 Implement `AuthProvider` and `useAuth` hook in `apps/admin/context/AuthContext.tsx` with user state, token management, and `can(module, action)` permission checker.
- [x] 3.3 Wrap `apps/admin/app/layout.tsx` with `AuthProvider` and add route protection redirecting unauthenticated users to `/login`.

## 4. Admin Login & Forgot Password Views

- [x] 4.1 Build AdminLTE 4 styled sign-in page at `apps/admin/app/login/page.tsx` with email/password validation, demo account quick-fill buttons, error feedback, and redirect to dashboard.
- [x] 4.2 Build password recovery placeholder shell at `apps/admin/app/forgot-password/page.tsx` with instructions, email field, and back-to-login navigation.
- [x] 4.3 Update `AdminNavbar.tsx` user profile dropdown to display active user's name, email, role badge, and functional logout handler.

## 5. Dynamic Navigation & Action Button Guards

- [x] 5.1 Define client-side module permissions in `apps/admin/config/permissions.ts` and update `AdminSidebar.tsx` to dynamically filter menu items based on `can(module, 'read')`.
- [x] 5.2 Update Catalog data tables (`CategoriesTable`, `BrandsTable`, `AttributesTable`, `ProductsTable`, `VariantsTable`) to conditionally render delete action buttons using `can(module, 'delete')`.
- [x] 5.3 Verify role-based UI behavior across all 3 admin roles (`superadmin`, `admin`, `shopmanager`).

## 6. Verification & Monorepo Build Check

- [x] 6.1 Run TypeScript type-checking across `apps/api` and `apps/admin` and verify zero errors.
- [x] 6.2 Run backend unit/e2e test suite (`pnpm --filter api test`) and ensure all tests pass.
- [x] 6.3 Run production build for `apps/api` and `apps/admin` and verify successful compilation.
