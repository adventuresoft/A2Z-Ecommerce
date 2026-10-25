# Spec Delta: customer-account

## ADDED Requirements

### Requirement: Customer Account Overview and Metric Aggregation
The system SHALL expose `GET /api/v1/account/overview` protected by JWT authentication, returning aggregated order statistics, recent order history, and default delivery address details for the authenticated customer.

#### Scenario: Authenticated customer retrieves overview statistics
- **WHEN** an authenticated customer sends `GET /api/v1/account/overview`
- **THEN** the system returns HTTP 200 with `counts` (`totalOrders`, `pendingOrders`, `processingOrders`, `deliveredOrders`), `recentOrders` (up to 5 latest orders with orderNumber, grandTotal, orderStatus, paymentStatus, itemCount, and createdAt), and `defaultShippingAddress`.

#### Scenario: Unauthenticated request to account overview
- **WHEN** an unauthenticated guest sends `GET /api/v1/account/overview` without a valid Bearer token
- **THEN** the system rejects the request with HTTP 401 Unauthorized.
