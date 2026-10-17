# Spec Delta

## ADDED Requirements

### Requirement: Live Shipping Management Administrative Views
The admin application SHALL provide functional AdminLTE 4 styled views for logistics management at `/shipping/shipments` (shipments data table with courier filters and status badges), `/shipping/shipments/[id]` (shipment detail with tracking link and timeline), `/shipping/methods` (shipping rate cards), and `/shipping/zones` (delivery geographic zones), replacing placeholder shells.

#### Scenario: Admin views shipments list
- **WHEN** an administrator navigates to `/shipping/shipments`
- **THEN** the application renders a data table listing shipments with tracking numbers, courier names, destination cities, current statuses, and quick action links.

#### Scenario: Admin inspects shipment details
- **WHEN** an administrator views a shipment at `/shipping/shipments/[id]`
- **THEN** the application displays shipment details, tracking links, order reference, customer delivery address, and an audit status timeline.

#### Scenario: Admin manages shipping methods and zones
- **WHEN** an administrator visits `/shipping/methods` or `/shipping/zones`
- **THEN** the application renders live management tables allowing creation, editing, and activation toggling of zones and delivery rate cards.
