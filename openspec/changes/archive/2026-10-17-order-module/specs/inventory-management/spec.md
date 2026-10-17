# Spec Delta

## MODIFIED Requirements

### Requirement: Transaction-Safe Stock Reservation Interfaces
The system SHALL provide internal service methods (`reserveStock`, `releaseReservedStock`, `fulfillReservedStock`, and `restoreStock`) executed in database transactions with row-level locks, permitting downstream checkout and order lifecycle modules to reserve inventory, release reservations on cancellation, deduct physical stock upon dispatch, and replenish stock upon returns.

#### Scenario: Successful stock reservation
- **WHEN** a reservation request is made for 3 units of a variant having physical quantity 10 and reserved quantity 2
- **THEN** the system increments `reservedQuantity` to 5 and creates a `PURCHASE_RESERVE` ledger entry within the active transaction

#### Scenario: Failed stock reservation due to insufficient available stock
- **WHEN** a reservation request is made for 5 units of a variant having physical quantity 10 and reserved quantity 8 (available 2)
- **THEN** the system rolls back the transaction and throws an InsufficientStockException without modifying balances

#### Scenario: Order cancellation reserved stock release
- **WHEN** an order containing reserved variants is cancelled
- **THEN** the system decrements `reservedQuantity` by the cancelled order quantity and creates a `CANCEL_RESTORE` ledger entry without altering physical on-hand quantity

#### Scenario: Order fulfillment physical and reserved stock deduction
- **WHEN** an order is marked shipped or fulfilled
- **THEN** the system decrements both physical `quantity` and `reservedQuantity` by the fulfilled quantity and creates an `ORDER_FULFILL` ledger entry
