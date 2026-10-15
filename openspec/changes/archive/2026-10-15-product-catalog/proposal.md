# Proposal: Unified Product & Variant Catalog

## Why

With categories, brands, and catalog attributes (`Attribute` & `AttributeValue`) fully implemented and active in the platform, the core master catalog engine is now required to represent physical merchandise. Physical products require master descriptive details (titles, categories, brands, marketing copy), rich media galleries with primary thumbnails, purchasable physical variants (SKUs, pricing, barcodes, weight), and attribute bindings (e.g., Color, Size), as well as variant-specific image linkages. Implementing this unified module unblocks the catalog management workflow, inventory tracking, and storefront browsing.

## What Changes

- **Product Master Entity**: Introduce `Product` model linking to `Category` (mandatory) and `Brand` (optional), supporting auto-derived canonical slugs, rich descriptions, short teasers, active toggles, and featured flags.
- **Product Gallery Media**: Introduce `ProductImage` model supporting batch image uploads, primary/thumbnail designation, alt text for accessibility, sort ordering, and physical file storage cleanup upon deletion.
- **Physical Variant & SKU Engine**: Introduce `ProductVariant` model holding SKU codes, barcodes, regular/sale prices, physical shipping weight, and an optional direct link to a gallery image (`imageId`).
- **Variant Attribute Association**: Introduce `ProductVariantAttributeValue` composite join table linking variants to predefined catalog `AttributeValue` entities.
- **Administrative API Endpoints**: Expose `/api/v1/admin/products` and `/api/v1/admin/variants` with paginated search, category/brand/status filters, multi-file image upload handling, variant matrix generator, and safe delete guards.
- **Admin Dashboard Screens**: Activate the live `/catalog/products` data table, implement product create/edit forms with general information, drag-and-drop media gallery, and variant matrix generator, and activate the `/catalog/variants` cross-product SKU view.

## Capabilities

### New Capabilities

- `product-catalog`: Product master definition, media gallery management, physical variant and SKU generation with attribute bindings, variant-specific image mapping, and administrative catalog operations.

### Modified Capabilities

*(None. Existing capabilities remain backward-compatible.)*

## Impact

- **Database**: Adds `Product`, `ProductImage`, `ProductVariant`, and `ProductVariantAttributeValue` models to Prisma schema, establishing foreign keys to existing `Category`, `Brand`, and `AttributeValue` tables.
- **Backend API (`apps/api`)**: New `products` module including `products.service`, `products.admin.controller`, `variants.admin.controller`, DTOs, file upload interceptors for `uploads/products/`, and Swagger documentation.
- **Admin Dashboard (`apps/admin`)**: Replaces the Phase 2 placeholder for `/catalog/products` and `/catalog/variants` with live AdminLTE-styled data tables and create/edit workflows.
- **Dependencies & Storage**: Utilizes existing `multer` disk storage pipeline; ensures `uploads/products` directory exists.
