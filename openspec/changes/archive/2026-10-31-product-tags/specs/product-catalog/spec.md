# product-catalog Specification Delta

## ADDED Requirements

### Requirement: Product Tag Association and On-The-Fly Tag Creation
The system SHALL accept `tagIds?: string[]` and/or `tags?: string[]` in product creation and update requests (`POST /api/v1/admin/products`, `PUT /api/v1/admin/products/:id`), validating referenced tag UUIDs, looking up or creating new tags by name on the fly, and persisting associations in `ProductTag` within the product save transaction.

#### Scenario: Creating product with existing tag IDs and new tag names
- **WHEN** an administrator creates a product with existing `tagIds: ["tag-uuid-1"]` and new `tags: ["Summer 2026"]`
- **THEN** the system resolves the existing tag, creates the new tag `"Summer 2026"` with slug `"summer-2026"`, links both tags to the product, and returns them in the response

#### Scenario: Updating product tags replacing previous associations
- **WHEN** an administrator updates a product with a new list of tag IDs
- **THEN** the system updates the product's tag associations to match the new list and removes unmentioned associations

## MODIFIED Requirements

### Requirement: Administrative Product and Variant Endpoints
The system SHALL expose administrative REST endpoints beneath `/api/v1/admin/products` and `/api/v1/admin/variants` restricted to `ADMIN` and `SUPER_ADMIN` roles, supporting pagination, keyword search over `title`, `slug`, and `sku`, filtering by `categoryId`, `brandId`, `tagId`, and `isActive`, multipart image uploading, and returning associated tags with each product.

#### Scenario: Searching and filtering products
- **WHEN** an administrator requests `GET /api/v1/admin/products?search=shirt&categoryId=uuid-cat&page=1&limit=10`
- **THEN** the system returns a paginated list of matching products with image thumbnails, category/brand metadata, associated tags, and variant count

#### Scenario: Filtering products by tag in admin table
- **WHEN** an administrator requests `GET /api/v1/admin/products?tagId=uuid-tag-1`
- **THEN** the system returns only products that are linked to the specified tag

### Requirement: Public Product Catalog Listing and Faceted Filtering
The system SHALL expose a public REST endpoint `GET /api/v1/products` that returns a paginated collection of active products supporting faceted filtering by category ID or slug, brand ID or slug, tag slug(s), price range, stock availability, discount presence, and sorting orders, including assigned tags in each product summary.

#### Scenario: Filtering products by category and price range
- **WHEN** a client sends `GET /api/v1/products?categorySlug=smartphones&minPrice=10000&maxPrice=50000&inStock=true`
- **THEN** the system returns HTTP 200 with matching active products, total count, pagination metadata, and active filter facets

#### Scenario: Sorting catalog by price or creation date
- **WHEN** a client sends `GET /api/v1/products?sort=price_asc&page=1&limit=12`
- **THEN** the system returns HTTP 200 with products sorted by their lowest variant regular or sale price in ascending order

#### Scenario: Filtering discounted products for deals page
- **WHEN** a client sends `GET /api/v1/products?hasDiscount=true`
- **THEN** the system returns HTTP 200 containing only active products having at least one variant where `salePrice` is less than `regularPrice`

#### Scenario: Filtering products by tag slug
- **WHEN** a client sends `GET /api/v1/products?tags=summer-collection`
- **THEN** the system returns HTTP 200 containing only active products that possess the `"summer-collection"` tag

### Requirement: Public Slug-Based Product Detail Resolution
The system SHALL expose a public REST endpoint `GET /api/v1/products/:slug` that resolves an active product by its unique URL slug, returning full product master details, media gallery images, all active variants with bound attribute values, real-time inventory stock balances, approved customer reviews, category-related products, and all assigned tags.

#### Scenario: Resolving valid product by slug
- **WHEN** a client sends `GET /api/v1/products/apple-macbook-pro-16-m3-max`
- **THEN** the system returns HTTP 200 with product metadata, primary image, full gallery, variants with inventory quantities, attribute matrix, approved reviews, and associated tags with names and color badges

#### Scenario: Requesting non-existent or inactive product slug
- **WHEN** a client sends `GET /api/v1/products/non-existent-product-slug`
- **THEN** the system returns HTTP 404 Not Found
