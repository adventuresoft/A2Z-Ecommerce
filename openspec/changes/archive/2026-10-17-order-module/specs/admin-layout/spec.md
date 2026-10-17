# Spec Delta

## ADDED Requirements

### Requirement: Live Order Management Administrative Views
The admin application SHALL provide functional AdminLTE 4 styled views for order management at `/orders` (paginated data table with search, status filters, and action links) and `/orders/[id]` (detailed order view with three-axis status badges, frozen customer and delivery address snapshot, line items breakdown, and status transition modal), replacing the placeholder shell.

#### Scenario: Admin navigates to orders list
- **WHEN** an administrator navigates to `/orders`
- **THEN** the application renders the live orders data table displaying order numbers, dates, customer names, financial totals, status badges, and action buttons.

#### Scenario: Admin inspects order details
- **WHEN** an administrator selects an order to view at `/orders/[id]`
- **THEN** the application renders the order details screen with recipient details, line items with unit prices and frozen attributes, three-axis statuses, and a status change control.
