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
The system SHALL provide an endpoint at `POST /api/v1/auth/login` validating user credentials against stored argon2id hashes, issuing a signed access token in the response body, and attaching the long-lived refresh token as an HTTP-only cookie (`refreshToken`) scoped to `/api/v1/auth` with `SameSite=Lax`.

#### Scenario: Valid credentials submitted
- **WHEN** client submits matching email and password for an active account
- **THEN** system responds with HTTP 200 OK containing `accessToken`, `user` summary object, and sets an `HttpOnly` cookie for `refreshToken` with a 7-day expiration

#### Scenario: Invalid password or non-existent email
- **WHEN** client submits non-existent email or incorrect password
- **THEN** system responds with HTTP 401 Unauthorized with a generic invalid credentials message

#### Scenario: Account is deactivated
- **WHEN** client submits valid credentials for an account where `isActive` is false
- **THEN** system responds with HTTP 403 Forbidden indicating account deactivation

### Requirement: Refresh Token Rotation and Invalidation
The system SHALL track refresh tokens per device session and provide `POST /api/v1/auth/refresh` to exchange a valid, non-revoked refresh token (provided via HTTP-only cookie or request body) for a newly issued access token and rotated refresh token (returned in both the JSON response body and HTTP-only cookie). Calling `POST /api/v1/auth/logout` SHALL clear the refresh cookie and revoke only the active device session, while password change or reset MUST increment `tokenVersion` and revoke all device sessions.

#### Scenario: Refreshing with valid token
- **WHEN** client submits a valid, unexpired, non-revoked refresh token via HTTP-only cookie or request body matching an active device session and the user's current `tokenVersion`
- **THEN** system rotates the stored session token hash, issues a new access token and rotated refresh token in the response body and HTTP-only cookie, and returns HTTP 200 OK

#### Scenario: Refreshing with revoked token version
- **WHEN** client submits a refresh token whose encoded `tokenVersion` does not match the database `tokenVersion`
- **THEN** system rejects the request with HTTP 401 Unauthorized and denies token issuance

#### Scenario: Refreshing with revoked device session or rotated token reuse
- **WHEN** client submits a refresh token belonging to a logged-out device session or an already-rotated token
- **THEN** system rejects the request with HTTP 401 Unauthorized and revokes that device session

#### Scenario: User logout execution
- **WHEN** authenticated user calls `POST /api/v1/auth/logout` from a device (via refresh cookie, refresh token body, or `deviceId`)
- **THEN** system clears the `refreshToken` HTTP-only cookie, revokes only that device's active refresh session while preserving other logged-in devices, and returns HTTP 200 OK

#### Scenario: Logout all devices on security-critical credential change
- **WHEN** a user resets or changes their password
- **THEN** system increments `tokenVersion` and revokes all active refresh sessions across all devices

### Requirement: Authenticated User Profile Retrieval
The system SHALL expose `GET /api/v1/auth/me` protected by JWT access token verification that returns the current authenticated user's profile details.

#### Scenario: Authenticated profile request
- **WHEN** client sends a request to `GET /api/v1/auth/me` with a valid Bearer access token
- **THEN** system returns HTTP 200 OK with user id, email, name, phone, role, and status

#### Scenario: Unauthenticated request
- **WHEN** client sends a request without a Bearer token or with an expired/invalid token
- **THEN** system responds with HTTP 401 Unauthorized

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

### Requirement: Authentication and OTP Endpoint Rate Limiting
The system SHALL enforce rate limits on sensitive authentication endpoints (`POST /api/v1/auth/phone/send-otp`, `verify-otp`, `phone/login`, `login`, and `refresh`) and enforce a server-side 60-second resend cooldown per phone number on OTP dispatch.

#### Scenario: Excessive OTP requests to same phone number within cooldown
- **WHEN** a client calls `POST /api/v1/auth/phone/send-otp` for the same phone number within 60 seconds of a prior OTP dispatch
- **THEN** the system rejects the request with HTTP 429 Too Many Requests indicating remaining wait time without triggering an upstream SMS call

#### Scenario: Brute-force login attempts from same client
- **WHEN** a client exceeds the configured authentication request threshold within the rate-limit window
- **THEN** the system responds with HTTP 429 Too Many Requests

### Requirement: Production Credential Safety and Dev Backdoor Prohibition
When running with `NODE_ENV=production`, the system SHALL require valid non-placeholder secrets at startup, MUST omit `devOtp` from OTP responses, and MUST prohibit development login backdoors.

#### Scenario: OTP response in production omits devOtp
- **WHEN** `POST /api/v1/auth/phone/send-otp` executes with `NODE_ENV=production`
- **THEN** the JSON response omits `devOtp` and dispatches solely through configured SMS provider credentials

#### Scenario: Development login shortcut blocked in production
- **WHEN** a login request attempts to use a development bypass account or fallback credential while `NODE_ENV=production`
- **THEN** the system enforces standard argon2id hash verification and rejects invalid credentials with HTTP 401 Unauthorized
