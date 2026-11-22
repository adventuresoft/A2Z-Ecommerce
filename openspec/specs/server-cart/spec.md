# server-cart Specification

## Purpose
Provides authenticated, cross-device customer shopping cart persistence, item quantity validation against available inventory, and guest-to-user cart merge synchronization across web and mobile clients.

## Requirements

### Requirement: Authenticated Customer Cart Retrieval
The system SHALL expose `GET /api/v1/cart` protected by JWT authentication, returning all persisted cart items for the authenticated customer enriched with live product title, slug, variant SKU, attribute selections, effective pricing, primary image URL, and available warehouse stock.

#### Scenario: Customer retrieves persisted cart items
- **WHEN** an authenticated customer requests `GET /api/v1/cart`
- **THEN** the system returns HTTP 200 OK with the customer's cart items ordered by most recently updated, including live pricing and stock availability indicators for each item

#### Scenario: Unauthenticated customer attempts to access server cart
- **WHEN** a client requests `GET /api/v1/cart` without a valid Bearer token
- **THEN** the system rejects the request with HTTP 401 Unauthorized

### Requirement: Cart Item Mutation with Inventory Guardrails
The system SHALL expose `POST /api/v1/cart/items`, `PATCH /api/v1/cart/items/:variantId`, `DELETE /api/v1/cart/items/:variantId`, and `DELETE /api/v1/cart` protected by JWT authentication. Adding an existing variant MUST increment its persisted quantity idempotently, and requested quantities MUST be validated against active variant status and available stock.

#### Scenario: Adding a new variant to cart
- **WHEN** an authenticated customer submits a valid active `variantId` and positive integer `quantity` within available stock to `POST /api/v1/cart/items`
- **THEN** the system persists the cart item and returns HTTP 200 OK with the updated cart representation

#### Scenario: Incrementing an already-present variant in cart
- **WHEN** an authenticated customer submits a `variantId` that already exists in their cart to `POST /api/v1/cart/items`
- **THEN** the system sums the existing and added quantities, capping or rejecting if available stock is exceeded, and persists the single deduplicated record

#### Scenario: Updating cart item quantity to zero or negative
- **WHEN** an authenticated customer submits `quantity <= 0` to `PATCH /api/v1/cart/items/:variantId`
- **THEN** the system removes that cart item or rejects invalid negative input with HTTP 400 Bad Request per validation rules

#### Scenario: Removing an item or clearing the entire cart
- **WHEN** an authenticated customer calls `DELETE /api/v1/cart/items/:variantId` or `DELETE /api/v1/cart`
- **THEN** the system deletes only the targeted item(s) belonging to that customer and returns HTTP 200 OK

### Requirement: Guest-to-Authenticated Cart Merge Synchronization
The system SHALL expose `POST /api/v1/cart/sync` protected by JWT authentication, accepting an array of guest `{ variantId, quantity }` entries, merging them atomically with the customer's existing server cart, ignoring archived/non-existent variants, capping merged quantities to available warehouse stock, and returning the full reconciled cart along with any adjustment warnings.

#### Scenario: Merging guest cart items on login
- **WHEN** a newly authenticated customer sends guest cart items to `POST /api/v1/cart/sync`
- **THEN** the system merges overlapping variants by summing quantities capped at available stock, inserts non-overlapping active variants, and returns HTTP 200 OK with the reconciled cart list and stock-adjustment notices

#### Scenario: Sync payload contains unavailable or out-of-stock variants
- **WHEN** `POST /api/v1/cart/sync` receives a variant ID that does not exist or has zero available stock
- **THEN** the system skips the unavailable variant without failing the entire merge and reports the skipped item in the sync warnings array
