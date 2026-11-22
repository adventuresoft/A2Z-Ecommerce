# Spec Delta

## ADDED Requirements

### Requirement: Customer Self-Service Account Deletion
The system SHALL expose `DELETE /api/v1/account` protected by JWT authentication, requiring password or verified phone OTP re-authentication before atomically anonymizing personal identity fields, deactivating the account, revoking all sessions and push tokens, and removing personal addresses, wishlist, and cart data while preserving historical order records.

#### Scenario: Customer deletes own account with valid password confirmation
- **WHEN** an authenticated customer sends `DELETE /api/v1/account` with their matching `password`
- **THEN** the system verifies the password, sets `name` to `"Deleted User"`, clears `email` and `phone`, sets `isActive = false`, increments `tokenVersion`, revokes all refresh sessions, deletes push tokens, saved addresses, wishlist items, and cart items in a single transaction, retains historical orders, and returns HTTP 200 OK

#### Scenario: Account deletion rejected with invalid password
- **WHEN** an authenticated customer sends `DELETE /api/v1/account` with an incorrect password or missing confirmation credential
- **THEN** the system rejects the request with HTTP 400 Bad Request or HTTP 401 Unauthorized without modifying account state

#### Scenario: Deleted account cannot authenticate or refresh tokens
- **WHEN** a client subsequently attempts to log in or refresh tokens for a deleted account
- **THEN** the system rejects the request with HTTP 401 Unauthorized or HTTP 403 Forbidden
