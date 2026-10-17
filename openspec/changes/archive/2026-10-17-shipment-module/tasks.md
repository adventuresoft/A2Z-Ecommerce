# Tasks

## 1. Database Schema & Prisma Migration

- [x] 1.1 Add `ShippingZone`, `ShippingMethod`, `Shipment`, and `ShipmentStatusHistory` models with relations to `Order` and `User` in `apps/api/prisma/schema.prisma`.
- [x] 1.2 Synchronize the database schema with PostgreSQL using `pnpm --filter api exec prisma db push` and verify Prisma client generation.

## 2. Backend Shipments Module Core & DTOs

- [x] 2.1 Create shipping and shipment DTOs (`create-shipment.dto.ts`, `update-shipment-status.dto.ts`, `query-shipments.dto.ts`, `shipment-response.dto.ts`, `shipping-zone.dto.ts`, `shipping-method.dto.ts`) with `class-validator` rules and Swagger decorators.
- [x] 2.2 Implement `ShipmentsService` supporting delivery zones CRUD, shipping rate methods CRUD, shipment package creation, and transit status transitions with state machine validation and `ShipmentStatusHistory` audit logging.
- [x] 2.3 Implement Order-Shipment synchronization logic in `ShipmentsService` and update `OrdersService` to include shipments in order details and trigger inventory fulfillment on dispatch.

## 3. Backend REST Controllers & Swagger

- [x] 3.1 Implement administrative controllers: `AdminShipmentsController`, `AdminShippingZonesController`, and `AdminShippingMethodsController` secured with role guards.
- [x] 3.2 Implement public and customer endpoints in `ShipmentsController` for active zones/methods and tracking lookup by tracking number or order reference.
- [x] 3.3 Register `ShipmentsModule` in `AppModule` and verify API endpoints and Swagger documentation compile cleanly.

## 4. Backend Automated Testing

- [x] 4.1 Write comprehensive unit tests in `apps/api/src/shipments/shipments.service.spec.ts` covering zones/methods, shipment creation, transit state transitions, order synchronization, and history logging.
- [x] 4.2 Write controller unit tests in `apps/api/src/shipments/shipments.controller.spec.ts` and verify all tests pass.

## 5. Admin Frontend Shipping Views & Order Integration

- [x] 5.1 Implement `apps/admin/services/shipments.ts` with typed methods for shipments, zones, and rate methods.
- [x] 5.2 Build live AdminLTE 4 Shipments data table view at `apps/admin/app/shipping/shipments/page.tsx` with search, courier filter, status filter, and quick status modal.
- [x] 5.3 Build live AdminLTE 4 Shipment detail view at `apps/admin/app/shipping/shipments/[id]/page.tsx` with recipient snapshot, courier tracking link, and transit status timeline.
- [x] 5.4 Build live AdminLTE 4 management views for Shipping Methods (`apps/admin/app/shipping/methods/page.tsx`) and Shipping Zones (`apps/admin/app/shipping/zones/page.tsx`).
- [x] 5.5 Update `apps/admin/app/orders/[id]/page.tsx` with a dedicated Shipments card and a "Create Shipment" dispatch modal.
- [x] 5.6 Update `apps/admin/config/navigation.ts` to mark the Shipping modules as Live with success badges.

## 6. Verification & Monorepo Build Check

- [x] 6.1 Run TypeScript type-checking across `apps/api` and `apps/admin` and verify zero errors.
- [x] 6.2 Execute backend test suite (`pnpm --filter api test`) and ensure all tests pass.
- [x] 6.3 Run production build for `apps/api` and `apps/admin` and verify clean compilation.
