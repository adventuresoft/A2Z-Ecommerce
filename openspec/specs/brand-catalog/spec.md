# brand-catalog Specification

## Purpose

Provides durable system behaviors for product brand management, including brand data integrity, slug generation and stability, deletion safeguards, logo uploads, role-guarded administrative controls, and public active-brand discovery.

## Requirements

### Requirement: Brand Data Model and Validation
The system SHALL persist brands with a required `name` (max 100 characters), a unique `slug` (max 120 characters, lowercase alphanumeric segments separated by single hyphens), optional `description`, optional `logoUrl` (max 255 characters), optional `website` (max 255 characters, valid `http` or `https` URL), `isActive` (default `true`), and a non-negative integer `sortOrder` (default `0`), and SHALL reject invalid payloads with HTTP 400 Bad Request.

#### Scenario: Creating a brand with minimal valid data
- **WHEN** an administrator submits `POST /api/v1/admin/brands` with only `name: "Samsung"`
- **THEN** the system returns HTTP 201 Created with the brand persisted as `isActive: true`, `sortOrder: 0`, and null `description`, `logoUrl`, and `website`

#### Scenario: Rejecting an invalid website URL
- **WHEN** an administrator submits a brand with `website: "not a url"` or `website: "ftp://example.com"`
- **THEN** the system rejects the request with HTTP 400 Bad Request identifying the `website` field

#### Scenario: Rejecting an over-length name
- **WHEN** an administrator submits a brand whose `name` exceeds 100 characters
- **THEN** the system rejects the request with HTTP 400 Bad Request

### Requirement: Brand Slug Generation and URL Stability
The system SHALL auto-generate a unique URL-friendly slug from the brand name when no slug is supplied, resolve auto-generation collisions with incremental numeric suffixes, reject explicitly supplied slugs that already belong to another brand with HTTP 409 Conflict, and preserve the existing slug when a brand name is updated without a new slug.

#### Scenario: Auto-generating slug on creation
- **WHEN** an administrator creates a brand with `name: "Levi's Originals"` and no `slug`
- **THEN** the system stores `slug: "levis-originals"`

#### Scenario: Auto-resolving slug collision
- **WHEN** an administrator creates a brand with `name: "Apple"` and no `slug` while `slug: "apple"` already exists
- **THEN** the system stores `slug: "apple-1"`

#### Scenario: Rejecting a duplicate explicit slug
- **WHEN** an administrator creates or updates a brand with an explicit `slug` already used by a different brand
- **THEN** the system rejects the request with HTTP 409 Conflict

#### Scenario: Preserving slug on rename
- **WHEN** an administrator updates a brand name from `"Samsung"` to `"Samsung Electronics"` without supplying a slug
- **THEN** the system keeps the existing slug `"samsung"`

### Requirement: Brand Deletion Safeguards
The system SHALL prevent deletion of any brand referenced by one or more products, responding with HTTP 409 Conflict and advising deactivation instead, and SHALL delete unreferenced brands with HTTP 200 OK.

#### Scenario: Deleting an unreferenced brand
- **WHEN** an administrator requests `DELETE /api/v1/admin/brands/:id` for a brand with zero associated products
- **THEN** the system deletes the brand and returns HTTP 200 OK with a success message

#### Scenario: Attempting deletion of a brand with products
- **WHEN** an administrator requests deletion of a brand that one or more products reference
- **THEN** the system rejects the deletion with HTTP 409 Conflict stating the product count and recommending deactivation or product reassignment

#### Scenario: Deleting a non-existent brand
- **WHEN** an administrator requests deletion of a brand ID that does not exist
- **THEN** the system responds with HTTP 404 Not Found

### Requirement: Administrative Brand Management Endpoints
The system SHALL expose administrative REST endpoints beneath `/api/v1/admin/brands` restricted to `ADMIN` and `SUPER_ADMIN` roles, providing create, read-by-ID, update, delete, and a paginated listing that supports case-insensitive search over name and slug, `isActive` filtering, and sorting by `name`, `sortOrder`, or `createdAt` in either direction.

