# Spec Delta

## Purpose

Enforces authenticated ownership controls on PayStation checkout payment initiation and provides reliable server-to-server payment reconciliation so mobile and web orders never remain stuck in unpaid states due to interrupted client callbacks.

## ADDED Requirements

### Requirement: Authenticated Ownership-Enforced PayStation Initiation
The system SHALL require JWT authentication on `POST /api/v1/payments/paystation/initiate` and MUST verify that the targeted order exists, belongs to the authenticated customer (or an authorized administrator), is eligible for PayStation payment, and is not already paid before initiating a gateway session.

#### Scenario: Customer initiates PayStation payment for own pending order
- **WHEN** an authenticated customer submits their own unpaid `PENDING` order ID and an allowed callback URL to `POST /api/v1/payments/paystation/initiate`
- **THEN** the system initiates a PayStation payment session and returns HTTP 200 OK with `payment_url` and `invoice_number`

#### Scenario: Unauthenticated or cross-user payment initiation attempt
- **WHEN** an unauthenticated caller or a different customer attempts to call `POST /api/v1/payments/paystation/initiate` for another user's order
- **THEN** the system rejects the request with HTTP 401 Unauthorized or HTTP 403 Forbidden

#### Scenario: Attempting to initiate payment for an already-paid or cancelled order
- **WHEN** a customer attempts to initiate PayStation payment for an order whose payment status is already `PAID` or order status is `CANCELLED`
- **THEN** the system rejects the request with HTTP 400 Bad Request or HTTP 409 Conflict

### Requirement: Server-to-Server PayStation Payment Reconciliation
The system SHALL expose a server-to-server callback/IPN endpoint `POST /api/v1/payments/paystation/callback` (and `GET` if redirected by gateway) that never trusts raw callback status parameters directly, but instead performs authoritative server-to-server verification against PayStation's transaction status API and idempotently reconciles the payment and order status.

#### Scenario: Interrupted mobile client still reconciles via gateway callback
- **WHEN** a customer completes payment on PayStation and loses connectivity before returning to the mobile app, and PayStation invokes the backend callback endpoint with `invoice_number`
- **THEN** the system queries PayStation's authoritative status endpoint, atomically marks the payment `PAID` and order `CONFIRMED` on verified success, and handles duplicate callbacks idempotently

#### Scenario: Spoofed callback with failed or unknown transaction
- **WHEN** a caller sends a forged callback claiming `status=Success` for an invoice that PayStation reports as `Failed` or `Pending`
- **THEN** the system refuses to mark the order `PAID` and records the verified gateway state only
