# product-catalog Specification

## Purpose

Enables creation, curation, and management of master physical products, multi-file media galleries, purchasable physical variants (SKUs) bound to catalog attributes, and variant-specific gallery image mappings.

## Requirements

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

### Requirement: Public Product Catalog Listing and Faceted Filtering
The system SHALL expose a public REST endpoint `GET /api/v1/products` that returns a paginated collection of active products supporting faceted filtering by category ID or slug, brand ID or slug, price range, stock availability, discount presence, and sorting orders.

#### Scenario: Filtering products by category and price range
- **WHEN** a client sends `GET /api/v1/products?categorySlug=smartphones&minPrice=10000&maxPrice=50000&inStock=true`
- **THEN** the system returns HTTP 200 with matching active products, total count, pagination metadata, and active filter facets

#### Scenario: Sorting catalog by price or creation date
- **WHEN** a client sends `GET /api/v1/products?sort=price_asc&page=1&limit=12`
- **THEN** the system returns HTTP 200 with products sorted by their lowest variant regular or sale price in ascending order

#### Scenario: Filtering discounted products for deals page
- **WHEN** a client sends `GET /api/v1/products?hasDiscount=true`
- **THEN** the system returns HTTP 200 containing only active products having at least one variant where `salePrice` is less than `regularPrice`

### Requirement: Public Slug-Based Product Detail Resolution
The system SHALL expose a public REST endpoint `GET /api/v1/products/:slug` that resolves an active product by its unique URL slug, returning full product master details, media gallery images, all active variants with bound attribute values, real-time inventory stock balances, approved customer reviews, and category-related products.

#### Scenario: Resolving valid product by slug
- **WHEN** a client sends `GET /api/v1/products/apple-macbook-pro-16-m3-max`
- **THEN** the system returns HTTP 200 with product metadata, primary image, full gallery, variants with inventory quantities, attribute matrix, and approved reviews

#### Scenario: Requesting non-existent or inactive product slug
- **WHEN** a client sends `GET /api/v1/products/non-existent-product-slug`
- **THEN** the system returns HTTP 404 Not Found

### Requirement: Public Search Autocomplete Suggestions
The system SHALL expose a public REST endpoint `GET /api/v1/products/search-suggestions?q=` that returns top matching products and active categories based on keyword prefix and substring matches over product titles and category names.

#### Scenario: Querying debounced search suggestions
- **WHEN** a client sends `GET /api/v1/products/search-suggestions?q=macbook`
- **THEN** the system returns HTTP 200 with an array of up to 5 matching products (title, slug, price, thumbnail) and matching category items within 300ms

#### Scenario: Querying with empty or whitespace search term
- **WHEN** a client sends `GET /api/v1/products/search-suggestions?q=`
- **THEN** the system returns HTTP 200 with an empty suggestions array

### Requirement: Curated Merchandising Collections
The system SHALL expose a public REST endpoint `GET /api/v1/products/curated` returning curated merchandising groupings including `flashDeals`, `featured`, `newArrivals`, and `bestSellers` populated from active products and variants.

#### Scenario: Querying curated homepage products
- **WHEN** a client sends `GET /api/v1/products/curated`
- **THEN** the system returns HTTP 200 with JSON containing `flashDeals` (variants with active discount sorted by discount percentage descending), `featured` (products with `isFeatured: true`), `newArrivals` (products sorted by `createdAt DESC`), and `bestSellers` (products sorted by order frequency with fallback to high-demand active items)

#### Scenario: Empty curated collection handling
- **WHEN** no products qualify for a specific merchandising grouping (such as no active sale discounts)
- **THEN** the system returns an empty array for that collection key without failing the request
