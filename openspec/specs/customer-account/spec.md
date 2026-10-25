# customer-account Specification

## Purpose

Provides customer self-service account management, personal profile and contact updates, password security with multi-device session revocation, and address book CRUD operations with default shipping and billing destinations.

## Requirements

### Requirement: Customer Profile Inspection and Mutation
The system SHALL expose `GET /api/v1/account/profile` and `PATCH /api/v1/account/profile` protected by JWT authentication, allowing customers to inspect their account details and update their display name and contact phone number.

#### Scenario: Customer retrieves own profile
- **WHEN** an authenticated customer sends a GET request to `/api/v1/account/profile`
- **THEN** system responds with HTTP 200 OK returning customer `id`, `email`, `name`, `phone`, `role`, and `createdAt`

#### Scenario: Customer updates name and phone
- **WHEN** customer submits updated `name` and `phone` to `PATCH /api/v1/account/profile`
- **THEN** system updates the database user record and returns HTTP 200 OK with the updated profile

#### Scenario: Unauthenticated profile access
- **WHEN** an unauthenticated client requests `/api/v1/account/profile`
- **THEN** system rejects the request with HTTP 401 Unauthorized

### Requirement: Customer Password Modification with Session Invalidation
The system SHALL provide `POST /api/v1/account/change-password` requiring current password verification with argon2id and enforcing minimum password standards on the new password. Upon successful update, the system MUST increment `tokenVersion` to revoke all active refresh tokens.

#### Scenario: Valid password change execution
- **WHEN** customer submits correct `currentPassword` and a compliant `newPassword` (minimum 8 characters, at least one letter and one number)
- **THEN** system updates `passwordHash`, increments `tokenVersion` in the database, clears existing refresh cookies, and returns HTTP 200 OK

#### Scenario: Incorrect current password
- **WHEN** customer submits an incorrect `currentPassword`
- **THEN** system rejects the request with HTTP 400 Bad Request indicating the current password does not match

#### Scenario: Weak new password
- **WHEN** customer submits a new password that fails complexity requirements
- **THEN** system rejects the request with HTTP 400 Bad Request detailing validation rules

### Requirement: Customer Address Book Management
The system SHALL provide endpoints under `/api/v1/account/addresses` allowing authenticated customers to list, create, update, and delete delivery addresses strictly scoped to their own account.

#### Scenario: Listing saved addresses
- **WHEN** customer requests `GET /api/v1/account/addresses`
- **THEN** system returns HTTP 200 OK with all saved addresses for this customer, ordered with default shipping address first

#### Scenario: Creating a new delivery address
- **WHEN** customer submits valid recipient name, phone, street address, city, state, and postal code
- **THEN** system creates the `UserAddress` record linked to the customer's `userId` and returns HTTP 201 Created

#### Scenario: Attempting to modify another customer's address
- **WHEN** customer attempts to update or delete an address ID belonging to a different user
- **THEN** system rejects the operation with HTTP 404 Not Found or HTTP 403 Forbidden

### Requirement: Default Shipping and Billing Destination Assignment
The system SHALL support atomic assignment of default shipping and default billing addresses via `PUT /api/v1/account/addresses/:id/default-shipping` and `PUT /api/v1/account/addresses/:id/default-billing`. Setting an address as default MUST clear the default flag from any previously designated address for that customer.

#### Scenario: Setting new default shipping address
- **WHEN** customer designates an address as default shipping
- **THEN** system executes a transaction setting `isDefaultShipping = true` on the target address while resetting `isDefaultShipping = false` on all other addresses owned by the customer

#### Scenario: Setting new default billing address
- **WHEN** customer designates an address as default billing
- **THEN** system executes a transaction setting `isDefaultBilling = true` on the target address while resetting `isDefaultBilling = false` on all other addresses owned by the customer

### Requirement: Customer Account Overview and Metric Aggregation
The system SHALL expose `GET /api/v1/account/overview` protected by JWT authentication, returning aggregated order statistics, recent order history, and default delivery address details for the authenticated customer.

#### Scenario: Authenticated customer retrieves overview statistics
- **WHEN** an authenticated customer sends `GET /api/v1/account/overview`
- **THEN** the system returns HTTP 200 with `counts` (`totalOrders`, `pendingOrders`, `processingOrders`, `deliveredOrders`), `recentOrders` (up to 5 latest orders with orderNumber, grandTotal, orderStatus, paymentStatus, itemCount, and createdAt), and `defaultShippingAddress`.

#### Scenario: Unauthenticated request to account overview
- **WHEN** an unauthenticated guest sends `GET /api/v1/account/overview` without a valid Bearer token
- **THEN** the system rejects the request with HTTP 401 Unauthorized.