#### Scenario: Paginated brand query with filters
- **WHEN** an authorized administrator requests `GET /api/v1/admin/brands?page=1&limit=10&search=sam&isActive=true&sortBy=name&sortOrder=asc`
- **THEN** the system returns HTTP 200 OK with `items`, `total`, `page`, `limit`, and `totalPages`, containing only active brands whose name or slug matches `sam`, ordered by name ascending

#### Scenario: Rejecting an unsupported sort field
- **WHEN** an authorized administrator requests `GET /api/v1/admin/brands?sortBy=website`
- **THEN** the system rejects the request with HTTP 400 Bad Request

#### Scenario: Fetching a missing brand by ID
- **WHEN** an authorized administrator requests `GET /api/v1/admin/brands/:id` for an unknown ID
- **THEN** the system responds with HTTP 404 Not Found

#### Scenario: Unauthorized access attempt
- **WHEN** an unauthenticated client or a `CUSTOMER` user calls any `/api/v1/admin/brands` endpoint
- **THEN** the system rejects the request with HTTP 401 Unauthorized or HTTP 403 Forbidden respectively

### Requirement: Brand Logo Upload
The system SHALL provide `POST /api/v1/admin/brands/upload-logo` for authorized administrators, accepting a single multipart `file` field limited to JPG, PNG, WEBP, SVG, or GIF images up to 5 MB, storing it under the brand uploads directory, and returning a publicly served `logoUrl` beneath `/uploads/brands/`.

#### Scenario: Uploading a valid logo
- **WHEN** an authorized administrator uploads a 200 KB PNG file
- **THEN** the system returns HTTP 201 Created with `logoUrl` beginning with `/uploads/brands/`, plus `filename`, `originalName`, and `size`

#### Scenario: Rejecting a non-image upload
- **WHEN** an authorized administrator uploads a PDF file
- **THEN** the system rejects the request with HTTP 400 Bad Request

#### Scenario: Rejecting an oversized upload
- **WHEN** an authorized administrator uploads an image larger than 5 MB
- **THEN** the system rejects the request with an HTTP 4xx error and does not store the file

### Requirement: Public Brand Listing and Slug Lookup
The system SHALL provide unauthenticated endpoints returning only active brands: `GET /api/v1/brands` listing active brands ordered by `sortOrder` ascending then `name` ascending, and `GET /api/v1/brands/:slug` returning a single active brand's public details.

#### Scenario: Listing active brands
- **WHEN** a client requests `GET /api/v1/brands`
- **THEN** the system returns HTTP 200 OK with active brands only, each including `id`, `name`, `slug`, `description`, `logoUrl`, `website`, and `sortOrder`, ordered by `sortOrder` then `name`

#### Scenario: Fetching an active brand by slug
- **WHEN** a client requests `GET /api/v1/brands/samsung` for an active brand
- **THEN** the system returns HTTP 200 OK with that brand's public details

#### Scenario: Requesting an inactive or unknown brand slug
- **WHEN** a client requests `GET /api/v1/brands/:slug` for a slug that does not exist or belongs to an inactive brand
- **THEN** the system responds with HTTP 404 Not Found

### Requirement: Administrative Brand Management UI
The admin application SHALL render an AdminLTE brand management page at `/catalog/brands` with a data table showing logo thumbnail, name, slug, website, active status toggle, and row actions, together with search, status filter, sortable headers, pagination, a create/edit modal supporting logo upload or URL entry with live preview, and a delete confirmation modal that surfaces server conflict messages.

#### Scenario: Rendering the brand table
- **WHEN** an administrator navigates to `/catalog/brands`
- **THEN** the page renders an AdminLTE card containing a search input, status filter, sortable brand rows, and pagination controls

#### Scenario: Creating a brand with logo preview
- **WHEN** an administrator opens the "Add Brand" modal and uploads a logo file or enters a logo URL
- **THEN** the modal shows a live logo preview and, on submit, the new brand appears in the table

#### Scenario: Toggling brand status inline
- **WHEN** an administrator toggles a brand's active switch in the table
- **THEN** the system updates `isActive` via the admin API and shows success feedback, reverting the switch on failure

#### Scenario: Surfacing a deletion conflict
- **WHEN** an administrator confirms deletion of a brand and the API responds with HTTP 409 Conflict
- **THEN** the delete modal displays the server's conflict message and the brand remains in the table
