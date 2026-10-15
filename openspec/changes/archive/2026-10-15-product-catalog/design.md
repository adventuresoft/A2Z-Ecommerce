# Design: Unified Product & Variant Catalog

## Context

The system has established fundamental catalog primitives (`Category`, `Brand`, and `Attribute` / `AttributeValue`) within Prisma 7 and PostgreSQL 18. The admin panel currently features working AdminLTE 4 tables and forms for categories, brands, and attributes, while `/catalog/products` and `/catalog/variants` are routed to phased placeholder screens. See `proposal.md` for business motivation and `specs/product-catalog/spec.md` for normative requirements.

## Goals / Non-Goals

**Goals:**
- Implement PostgreSQL schema models for `Product`, `ProductImage`, `ProductVariant`, and `ProductVariantAttributeValue`.
- Support multi-file upload for product gallery images with automatic primary cover assignment, alt text, and file cleanup on disk.
- Implement Option B: allow each `ProductVariant` to optionally link to a specific `ProductImage` from the parent product's gallery.
- Provide administrative REST endpoints for products and variants with search, filters, and transaction-safe mutations.
- Deliver an AdminLTE 4 React interface with full CRUD for products, a drag-and-drop media gallery, an interactive variant generator matrix, and a dedicated cross-product SKU index.

**Non-Goals:**
- Real-time inventory reservation and warehouse transaction ledger (reserved for the dedicated `inventory` module).
- Customer-facing storefront display, cart actions, or checkout logic.
- Automated third-party image CDN processing, watermarking, or external cloud storage integrations.

## Decisions

### Decision 1: Unified Relational Data Model in Prisma

- **Choice:** Define `Product`, `ProductImage`, `ProductVariant`, and `ProductVariantAttributeValue` in `apps/api/prisma/schema.prisma` within a single migration.
- **Rationale:** A variant is strictly dependent on its parent `Product` (`productId NOT NULL`). Creating them together ensures foreign key referential integrity and atomic transaction creation for products with initial variants.
- **Alternatives Considered:**
  - *Split into separate migrations:* Rejected because simple products require at least one default variant for pricing, making standalone products incomplete.

### Decision 2: Variant Image Pointer (Option B)

- **Choice:** Add `imageId String?` on `ProductVariant` referencing `ProductImage.id` with `onDelete: SetNull`. Validate that the assigned image belongs to the variant's parent `Product`.
- **Rationale:** Keeps image assets centralized in the product gallery without duplicate uploads. When a customer or admin inspects a variant (e.g., "Navy Blue / XL"), the UI seamlessly resolves its specific photo while falling back to `ProductImage.isPrimary` if unassigned.
- **Alternatives Considered:**
  - *Separate image gallery per variant:* Rejected due to severe database bloat and redundant image storage.

### Decision 3: Multi-File Disk Storage with Multer

- **Choice:** Use `FilesInterceptor('files', 10, createImageUploadOptions('products', 'prod'))` to save images to `apps/api/uploads/products/` with static serving enabled at `/uploads/products/*`.
- **Rationale:** Consistent with existing Category and Brand image handlers. Eliminates external dependencies for local development and adheres to the project's zero-bloat architecture.
- **Alternatives Considered:**
  - *Base64 storage in database:* Rejected due to payload bloat and database degradation.

### Decision 4: Product Form with Variant Matrix Generator

- **Choice:** Build a unified multi-section AdminLTE form in `apps/admin/app/catalog/products/new` and `[id]/edit`:
  1. *General Info:* Title, Category (select), Brand (select), Short Description, Rich Description, Status toggles.
  2. *Media Gallery:* Multi-file dropzone, cover thumbnail selector, alt text inputs, and delete triggers.
  3. *Variants & Attributes:* Simple product toggle vs. Multi-variant mode. In multi-variant mode, an admin selects attributes (e.g. Size: S, M, L; Color: Black, White) and clicks "Generate Matrix", which creates editable rows for SKU, regular price, sale price, weight, and image selector.
