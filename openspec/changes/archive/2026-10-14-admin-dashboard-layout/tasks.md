# Tasks

## 1. Navigation Configuration & State Context

- [x] 1.1 Create `apps/admin/config/navigation.ts` defining the complete hierarchical navigation structure (Dashboard, Catalog, Orders, Inventory, Customers, Marketing, Payments, Shipping, Reports, System) with typed interfaces and a `getBreadcrumbs` lookup utility. Verify with `pnpm --filter admin check-types`.
- [x] 1.2 Create `apps/admin/components/layout/AdminLayoutContext.tsx` providing pure React state management for desktop sidebar collapse, mobile drawer toggling, resize listener, and `Escape` key backdrop dismissal. Verify component exports and type safety.

## 2. Layout Components Implementation

- [x] 2.1 Implement `apps/admin/components/layout/AdminNavbar.tsx` featuring the sidebar toggle trigger, quick search input, notification icon with alert badge, user profile menu, and sign-out button. Verify rendering matches AdminLTE 4 header classes.
- [x] 2.2 Implement `apps/admin/components/layout/AdminSidebar.tsx` rendering the brand header, hierarchical nav tree, active route highlighting using `usePathname()`, expandable parent groups, and phase badges. Verify active state updates when changing routes.
- [x] 2.3 Implement `apps/admin/components/layout/Breadcrumbs.tsx` and `PageHeader.tsx` resolving title and breadcrumb trail automatically from navigation config. Verify breadcrumbs render correctly for root and nested paths.
- [x] 2.4 Implement `apps/admin/components/layout/AdminFooter.tsx` and compose `AdminLayout.tsx` assembling `app-wrapper`, `AdminNavbar`, `AdminSidebar`, `PageHeader`, `app-main`, and mobile backdrop overlay. Verify HTML structure matches AdminLTE 4 specifications.

## 3. Phased Status Shell & Sample Dashboard

- [x] 3.1 Implement `apps/admin/components/layout/ModuleStatusShell.tsx` displaying an informative AdminLTE status card for future-phase modules without dead 404 links.
- [x] 3.2 Update `apps/admin/app/layout.tsx` to wrap administrative pages within `AdminLayoutProvider` and `AdminLayout`.
- [x] 3.3 Create a sample operational Dashboard Overview in `apps/admin/app/page.tsx` featuring key operational stat cards (Orders, Products, Customers, Low Stock) and quick actions with AdminLTE styling.
- [x] 3.4 Implement route placeholders for secondary modules (e.g. `/catalog/categories`, `/orders`, `/inventory`, `/customers`, `/marketing/coupons`, `/settings`) utilizing `ModuleStatusShell` to verify full navigation tree links.

## 4. Verification & Build Validation

- [x] 4.1 Run TypeScript type checking (`pnpm --filter admin check-types`) across `apps/admin` and verify zero errors.
- [x] 4.2 Run ESLint (`pnpm --filter admin lint`) across `apps/admin` and verify zero warnings or errors.
- [x] 4.3 Run Next.js production build (`pnpm --filter admin build`) and verify successful static and dynamic page generation with zero SSR hydration issues.
- [x] 4.4 Verify live dev server behavior on `http://localhost:3002` (desktop sidebar toggle, mobile drawer overlay, route navigation, and breadcrumb updates).
