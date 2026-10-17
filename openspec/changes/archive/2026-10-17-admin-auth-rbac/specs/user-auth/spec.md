# Spec Delta: user-auth

## MODIFIED Requirements

### Requirement: Role-Based Access Control and Route Protection
The system SHALL provide guards and decorators enforcing role authorization (`SUPER_ADMIN`, `ADMIN`, `SHOP_MANAGER`, `CUSTOMER`) and module-based permission policies on protected endpoints, rejecting unauthorized roles or unpermitted actions with HTTP 403 Forbidden.

#### Scenario: Administrator accessing admin-protected route
- **WHEN** an authenticated user with role `ADMIN` or `SUPER_ADMIN` accesses an endpoint guarded by `@Roles(Role.ADMIN, Role.SUPER_ADMIN)`
- **THEN** system permits request processing to proceed

#### Scenario: Customer attempting to access admin-protected route
- **WHEN** an authenticated user with role `CUSTOMER` accesses an admin-guarded endpoint
- **THEN** system immediately rejects the request with HTTP 403 Forbidden

#### Scenario: Shop manager accessing catalog management route
- **WHEN** an authenticated user with role `SHOP_MANAGER` accesses a catalog endpoint requiring role `SHOP_MANAGER`
- **THEN** system permits request processing to proceed

#### Scenario: Shop manager attempting system settings modification
- **WHEN** an authenticated user with role `SHOP_MANAGER` accesses an endpoint reserved for `SUPER_ADMIN` or `ADMIN`
- **THEN** system rejects the request with HTTP 403 Forbidden

### Requirement: Initial Super Administrator Provisioning
The system SHALL include an idempotent database seeding mechanism that creates default demo accounts across all system roles (`SUPER_ADMIN`, `ADMIN`, `SHOP_MANAGER`, `CUSTOMER`) if they do not already exist in the database.

#### Scenario: Fresh database seed execution
- **WHEN** the seeding script executes against a fresh database
- **THEN** system provisions demo accounts for `superadmin@az-ecommerce.local`, `admin@az-ecommerce.local`, `shopmanager@az-ecommerce.local`, and `customer@az-ecommerce.local` with argon2id hashed passwords

#### Scenario: Database already seeded
- **WHEN** the seeding script executes and the configured demo account emails already exist
- **THEN** system preserves existing credentials without duplicate insertion or overwriting

## ADDED Requirements

### Requirement: Module-Based Action Authorization Guard
The system SHALL provide a `@RequirePermission(module, action)` guard that checks the user's role against the centralized permission policy matrix for the target module and action (`create`, `read`, `update`, `delete`), rejecting unauthorized requests with HTTP 403 Forbidden.

#### Scenario: Super admin performing any action
- **WHEN** a user with role `SUPER_ADMIN` attempts any action (`create`, `read`, `update`, `delete`) on any module
- **THEN** system permits the request to execute

#### Scenario: Admin attempting delete action
- **WHEN** a user with role `ADMIN` sends a DELETE request to an endpoint guarded by `@RequirePermission(module, 'delete')`
- **THEN** system immediately rejects the request with HTTP 403 Forbidden and an informative error message

#### Scenario: Shop manager deleting product
- **WHEN** a user with role `SHOP_MANAGER` sends a DELETE request to a product variant or product deletion endpoint
- **THEN** system authorizes the deletion because the policy grants `delete` on `products` to `SHOP_MANAGER`

#### Scenario: Shop manager attempting category deletion
- **WHEN** a user with role `SHOP_MANAGER` sends a DELETE request to a category deletion endpoint
- **THEN** system rejects the request with HTTP 403 Forbidden because `SHOP_MANAGER` is restricted to `create`, `read`, and `update` for categories
