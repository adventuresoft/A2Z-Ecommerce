# Design: Shipments & Logistics Management Module

## Context

See [proposal.md](file:///c:/xampp/htdocs/office/az-ecommerce/openspec/changes/shipment-module/proposal.md). The platform already possesses operational modules for Auth/RBAC, Catalog (Categories, Brands, Attributes, Products, Variants), Inventory Management (`InventoryService`), and Orders (`OrdersService`, `Order`, `OrderItem`, `OrderStatusHistory`). The `Order` model currently tracks `shipmentStatus: ShipmentStatus @default(UNFULFILLED)` and contains frozen recipient shipping fields (`recipientName`, `recipientPhone`, `shippingStreet`, `shippingCity`, `shippingState`, `shippingPostalCode`, `customerNotes`).

This design specifies the schema, status transition state machine, bidirectional order synchronization, REST API structure, and AdminLTE 4 frontend views for shipping zones, rate cards, and courier shipment tracking.

## Goals / Non-Goals

**Goals:**
- Implement `ShippingZone`, `ShippingMethod`, `Shipment`, and `ShipmentStatusHistory` models in Prisma schema.
- Support administrative CRUD for delivery zones and shipping rate methods with delivery fees and estimated transit days.
- Support shipment creation for eligible orders (`CONFIRMED`, `PROCESSING`, `SHIPPED`) with courier assignment, tracking number, tracking URL, and notes.
- Implement shipment transit status transitions (`PREPARING` -> `DISPATCHED` -> `IN_TRANSIT` -> `OUT_FOR_DELIVERY` -> `DELIVERED`, with `FAILED_DELIVERY` and `RETURNED`) and record an audit log in `ShipmentStatusHistory`.
- Synchronize shipment events with the parent `Order`:
  - When a shipment is dispatched, set `Order.shipmentStatus = DISPATCHED`, advance `Order.orderStatus = SHIPPED`, and trigger inventory fulfillment (`InventoryService.fulfillReservedStock()`).
  - When all shipments are delivered, set `Order.shipmentStatus = DELIVERED` and `Order.orderStatus = DELIVERED`.
- Provide customer endpoints to track shipments for their authenticated orders and public tracking lookup by tracking number.
- Implement live AdminLTE 4 screens for Shipments (`/shipping/shipments`, `/shipping/shipments/[id]`), Shipping Methods (`/shipping/methods`), Shipping Zones (`/shipping/zones`), and integrate a Shipments card with a "Create Shipment" modal directly on the Order Details view (`/orders/[id]`).

**Non-Goals:**
- Direct third-party courier webhook callbacks (Steadfast, Pathao, RedX API secret callbacks can be layered on top of this internal shipment lifecycle in a future integration phase).
- Multi-warehouse inventory split shipping (one shipment package fulfills the customer order for single-vendor v1).

## Decisions

### 1. Relational Schema & Constraints
- **`ShippingZone`**:
  - `id`: UUID (PK).
  - `name`: String (e.g., "Inside Dhaka", "Outside Dhaka").
  - `description`: String? (Nullable).
  - `isActive`: Boolean (default `true`).
  - `sortOrder`: Int (default `0`).
  - `createdAt`, `updatedAt`.
  - Relations: `methods: ShippingMethod[]`.
- **`ShippingMethod`**:
  - `id`: UUID (PK).
  - `zoneId`: UUID (FK to `ShippingZone`, onDelete: Cascade).
  - `name`: String (e.g., "Standard Courier Delivery", "Express Delivery").
  - `cost`: Decimal(10, 2) (default `0.00`).
  - `estimatedDays`: Int (e.g., `2`, `3`).
  - `isActive`: Boolean (default `true`).
  - `sortOrder`: Int (default `0`).
  - `createdAt`, `updatedAt`.
  - Relations: `zone: ShippingZone`, `shipments: Shipment[]`.
- **`Shipment`**:
  - `id`: UUID (PK).
  - `orderId`: UUID (FK to `Order`, onDelete: Cascade).
  - `shippingMethodId`: UUID? (FK to `ShippingMethod`, onDelete: SetNull).
  - `courierName`: String (e.g., "Steadfast", "Pathao", "RedX", "In-House").
  - `trackingNumber`: String? (Indexed for fast courier lookup).
  - `trackingUrl`: String? (Clickable direct tracking link).
  - `status`: `ShipmentStatus` (default `PREPARING`).
  - `notes`: String? (Courier notes, weight, package instructions).
  - `shippedAt`: DateTime? (Timestamp marked upon dispatch).
  - `deliveredAt`: DateTime? (Timestamp marked upon final delivery).
  - `createdAt`, `updatedAt`.
  - Relations: `order: Order`, `shippingMethod: ShippingMethod?`, `statusHistory: ShipmentStatusHistory[]`.
- **`ShipmentStatusHistory`**:
  - `id`: UUID (PK).
  - `shipmentId`: UUID (FK to `Shipment`, onDelete: Cascade).
  - `fromStatus`: `ShipmentStatus`? (Nullable).
  - `toStatus`: `ShipmentStatus` (Not null).
  - `notes`: String? (Staff notes or transit event description).
  - `changedByUserId`: UUID? (FK to `User`, onDelete: SetNull).
  - `createdAt`: DateTime (default `now()`).
  - Relations: `shipment: Shipment`, `changedByUser: User?`.

### 2. Shipment State Transitions & Order Synchronization
- Allowed `ShipmentStatus` transitions:
  - `PREPARING` -> `DISPATCHED`
  - `DISPATCHED` -> `IN_TRANSIT`
  - `IN_TRANSIT` -> `OUT_FOR_DELIVERY`
  - `OUT_FOR_DELIVERY` -> `DELIVERED` or `FAILED_DELIVERY`
  - `FAILED_DELIVERY` -> `OUT_FOR_DELIVERY` (re-attempt) or `RETURNED`
  - `DELIVERED` -> terminal state (or `RETURNED` for processed customer returns).
  - `RETURNED` -> terminal state.
- **Fulfillment Coupling**:
  - When transitioning to `DISPATCHED`:
    - Set `shippedAt = new Date()`.
    - Update parent `Order.shipmentStatus = DISPATCHED`.
    - If `Order.orderStatus === OrderStatus.CONFIRMED || Order.orderStatus === OrderStatus.PROCESSING`, update `Order.orderStatus = SHIPPED`, invoke `InventoryService.fulfillReservedStock()`, and log `OrderStatusHistory`.
  - When transitioning to `DELIVERED`:
    - Set `deliveredAt = new Date()`.
    - Update parent `Order.shipmentStatus = DELIVERED`.
    - If `Order.orderStatus !== OrderStatus.CANCELLED && Order.orderStatus !== OrderStatus.RETURNED`, update `Order.orderStatus = DELIVERED` and log `OrderStatusHistory`.
  - When transitioning to `RETURNED`:
    - Update parent `Order.shipmentStatus = RETURNED`.

### 3. REST API Contract Design
- **Admin Shipments API (`/api/v1/admin/shipments`)**:
  - `GET /api/v1/admin/shipments`: Paginated search with filters (`status`, `courierName`, `search` by tracking or order number).
  - `GET /api/v1/admin/shipments/:id`: Detailed view with recipient snapshot, order items summary, and transit timeline.
  - `POST /api/v1/admin/shipments`: Dispatch package for an order (`orderId`, `courierName`, `trackingNumber`, `trackingUrl`, `shippingMethodId`, `notes`).
  - `PATCH /api/v1/admin/shipments/:id/status`: Update transit status (`status`, `notes`).
  - `PATCH /api/v1/admin/shipments/:id`: Update tracking info / courier metadata.
- **Admin Shipping Zones & Methods API (`/api/v1/admin/shipping/...`)**:
  - `GET /api/v1/admin/shipping/zones`: List all zones with method count.
  - `POST /api/v1/admin/shipping/zones`: Create zone.
  - `PATCH /api/v1/admin/shipping/zones/:id`: Update zone.
  - `DELETE /api/v1/admin/shipping/zones/:id`: Delete zone (soft or restricted if methods exist).
  - `GET /api/v1/admin/shipping/methods`: List all methods with zone relation.
  - `POST /api/v1/admin/shipping/methods`: Create method.
  - `PATCH /api/v1/admin/shipping/methods/:id`: Update method.
  - `DELETE /api/v1/admin/shipping/methods/:id`: Delete method.
- **Customer / Public API**:
  - `GET /api/v1/shipping/methods`: Active shipping methods for checkout rate selection.
  - `GET /api/v1/shipping/zones`: Active shipping zones.
  - `GET /api/v1/orders/:orderId/shipments`: Authenticated customer retrieves shipments for their order.
  - `GET /api/v1/shipments/track/:trackingNumber`: Public tracking status by courier tracking number.

### 4. Admin Frontend Architecture
- `apps/admin/services/shipments.ts`: Unified typed client for all shipping operations.
- `apps/admin/app/shipping/shipments/page.tsx`: Live AdminLTE data table with status pills, courier filter, tracking search, and quick status update modal.
- `apps/admin/app/shipping/shipments/[id]/page.tsx`: Shipment details card with recipient snapshot, courier details, direct tracking link, and transit status history timeline.
- `apps/admin/app/shipping/methods/page.tsx`: Shipping methods table with zone grouping, cost badges, and create/edit modal.
- `apps/admin/app/shipping/zones/page.tsx`: Shipping zones table with method counts and create/edit modal.
- `apps/admin/app/orders/[id]/page.tsx`: Enhanced Order Details with a Shipments card showing linked tracking, courier, and "Create Shipment" button for unfulfilled orders.
- `apps/admin/config/navigation.ts`: Mark Shipments, Shipping Methods, and Shipping Zones as Live with success badges.

## Risks / Trade-offs

- **[Risk: Multiple shipments for one order]** → **Mitigation**: Database allows 1-to-many (`Order` has many `Shipment`), and order status synchronization updates parent order based on the aggregate status.
- **[Risk: Accidental double dispatch]** → **Mitigation**: Validate that an order does not already have an active `PREPARING` or `DISPATCHED` shipment unless explicitly authorized by the operator.
- **[Risk: Race condition during status change]** → **Mitigation**: Status transitions and order synchronization execute within an atomic PostgreSQL transaction `prisma.$transaction`.
