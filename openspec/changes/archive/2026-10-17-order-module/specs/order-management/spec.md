# Spec Delta

## Purpose

Enables transactional customer order placement with frozen item pricing and address snapshots, supports three-axis order, payment, and shipment status management, maintains an immutable status transition history, provides customer order cancellation with stock release, and delivers administrative order fulfillment controls.

## ADDED Requirements

### Requirement: Relational Order and Line Item Data Structure
The system SHALL model orders using relational `Order`, `OrderItem`, and `OrderStatusHistory` entities, assigning a unique human-friendly `orderNumber`, maintaining independent `orderStatus` (default `PENDING`), `paymentStatus` (default `PENDING`), and `shipmentStatus` (default `UNFULFILLED`), financial decimal totals (`subtotal`, `discountAmount`, `shippingFee`, `grandTotal`), and a frozen recipient delivery address snapshot.

#### Scenario: Order creation with default statuses and address snapshot
- **WHEN** a customer places an order with recipient details, delivery address, and line items
- **THEN** an `Order` record is created with default `orderStatus: PENDING`, `paymentStatus: PENDING`, and `shipmentStatus: UNFULFILLED`, and the recipient's name, phone, and complete delivery address are frozen directly on the order record.

### Requirement: Transactional Order Placement and Item Immutability
The system SHALL execute customer order creation within a database transaction, verifying current variant availability and regular or promotional sale prices from the product catalog, freezing product title, SKU, variant attributes snapshot, and unit price in `OrderItem` records, computing non-negotiable financial totals, and reserving stock for all line items.

#### Scenario: Successful order placement with verified pricing
- **WHEN** an authenticated customer submits a valid checkout payload containing variant IDs, quantities, and shipping address
- **THEN** the system fetches active prices from the database, freezes line item snapshots, reserves warehouse stock, records an initial `OrderStatusHistory` entry, and returns HTTP 201 Created with the order details.

#### Scenario: Rejection of checkout when stock is insufficient
- **WHEN** a customer attempts to place an order for a quantity exceeding available warehouse stock
- **THEN** the system aborts the database transaction, throws HTTP 400 Bad Request indicating insufficient stock, and creates no order or stock records.

### Requirement: Three-Axis Order Lifecycle and Status Transitions
The system SHALL maintain independent statuses for order fulfillment, payment lifecycle, and courier shipment, enforcing valid lifecycle transitions for `OrderStatus` (`PENDING` -> `CONFIRMED` -> `PROCESSING` -> `SHIPPED` -> `DELIVERED`, plus cancellation from `PENDING`/`CONFIRMED`), automatically fulfilling reserved stock when an order is transitioned to `SHIPPED`, and recording every transition in `OrderStatusHistory`.

#### Scenario: Admin updates order status to confirmed
- **WHEN** an administrator transitions an order from `PENDING` to `CONFIRMED` with note "Order verified with customer"
- **THEN** the system updates `orderStatus` to `CONFIRMED`, creates an `OrderStatusHistory` log entry with previous status, new status, admin user ID, and notes, and returns HTTP 200 OK.

#### Scenario: Admin marks order shipped and fulfills stock
- **WHEN** an administrator transitions an order to `SHIPPED`
- **THEN** the system deducts the reserved warehouse inventory via `fulfillReservedStock` and logs the fulfillment status change in `OrderStatusHistory`.

#### Scenario: Rejection of invalid status transition
- **WHEN** an administrator attempts to change an order directly from `DELIVERED` to `PENDING`
- **THEN** the system rejects the operation with HTTP 400 Bad Request indicating an invalid order status transition.

### Requirement: Customer Order Cancellation and Stock Release
The system SHALL allow an authenticated customer to cancel their own order provided the order is in `PENDING` status, automatically releasing the reserved stock in the warehouse inventory and recording the cancellation reason in `OrderStatusHistory`.

#### Scenario: Successful customer cancellation of pending order
- **WHEN** an authenticated customer submits a cancellation request for their own order currently in `PENDING` status
- **THEN** the system updates the `orderStatus` to `CANCELLED`, releases the reserved inventory balance via `releaseReservedStock`, appends a cancellation entry to `OrderStatusHistory`, and returns HTTP 200 OK.

#### Scenario: Rejection of cancellation for processed order
- **WHEN** a customer attempts to cancel an order whose `orderStatus` is `PROCESSING` or `SHIPPED`
- **THEN** the system rejects the request with HTTP 400 Bad Request indicating that orders already in processing or transit cannot be cancelled by the customer.

### Requirement: Customer Order History and Detail Retrieval
The system SHALL provide authenticated customers with endpoints to view their paginated order history and retrieve individual order details, strictly restricting access to orders belonging to the requesting customer.

#### Scenario: Customer views paginated order history
- **WHEN** an authenticated customer sends a GET request to `/api/v1/orders`
- **THEN** the system returns HTTP 200 OK with a paginated list of orders placed by that customer, including order number, date, item summary, totals, and current statuses.

#### Scenario: Denial of access to another customer's order
- **WHEN** an authenticated customer attempts to fetch `/api/v1/orders/:id` for an order belonging to a different user
- **THEN** the system returns HTTP 404 Not Found or HTTP 403 Forbidden without disclosing order information.

### Requirement: Administrative Order Management API
The system SHALL expose administrative endpoints beneath `/api/v1/admin/orders` restricted to administrative roles (`SUPER_ADMIN`, `ADMIN`, `SHOP_MANAGER`), supporting paginated search across order numbers and customer details, status filtering, full order detail inspection with frozen line items and audit timeline, and status updates.

#### Scenario: Admin queries orders with status filter
- **WHEN** an administrator sends a GET request to `/api/v1/admin/orders?status=PENDING&page=1&limit=20`
- **THEN** the system returns HTTP 200 OK with paginated order records filtered by `PENDING` status and metadata.

#### Scenario: Admin views detailed order breakdown
- **WHEN** an administrator fetches `/api/v1/admin/orders/:id`
- **THEN** the system returns HTTP 200 OK with complete order details including customer details, frozen shipping address, line items with attributes and prices, three-axis statuses, and complete status history timeline.
