# tag-catalog Specification

## Purpose

Enables creation, curation, and management of catalog tags with unique slugs and optional UI color badges for product categorization, marketing highlights, and faceted search discovery.

## ADDED Requirements

### Requirement: Tag Data Model and Slug Management
The system SHALL persist tags with unique `id` (UUID), `name` (up to 100 characters), unique URL-safe `slug` (up to 120 characters), optional `colorCode` (hex color string for badges), `isActive` boolean (defaulting to true), and timestamps. If no slug is explicitly provided upon creation, the system SHALL automatically generate a kebab-case slug derived from the tag name and resolve collisions by appending incremental numeric suffixes.

#### Scenario: Creating a tag with auto-generated slug
- **WHEN** an administrator creates a tag with name `"Summer Collection"` without supplying a slug
- **THEN** the system generates slug `"summer-collection"` and returns HTTP 201 Created

#### Scenario: Auto-resolving tag slug collision
- **WHEN** an administrator creates a tag with name `"Trending"` while slug `"trending"` already exists
- **THEN** the system generates slug `"trending-1"` and returns HTTP 201 Created

#### Scenario: Rejecting duplicate explicit tag slug
- **WHEN** an administrator creates or updates a tag with an explicit slug that already exists
- **THEN** the system rejects the request with HTTP 409 Conflict

### Requirement: Tag Management Administrative API
The system SHALL expose administrative REST endpoints beneath `/api/v1/admin/tags` restricted to `ADMIN` and `SUPER_ADMIN` roles for creating, listing with pagination and search, retrieving, updating, and deleting tags, including a product count property representing how many products currently use each tag.

#### Scenario: Querying paginated tags with product counts
- **WHEN** an administrator requests `GET /api/v1/admin/tags?search=eco&page=1&limit=10`
- **THEN** the system returns HTTP 200 with matching tags, pagination metadata, and `productCount` for each tag

#### Scenario: Updating tag details and color code
- **WHEN** an administrator updates a tag's name to `"Eco Friendly"` and `colorCode` to `"#198754"`
- **THEN** the system persists the changes and returns HTTP 200 OK with the updated tag

### Requirement: Safe Tag Deletion
The system SHALL allow deletion of any tag via `DELETE /api/v1/admin/tags/:id`, automatically cascading the deletion to remove associated `ProductTag` join records without deleting or modifying the underlying products.

#### Scenario: Deleting a tag assigned to products
- **WHEN** an administrator deletes a tag that is currently linked to five products
- **THEN** the system removes the tag and its five `ProductTag` links, leaves the five products intact, and returns HTTP 200 OK

### Requirement: Public Tags Querying
The system SHALL expose a public REST endpoint `GET /api/v1/tags` that returns active tags with their names, slugs, color codes, and product counts for storefront tag clouds and filter navigation.

#### Scenario: Retrieving active public tags
- **WHEN** a client sends `GET /api/v1/tags`
- **THEN** the system returns HTTP 200 with an array of active tags sorted by name or product count
