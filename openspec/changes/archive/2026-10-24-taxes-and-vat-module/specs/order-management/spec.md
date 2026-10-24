# Spec Delta

## MODIFIED Requirements

### Requirement: Relational Order and Line Item Data Structure
The system SHALL model orders using relational `Order`, `OrderItem`, and `OrderStatusHistory` entities, assigning a unique human-friendly `orderNumber`, maintaining independent `orderStatus` (default `PENDING`), `paymentStatus` (default `PENDING`), and `shipmentStatus` (default `UNFULFILLED`), financial decimal totals (`subtotal`, `discountAmount`, `shippingFee`, `totalTaxAmount`, `grandTotal`), frozen tax attributes (`taxRate`, `taxAmount`, `taxClassName` on line items), and a frozen recipient delivery address snapshot.

#### Scenario: Order creation with default statuses and address snapshot
- **WHEN** a customer places an order with recipient details, delivery address, and line items
- **THEN** an `Order` record is created with default `orderStatus: PENDING`, `paymentStatus: PENDING`, and `shipmentStatus: UNFULFILLED`, financial totals including `totalTaxAmount`, and the recipient's name, phone, and complete delivery address are frozen directly on the order record.

### Requirement: Transactional Order Placement and Item Immutability
The system SHALL execute customer order creation within a database transaction, verifying current variant availability, catalog prices, and resolved tax rates, freezing product title, SKU, variant attributes, unit price, tax rate, tax amount, and tax class name in `OrderItem` records, computing non-negotiable financial totals including reverse-extracted tax amounts, and reserving stock for all line items.

#### Scenario: Successful order placement with verified pricing
- **WHEN** an authenticated customer submits a valid checkout payload containing variant IDs, quantities, and shipping address
- **THEN** the system fetches active prices and resolved tax rates from the database, freezes line item snapshots with `taxRate`, `taxAmount`, and `taxClassName`, computes `totalTaxAmount`, reserves warehouse stock, records an initial `OrderStatusHistory` entry, and returns HTTP 201 Created with the order details.

#### Scenario: Rejection of checkout when stock is insufficient
- **WHEN** a customer attempts to place an order for a quantity exceeding available warehouse stock
- **THEN** the system aborts the database transaction, throws HTTP 400 Bad Request indicating insufficient stock, and creates no order or stock records.
