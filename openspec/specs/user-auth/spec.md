# user-auth Specification

## Purpose

Enables secure customer registration, credential verification, dual-token JWT lifecycle management, refresh token invalidation, authenticated profile inspection, and role-based endpoint protection for administrative and customer operations.

## Requirements

### Requirement: Customer Account Registration
The system SHALL provide an endpoint at `POST /api/v1/auth/register` allowing new customers to create accounts with email, password, name, and optional phone number. The password MUST be hashed using argon2id, the role MUST default to `CUSTOMER`, and duplicate email registrations MUST be rejected with HTTP 409 Conflict.

#### Scenario: Successful customer registration
- **WHEN** client submits valid registration data with a unique email address
- **THEN** system hashes the password with argon2id, persists the user record with role `CUSTOMER`, and returns HTTP 201 with the created user profile (omitting password hash)

#### Scenario: Registration with already registered email
- **WHEN** client submits a registration payload containing an email address that already exists
- **THEN** system rejects the request with HTTP 409 Conflict and an informative error message

#### Scenario: Registration with weak or malformed data
- **WHEN** client submits invalid email format or password shorter than 8 characters
- **THEN** system rejects the request with HTTP 400 Bad Request detailing validation errors

### Requirement: User Authentication and Token Issuance
The system SHALL provide an endpoint at `POST /api/v1/auth/login` validating user credentials against stored argon2id hashes and issuing a pair of signed JWT tokens: a short-lived access token and a long-lived refresh token containing the user identifier, role, and current tokenVersion.

#### Scenario: Valid credentials submitted
- **WHEN** client submits matching email and password for an active account
- **THEN** system responds with HTTP 200 OK containing `accessToken`, `refreshToken`, and a user summary object (id, email, name, role)

#### Scenario: Invalid password or non-existent email
- **WHEN** client submits non-existent email or incorrect password
- **THEN** system responds with HTTP 401 Unauthorized with a generic invalid credentials message

#### Scenario: Account is deactivated
- **WHEN** client submits valid credentials for an account where `isActive` is false
- **THEN** system responds with HTTP 403 Forbidden indicating account deactivation

### Requirement: Refresh Token Rotation and Invalidation
The system SHALL provide `POST /api/v1/auth/refresh` to exchange a valid refresh token for a newly issued access token and refresh token, and `POST /api/v1/auth/logout` to invalidate existing refresh tokens by incrementing the user's `tokenVersion`.

#### Scenario: Refreshing with valid token
- **WHEN** client submits a valid, unexpired refresh token matching the user's current `tokenVersion`
- **THEN** system issues a new access token and rotated refresh token with HTTP 200 OK

#### Scenario: Refreshing with revoked token version
- **WHEN** client submits a refresh token whose encoded `tokenVersion` does not match the database `tokenVersion`
- **THEN** system rejects the request with HTTP 401 Unauthorized and denies token issuance

#### Scenario: User logout execution
- **WHEN** authenticated user calls `POST /api/v1/auth/logout`
- **THEN** system increments the user's `tokenVersion` in the database and returns HTTP 200 OK

### Requirement: Authenticated User Profile Retrieval
The system SHALL expose `GET /api/v1/auth/me` protected by JWT access token verification that returns the current authenticated user's profile details.

#### Scenario: Authenticated profile request
- **WHEN** client sends a request to `GET /api/v1/auth/me` with a valid Bearer access token
- **THEN** system returns HTTP 200 OK with user id, email, name, phone, role, and status

#### Scenario: Unauthenticated request
- **WHEN** client sends a request without a Bearer token or with an expired/invalid token
- **THEN** system responds with HTTP 401 Unauthorized

### Requirement: Role-Based Access Control and Route Protection
The system SHALL provide guards and decorators enforcing role authorization (`SUPER_ADMIN`, `ADMIN`, `CUSTOMER`) on protected endpoints, rejecting unauthorized roles with HTTP 403 Forbidden.

#### Scenario: Administrator accessing admin-protected route
- **WHEN** an authenticated user with role `ADMIN` or `SUPER_ADMIN` accesses an endpoint guarded by `@Roles(Role.ADMIN, Role.SUPER_ADMIN)`
- **THEN** system permits request processing to proceed

#### Scenario: Customer attempting to access admin-protected route
- **WHEN** an authenticated user with role `CUSTOMER` accesses an admin-guarded endpoint
- **THEN** system immediately rejects the request with HTTP 403 Forbidden

### Requirement: Initial Super Administrator Provisioning
The system SHALL include a database seeding mechanism that idempotently creates a default `SUPER_ADMIN` user if no administrator account exists in the database.

#### Scenario: Fresh database seed execution
- **WHEN** the seeding script executes against a database with no administrator accounts
- **THEN** system creates the configured `SUPER_ADMIN` user with argon2id hashed credentials and logs successful provisioning

#### Scenario: Database already seeded
- **WHEN** the seeding script executes and the configured super admin email already exists
- **THEN** system preserves existing credentials without duplicate insertion or overwriting
