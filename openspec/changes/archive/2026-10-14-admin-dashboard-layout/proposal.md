# Proposal

## Why

The administrative application (`apps/admin`) currently contains only a basic placeholder page and root layout stub without a structured navigation system, page chrome, or responsive layout shell. A standardized, reusable layout using the approved AdminLTE 4 and Bootstrap 5 design is required to support forthcoming back-office operational modules (Catalog, Orders, Inventory, Customers) with consistent navigation, breadcrumbs, responsive drawer behavior, and user profile controls.

## What Changes

- Introduce a reusable `AdminLayout` wrapper component implementing AdminLTE 4 HTML and CSS conventions (`app-wrapper`, `app-header`, `app-sidebar`, `app-main`, `app-footer`).
- Implement native React state and context management (`AdminLayoutContext`) for desktop sidebar collapse and mobile off-canvas drawer toggling without third-party DOM-manipulating jQuery/vanilla plugins.
- Introduce a centralized, typed navigation configuration (`nav-config.ts`) reflecting the approved single-vendor e-commerce information architecture (Dashboard, Catalog, Orders, Inventory, Customers, Marketing, Payments, Shipping, Reports, System).
- Implement modular layout sub-components: `AdminSidebar`, `AdminNavbar`, `PageHeader`, `Breadcrumbs`, and `AdminFooter`.
- Implement dynamic breadcrumbs and page header titles resolved automatically from the current active route and navigation configuration.
- Implement **Phased Menu Activation** with an honest AdminLTE status shell component for routes scheduled in future phases, preventing broken 404 links.
- Create a sample Dashboard Overview page (`/` or `/dashboard`) to verify layout responsiveness, active menu state, and content presentation.

## Capabilities

### New Capabilities
- `admin-layout`: Provides a reusable, accessible, and responsive administrative shell adhering to AdminLTE 4 design guidelines, featuring centralized hierarchical navigation, dynamic header and breadcrumbs, collapsible sidebar with desktop/mobile drawer support, user profile actions, and a phased activation status shell for upcoming modules.

### Modified Capabilities
None. (Existing capabilities `api-core` and `user-auth` remain unchanged).

## Impact

- **Affected Code:** `apps/admin/app/layout.tsx`, `apps/admin/app/page.tsx`, and new components under `apps/admin/components/layout/` and navigation configs under `apps/admin/config/`.
- **Dependencies:** Relies on already-installed `admin-lte@4.10.0`, `bootstrap@^5.3.8`, and `bootstrap-icons@^1.13.2`. No new external packages or CSS frameworks are introduced.
- **APIs & Other Apps:** Zero impact on `apps/api` or `apps/web`.
