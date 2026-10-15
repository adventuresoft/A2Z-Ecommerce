# attribute-catalog Specification

## Purpose

Enables centralized catalog attribute and attribute value definition, curation, and management, providing standard product options (e.g. Color, Size, Material) with display types for variant generation and storefront filtering.

## Requirements

### Requirement: Attribute Data Model and Integrity
The system SHALL persist attributes with `name`, unique `slug`, display `type` (`TEXT`, `COLOR`, `BUTTON`), optional `description`, `isActive` flag, and `sortOrder`, automatically deriving a URL-safe slug from `name` if not provided, resolving collisions with incremental numeric suffixes, and keeping existing slugs unchanged when an attribute is renamed without a new slug.

#### Scenario: Creating an attribute with auto-generated slug
- **WHEN** an administrator creates an attribute with `name: "Shoe Size"` and no `slug`
- **THEN** the system persists the attribute with `slug: "shoe-size"` and default `type: "TEXT"`

#### Scenario: Auto-resolving slug collision
- **WHEN** an administrator creates an attribute with `name: "Color"` and no `slug` while `slug: "color"` already exists
- **THEN** the system assigns `slug: "color-1"`

#### Scenario: Preserving slug on name update
- **WHEN** an administrator updates an attribute's name from `"Color"` to `"Primary Color"` without supplying a `slug`
- **THEN** the system preserves the existing `slug: "color"`

#### Scenario: Rejecting duplicate explicit slug
- **WHEN** an administrator creates or updates an attribute with an explicit `slug` already used by another attribute
- **THEN** the system rejects the request with HTTP 409 Conflict

### Requirement: Attribute Value Management and Integrity
The system SHALL persist attribute values linked to a parent attribute with `value`, optional `label`, optional `colorCode` (hex color string), `sortOrder`, and `isActive` flag, enforcing uniqueness on `(attributeId, value)`, and validating that `colorCode` adheres to `#RGB` or `#RRGGBB` format when supplied.

#### Scenario: Creating a valid attribute value
- **WHEN** an administrator adds a value with `value: "Navy Blue"`, `label: "Navy"`, and `colorCode: "#000080"` to a `COLOR` attribute
- **THEN** the system stores the value associated with that attribute and returns HTTP 201 Created

#### Scenario: Rejecting duplicate value for the same attribute
- **WHEN** an administrator adds `value: "XL"` to an attribute that already has an attribute value with `value: "XL"`
- **THEN** the system rejects the request with HTTP 409 Conflict

#### Scenario: Rejecting invalid colorCode format
- **WHEN** an administrator adds or updates an attribute value with `colorCode: "blue"` or `"12345"`
- **THEN** the system rejects the request with HTTP 400 Bad Request

### Requirement: Attribute and Value Deletion Safeguards
The system SHALL prevent deletion of any attribute or attribute value referenced by existing products or variants, responding with HTTP 409 Conflict, and SHALL allow deletion of unreferenced attributes (cascading to their attribute values) or unreferenced individual values with HTTP 200 OK.

#### Scenario: Deleting an unreferenced attribute
- **WHEN** an administrator requests `DELETE /api/v1/admin/attributes/:id` for an attribute with zero product or variant references
- **THEN** the system removes the attribute and its associated values and returns HTTP 200 OK

#### Scenario: Attempting deletion of an attribute referenced by products or variants
- **WHEN** an administrator requests deletion of an attribute linked to one or more products or variants
- **THEN** the system rejects the deletion with HTTP 409 Conflict stating the reference count and advising deactivation

#### Scenario: Deleting a non-existent attribute
- **WHEN** an administrator requests deletion of an attribute ID that does not exist
- **THEN** the system responds with HTTP 404 Not Found

### Requirement: Administrative Attribute Endpoints
The system SHALL expose administrative REST endpoints beneath `/api/v1/admin/attributes` restricted to `ADMIN` and `SUPER_ADMIN` roles, supporting pagination, search over `name` and `slug`, filtering by `type` and `isActive`, sorting by `name`, `sortOrder`, or `createdAt`, and nested value management at `/api/v1/admin/attributes/:id/values`.

#### Scenario: Paginated query with search and filters
- **WHEN** an authorized administrator requests `GET /api/v1/admin/attributes?page=1&limit=10&search=col&type=COLOR&isActive=true&sortBy=sortOrder&sortOrder=asc`
- **THEN** the system returns HTTP 200 OK with `items`, `total`, `page`, `limit`, and `totalPages`, including attribute values and item counts

#### Scenario: Creating an attribute with initial values inline
- **WHEN** an authorized administrator posts an attribute payload containing `name: "Size"`, `type: "BUTTON"`, and `values: [{ value: "S" }, { value: "M" }, { value: "L" }]`
- **THEN** the system creates the attribute and all three values atomically in a transaction and returns HTTP 201 Created

#### Scenario: Unauthorized access attempt
- **WHEN** an unauthenticated client or a `CUSTOMER` role calls any `/api/v1/admin/attributes` endpoint
- **THEN** the system rejects the request with HTTP 401 Unauthorized or HTTP 403 Forbidden

### Requirement: Public Attribute Listing and Slug Lookup
The system SHALL expose unauthenticated endpoints returning active attributes with their active values: `GET /api/v1/attributes` ordered by `sortOrder` ascending then `name` ascending, and `GET /api/v1/attributes/:slug` returning a single active attribute with its active values.

#### Scenario: Listing active attributes for storefront
- **WHEN** a public client requests `GET /api/v1/attributes`
- **THEN** the system returns HTTP 200 OK with active attributes only, each containing active attribute values ordered by `sortOrder` ascending

#### Scenario: Fetching an active attribute by slug
- **WHEN** a client requests `GET /api/v1/attributes/color` for an active attribute
- **THEN** the system returns HTTP 200 OK with the attribute details and its active values

#### Scenario: Fetching an inactive or missing attribute slug
- **WHEN** a client requests `GET /api/v1/attributes/non-existent`
- **THEN** the system responds with HTTP 404 Not Found

### Requirement: Administrative Attribute Management UI
The admin application SHALL render an AdminLTE attribute management page at `/catalog/attributes` featuring an interactive data table with search, type filter, status filter, sortable headers, pagination, visual values preview (color swatch circles or text chips), inline active toggle, create/edit modal with dynamic value rows and color picker, and conflict-aware delete confirmation.

#### Scenario: Rendering the attributes table
- **WHEN** an administrator navigates to `/catalog/attributes`
- **THEN** the page displays the AdminLTE card with filters, attribute rows showing type badges and value swatches/chips, and pagination controls

#### Scenario: Creating an attribute with color values
- **WHEN** an administrator opens the "Add Attribute" modal, selects type "Color", adds values with color hex codes using the color picker, and submits
- **THEN** the modal saves the attribute and the new record appears in the table with color swatches

#### Scenario: Toggling attribute status inline
- **WHEN** an administrator toggles an attribute's active switch in the table
- **THEN** the system updates `isActive` via the admin API and displays success feedback

#### Scenario: Handling deletion conflict in the UI
- **WHEN** an administrator confirms deletion of an in-use attribute and the API responds with HTTP 409 Conflict
- **THEN** the delete modal displays the server's conflict message and leaves the table intact
