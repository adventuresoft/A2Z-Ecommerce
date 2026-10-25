# Spec Delta

## ADDED Requirements

### Requirement: Curated Merchandising Collections
The system SHALL expose a public REST endpoint `GET /api/v1/products/curated` returning curated merchandising groupings including `flashDeals`, `featured`, `newArrivals`, and `bestSellers` populated from active products and variants.

#### Scenario: Querying curated homepage products
- **WHEN** a client sends `GET /api/v1/products/curated`
- **THEN** the system returns HTTP 200 with JSON containing `flashDeals` (variants with active discount sorted by discount percentage descending), `featured` (products with `isFeatured: true`), `newArrivals` (products sorted by `createdAt DESC`), and `bestSellers` (products sorted by order frequency with fallback to high-demand active items)

#### Scenario: Empty curated collection handling
- **WHEN** no products qualify for a specific merchandising grouping (such as no active sale discounts)
- **THEN** the system returns an empty array for that collection key without failing the request
