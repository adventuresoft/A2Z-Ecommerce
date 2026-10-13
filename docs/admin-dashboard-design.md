# Admin Dashboard Design Specification
**Project:** Single-Vendor E-commerce  
**Frontend:** Next.js + React + TypeScript  
**Backend:** NestJS REST API  
**Primary design reference:** AdminLTE  
**Design skill:** `.agents\skills\frontend-design\SKILL.md`

---

## 1. Purpose and Scope

Design a professional, responsive, maintainable admin dashboard for the single-vendor physical-products e-commerce application.

This document defines the admin UI/UX direction and implementation constraints. It complements `docs/PRD.md`; it does **not** replace the PRD, redefine business rules, or authorize unrelated features.

### Source-of-truth rules

1. `docs/PRD.md` is the source of truth for business requirements, roles, workflows, and feature scope.
2. This file is the source of truth for admin UI/UX design expectations.
3. The existing repository is the source of truth for current framework versions, routes, dependencies, architecture, and implemented functionality.
4. The installed `frontend-design` skill provides additional design guidance; inspect and follow its actual instructions rather than assuming what it contains.
5. When these sources conflict, report the conflict and ask for clarification instead of silently choosing one.

## 2. Mandatory Pre-Implementation Review

**Do not begin a full redesign or install packages immediately.** First inspect and report:

1. Repository structure and the location of the actual admin frontend.
2. Next.js, React, TypeScript, styling, routing, and package-manager versions.
3. Existing admin layouts, pages, shared components, CSS conventions, and authentication flow.
4. Existing API client, environment configuration, and NestJS endpoint availability.
5. Whether the `frontend-design` skill is installed, where it is available, and its relevant instructions.
6. The AdminLTE version and whether its assets/components are compatible with the existing Next.js/React setup.
7. Required dependency or configuration changes, including any compatibility risks.
8. A proposed layout, navigation, component plan, affected files, and implementation sequence.

Wait for approval before major UI changes, dependency changes, or broad refactoring.

> Installing `frontend-design` does not automatically install AdminLTE. Verify both separately.

## 3. Design Direction

Use AdminLTE as the primary layout and component reference, adapted to the current application rather than copied blindly.

The interface should be:

- Professional, clear, and suitable for daily business operations.
- Consistent in typography, spacing, buttons, forms, tables, icons, and status indicators.
- Compact but readable, especially on data-heavy pages.
- Responsive on desktop, tablet, and mobile.
- Accessible by keyboard, with visible focus, readable labels, and adequate contrast.
- Built from reusable components where reuse provides real value.
- Focused on real e-commerce workflows, not decorative dashboard widgets.

Avoid excessive gradients, unnecessary animation, oversized cards, inconsistent styling, fake business metrics, and non-functional controls.

## 4. Technology and Compatibility Rules

- Follow the existing Next.js, React, and TypeScript architecture.
- Select an AdminLTE version only after inspecting compatibility with the current project.
- Use only the Bootstrap version, CSS assets, and icon library compatible with the selected AdminLTE version.
- Do not add a competing admin template or a second CSS framework without approval.
- Do not assume that an AdminLTE package designed for a different framework can be imported directly into Next.js.
- Reuse the project's existing UI libraries and utilities when suitable.
- Do not add dependencies unless the need and compatibility are documented.
- Keep the customer-facing storefront and NestJS backend unaffected unless a separately approved requirement demands a change.

If direct AdminLTE integration is unsuitable, explain the trade-offs and propose the smallest compatible approach before implementation.

## 5. Admin Application Layout

Use the compatible AdminLTE layout conventions, adapted to the existing app:

- Application wrapper
- Top navigation bar
- Sidebar navigation
- Main content wrapper
- Page title and optional description
- Breadcrumbs when useful
- Main content area
- Optional footer, only if appropriate

### Top navigation

Include only useful, implemented features:

- Sidebar toggle
- Application logo/name or page context
- Global search, if required by the PRD
- Notifications, if supported
- Authenticated administrator profile menu
- Profile/account settings, if supported
- Logout

Do not render controls that have no working action.

### Sidebar behavior

- Group related modules under clear labels.
- Use consistent icons from the chosen icon library.
- Highlight the active route.
- Support expandable/collapsible groups.
- Preserve usable navigation on smaller screens.
- Build navigation from actual or explicitly approved routes.
- Do not create routes or menu entries for imaginary features just to fill the sidebar.
- Show menu items according to the approved authorization design, while relying on backend authorization for security.

## 6. Proposed Navigation — Validate Against the PRD

The following is a **candidate structure**, not a mandate to build every item. Confirm each module against `docs/PRD.md` and the repository before finalizing it.

- **Dashboard**
  - Overview
- **Catalog**
  - Products
  - Categories
  - Brands
  - Attributes
  - Product Variants
- **Orders**
  - Orders
  - Order Details (usually accessed from an order)
  - Returns, if supported
- **Inventory**
  - Stock Overview
  - Stock Adjustments
  - Stock Movements
  - Low Stock
- **Customers**
  - Customer List
  - Customer Details (usually accessed from a customer)
- **Marketing**
  - Coupons
  - Discounts
