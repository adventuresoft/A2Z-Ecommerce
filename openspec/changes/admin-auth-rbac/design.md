# Design

## Context

The backend currently enforces authentication via JWT access and refresh tokens with a `Role` enum (`SUPER_ADMIN`, `ADMIN`, `CUSTOMER`). The admin frontend in `apps/admin` lacks an authentication entry point, meaning administrative pages are open to unauthenticated visitors and the sidebar renders all modules without role checks.

See [proposal.md](file:///c:/xampp/htdocs/office/az-ecommerce/openspec/changes/admin-auth-rbac/proposal.md) for motivation and problem statement.

## Goals / Non-Goals

**Goals:**
- Provide a dedicated `/login` page styled with AdminLTE 4 and Bootstrap 5 for administrative sign-in.
- Provide a `/forgot-password` UI shell for password recovery requests.
- Expand the PostgreSQL/Prisma `Role` enum with `SHOP_MANAGER`.
- Define a centralized Module Permission Policy Matrix:
  - `SUPER_ADMIN`: All modules, all actions (`create`, `read`, `update`, `delete`).
  - `ADMIN`: All modules, actions `create`, `read`, `update`; explicitly forbidden from `delete`.
  - `SHOP_MANAGER`: Catalog modules (CRUD on products; CRU on categories, brands, attributes); read/update on orders; no access to users or settings.
  - `CUSTOMER`: Storefront customer role only.
- Implement `@RequirePermission(module, action)` and a NestJS `PermissionsGuard` to enforce action rules server-side.
- Dynamically filter sidebar navigation items in `apps/admin` based on user module permissions.
- Hide or disable destructive "Delete" action controls on catalog data tables for users lacking `delete` privileges.
- Seed demo users for all four roles with known passwords (`superadmin@az-ecommerce.local`, `admin@az-ecommerce.local`, `shopmanager@az-ecommerce.local`, `customer@az-ecommerce.local`).

**Non-Goals:**
- Dynamic database-driven RBAC tables (`Role`, `Permission`, `RolePermission` models) — config-driven Option B was approved.
- Live SMTP email dispatch for forgot password (only the UI shell is created in this phase).
- Social login / OAuth 2.0 (Google, GitHub, Facebook).

## Decisions

### Decision 1: Config-Driven Permission Policy Matrix

- **Choice:** Define a typed permission policy mapping each `Role` to its allowed actions per module:
  ```typescript
  export type ModuleAction = 'create' | 'read' | 'update' | 'delete';
  export type AppModule = 'products' | 'categories' | 'brands' | 'attributes' | 'variants' | 'orders' | 'inventory' | 'users' | 'settings';
  
  export const ROLE_PERMISSIONS: Record<Role, Partial<Record<AppModule, ModuleAction[]>>> = {
    SUPER_ADMIN: { /* all modules have ['create', 'read', 'update', 'delete'] */ },
    ADMIN: { /* all modules have ['create', 'read', 'update'] */ },
    SHOP_MANAGER: {
      products: ['create', 'read', 'update', 'delete'],
      variants: ['create', 'read', 'update', 'delete'],
      categories: ['create', 'read', 'update'],
      brands: ['create', 'read', 'update'],
      attributes: ['create', 'read', 'update'],
      orders: ['read', 'update'],
      inventory: ['read', 'update'],
    },
    CUSTOMER: {},
  };
  ```
- **Rationale:** Simple, type-safe, extremely fast without multi-table joins, and completely satisfies the business requirement for single-vendor e-commerce.
- **Alternatives Considered:** Relational database RBAC (rejected for high overhead and premature complexity).

### Decision 2: Admin Auth State & Token Storage

- **Choice:** Use an `AuthProvider` React context in `apps/admin` backed by `localStorage` and `js-cookie` (for tokens) and synchronous state hydration. Expose `user`, `role`, `permissions`, `login`, `logout`, and helper `can(module, action)`.
- **Rationale:** Enables instant, reactive UI updates across the navigation sidebar and table action buttons, while allowing API client requests to automatically attach Bearer tokens.
- **Alternatives Considered:** NextAuth/Auth.js — rejected because existing backend already implements NestJS JWT endpoints (`/api/v1/auth/login`, `/api/v1/auth/refresh`, `/api/v1/auth/me`).

### Decision 3: Server-Side Action Protection via `@RequirePermission()`

- **Choice:** Create a custom decorator `@RequirePermission(module: AppModule, action: ModuleAction)` and a `PermissionsGuard` in `apps/api/src/auth/guards/permissions.guard.ts`.
- **Rationale:** Guarantees security enforcement at the API boundary regardless of client-side logic. For example:
  ```typescript
  @Delete(':id')
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @RequirePermission('categories', 'delete')
  async remove(@Param('id') id: string) { ... }
  ```
  If `ADMIN` calls this endpoint, the guard compares the user's role against `ROLE_PERMISSIONS` and throws HTTP 403 Forbidden because `ADMIN` lacks `delete` on `categories`.

### Decision 4: Dynamic Admin Navigation and Action Guards

- **Choice:** 
  1. In `AdminSidebar.tsx`: Filter `navigationConfig` using `can(module, 'read')` so unauthorized items are omitted from rendering.
  2. In table components: Wrap "Delete" buttons with `can(module, 'delete')` checks to prevent rendering delete actions for `ADMIN` or restricted roles.

### Decision 5: Idempotent Demo Seeding

- **Choice:** Extend `apps/api/src/prisma/seed.ts` to provision:
  - `superadmin@az-ecommerce.local` (`SUPER_ADMIN`)
  - `admin@az-ecommerce.local` (`ADMIN`)
  - `shopmanager@az-ecommerce.local` (`SHOP_MANAGER`)
  - `customer@az-ecommerce.local` (`CUSTOMER`)
  All provisioned with password `Password123!` hashed via argon2id.

## Risks / Trade-offs

- **[Risk]** Client-side token tampering or unauthorized API direct calls.  
  → **Mitigation:** Strict server-side verification using `JwtAuthGuard` and `PermissionsGuard` on every mutation and sensitive query. Client UI hides buttons for UX only; backend remains authoritative.
- **[Risk]** Token expiration during administrative use.  
  → **Mitigation:** The API client service transparently calls `/api/v1/auth/refresh` on 401 responses, rotating tokens without interrupting user work. If refresh fails, user is redirected to `/login`.
- **[Risk]** Unauthenticated access to admin routes before hydration.  
  → **Mitigation:** `AdminLayout` checks auth loading state; unauthenticated sessions are immediately redirected to `/login?returnUrl=...`.

## Migration Plan

1. Update `apps/api/prisma/schema.prisma` enum `Role` with `SHOP_MANAGER`.
2. Apply schema migration to PostgreSQL database (`pnpm --filter api exec prisma db push`).
3. Run `pnpm --filter api run seed` to provision all demo accounts.
