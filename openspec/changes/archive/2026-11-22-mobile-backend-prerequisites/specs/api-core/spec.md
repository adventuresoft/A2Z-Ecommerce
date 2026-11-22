# Spec Delta

## ADDED Requirements

### Requirement: Complete Typed Customer OpenAPI Schemas
All customer-facing REST endpoints served under `/api/v1` (including authentication, customer account, addresses, collections, store settings, cart, and device tokens) SHALL declare explicit OpenAPI response DTO schemas and consistent bearer security metadata so `/api/docs-json` produces deterministic, strongly typed client SDKs without untyped `void` or `unknown` payloads.

#### Scenario: OpenAPI JSON includes concrete response schemas for customer endpoints
- **WHEN** a client or code generator fetches `/api/docs-json`
- **THEN** every customer-facing endpoint under auth, account, addresses, collections, settings, cart, wishlist, catalog, checkout, orders, payments, shipments, locations, and notifications defines a structured response schema in `components.schemas`

### Requirement: Automated Uploaded Image WebP Optimization
When product, category, or brand images are uploaded through backend media endpoints, the system SHALL automatically convert raster uploads (JPEG/PNG/WebP) into optimized WebP assets and generate responsive thumbnail (`400px` wide) and medium (`800px` wide) variants behind a pluggable storage adapter while preserving original relative URL compatibility.

#### Scenario: Uploading a large raster product image generates WebP derivatives
- **WHEN** an administrator uploads a 3 MB PNG product image via the media upload endpoint
- **THEN** the system saves an optimized WebP image alongside `400px` thumbnail and `800px` medium derivatives and returns accessible URLs under `/uploads/...`

#### Scenario: Uploading an SVG asset bypasses raster resizing safely
- **WHEN** an administrator uploads an allowed vector asset such as SVG
- **THEN** the system stores it safely without failing raster conversion
