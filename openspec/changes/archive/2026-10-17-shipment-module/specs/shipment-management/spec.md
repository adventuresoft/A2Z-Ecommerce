# Spec Delta

## Purpose

Enables store operators to manage regional shipping zones, delivery rate cards, courier package dispatch, transit status lifecycle, shipment audit history, and customer tracking lookups.

## ADDED Requirements

### Requirement: Shipping Zones and Methods Rate Cards
The system SHALL support managing regional `ShippingZone` records and associated `ShippingMethod` rate cards defining delivery charges and estimated transit durations for customer checkout and fulfillment assignment.

#### Scenario: Admin creates a shipping zone and delivery method
- **WHEN** an administrator creates a shipping zone "Inside Dhaka" and adds a shipping method "Standard Delivery" with cost 60 BDT and estimated 2 days
- **THEN** the system stores the zone and method, sets `isActive: true`, and returns HTTP 201 Created.

#### Scenario: Checkout queries active shipping methods
- **WHEN** a client or customer requests available delivery methods from `/api/v1/shipping/methods`
- **THEN** the system returns HTTP 200 OK with all active shipping methods grouped or associated with their respective active shipping zones.

### Requirement: Courier Shipment Creation for Eligible Orders
The system SHALL provide administrative shipment creation (`POST /api/v1/admin/shipments`) for orders in `CONFIRMED`, `PROCESSING`, or `SHIPPED` status, capturing courier provider name, tracking number, optional tracking URL, and shipment notes.

#### Scenario: Successful shipment creation for confirmed order
- **WHEN** an administrator creates a shipment for a `CONFIRMED` order specifying courier "Steadfast" and tracking number "ST-987654"
- **THEN** the system creates a `Shipment` record with default `status: PREPARING`, records an initial `ShipmentStatusHistory` entry, updates the parent order's `shipmentStatus` to `PREPARING`, and returns HTTP 201 Created.

#### Scenario: Rejection of shipment creation for cancelled or returned orders
- **WHEN** an administrator attempts to create a shipment for an order in `CANCELLED` or `RETURNED` status
- **THEN** the system rejects the operation with HTTP 400 Bad Request indicating that shipments cannot be dispatched for cancelled or returned orders.

### Requirement: Shipment Transit Status Lifecycle and History Auditing
The system SHALL enforce valid status transitions for `ShipmentStatus` (`PREPARING` -> `DISPATCHED` -> `IN_TRANSIT` -> `OUT_FOR_DELIVERY` -> `DELIVERED`, with `FAILED_DELIVERY` and `RETURNED` branches), timestamping transit events and logging each transition into `ShipmentStatusHistory`.

#### Scenario: Admin updates shipment status to dispatched
- **WHEN** an administrator updates a shipment's status from `PREPARING` to `DISPATCHED`
- **THEN** the system updates the shipment status to `DISPATCHED`, records `shippedAt` timestamp, appends an audit record to `ShipmentStatusHistory`, and returns HTTP 200 OK.

#### Scenario: Admin updates shipment status to delivered
- **WHEN** an administrator marks a shipment as `DELIVERED`
- **THEN** the system updates the shipment status to `DELIVERED`, stamps `deliveredAt` with the current timestamp, logs the history entry, and synchronizes the parent order's fulfillment state.

### Requirement: Administrative Shipment Management API
The system SHALL expose administrative endpoints under `/api/v1/admin/shipments` allowing operators to paginate, search by tracking number or order reference, filter by courier or shipment status, view detailed package information, and modify tracking metadata.

#### Scenario: Admin searches shipments by tracking number
- **WHEN** an administrator sends a GET request to `/api/v1/admin/shipments?search=ST-987654`
- **THEN** the system returns HTTP 200 OK with paginated shipment records matching the tracking number along with associated order details.

#### Scenario: Admin inspects shipment details with audit timeline
- **WHEN** an administrator fetches `/api/v1/admin/shipments/:id`
- **THEN** the system returns HTTP 200 OK with full shipment information, courier tracking link, recipient address snapshot, and complete `ShipmentStatusHistory` log entries.

### Requirement: Customer Shipment and Tracking Lookup
The system SHALL provide customer-accessible endpoints to inspect shipment status and tracking details for orders placed by the authenticated customer, and a public tracking lookup endpoint by tracking number.

#### Scenario: Authenticated customer retrieves shipment for their order
- **WHEN** an authenticated customer requests `/api/v1/orders/:orderId/shipments`
- **THEN** the system returns HTTP 200 OK with the shipment details and tracking information for that order, verifying order ownership.

#### Scenario: Public tracking lookup by valid tracking number
- **WHEN** a client submits a GET request to `/api/v1/shipments/track/:trackingNumber`
- **THEN** the system returns HTTP 200 OK with current shipment transit status, courier name, tracking URL, and status checkpoint dates without leaking sensitive customer PII.
