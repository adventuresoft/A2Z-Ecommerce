# Spec Delta: admin-layout

## MODIFIED Requirements

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

### Requirement: Top Navigation Bar Controls
The top navigation bar SHALL provide accessible controls for toggling the sidebar, triggering global search, viewing notifications, inspecting active user details (name, email, role badge), and executing a logout action that clears tokens and redirects to `/login`.

#### Scenario: Profile menu interaction
- **WHEN** the administrator clicks the user profile avatar or name in the navbar
- **THEN** an accessible dropdown menu opens displaying the user's role and profile links.

#### Scenario: Logout action trigger
- **WHEN** the user selects "Sign Out" from the profile menu
- **THEN** the application invokes the logout handler, clears administrative session tokens, and navigates to `/login`.

## ADDED Requirements

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
