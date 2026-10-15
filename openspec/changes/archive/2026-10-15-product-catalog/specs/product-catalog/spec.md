# Spec Delta

## Purpose

Enables creation, curation, and management of master physical products, multi-file media galleries, purchasable physical variants (SKUs) bound to catalog attributes, and variant-specific gallery image mappings.

## ADDED Requirements

### Requirement: Product Data Model and Slug Integrity
The system SHALL persist products with `title`, unique `slug`, rich `description`, optional `shortDescription`, mandatory `categoryId` referencing an existing active Category, optional `brandId` referencing an existing Brand, `isFeatured` flag, and `isActive` toggle, automatically deriving a URL-safe slug from `title` if not provided, resolving collisions with incremental numeric suffixes, and rejecting duplicate explicit slugs with HTTP 409 Conflict.

#### Scenario: Creating product with auto-generated slug
- **WHEN** an administrator creates a product with title `"Pro Running Shoes"` and category ID of an existing category without supplying a slug
- **THEN** the system persists the product with slug `"pro-running-shoes"` and returns HTTP 201 Created

#### Scenario: Auto-resolving slug collision
- **WHEN** an administrator creates a product with title `"Cotton T-Shirt"` while slug `"cotton-t-shirt"` already exists
- **THEN** the system generates and stores slug `"cotton-t-shirt-1"`

#### Scenario: Rejecting invalid category ID
- **WHEN** an administrator creates a product with a `categoryId` that does not exist in the database
- **THEN** the system rejects the request with HTTP 400 Bad Request

#### Scenario: Rejecting duplicate explicit slug
- **WHEN** an administrator updates a product with an explicit slug already in use by another product
- **THEN** the system rejects the request with HTTP 409 Conflict

### Requirement: Product Gallery Media and Primary Thumbnail
The system SHALL persist multiple gallery images for each product with `imageUrl`, optional `altText`, `sortOrder`, and `isPrimary` flag, ensuring that exactly one image per product is designated as the primary cover, automatically clearing the previous primary flag when a new primary image is assigned, and physically removing media files from disk upon image deletion.

#### Scenario: Uploading multiple gallery images
- **WHEN** an administrator uploads three image files to a product gallery
- **THEN** the system saves the files to disk, creates three `ProductImage` records, and designates the first image as `isPrimary: true` if no primary image previously existed

#### Scenario: Setting a new primary image
- **WHEN** an administrator updates an existing gallery image to `isPrimary: true`
- **THEN** the system sets that image as primary, updates any previously primary image for that product to `isPrimary: false`, and returns HTTP 200 OK

#### Scenario: Deleting a gallery image
- **WHEN** an administrator deletes a gallery image
- **THEN** the system removes the database record, deletes the physical file from disk, and sets any referencing variant's `imageId` to null

### Requirement: Product Variant and SKU Engine
The system SHALL persist physical variants (`ProductVariant`) belonging to a parent product with unique `sku`, optional `barcode`, mandatory `regularPrice` (positive decimal), optional `salePrice` (less than or equal to `regularPrice`), optional `weightGrams` (non-negative integer), and `isActive` toggle, enforcing that every product has at least one default variant upon creation.

#### Scenario: Creating a valid product variant
- **WHEN** an administrator creates a variant with SKU `"TSH-RED-XL"`, regular price `29.99`, and weight `250` grams
- **THEN** the system persists the variant linked to the parent product and returns HTTP 201 Created

#### Scenario: Rejecting duplicate SKU
- **WHEN** an administrator creates or updates a variant with a SKU code that already exists across the catalog
- **THEN** the system rejects the request with HTTP 409 Conflict

#### Scenario: Rejecting sale price higher than regular price
- **WHEN** an administrator creates or updates a variant with `salePrice: 40.00` and `regularPrice: 30.00`
- **THEN** the system rejects the request with HTTP 400 Bad Request

### Requirement: Variant Attribute Combination Integrity
The system SHALL link product variants to catalog attribute values via `ProductVariantAttributeValue`, validating that all assigned `attributeValueId` references exist, and rejecting combinations where two distinct values are assigned from the same single-choice attribute for a single variant.

#### Scenario: Associating valid attribute values to a variant
- **WHEN** an administrator binds attribute values for Color `"Navy Blue"` and Size `"XL"` to a variant
- **THEN** the system persists the association records and returns HTTP 200 OK

#### Scenario: Rejecting non-existent attribute value ID
- **WHEN** an administrator associates an `attributeValueId` that does not exist in the database
- **THEN** the system rejects the request with HTTP 400 Bad Request

### Requirement: Variant-Specific Gallery Image Linkage
The system SHALL permit each product variant to optionally reference a specific `imageId` from its parent product's gallery, verifying that the selected image belongs to the same parent product, and automatically resetting `variant.imageId` to null if that gallery image is deleted.

#### Scenario: Assigning valid product gallery image to variant
- **WHEN** an administrator sets a variant's `imageId` to an image belonging to the parent product
- **THEN** the system links the variant to the image and returns HTTP 200 OK

#### Scenario: Rejecting image belonging to a different product
- **WHEN** an administrator attempts to assign a variant an `imageId` belonging to another product
- **THEN** the system rejects the request with HTTP 400 Bad Request

### Requirement: Product and Variant Deletion Safeguards
The system SHALL prevent deletion of any product or variant that is referenced by existing customer order line items (`OrderItem`), responding with HTTP 409 Conflict, while permitting deletion of unreferenced products (cascading to variants and gallery images) and unreferenced variants with HTTP 200 OK.

#### Scenario: Attempting deletion of product with ordered items
- **WHEN** an administrator requests deletion of a product whose variants exist in an order
- **THEN** the system rejects the deletion with HTTP 409 Conflict and advises deactivation instead

#### Scenario: Deleting unreferenced product
- **WHEN** an administrator deletes a product that has no historical order references
- **THEN** the system removes the product, its variants, and gallery records, unlinks disk files, and returns HTTP 200 OK

### Requirement: Administrative Product and Variant Endpoints
The system SHALL expose administrative REST endpoints beneath `/api/v1/admin/products` and `/api/v1/admin/variants` restricted to `ADMIN` and `SUPER_ADMIN` roles, supporting pagination, keyword search over `title`, `slug`, and `sku`, filtering by `categoryId`, `brandId`, and `isActive`, and multipart image uploading.

#### Scenario: Searching and filtering products
- **WHEN** an administrator requests `GET /api/v1/admin/products?search=shirt&categoryId=uuid-cat&page=1&limit=10`
- **THEN** the system returns a paginated list of matching products with image thumbnails, category/brand metadata, and variant count
