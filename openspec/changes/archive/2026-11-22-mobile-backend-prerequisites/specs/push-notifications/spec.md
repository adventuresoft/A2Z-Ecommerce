# Spec Delta

## Purpose

Manages mobile push notification device token registration per customer device and delivers non-blocking remote push notifications when store order, payment, or promotional notifications are generated.

## ADDED Requirements

### Requirement: Device Push Token Registration and Lifecycle Management
The system SHALL expose `POST /api/v1/notifications/device-tokens` and `DELETE /api/v1/notifications/device-tokens/:token` protected by JWT authentication so mobile clients can register, refresh, and deactivate push tokens per device.

#### Scenario: Registering or refreshing a device push token
- **WHEN** an authenticated user submits a valid push token, platform (`ANDROID` or `IOS`), and `deviceId` to `POST /api/v1/notifications/device-tokens`
- **THEN** the system upserts the token record associated with the authenticated user, marks it active, updates `lastUsedAt`, and returns HTTP 200 OK

#### Scenario: Reassigning a shared device token to a newly logged-in user
- **WHEN** a different user logs in on the same physical device and submits the same push token to `POST /api/v1/notifications/device-tokens`
- **THEN** the system transfers token ownership to the currently authenticated user so the previous user no longer receives notifications on that device

#### Scenario: Deactivating a push token on logout
- **WHEN** an authenticated user calls `DELETE /api/v1/notifications/device-tokens/:token` for a token they own
- **THEN** the system marks the token inactive (or deletes it) and returns HTTP 200 OK

### Requirement: Non-Blocking Remote Push Notification Dispatch
When the system creates a customer-facing notification (`ORDER_STATUS`, `PAYMENT`, or `PROMOTION`), it SHALL asynchronously dispatch push notifications to all active registered device tokens for the target user, including structured deep-link routing metadata, without blocking or failing the primary business transaction.

#### Scenario: Order status change triggers push notification
- **WHEN** an order status transitions (such as `SHIPPED` or `DELIVERED`) and an in-app notification is recorded for the customer
- **THEN** the system dispatches a push payload containing localized title, body, and route metadata (`/orders/:orderId`) to the customer's active device tokens

#### Scenario: Push delivery failure does not fail order mutation
- **WHEN** the upstream push provider is unreachable or returns an error during dispatch
- **THEN** the system logs the failure cleanly and completes the originating order/payment mutation without error

#### Scenario: Stale or unregistered device token cleanup
- **WHEN** the upstream push provider reports a token as permanently unregistered (`DeviceNotRegistered`)
- **THEN** the system automatically marks that device token inactive to prevent repeated failed deliveries
