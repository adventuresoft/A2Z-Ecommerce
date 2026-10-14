# Design

## Context

See [proposal.md](proposal.md) for motivation and [specs/admin-layout/spec.md](specs/admin-layout/spec.md) for normative requirements.

`apps/admin` is a Next.js 16 App Router application with React 19 and TypeScript 6. Tailwind CSS v4 has been removed, and `admin-lte@4.10.0`, `bootstrap@^5.3.8`, and `bootstrap-icons@^1.13.2` are imported globally in `app/layout.tsx`. The current application contains only a minimal placeholder card without structural layout components.

## Goals / Non-Goals

**Goals:**
- Provide a reusable `AdminLayout` wrapper component conforming to AdminLTE 4 DOM hierarchy and CSS classes.
- Implement native React state management (`AdminLayoutContext` / `useSidebar`) for sidebar collapse, mobile drawer expansion, and overlay backdrop handling without external vanilla JS plugins.
- Centralize navigation items in a typed `navigation.ts` configuration supporting hierarchical menus, active route detection, and phased activation badges.
- Deliver modular sub-components: `AdminNavbar`, `AdminSidebar`, `PageHeader`, `Breadcrumbs`, and `AdminFooter`.
- Implement dynamic breadcrumbs and page titles derived automatically from current route path.
- Provide a clean `ModuleStatusShell` component for routes scheduled in later development phases.
- Create a sample Dashboard Overview page verifying layout responsiveness, collapse behavior, and component integration.

**Non-Goals:**
- Do not build full business modules (Categories CRUD, Product editor, Order processing) in this change; those belong to subsequent atomic vertical slices.
- Do not load AdminLTE DOM-manipulating jQuery or vanilla JS scripts into the Next.js runtime.
- Do not hardcode fictitious business analytics as live production data.

## Decisions

### Decision 1: Pure React State Architecture for AdminLTE 4 Shell
- **Choice:** Manage sidebar collapse and mobile drawer states entirely using React state inside a client-side `AdminLayoutProvider` context, synchronizing the appropriate CSS classes (`sidebar-collapse`, `sidebar-open`) to `document.body` or layout wrapper via a `useEffect` hook.
- **Rationale:** AdminLTE 4 provides pure CSS layout classes (`layout-fixed`, `sidebar-expand-lg`, `sidebar-collapse`, `sidebar-open`). Relying on external DOM scripts causes hydration mismatch errors, stale DOM nodes, and conflicts with Next.js client transitions.
- **Alternatives Considered:**
  - *AdminLTE Vanilla JS Bundle (`adminlte.min.js`):* Rejected due to hydration mismatch, lack of SSR compatibility, and uncontrolled DOM mutations.
  - *CSS-only Checkbox Hack:* Rejected because accessibility, Escape key listeners, and programmatic route-change collapses are difficult to manage cleanly.

### Decision 2: Centralized Hierarchical Navigation Specification
- **Choice:** Define a single source of truth for administrative navigation in `apps/admin/config/navigation.ts`. Each item specifies:
  - `id`: unique identifier
  - `title`: display label
  - `href`: target path (optional for grouping parents)
  - `icon`: Bootstrap icon class string (e.g., `bi bi-speedometer2`)
  - `children`: optional array of nested `NavItem`s
  - `phase`: number (1 = active/current, 2+ = planned)
  - `badge`: optional badge text and variant
- **Rationale:** Decouples layout presentation from navigation data. Enables centralized active-route detection, breadcrumb path traversal, and authorization filtering.
- **Alternatives Considered:**
  - *Hardcoded markup in Sidebar component:* Rejected due to high maintenance overhead and duplicated route logic across breadcrumbs and sidebar.

### Decision 3: Automatic Breadcrumb Resolution
- **Choice:** Build a utility `getBreadcrumbs(pathname, navItems)` that traverses the navigation tree to resolve the ancestor path and active item title automatically.
- **Rationale:** Eliminates tedious manual breadcrumb definitions on individual pages while allowing optional custom overrides via `PageHeader` props when deeper entity detail pages (e.g., `/catalog/categories/[id]`) require dynamic entity names.

### Decision 4: Phased Menu Activation and Status Shell
- **Choice:** Unimplemented menu items link to their respective routes (e.g. `/orders`, `/inventory`), which render a standard AdminLTE `ModuleStatusShell` displaying the module's target phase, PRD alignment summary, and return link.
- **Rationale:** Fulfills [docs/admin-dashboard-design.md §6](file:///c:/xampp/htdocs/office/az-ecommerce/docs/admin-dashboard-design.md#L153) and [docs/admin-dashboard-decisions.md Decision 9](file:///c:/xampp/htdocs/office/az-ecommerce/docs/admin-dashboard-decisions.md#L137): avoids dead 404 links while presenting honest development progress without mocking non-existent business metrics.

## Risks / Trade-offs

- **[Risk] Hydration Flash during Sidebar State Hydration** → Mitigate by defaulting to the standard desktop-expanded layout on initial server render, applying saved `localStorage` collapsed state in a `useEffect` hook without blocking layout display.
- **[Risk] Mobile Drawer Accessibility & Trapped Focus** → Mitigate by attaching an `Escape` key listener, providing a visible close button and backdrop click handler, and automatically collapsing the drawer when a navigation link is clicked.
- **[Risk] Route Mismatch on Nested Paths** → Mitigate by matching active items using prefix/exact comparison against `usePathname()`, ensuring parent dropdowns automatically expand when a child route is active.

## Migration Plan

1. Create layout components and navigation configuration in `apps/admin`.
2. Update `apps/admin/app/layout.tsx` to wrap children with `AdminLayoutProvider` and render `AdminLayout`.
3. Update `apps/admin/app/page.tsx` to render the initial operational Dashboard overview inside `AdminLayout`.
4. Add placeholder status routes for pending modules.
5. Run lint, type check (`tsc --noEmit`), and build (`pnpm --filter admin build`) to verify clean compilation.
