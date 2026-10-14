# Admin Dashboard Architecture & Design Decisions

**Date:** 2026-10-13  
**Status:** Approved  
**Related Documents:**
- [PRD.md](file:///c:/xampp/htdocs/office/az-ecommerce/docs/PRD.md)
- [admin-dashboard-design.md](file:///c:/xampp/htdocs/office/az-ecommerce/docs/admin-dashboard-design.md)
- [project-review-report.md](file:///c:/xampp/htdocs/office/az-ecommerce/docs/project-review-report.md)

---

## 1. Executive Summary

This document records the confirmed architectural, infrastructure, and frontend design decisions established during the project review and design interview. These decisions unblock the monorepo workspace, resolve runtime blockers in NestJS and Prisma 7, standardize frontend styling on AdminLTE 4 (Bootstrap 5.3), define authentication and role boundaries, and establish the OpenSpec proposal roadmap.

---

## 2. Confirmed Decision Matrix

| # | Decision Topic | Status | Approved Choice | Key Driver |
|---|---|---|---|---|
| **1** | Admin UI Styling Framework | **Approved** | **AdminLTE 4 CSS + Bootstrap 5.3 + Bootstrap Icons** (Remove Tailwind v4) | Full alignment with design spec; eliminates CSS reset conflicts; zero migration cost on empty scaffold. |
| **2** | Monorepo pnpm Workspace | **Approved** | **Unify `apps/admin` into root workspace** | Deletes nested `pnpm-workspace.yaml`; enables Turborepo caching, shared packages, and unified lockfile. |
| **3** | Backend Source Control | **Approved** | **Fold `apps/api` into root monorepo** | Removes empty submodule/gitlink risk; enables atomic full-stack commits across API, DB, and Admin. |
| **4** | Tooling & Version Alignment | **Approved** | **Harmonize across workspaces** (React 19.3, Next 16.4, TS 6.0.x, ESLint 9.x) | Eliminates duplicate React runtime conflicts, decorator metadata bugs, and compiler discrepancies. |
| **5** | Prisma 7 & Database Runtime | **Approved** | **Prisma 7 + `@prisma/adapter-pg` + `pg`**; fix ESM `.js` imports | Unblocks API startup; complies with Prisma 7 driver adapter requirement on PostgreSQL 18. |
| **6** | Telemetry & Environment Config | **Approved** | **Remove `@nestjs/observe`**; add `@nestjs/config` with strict validation | Stops unauthorized third-party telemetry calls; enforces secret hygiene and schema validation. |
| **7** | Local Development Ports | **Approved** | **Web: 3000, API: 3001, Admin: 3002**; Retire `apps/docs` | Deterministic URLs prevent CORS breakages; removes redundant template starter app. |
| **8** | Auth & Authorization Model | **Approved** | **Structured Role Enum (`SUPER_ADMIN`, `ADMIN`, `CUSTOMER`)** | Avoids premature dynamic RBAC database complexity; fast JWT validation with NestJS `@Roles()` guard. |
| **9** | Admin Navigation & Scope | **Approved** | **Pruned Navigation + Phased Menu Activation** | Matches PRD scope (removes "Discounts" & "Roles/Permissions"); clean status shell for pending modules. |
| **10** | OpenSpec Sequence & Slices | **Approved** | **Phased Atomic OpenSpec Proposals** | Workspace Repair → Backend Foundation → Admin Layout & Auth → Vertical Slice: Categories CRUD. |

---

## 3. Detailed Decision Records

### Decision 1: Admin UI Styling & Component Framework
- **Approved Decision:** Remove Tailwind CSS v4 and `@tailwindcss/turbopack` from `apps/admin`. Install `admin-lte@4.10.0`, `bootstrap@^5.3.8`, and `bootstrap-icons@^1.13.2`. Build clean, accessible React components (`AdminLayout`, `Sidebar`, `Navbar`, `Card`, `DataTable`) to manage interactive UI state natively in React.
- **Rationale:** [admin-dashboard-design.md](file:///c:/xampp/htdocs/office/az-ecommerce/docs/admin-dashboard-design.md) mandates AdminLTE as the primary reference and explicitly forbids competing CSS frameworks. Mixing Tailwind v4 Preflight with Bootstrap Reboot causes severe styling conflicts. Because `apps/admin` is currently an untouched starter scaffold, replacing Tailwind with AdminLTE CSS incurs zero rework cost. AdminLTE vanilla JS scripts will not be loaded into the DOM; React state hooks will control all interactive toggles.
- **Alternatives Considered:**
  - *Keep Tailwind v4 and recreate AdminLTE styles manually:* Rejected due to high ongoing authoring overhead and divergence from the tested AdminLTE visual hierarchy.
  - *Dual Framework Hybrid:* Rejected due to bundle bloat, specificity clashes, and rule violation.
- **Implementation Implications:**
  - Strip Tailwind directives from `apps/admin/app/globals.css`.
  - Import Bootstrap 5 and AdminLTE 4 SCSS/CSS in the admin root layout.
  - Implement React state components for sidebar collapse/drawer, navigation treeview, and dropdown menus.

---

### Decision 2: Monorepo pnpm Workspace Integration
- **Approved Decision:** Delete `apps/admin/pnpm-workspace.yaml`. Move any required workspace settings and `allowBuilds` directives into the root configuration. Re-sync workspace dependencies using root `pnpm install`.
- **Rationale:** `apps/admin` was treated as an isolated workspace root by pnpm, causing it to be omitted from the root `pnpm-lock.yaml`. Turborepo could not coordinate its tasks, and shared packages (`@repo/ui`, `@repo/typescript-config`) could not be resolved.
- **Alternatives Considered:**
  - *Keep `apps/admin` isolated with its own dedicated lockfile:* Rejected because it fragments dependencies, duplicates disk space, and prevents sharing validation schemas or DTO interfaces across apps.
- **Implementation Implications:**
  - Remove `apps/admin/pnpm-workspace.yaml`.
  - Add `apps/admin` as an importer in the root `pnpm-lock.yaml`.
  - Ensure `turbo dev` and `turbo build` orchestrate `admin` alongside `api` and `web`.

---

### Decision 3: Backend Source Control (`apps/api` Structure)
- **Approved Decision:** Fold `apps/api` directly into the root monorepo by removing its internal `.git` folder and untracked gitlink pointer, committing all API source files directly to the root repository.
- **Rationale:** `apps/api` was tracked as a mode `160000` gitlink without a `.gitmodules` configuration. Anyone performing a fresh git clone received an empty `apps/api` directory. Folding it into the root monorepo matches [PRD.md §2](file:///c:/xampp/htdocs/office/az-ecommerce/docs/PRD.md#L22) ("Modular Monolith") and enables atomic commits spanning backend Prisma migrations, NestJS endpoints, and Next.js admin screens.
- **Alternatives Considered:**
  - *Formal Git Submodule:* Rejected because it introduces detached HEAD states, recursive clone requirements, and disjointed multi-repo pull requests for full-stack features.
- **Implementation Implications:**
  - Remove `apps/api/.git`.
  - Remove git index entry for the gitlink: `git rm --cached apps/api`.
  - Stage and commit all `apps/api` source code in the root repository.

---

### Decision 4: Tooling & Version Harmonization
- **Approved Decision:** Align all applications and packages on **React 19.3.0**, **Next.js 16.4.0**, **TypeScript 6.0.x**, and **ESLint 9.x**. Disable experimental `cacheComponents` in `apps/admin/next.config.ts`.
- **Rationale:** Resolves version fragmentation across workspaces (TS 5.9 vs 6.0 vs 7.0; React 19.3 vs 19.2; Next 16.4 vs 16.3). Standardizing TypeScript on 6.0.x guarantees decorator compatibility required by NestJS 12 and `@nestjs/swagger` while supporting Next.js 16 App Router. Disabling `cacheComponents` prevents auth cookie caching issues.
- **Alternatives Considered:**
  - *Retain independent workspace versions:* Rejected because pnpm instantiates multiple React copies, causing runtime hook crashes when consuming shared UI packages.
- **Implementation Implications:**
  - Update `package.json` in root and apps to target uniform versions.
  - Clean `apps/admin/next.config.ts` of unneeded experimental flags.

---

### Decision 5: Prisma 7 Runtime, Driver Adapter & ESM Imports
- **Approved Decision:** Retain Prisma 7.10.0, install `@prisma/adapter-pg` and `pg` (with `@types/pg`), update `PrismaService` to initialize `PrismaPg` connection pooling, and standardize explicit `.js` import paths across `apps/api/src/prisma/*`.
- **Rationale:** Resolves the runtime startup crash `PrismaClientInitializationError: A driver adapter is required` and fixes Node ESM module resolution (`ERR_MODULE_NOT_FOUND`). Connects cleanly to the running local PostgreSQL 18 service (`postgresql-x64-18` on port 5432).
- **Alternatives Considered:**
  - *Downgrade to Prisma 6:* Rejected because Prisma 7 is already declared and its driver adapter pattern provides superior connection management and smaller runtime footprints.
- **Implementation Implications:**
  - Add `@prisma/adapter-pg` and `pg` to `apps/api/package.json`.
  - Refactor `PrismaService` to construct a `pg.Pool` and pass the `PrismaPg` adapter to `new PrismaClient({ adapter })`.
  - Add explicit `.js` extensions to relative import specifiers in ESM TypeScript source files.

---

### Decision 6: Telemetry Removal & Environment Validation
- **Approved Decision:** Uninstall `@nestjs/observe` completely. Install `@nestjs/config` and configure strict environment variable validation on startup using `class-validator` / `zod`.
- **Rationale:** Stops unauthorized HTTP requests to external telemetry collectors containing dummy placeholder keys (`YOUR_APP_KEY`). Ensures critical environment variables (`DATABASE_URL`, `JWT_SECRET`, `PORT`, `CORS_ORIGIN`) are verified at application boot before accepting traffic.
- **Alternatives Considered:**
  - *Retain `@nestjs/observe` with `.env` keys:* Rejected as premature; the project does not currently require commercial third-party APM tooling.
- **Implementation Implications:**
  - Remove `@nestjs/observe` from `apps/api/package.json` and `app.module.ts`.
  - Configure `ConfigModule.forRoot({ isGlobal: true, validate })`.

---

### Decision 7: Local Development Ports & Service Cleanliness
- **Approved Decision:** Lock in deterministic local dev ports:
  - **Storefront (`apps/web`):** `http://localhost:3000` (`next dev -p 3000`)
  - **Backend API (`apps/api`):** `http://localhost:3001` (Global prefix `/api/v1`, Swagger at `/api/docs`)
  - **Admin Dashboard (`apps/admin`):** `http://localhost:3002` (`next dev -p 3002`)
  - **Retire `apps/docs`:** Remove the redundant Turborepo template starter app.
- **Rationale:** Prevents port collision crashes during `turbo dev`. Eliminates CORS failures caused by unstable auto-assigned ports. Removing `apps/docs` declutters the repository since all architectural documentation lives in root `/docs/*.md`.
- **Alternatives Considered:**
  - *Retain `apps/docs` on port 3003:* Rejected because it duplicates documentation overhead and adds build lag without business purpose.
- **Implementation Implications:**
  - Update `dev` scripts in `apps/admin/package.json` and `apps/web/package.json`.
  - Delete `apps/docs` folder and remove from workspace.
  - Whitelist origins `http://localhost:3000` and `http://localhost:3002` in NestJS CORS settings.

---

### Decision 8: Admin Authentication & Role/Permission Model
- **Approved Decision:** Implement structured **Role Enum (`SUPER_ADMIN`, `ADMIN`, `CUSTOMER`)** stored on the `User` table, secured via JWT access/refresh tokens and NestJS `@Roles()` guard.
- **Rationale:** A single-vendor e-commerce platform requires clear separation between administrative control and customer shopping. Dynamic relational RBAC (tables for `Role`, `Permission`, `RolePermission`, `UserRole`) introduces premature complexity, slow DB joins, and extensive permission-management UI screens before core sales features are even built. Role enums embedded in signed JWT tokens provide instant, zero-DB-lookup authorization.
- **Alternatives Considered:**
  - *Full Dynamic Relational RBAC:* Rejected as over-engineering for single-vendor v1; can be introduced later if departmental staff permissions are required.
- **Implementation Implications:**
  - Define `enum Role { SUPER_ADMIN, ADMIN, CUSTOMER }` in Prisma schema.
  - Implement `RolesGuard` and `@Roles()` decorator in NestJS.
  - Build Admin login flow verifying `role === 'SUPER_ADMIN' || role === 'ADMIN'`.

---

### Decision 9: Admin Navigation Structure & Phased Activation
- **Approved Decision:** Adopt the pruned navigation tree (removing "Discounts" and replacing dynamic "Roles & Permissions" with "Admin Users"). Implement **Phased Menu Activation** with clear visual status indicators and standard AdminLTE status shells for upcoming phases, avoiding dead 404 links.
- **Rationale:** Matches [PRD.md §5](file:///c:/xampp/htdocs/office/az-ecommerce/docs/PRD.md) exactly while adhering to [admin-dashboard-design.md §5](file:///c:/xampp/htdocs/office/az-ecommerce/docs/admin-dashboard-design.md#L98-L107) prohibiting fake business features or dead navigation links.
- **Approved Navigation Tree:**
  - **Dashboard:** Overview
  - **Catalog:** Products, Categories, Brands, Attributes, Product Variants
  - **Orders:** Orders (Order Details & Returns handled within Order view)
  - **Inventory:** Stock Overview, Stock Adjustments, Movements, Low Stock
  - **Customers:** Customer List, Customer Details
  - **Marketing:** Coupons
  - **Payments:** Transactions, Refunds
  - **Shipping:** Shipments, Shipping Methods, Shipping Zones
  - **Engagement:** Reviews (Moderation), Notifications
  - **Reports:** Sales, Orders, Inventory, Customers
  - **System:** Admin Users, Store Settings, Activity Logs
- **Implementation Implications:**
  - Configure navigation config data structure with phase tags.
  - Render implemented routes with full live data; render pending modules with an honest status placeholder shell.

---

### Decision 10: OpenSpec Proposal Sequence & Implementation Roadmap
- **Approved Decision:** Execute delivery through **Phased Atomic OpenSpec Proposals**:
  1. **Phase 0 (Environment & Repository Repair):** Unify `admin` workspace, fold `api` into root git repo, delete `apps/docs`, synchronize versions, run `pnpm install`, and run `openspec init`.
  2. **OpenSpec Proposal 1 (Backend Core Foundation):** ESM import fixes, `@prisma/adapter-pg` + `pg`, `@nestjs/config` env validation, `/api/v1` prefix, Swagger, global validation pipe, CORS, helmet, unified error responses, and `/health`.
  3. **OpenSpec Proposal 2 (Admin UI Foundation & Auth Shell):** AdminLTE 4 CSS + Bootstrap 5.3 + Bootstrap Icons layout, React state components (`AdminLayout`, `Sidebar`, `Navbar`), token plan, and admin login screen connected to NestJS JWT auth.
  4. **OpenSpec Proposal 3 (First Vertical Business Slice — Categories CRUD):** Prisma schema migration, NestJS Category endpoints, Swagger documentation, and AdminLTE Category management data table & form.
- **Rationale:** Guarantees zero regressions, reviewable increments, and verified stability at every step.