- **Payments**
  - Transactions
  - Payment History
  - Refunds
- **Shipping**
  - Shipments
  - Shipping Methods
  - Shipping Zones
- **Engagement**
  - Reviews
  - Notifications
- **Reports**
  - Sales Reports
  - Order Reports
  - Inventory Reports
  - Customer Reports
- **System**
  - Users
  - Roles and Permissions
  - Settings
  - Activity Logs

### Navigation decision rule

For each proposed item, classify it as:

- **Existing:** route and functionality already exist.
- **Required:** included in the PRD but not yet implemented.
- **Proposed:** potentially useful, but not confirmed in the PRD.

Only Existing and approved Required items should be exposed as active navigation. Keep Proposed items out of the live sidebar until approved.

## 7. Dashboard Overview

Build an operational overview, not a collection of decorative cards.

### Candidate summary metrics

Use only metrics supported by business requirements and available APIs:

- Total Sales
- Total Orders
- Pending Orders
- Total Customers
- Total Products
- Low-Stock Products

### Candidate dashboard sections

- Sales trend chart
- Recent orders
- Best-selling products
- Low-stock alerts
- Order status summary
- Recent administrative activity, only if suitable activity/audit data exists

### Data rules

- Use real backend data when the required endpoint exists.
- Define each metric's meaning, currency, and date range.
- Do not present mock values as live business data.
- If data is unavailable, show a clear loading, empty, unavailable, or explicitly labelled preview state.
- Avoid duplicating the same metric without a clear purpose.
- Provide accessible labels or a text alternative for charts.
- Format currency, dates, and numbers consistently with project conventions and business requirements.

## 8. Standard Page Patterns

### 8.1 List and table pages

Use a consistent pattern for products, orders, customers, inventory, payments, shipments, coupons, and reviews where those modules exist:

- Page title and concise description when helpful
- Primary action, if the user has permission
- Search
- Relevant filters and sorting
- Clear column labels
- Status badges with readable text
- Row actions appropriate to the record and current status
- Pagination and result count
- Loading, empty, error, and success feedback

Use server-side search, filtering, sorting, and pagination when supported by the API. Do not fetch every record into the browser for large datasets without a justified reason.

On small screens, choose a deliberate strategy such as horizontal table scrolling or a compact card view. Avoid page-wide horizontal overflow.

### 8.2 Create and edit forms

- Group related fields into logical sections.
- Use visible labels and appropriate input types.
- Indicate required fields.
- Display validation messages near the relevant field.
- Preserve entered values when validation fails where appropriate.
- Disable duplicate submission while a save is in progress.
- Provide clear success and failure feedback.
- Include Save and Cancel actions.
- Warn about unsaved changes when appropriate.
- Confirm destructive actions before committing them.

### 8.3 Detail pages

- Present key entity information clearly.
- Show status and important dates.
- Display related records when useful and available.
- Show only actions allowed for the current user's permissions and the record's current status.
- Display history/audit information only when supported by the application.

For orders, keep order status, payment status, and shipment status visually distinct.

### 8.4 Inventory pages

Where inventory functionality exists:

- Make available stock and low-stock warnings easy to understand.
- Present stock adjustments and movement history clearly.
- Confirm stock-changing actions.
- Show the result of a successful or failed operation.
- Do not imply a stock change before the backend confirms it.

## 9. Reusable Component Strategy

Reuse existing components first. Create shared components only where they improve consistency and maintainability.

Potential shared components:

- `AdminLayout`
- `AdminSidebar`
- `AdminNavbar`
- `PageHeader`
- `Breadcrumbs`
- `StatCard`
- `DataTable`
- `SearchFilterBar`
- `Pagination`
- `StatusBadge`
- `FormField`
- `ConfirmDialog`
- `EmptyState`
- `LoadingState`
- `ErrorState`
- `NotificationDropdown`
- `UserProfileMenu`

The names above are suggestions, not mandatory files. Follow repository naming conventions and avoid premature abstraction.

## 10. Responsive Design

Support desktop, tablet, and mobile layouts using the actual breakpoint behavior of the selected AdminLTE/Bootstrap version.

- **Desktop:** persistent or collapsible sidebar; full data tables where space allows.
- **Tablet:** collapsible sidebar, compact spacing, and usable table controls.
- **Mobile:** sidebar drawer/overlay, vertically stacked forms, accessible primary actions, and deliberate table overflow or compact presentation.
- Keep critical status information and actions accessible.
- Ensure dropdowns and dialogs fit within the viewport.
- Prevent accidental horizontal page overflow.

Do not hard-code breakpoint assumptions that conflict with the selected framework's conventions.

## 11. Visual System and Accessibility

Start with the selected AdminLTE theme and customize only where necessary.

Keep consistent values for:

- Primary and secondary colors
- Success, warning, danger, and informational states
- Typography and text hierarchy
- Spacing
- Borders and radii
- Shadows
- Focus indicators

Accessibility requirements:

