# admin-layout Specification

## Purpose

Provides a reusable, responsive, and accessible administrative shell adhering to AdminLTE 4 design guidelines, featuring centralized hierarchical navigation, dynamic header and breadcrumbs, collapsible sidebar with desktop/mobile drawer support, user profile actions, and a phased activation status shell for upcoming modules.

## Requirements

### Requirement: Responsive Admin Shell and Wrapper
The admin application SHALL render an AdminLTE 4 compatible layout structure consisting of a top navigation bar, a collapsible sidebar navigation container, a dynamic page content header, a main content wrapper, and an operational footer.

#### Scenario: Desktop viewport rendering
- **WHEN** an administrator views any administrative page on a desktop viewport (992px or wider)
- **THEN** the layout renders a persistent sidebar and top navigation bar with the main content area occupying the remaining screen width.

#### Scenario: Mobile viewport rendering
- **WHEN** an administrator views the administrative portal on a mobile or small tablet viewport (under 992px)
- **THEN** the sidebar is hidden off-canvas by default, allowing the main content to occupy full viewport width.

### Requirement: Hierarchical Navigation Tree
The system SHALL render a centralized, typed navigation menu displaying store management modules, supporting nested children, active route highlighting, and dynamically filtering visible items based on the active user's role permissions.

#### Scenario: Active route highlighting
- **WHEN** the user navigates to an administrative page (e.g., `/` or `/dashboard`)
- **THEN** the corresponding sidebar menu item is highlighted as active with distinct styling and aria-current attribute.

#### Scenario: Submenu expansion and collapse
- **WHEN** the user clicks an expandable navigation group with child items (e.g., Catalog)
- **THEN** the child menu items expand smoothly, and clicking again collapses the menu.

#### Scenario: Dynamic menu filtering for shop manager
- **WHEN** an authenticated user with role `SHOP_MANAGER` views the admin sidebar
- **THEN** the sidebar displays Catalog and Orders items, but hides administrative System and User management menus.

#### Scenario: Dynamic menu filtering for admin
- **WHEN** an authenticated user with role `ADMIN` views the admin sidebar
- **THEN** all store operational and catalog menus are visible, while settings and logs are presented in read-only mode.

### Requirement: Adaptive Sidebar State Management
The system SHALL manage sidebar collapse and expansion natively using React state, applying AdminLTE body and wrapper classes and providing backdrop overlay dismissal on small viewports without external DOM-manipulating plugins.

#### Scenario: Desktop sidebar toggle
- **WHEN** the user clicks the sidebar toggle button on a desktop viewport
- **THEN** the sidebar collapses into icon-only mode, and the body class updates to reflect the collapsed state.

#### Scenario: Mobile drawer toggle and backdrop dismissal
- **WHEN** the user clicks the sidebar toggle button on a mobile viewport
- **THEN** the sidebar slides in from the left over an interactive backdrop, and clicking the backdrop or pressing Escape dismisses the drawer.

#### Scenario: Route change drawer dismissal
- **WHEN** the user clicks a navigation link inside the open mobile sidebar drawer
- **THEN** the drawer automatically closes upon navigating to the selected route.

### Requirement: Dynamic Page Header and Breadcrumbs
The system SHALL render a page content header containing the current page title and navigable breadcrumb hierarchy resolved dynamically from the active URL path and navigation configuration.

#### Scenario: Root dashboard breadcrumbs
- **WHEN** the user visits the dashboard home route
- **THEN** the header displays "Dashboard" as the title and a single active breadcrumb item "Dashboard".

#### Scenario: Nested section breadcrumbs
- **WHEN** the user visits a nested route (e.g., `/catalog/categories`)
- **THEN** the header displays "Categories" as the page title and breadcrumbs "Home > Catalog > Categories" with links to parent sections.

### Requirement: Top Navigation Bar Controls
The top navigation bar SHALL provide accessible controls for toggling the sidebar, triggering global search, viewing notifications, inspecting active user details (name, email, role badge), and executing a logout action that clears tokens and redirects to `/login`.

#### Scenario: Profile menu interaction
- **WHEN** the administrator clicks the user profile avatar or name in the navbar
- **THEN** an accessible dropdown menu opens displaying the user's role and profile links.

#### Scenario: Logout action trigger
- **WHEN** the user selects "Sign Out" from the profile menu
- **THEN** the application invokes the logout handler, clears administrative session tokens, and navigates to `/login`.

