# Spec Delta: order-management

## MODIFIED Requirements

### Requirement: Transactional Order Placement and Item Immutability
The system SHALL execute customer order creation within a database transaction, verifying current variant availability, catalog prices, selected shipping method fee, and resolved tax rates, validating and recording applied coupon discounts and coupon usages, freezing product title, SKU, variant attributes, unit price, tax rate, tax amount, and tax class name in `OrderItem` records, computing non-negotiable financial totals including reverse-extracted tax amounts, and reserving stock for all line items.

#### Scenario: Successful order placement with verified pricing
- **WHEN** an authenticated customer submits a valid checkout payload containing variant IDs, quantities, shipping method, and shipping address
- **THEN** the system fetches active prices, delivery fees, and resolved tax rates from the database, freezes line item snapshots with `taxRate`, `taxAmount`, and `taxClassName`, computes `totalTaxAmount` and `grandTotal`, reserves warehouse stock, records an initial `OrderStatusHistory` entry, and returns HTTP 201 Created with the order details.

#### Scenario: Rejection of checkout when stock is insufficient
- **WHEN** a customer attempts to place an order for a quantity exceeding available warehouse stock
- **THEN** the system aborts the database transaction, throws HTTP 400 Bad Request indicating insufficient stock, and creates no order or stock records.

## ADDED Requirements

### Requirement: Order Checkout Idempotency and Payment Method Handling
The system SHALL support order placement with idempotent submission guards via `Idempotency-Key` header and decoupled payment records supporting Cash on Delivery and Mobile Banking (bKash/Nagad) with customer transaction references.

#### Scenario: Duplicate checkout request with same idempotency key rejected
- **WHEN** a client submits a second checkout request with the same `Idempotency-Key` header within 30 seconds
- **THEN** the system rejects the duplicate submission with HTTP 409 Conflict preventing double order creation.

#### Scenario: Mobile Banking order placed with transaction reference
- **WHEN** a customer submits an order selecting `MOBILE_BANKING` payment method and provides a bKash transaction reference
- **THEN** an `Order` record is created with `orderStatus: PENDING` and an initial `Payment` record is created with `method: MOBILE_BANKING`, `status: PENDING`, and `transactionRef`.