- Use semantic HTML and properly associated form labels.
- Provide visible keyboard focus.
- Maintain sufficient contrast.
- Give icon-only buttons accessible names and tooltips where useful.
- Ensure menus, dialogs, and dropdowns support keyboard interaction.
- Never communicate status through color alone.
- Respect reduced-motion preferences where animations are used.
- Show clear validation, loading, empty, success, and failure feedback.

Implement light/dark mode only if compatible, useful, and fully functional. Do not add a decorative theme toggle that does not work.

## 12. Frontend Architecture and API Integration

Follow existing project conventions for:

- Routing and layouts
- Authentication and route protection
- API clients/services
- Types and validation schemas
- State management and hooks
- Shared UI components
- Feature-specific pages and components
- Navigation configuration

API integration rules:

- Use the existing API base URL and environment configuration.
- Use the existing authentication/token-handling flow.
- Type API responses and form data with TypeScript.
- Keep API access separate from presentation components where practical.
- Handle loading, success, empty, validation, and server-error responses.
- Respect backend permissions; hiding a menu item is not a security boundary.
- Treat server-side validation as authoritative.
- Do not hardcode credentials, tokens, or business data.
- Do not fabricate endpoints, persistence, or successful API responses.
- If an endpoint is missing, document it as a dependency/blocker rather than pretending integration is complete.

## 13. Implementation Workflow

Use the project's established process for substantial work:

1. Read `docs/PRD.md` and this design specification.
2. Inspect the repository, dependencies, routes, and existing components.
3. Inspect the installed `frontend-design` skill and relevant instructions.
4. Check AdminLTE/Bootstrap compatibility and available templates/examples.
5. Compare the proposed navigation and dashboard widgets against the PRD.
6. Identify existing, required, and proposed functionality.
7. Present the design plan, affected files, dependency changes, risks, and implementation sequence.
8. Use GRILL-ME to clarify major ambiguities when needed.
9. Use OpenSpec to propose and approve substantial changes according to the project's workflow.
10. Implement the shared layout and navigation first.
11. Build one representative vertical slice, such as the dashboard overview, before expanding.
12. Integrate existing API endpoints and clearly document missing endpoints.
13. Review the result against this specification and the PRD.
14. Test responsive behavior, navigation, forms, permissions, and API states.
15. Run available lint, type-check, test, and build commands.
16. Fix failures and report any remaining limitations.

Do not implement the entire admin panel in one unreviewed operation.

## 14. Implementation Boundaries

- Do not replace working application logic only to match a visual example.
- Do not introduce Laravel Blade or another frontend framework into the Next.js frontend.
- Do not make unrelated changes to the storefront or NestJS API.
- Do not install packages or alter configuration before checking compatibility and explaining the need.
- Do not add unsupported modules to the sidebar.
- Do not present mock data as real.
- Do not claim tests passed unless they were actually run.
- Keep changes scoped and reviewable.

## 15. Acceptance Criteria

The implementation is acceptable when:

- The UI follows a coherent AdminLTE-inspired design using a version compatible with the project.
- The `frontend-design` skill instructions have been inspected and applied where relevant.
- Navigation reflects actual or approved features and highlights active routes correctly.
- Layout, tables, forms, statuses, and actions are consistent across pages.
- Shared components are reused appropriately without unnecessary abstraction.
- Dashboard values come from real APIs or are clearly identified as preview/unavailable states.
- Loading, empty, error, validation, and success states are handled.
- Desktop, tablet, and mobile layouts remain usable.
- Keyboard navigation, focus indicators, form labels, and status contrast meet basic accessibility expectations.
- Authentication and backend authorization remain intact.
- Existing storefront and backend functionality remain unaffected.
- Relevant linting, type-checking, tests, and build checks are run and their results reported honestly.

## 16. First Task for the Coding Agent

**Do not implement the full dashboard yet.**

Read `docs/PRD.md` and `docs/admin-dashboard-design.md`, then inspect the current repository. Return a review report containing:

1. Current frontend structure and routing.
2. Installed dependency names and versions relevant to the admin UI.
3. `frontend-design` skill availability and relevant instructions.
4. AdminLTE version options and compatibility findings.
5. Existing admin layouts, pages, and reusable components.
6. A proposed navigation map classified as Existing / Required / Proposed.
7. Proposed dashboard widgets and the API data each requires.
8. Missing API endpoints or requirements that block accurate UI integration.
9. Files likely to be affected.
10. Required dependency/configuration changes and risks.
11. A phased implementation plan and recommended first vertical slice.

Do not edit files, install packages, change configuration, or begin implementation during this first review. Clearly distinguish verified findings from assumptions and wait for approval before major changes.

---

## Suggested Review Prompt

> Review `docs/PRD.md` and `docs/admin-dashboard-design.md` against the current repository. Treat the PRD as the source of truth for business requirements and this design specification as the source of truth for admin UI/UX expectations. Inspect the actual frontend structure, installed dependencies and versions, routes, existing components, the installed `frontend-design` skill, AdminLTE compatibility, and available NestJS API endpoints. Classify navigation/features as Existing, Required, or Proposed. Report verified findings, assumptions, missing dependencies/endpoints, risks, affected files, and a phased implementation plan. Do not install packages, modify files/configuration, or implement anything yet. Wait for approval.
