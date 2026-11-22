# Spec Delta

## MODIFIED Requirements

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

## ADDED Requirements

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