- **Rationale:** Matches modern e-commerce standards (Shopify, WooCommerce), dramatically reducing manual data entry for multi-SKU products.

### Decision 5: Cross-Product Variant View (`/catalog/variants`)

- **Choice:** Implement `/catalog/variants` as a global data table displaying all SKUs across all products, searchable by SKU, barcode, and product title, with quick status toggles and direct edit links to the parent product.
- **Rationale:** Provides store managers a bird's-eye view of all physical stock items and barcodes without navigating into individual product forms.

## Technical Architecture & Schema

```prisma
model Product {
  id               String           @id @default(uuid())
  title            String           @db.VarChar(255)
  slug             String           @unique @db.VarChar(255)
  description      String           @db.Text
  shortDescription String?          @db.VarChar(500)
  categoryId       String
  brandId          String?
  isFeatured       Boolean          @default(false)
  isActive         Boolean          @default(true)
  createdAt        DateTime         @default(now())
  updatedAt        DateTime         @updatedAt

  category         Category         @relation(fields: [categoryId], references: [id], onDelete: Restrict)
  brand            Brand?           @relation(fields: [brandId], references: [id], onDelete: SetNull)
  images           ProductImage[]
  variants         ProductVariant[]

  @@index([categoryId])
  @@index([brandId])
  @@index([isActive, isFeatured])
  @@index([slug])
  @@map("Product")
}

model ProductImage {
  id        String           @id @default(uuid())
  productId String
  imageUrl  String           @db.VarChar(255)
  altText   String?          @db.VarChar(200)
  isPrimary Boolean          @default(false)
  sortOrder Int              @default(0)
  createdAt DateTime         @default(now())

  product   Product          @relation(fields: [productId], references: [id], onDelete: Cascade)
  variants  ProductVariant[]

  @@index([productId, sortOrder])
  @@map("ProductImage")
}

model ProductVariant {
  id           String                        @id @default(uuid())
  productId    String
  sku          String                        @unique @db.VarChar(100)
  barcode      String?                       @db.VarChar(100)
  regularPrice Decimal                       @db.Decimal(10, 2)
  salePrice    Decimal?                      @db.Decimal(10, 2)
  weightGrams  Int?
  imageId      String?
  isActive     Boolean                       @default(true)
  createdAt    DateTime                      @default(now())
  updatedAt    DateTime                      @updatedAt

  product      Product                       @relation(fields: [productId], references: [id], onDelete: Cascade)
  image        ProductImage?                 @relation(fields: [imageId], references: [id], onDelete: SetNull)
  attributes   ProductVariantAttributeValue[]

  @@index([productId])
  @@index([sku])
  @@index([barcode])
  @@index([isActive])
  @@map("ProductVariant")
}

model ProductVariantAttributeValue {
  variantId        String
  attributeValueId String

  variant          ProductVariant @relation(fields: [variantId], references: [id], onDelete: Cascade)
  attributeValue   AttributeValue @relation(fields: [attributeValueId], references: [id], onDelete: Restrict)

  @@id([variantId, attributeValueId])
  @@map("ProductVariantAttributeValue")
}
```

## Risks / Trade-offs

- **[Risk] High combinatoric variant generation freezes browser UI**  
  → *Mitigation:* Limit attribute combinations in UI generator to 100 variants per batch with warning dialog before matrix expansion.
- **[Risk] Orphaned files in `uploads/products` upon image record deletion**  
  → *Mitigation:* Service deletion methods explicitly invoke `fs.unlink` wrapped in try/catch to remove disk files when `ProductImage` records are deleted.
- **[Risk] Accidental deletion of product with historical orders**  
  → *Mitigation:* `products.service` checks for order references before deletion and returns 409 Conflict instructing user to toggle `isActive: false`.

## Migration Plan

1. Apply schema changes using `prisma db push` or `prisma migrate dev`.
2. Ensure `uploads/products` directory exists during API bootstrap.
3. Verify backward-compatibility for existing Category, Brand, and Attribute tables.
