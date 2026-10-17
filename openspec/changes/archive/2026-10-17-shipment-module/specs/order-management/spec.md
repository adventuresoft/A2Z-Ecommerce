# Spec Delta

## ADDED Requirements

### Requirement: Order Fulfillment Synchronization with Shipments
The system SHALL synchronize the parent `Order.shipmentStatus` and `Order.orderStatus` whenever an associated shipment's status changes, automatically transitioning the order to `SHIPPED` and fulfilling reserved stock when a shipment is marked `DISPATCHED`.

#### Scenario: Dispatching shipment advances order to shipped
- **WHEN** an associated shipment is transitioned to `DISPATCHED` for an order in `CONFIRMED` or `PROCESSING` status
- **THEN** the system updates `Order.shipmentStatus` to `DISPATCHED`, transitions `Order.orderStatus` to `SHIPPED`, fulfills reserved inventory stock, and logs the change in `OrderStatusHistory`.

#### Scenario: Delivering shipment marks order delivered
- **WHEN** all shipments associated with an order reach `DELIVERED` status
- **THEN** the system updates `Order.shipmentStatus` to `DELIVERED` and marks `Order.orderStatus` as `DELIVERED` unless the order was previously cancelled.

### Requirement: Order Shipment Details Inspection
The system SHALL include linked shipment summary records (including courier name, tracking number, tracking URL, and status) within the order detail response for both administrative and customer order queries.

#### Scenario: Admin views order with linked shipments
- **WHEN** an administrator fetches order details from `/api/v1/admin/orders/:id`
- **THEN** the response includes a `shipments` array containing any associated shipment records with tracking links and current transit statuses.

#### Scenario: Customer views order with shipment tracking
- **WHEN** an authenticated customer fetches `/api/v1/orders/:id`
- **THEN** the response includes active courier tracking details for any dispatched shipments linked to that order.
