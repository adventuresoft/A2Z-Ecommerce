# Spec Delta

## Purpose

Provides durable system behaviors for product category taxonomy management, hierarchical navigation trees, deletion dependency safeguards, slug stability rules, and role-guarded administrative catalog controls.

## ADDED Requirements

### Requirement: Category Taxonomy Hierarchy and Depth Limitation
The system SHALL support nested categories up to a maximum depth of 3 levels (Root Level 1, Subcategory Level 2, and Leaf Level 3) and SHALL reject assigning any Level 3 category as a parent or creating circular hierarchy references.

#### Scenario: Creating a valid Level 2 subcategory
- **WHEN** an administrator creates a category with `parentId` referencing an existing Level 1 category
- **THEN** the system successfully persists the category with hierarchy depth 2

#### Scenario: Rejecting creation beyond 3 levels of depth
- **WHEN** an administrator attempts to create or update a category with `parentId` referencing a Level 3 category
- **THEN** the system rejects the request with HTTP 400 Bad Request indicating the maximum hierarchy depth of 3 has been reached

#### Scenario: Rejecting circular hierarchy references
- **WHEN** an administrator attempts to update a category setting its `parentId` to itself or any of its own descendant categories
- **THEN** the system rejects the request with HTTP 400 Bad Request indicating a circular parent dependency

### Requirement: Deletion Safeguards and Dependency Enforcement
The system SHALL prevent the deletion of any category that currently has one or more child subcategories or assigned products, responding with an HTTP 409 Conflict.

#### Scenario: Attempting deletion of category with subcategories
- **WHEN** an administrator requests deletion of a category that has one or more child categories
- **THEN** the system rejects the deletion with HTTP 409 Conflict stating that subcategories must be reassigned or deleted first

#### Scenario: Attempting deletion of category with assigned products
- **WHEN** an administrator requests deletion of a category that has one or more products assigned to it
- **THEN** the system rejects the deletion with HTTP 409 Conflict stating that associated products must be reassigned first

#### Scenario: Successful deletion of empty category
- **WHEN** an administrator requests deletion of a category having zero child subcategories and zero assigned products
- **THEN** the system deletes the category and returns HTTP 200 OK

### Requirement: Smart Slug Generation and URL Stability
The system SHALL auto-generate unique URL-friendly slugs from category titles on creation while preserving existing slugs across title edits and resolving auto-generation collisions with incremental suffix counters.

#### Scenario: Auto-generating slug on creation
- **WHEN** an administrator creates a category with `name: "Men's Footwear"` and an empty `slug`
- **THEN** the system generates and stores `slug: "mens-footwear"`

#### Scenario: Auto-resolving collision on creation
- **WHEN** an administrator creates a category with `name: "Laptops"` and an empty `slug` where `slug: "laptops"` already exists
- **THEN** the system automatically generates and stores `slug: "laptops-1"`

#### Scenario: Preserving slug on category title update
- **WHEN** an administrator updates a category title from `"Men's Footwear"` to `"Men's Shoes & Boots"` without supplying a new slug
- **THEN** the system preserves the existing slug `"mens-footwear"` to prevent breaking indexed URLs

### Requirement: Administrative Category Management and Search Filtering
The system SHALL expose protected administrative REST endpoints beneath `/api/v1/admin/categories` requiring `ADMIN` or `SUPER_ADMIN` role authorization, providing paginated category listings, search, status filtering, parent filtering, and parent option retrieval.

#### Scenario: Paginated category query with filters
- **WHEN** an authorized administrator requests `GET /api/v1/admin/categories?page=1&limit=10&search=lap&isActive=true`
- **THEN** the system returns HTTP 200 OK with paginated category items matching the search query and status filter, including parent metadata and total counts

#### Scenario: Retrieving eligible parent options
- **WHEN** an authorized administrator requests `GET /api/v1/admin/categories/parent-options`
- **THEN** the system returns a list of categories eligible to be parents (Level 1 and Level 2 only), excluding any current category and its descendants

#### Scenario: Unauthorized access attempt
- **WHEN** an unauthenticated client or a user with `CUSTOMER` role sends a request to `/api/v1/admin/categories`
- **THEN** the system rejects the request with HTTP 401 Unauthorized or HTTP 403 Forbidden

### Requirement: Public Category Navigation Tree and Slug Lookup
The system SHALL provide public REST endpoints returning active categories structured as a nested navigation tree and single category details queried by slug with ancestor breadcrumbs.

#### Scenario: Fetching navigation tree for active categories
- **WHEN** a client sends a `GET /api/v1/categories/tree` request
- **THEN** the system returns HTTP 200 OK with active categories formatted into a nested hierarchy containing root categories and their active child subcategories

#### Scenario: Fetching category details by valid slug
- **WHEN** a client sends a `GET /api/v1/categories/:slug` request for an active category
- **THEN** the system returns HTTP 200 OK with category details, immediate active subcategories, and parent breadcrumb ancestor trail

#### Scenario: Requesting inactive or non-existent category slug
- **WHEN** a client sends a `GET /api/v1/categories/:slug` for a slug that does not exist or has `isActive: false`
- **THEN** the system responds with HTTP 404 Not Found

### Requirement: Administrative UI DataTable and Category Management Form
The admin application SHALL render a responsive AdminLTE data table at `/catalog/categories` displaying categories with search, parent and status filters, sortable headers, pagination, status toggling, and a modal form with live image URL preview.

#### Scenario: Rendering category management table
- **WHEN** an administrator navigates to `/catalog/categories`
- **THEN** the page renders an AdminLTE Card with a search bar, status and parent dropdown filters, sortable category rows, and pagination controls

#### Scenario: Creating a category with live image preview
- **WHEN** an administrator opens the "Add Category" modal and inputs a valid image URL
- **THEN** the modal displays an instant image preview thumbnail before submission

#### Scenario: In-line category status toggle
- **WHEN** an administrator toggles the active status switch for a category in the table
- **THEN** the system updates the category's `isActive` state via API and provides success feedback
