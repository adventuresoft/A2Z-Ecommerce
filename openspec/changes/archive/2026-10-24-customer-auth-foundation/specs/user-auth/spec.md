# Spec Delta

## MODIFIED Requirements

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
The system SHALL provide `POST /api/v1/auth/refresh` to exchange a valid refresh token (provided via HTTP-only cookie or request body) for a newly issued access token and rotated refresh token cookie, and `POST /api/v1/auth/logout` to clear the refresh token cookie and invalidate sessions by incrementing the user's `tokenVersion`.

#### Scenario: Refreshing with valid token
- **WHEN** client submits a valid, unexpired refresh token via HTTP-only cookie or request body matching the user's current `tokenVersion`
- **THEN** system issues a new access token in the response body and rotated refresh token cookie with HTTP 200 OK

#### Scenario: Refreshing with revoked token version
- **WHEN** client submits a refresh token whose encoded `tokenVersion` does not match the database `tokenVersion`
- **THEN** system rejects the request with HTTP 401 Unauthorized and denies token issuance

#### Scenario: User logout execution
- **WHEN** authenticated user calls `POST /api/v1/auth/logout`
- **THEN** system clears the `refreshToken` HTTP-only cookie, increments the user's `tokenVersion` in the database, and returns HTTP 200 OK
