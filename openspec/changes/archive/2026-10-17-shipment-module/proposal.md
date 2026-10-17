# Proposal: Shipments & Logistics Management Module

## Why

With customer orders, inventory stock reservation, and the three-axis fulfillment foundation established in the platform, orders cannot currently be dispatched, assigned courier tracking numbers, or monitored through logistic lifecycles. Without dedicated shipping zones, delivery rate cards, and shipment tracking, store operators cannot configure regional shipping costs, generate courier dispatch records (e.g., Steadfast, Pathao, RedX, in-house), or update transit checkpoints for customers and administrators.

Implementing the Shipments Management module resolves this fulfillment gap by providing regional shipping zones, configurable shipping methods with rate calculation, courier package creation, transit status tracking (`ShipmentStatus`), shipment audit logging, and seamless integration with the existing order fulfillment pipeline as specified in PRD §5.7 and data-model.md §4.7.

## What Changes

- **Shipping & Courier Relational Schema**: Introduce `ShippingZone`, `ShippingMethod`, `Shipment`, and `ShipmentStatusHistory` models in `apps/api/prisma/schema.prisma` with appropriate relations to `Order`, `User`, and `ShipmentStatus` enum, including tracking number indexes and foreign key constraints.
- **Shipping Zones & Methods Management**:
  - Administrative endpoints for managing delivery zones (e.g., "Inside Dhaka", "Outside Dhaka") and shipping methods (e.g., "Standard Delivery", "Express Delivery") with delivery fees and estimated delivery times.
  - Public/checkout endpoints for querying active shipping zones and methods.
- **Shipment Dispatch & Lifecycle Management**:
  - Administrative shipment creation (`POST /api/v1/admin/shipments`) for eligible orders (`CONFIRMED`, `PROCESSING`, `SHIPPED`).
  - Courier assignment (`courierName`, `trackingNumber`, `trackingUrl`, delivery instructions/notes).
  - Status updates (`PATCH /api/v1/admin/shipments/:id/status`) enforcing valid transit transitions (`PREPARING` -> `DISPATCHED` -> `IN_TRANSIT` -> `OUT_FOR_DELIVERY` -> `DELIVERED`, with `FAILED_DELIVERY` and `RETURNED` exception branches) and recording an audit trail in `ShipmentStatusHistory`.
  - Tight order synchronization: Updating a shipment to `DISPATCHED` automatically aligns `Order.shipmentStatus` to `DISPATCHED` and transitions `Order.orderStatus` to `SHIPPED` (triggering inventory fulfillment stock deduction if not previously fulfilled); updating to `DELIVERED` automatically stamps `deliveredAt` and aligns `Order.shipmentStatus` to `DELIVERED`.
- **Order Module Integration**:
  - Embed linked shipments and active courier tracking information directly within order queries and detail responses (`OrderResponseDto`).
  - Provide convenient shipment creation and tracking directly from the Admin Order Details view.
  - Allow customer tracking lookup for their own orders (`GET /api/v1/orders/:orderId/shipments` and `GET /api/v1/shipments/track/:trackingNumber`).
- **Admin Dashboard Shipping Screens**:
  - Implement full AdminLTE 4 views at `apps/admin/app/shipping/shipments/page.tsx` (Shipments list data table with courier filters, tracking search, and status updates).
  - Implement Shipment Details view at `apps/admin/app/shipping/shipments/[id]/page.tsx` (Package summary, recipient snapshot, courier details, and timeline).
  - Implement Shipping Methods at `apps/admin/app/shipping/methods/page.tsx` and Shipping Zones at `apps/admin/app/shipping/zones/page.tsx`.
  - Update `apps/admin/app/orders/[id]/page.tsx` with a dedicated Shipment section and "Create Shipment" action.
  - Update `apps/admin/config/navigation.ts` to mark Shipping modules as Live with success badges.

## Capabilities

### New Capabilities

- `shipment-management`: Regional delivery zones, rate card methods, courier shipment dispatch, transit status lifecycle (`ShipmentStatus`), status audit tracking, and customer tracking lookup.

### Modified Capabilities

- `order-management`: Integrate shipment lifecycle with order fulfillment, syncing `Order.shipmentStatus` and `Order.orderStatus` on shipment dispatch/delivery, and embedding shipment data into order detail responses.
- `admin-layout`: Activate live AdminLTE 4 views for Shipments, Shipping Methods, and Shipping Zones in navigation config and route handling.

## Impact

- **Database**: Adds `ShippingZone`, `ShippingMethod`, `Shipment`, and `ShipmentStatusHistory` models to PostgreSQL via Prisma.
- **Backend API (`apps/api`)**: Adds `ShipmentsModule` (`ShipmentsService`, `ShipmentsController`, `AdminShipmentsController`, `AdminShippingZonesController`, `AdminShippingMethodsController`, DTOs, and unit tests). Integrates with `OrdersModule`.
- **Admin Frontend (`apps/admin`)**: Implements `apps/admin/services/shipments.ts`, live UI pages for shipments, shipping zones, shipping methods, and updates order details screen.
