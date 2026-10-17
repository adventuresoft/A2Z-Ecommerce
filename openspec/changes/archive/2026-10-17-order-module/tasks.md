# Tasks

## 1. Database Schema & Prisma Migration

- [x] 1.1 Add `OrderStatus`, `PaymentStatus`, and `ShipmentStatus` enums, plus `Order`, `OrderItem`, and `OrderStatusHistory` models to `apps/api/prisma/schema.prisma` with appropriate relations, defaults, and indexes.
- [x] 1.2 Synchronize the database schema with PostgreSQL using `pnpm --filter api exec prisma db push` and verify client generation.

## 2. Backend Orders Module Core & DTOs

- [x] 2.1 Create order DTOs (`create-order.dto.ts`, `query-orders.dto.ts`, `update-order-status.dto.ts`, `order-response.dto.ts`, `cancel-order.dto.ts`) with strict `class-validator` rules and Swagger decorators.
- [x] 2.2 Implement `OrdersService` with transactional order creation, database price verification, stock reservation via `InventoryService.reserveStock()`, order number generation, and status history logging.
- [x] 2.3 Implement status transition logic in `OrdersService` with state transition validation, administrative notes, and stock fulfillment deduction via `InventoryService.fulfillReservedStock()` when marked `SHIPPED`.
- [x] 2.4 Implement customer cancellation in `OrdersService` verifying `PENDING` eligibility, releasing reserved stock via `InventoryService.releaseReservedStock()`, and recording history notes.

## 3. Backend REST Controllers & Swagger

- [x] 3.1 Implement customer `OrdersController` (`POST /api/v1/orders`, `GET /api/v1/orders`, `GET /api/v1/orders/:id`, `POST /api/v1/orders/:id/cancel`) secured by JWT authentication.
- [x] 3.2 Implement `AdminOrdersController` (`GET /api/v1/admin/orders`, `GET /api/v1/admin/orders/:id`, `PATCH /api/v1/admin/orders/:id/status`) with permissions checks.
- [x] 3.3 Register `OrdersModule` in `AppModule` and verify API endpoints and Swagger documentation compile without errors.

## 4. Backend Automated Testing

- [x] 4.1 Write comprehensive unit tests in `apps/api/src/orders/orders.service.spec.ts` covering price verification, stock reservation, status transitions, and cancellation stock release.
- [x] 4.2 Write controller unit tests in `apps/api/src/orders/orders.controller.spec.ts` and verify test suite passes.

## 5. Admin Frontend Orders Management Views

- [x] 5.1 Implement `apps/admin/services/orders.ts` with typed methods for listing orders, retrieving order details, and updating order status.
- [x] 5.2 Build live AdminLTE 4 orders data table view at `apps/admin/app/orders/page.tsx` with search, status filters, pagination, and status badges.
- [x] 5.3 Build live AdminLTE 4 order detail view at `apps/admin/app/orders/[id]/page.tsx` with frozen customer and delivery address, line items breakdown, status update modal, and status timeline.
- [x] 5.4 Update `apps/admin/config/navigation.ts` to mark the Orders module as Live with a success badge.

## 6. Verification & Monorepo Build Check

- [x] 6.1 Run TypeScript type-checking across `apps/api` and `apps/admin` and verify zero errors.
- [x] 6.2 Execute backend test suite (`pnpm --filter api test`) and ensure all tests pass.
- [x] 6.3 Run production build for `apps/api` and `apps/admin` and verify clean compilation.
