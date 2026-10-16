# inventory-management Specification

## Purpose

Enables accurate tracking of warehouse stock balances per physical product variant (SKU), provides concurrency-safe stock adjustments and reservations, maintains an immutable audit ledger of all inventory movements, and delivers low-stock monitoring for store administrators.

## Requirements

### Requirement: Inventory Record and Variant Binding
The system SHALL maintain a 1:1 relational inventory balance record for each physical product variant (`ProductVariant`), storing physical on-hand `quantity` (non-negative integer), committed `reservedQuantity` (non-negative integer), and configurable `lowStockThreshold` (positive integer, default 5), ensuring that available sellable quantity is computed as `availableQuantity = quantity - reservedQuantity >= 0`.

#### Scenario: Default inventory initialization for new variant
- **WHEN** a new product variant is created in the catalog
- **THEN** an associated Inventory record is automatically initialized with `quantity` 0, `reservedQuantity` 0, and `lowStockThreshold` 5

#### Scenario: Existing variants initialization
- **WHEN** the inventory migration executes across existing product variants without inventory records
- **THEN** an Inventory record is created for each variant with default values of 0 quantity, 0 reserved, and 5 threshold

### Requirement: Concurrency-Safe Stock Adjustment
The system SHALL provide administrative stock adjustment operations (`RESTOCK`, `MANUAL_ADJUSTMENT`, `DAMAGED`) that execute within a database transaction utilizing row-level pessimistic locking (`FOR UPDATE`), recalculating physical quantity by delta and rejecting any adjustment that would result in negative physical quantity or physical quantity lower than committed reserved quantity.

#### Scenario: Successful restock adjustment
- **WHEN** an administrator submits a restock adjustment with a positive delta of 50 units for a variant having 10 units on-hand
- **THEN** the system increments the physical quantity to 60, updates the timestamp, logs the ledger entry, and returns HTTP 200 OK

#### Scenario: Rejection of negative stock outcome
- **WHEN** an administrator attempts to deduct 20 units from a variant with only 10 physical units on hand
- **THEN** the system aborts the transaction with HTTP 400 Bad Request and leaves inventory quantities unchanged

#### Scenario: Rejection of deduction below reserved quantity
- **WHEN** an administrator attempts to reduce physical quantity below currently committed reserved quantity
- **THEN** the system rejects the operation with HTTP 400 Bad Request stating insufficient unreserved stock

### Requirement: Immutable Stock Movement Ledger
The system SHALL record an immutable audit ledger entry in `StockMovement` for every stock balance modification, capturing the associated `variantId`, `type` enum, signed `quantityChange`, `previousQuantity`, `newQuantity`, optional `referenceId` (purchase order or audit count code), optional administrative `notes`, the authenticated user ID (`performedByUserId`), and creation timestamp.

#### Scenario: Ledger entry recording on manual adjustment
- **WHEN** an administrator adjusts inventory quantity by -2 due to damaged stock with note "Broken in transit"
- **THEN** a `StockMovement` record is created containing `DAMAGED` type, delta -2, previous and new balances, admin user id, and notes

#### Scenario: Ledger immutability
- **WHEN** stock movements are queried through the administrative API
- **THEN** the movements are returned in reverse chronological order with no API endpoint permitting modification or deletion of movement records

### Requirement: Low Stock Detection and Threshold Configuration
The system SHALL allow administrators to view and configure the `lowStockThreshold` for each product variant, dynamically classifying a variant as low stock whenever `availableQuantity <= lowStockThreshold`, and classifying it as out-of-stock when `availableQuantity = 0`.

#### Scenario: Updating low stock threshold
- **WHEN** an administrator submits a PATCH request to update a variant's `lowStockThreshold` to 15
- **THEN** the system updates the threshold and returns the updated inventory record with HTTP 200 OK

#### Scenario: Low stock filtering
- **WHEN** an administrator queries the inventory overview with `lowStock=true`
- **THEN** the system returns only variants whose available sellable quantity is less than or equal to their low stock threshold

### Requirement: Transaction-Safe Stock Reservation Interfaces
The system SHALL provide internal service methods (`reserveStock`, `releaseReservedStock`, `fulfillReservedStock`, and `restoreStock`) executed in database transactions with row-level locks, permitting downstream checkout and order lifecycle modules to reserve inventory, release reservations on cancellation, deduct physical stock upon dispatch, and replenish stock upon returns.

#### Scenario: Successful stock reservation
- **WHEN** a reservation request is made for 3 units of a variant having physical quantity 10 and reserved quantity 2
- **THEN** the system increments `reservedQuantity` to 5 and creates a `PURCHASE_RESERVE` ledger entry within the active transaction

#### Scenario: Failed stock reservation due to insufficient available stock
- **WHEN** a reservation request is made for 5 units of a variant having physical quantity 10 and reserved quantity 8 (available 2)
- **THEN** the system rolls back the transaction and throws an InsufficientStockException without modifying balances

### Requirement: Administrative Inventory API Endpoints
The system SHALL expose administrative REST endpoints beneath `/api/v1/admin/inventory` protected by JWT authentication and restricted to `ADMIN` and `SUPER_ADMIN` roles, supporting pagination, keyword search across product title and SKU, category filtering, low-stock filtering, and retrieval of stock movement history.

#### Scenario: Paginated inventory list retrieval
- **WHEN** an administrator sends a GET request to `/api/v1/admin/inventory?page=1&limit=10&search=shirt`
- **THEN** the system returns HTTP 200 OK with a paginated array of inventory records matching the search query along with pagination metadata

#### Scenario: Unauthorized customer access rejection
- **WHEN** a user with role `CUSTOMER` attempts to access any endpoint under `/api/v1/admin/inventory`
- **THEN** the system rejects the request with HTTP 403 Forbidden