### Requirement: Phased Menu Activation and Status Shell
Navigation items designated for upcoming delivery phases SHALL route to a standard AdminLTE status shell component clearly stating that the module is in development, rather than presenting broken links or unhandled errors.

#### Scenario: Navigating to pending module
- **WHEN** an administrator clicks a navigation item tagged for a future phase (e.g., Orders or Inventory)
- **THEN** the application renders a clean AdminLTE card indicating the feature's planned phase without dead 404 errors.

### Requirement: Admin Authentication and Login View
The admin application SHALL provide a dedicated login page at `/login` styled with AdminLTE 4 and Bootstrap 5 conventions, featuring validated email and password inputs, error alert feedback, and automatic redirection to the dashboard upon successful token acquisition.

#### Scenario: Successful sign in
- **WHEN** user submits valid credentials for an administrative account (`SUPER_ADMIN`, `ADMIN`, or `SHOP_MANAGER`)
- **THEN** the application stores the received access and refresh tokens, updates the authentication state, and redirects the browser to the dashboard (`/`).

#### Scenario: Customer login denial
- **WHEN** user submits credentials belonging to an account with role `CUSTOMER`
- **THEN** the application rejects administrative entry, displays an unauthorized access alert, and prevents redirection.

#### Scenario: Unauthenticated route interception
- **WHEN** an unauthenticated visitor attempts to navigate directly to any protected admin route
- **THEN** the application intercepts the request and redirects the user to `/login`.

### Requirement: Admin Password Recovery UI Shell
The admin application SHALL provide a clean UI shell page at `/forgot-password` displaying password recovery instructions and an email input form with return-to-login navigation.

#### Scenario: Forgot password page rendering
- **WHEN** a user visits `/forgot-password` or clicks "Forgot password" on the login page
- **THEN** the application renders the password recovery card with email field and a link back to `/login`.

### Requirement: Client-Side Action Guards for Destructive Operations
The administrative UI views (data tables and edit forms) SHALL inspect the authenticated user's permissions and conditionally hide or disable destructive action controls (such as Delete buttons) when the user lacks `delete` permissions for that module.

#### Scenario: Super admin views table actions
- **WHEN** a `SUPER_ADMIN` views any catalog data table (Categories, Brands, Products, Variants)
- **THEN** all action buttons including Edit and Delete are visible and operational.

#### Scenario: Admin views table actions
- **WHEN** an `ADMIN` views catalog data tables
- **THEN** the Delete buttons are hidden or disabled with a tooltip indicating insufficient permissions, preventing accidental or unauthorized delete requests.

### Requirement: Live Order Management Administrative Views
The admin application SHALL provide functional AdminLTE 4 styled views for order management at `/orders` (paginated data table with search, status filters, and action links) and `/orders/[id]` (detailed order view with three-axis status badges, frozen customer and delivery address snapshot, line items breakdown, and status transition modal), replacing the placeholder shell.

#### Scenario: Admin navigates to orders list
- **WHEN** an administrator navigates to `/orders`
- **THEN** the application renders the live orders data table displaying order numbers, dates, customer names, financial totals, status badges, and action buttons.

#### Scenario: Admin inspects order details
- **WHEN** an administrator selects an order to view at `/orders/[id]`
- **THEN** the application renders the order details screen with recipient details, line items with unit prices and frozen attributes, three-axis statuses, and a status change control.

### Requirement: Live Shipping Management Administrative Views
The admin application SHALL provide functional AdminLTE 4 styled views for logistics management at `/shipping/shipments` (shipments data table with courier filters and status badges), `/shipping/shipments/[id]` (shipment detail with tracking link and timeline), `/shipping/methods` (shipping rate cards), and `/shipping/zones` (delivery geographic zones), replacing placeholder shells.

#### Scenario: Admin views shipments list
- **WHEN** an administrator navigates to `/shipping/shipments`
- **THEN** the application renders a data table listing shipments with tracking numbers, courier names, destination cities, current statuses, and quick action links.

#### Scenario: Admin inspects shipment details
- **WHEN** an administrator views a shipment at `/shipping/shipments/[id]`
- **THEN** the application displays shipment details, tracking links, order reference, customer delivery address, and an audit status timeline.

#### Scenario: Admin manages shipping methods and zones
- **WHEN** an administrator visits `/shipping/methods` or `/shipping/zones`
- **THEN** the application renders live management tables allowing creation, editing, and activation toggling of zones and delivery rate cards.
