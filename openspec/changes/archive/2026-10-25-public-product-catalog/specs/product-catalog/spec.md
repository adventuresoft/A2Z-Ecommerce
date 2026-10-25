# Spec Delta

## ADDED Requirements

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
