# Design: Product Attributes Module

## Context

See `proposal.md` for motivation. Relevant current state:

- `apps/api/src/brands/` and `apps/api/src/categories/` serve as the reference architectural pattern: separated Admin (`JwtAuthGuard` + `RolesGuard`, `@Roles(ADMIN, SUPER_ADMIN)`) and Public controllers, a service handling transactions and slug uniqueness, `class-validator` DTOs, and unit tests.
- `apps/admin/app/catalog/` contains the AdminLTE catalog modules. The sidebar already links to `/catalog/attributes`, currently handled by the catch-all `ModuleStatusShell` (Phase 2 placeholder).
- The `Product` and `ProductVariant` models do not exist yet. Like the brands and categories modules, deletion safeguards will use clearly marked seams returning `0` that the upcoming Products module can switch on.

## Goals / Non-Goals

**Goals:**
- Provide a clean, catalog-level dictionary of reusable attributes (`Attribute`) and their allowed options (`AttributeValue`).
- Support presentation types (`TEXT`, `COLOR`, `BUTTON`) enabling color hex codes, swatches, and button chips.
- Support atomic attribute creation with initial values in a single transaction, as well as granular nested value management.
- Establish deletion safeguard seams to prevent deleting attributes or values in use by future products or variants.
- Deliver an interactive AdminLTE management UI at `/catalog/attributes` with live color swatches and color picker.

**Non-Goals:**
- Product-to-variant combinatorial matrix generation (handled in the upcoming Products and Variants module).
- Category-restricted attributes (e.g. restricting "Shoe Size" only to "Footwear"); attributes remain catalog-wide for broad filtering.
- Bulk CSV import/export of attributes.

## Decisions

### D1. Catalog-Level Reusable Attributes vs Per-Product Attributes
Confirm Option A (reusable catalog dictionary) over per-product attributes.
- *Rationale*: A standalone `/catalog/attributes` UI requires independent lifecycle management. Defining standard attributes (Color, Size, Material) centrally avoids re-creating redundant attribute records per product and standardizes future faceted search.
- *Alternative Considered*: Embedding attributes strictly inside `Product` (`ProductAttribute.productId`). Rejected because it prevents standalone curation and requires repetitive data entry for every product.

### D2. Prisma Schema Design
```prisma
enum AttributeType {
  TEXT
  COLOR
  BUTTON
}

model Attribute {
  id          String           @id @default(uuid())
  name        String           @db.VarChar(100)
  slug        String           @unique @db.VarChar(120)
  type        AttributeType    @default(TEXT)
  description String?          @db.Text
  isActive    Boolean          @default(true)
  sortOrder   Int              @default(0)
  createdAt   DateTime         @default(now())
  updatedAt   DateTime         @updatedAt

  values      AttributeValue[]

  @@index([isActive, sortOrder])
  @@map("Attribute")
}

model AttributeValue {
  id          String    @id @default(uuid())
  attributeId String
  value       String    @db.VarChar(100)
  label       String?   @db.VarChar(100)
  colorCode   String?   @db.VarChar(20)
  sortOrder   Int       @default(0)
  isActive    Boolean   @default(true)
  createdAt   DateTime  @default(now())
  updatedAt   DateTime  @updatedAt

  attribute   Attribute @relation(fields: [attributeId], references: [id], onDelete: Cascade)

  @@unique([attributeId, value])
  @@index([attributeId, sortOrder])
  @@map("AttributeValue")
}
```
- *Uniqueness*: `(attributeId, value)` is unique so an attribute cannot have duplicate values (e.g. two "XL" values under "Size").
- *Cascade*: Deleting an unreferenced attribute cascade-deletes its values cleanly.

### D3. Module Architecture
`apps/api/src/attributes/` contains:
- `attributes.module.ts`
- `attributes.admin.controller.ts` (routes under `/api/v1/admin/attributes`)
- `attributes.public.controller.ts` (routes under `/api/v1/attributes`)
- `attributes.service.ts`
- `dto/` (`create-attribute.dto.ts`, `update-attribute.dto.ts`, `attribute-query.dto.ts`, `attribute-response.dto.ts`, `attribute-value.dto.ts`, `index.ts`)
- Unit tests (`attributes.service.spec.ts`, `attributes.controller.spec.ts`, `dto.spec.ts`).

### D4. Validation & Value Handling
- `colorCode`: validated with regex `/^#([0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/i` when provided.
- `CreateAttributeDto`: accepts optional `values: CreateAttributeValueInlineDto[]`. If present, the service creates the attribute and values inside a `prisma.$transaction`.
- `AttributeQueryDto`: supports `search` (name, slug), `type` (`TEXT | COLOR | BUTTON`), `isActive` boolean transform, `sortBy` (`name`, `sortOrder`, `createdAt`), and `sortOrder` direction (`asc`, `desc`).

### D5. Deletion Safeguard Seams
`AttributesService.remove(id)` and `AttributesService.removeValue(attributeId, valueId)` will call private helper methods:
- `countAttributeUsage(id): Promise<number>` (returns 0 with `TODO(products)` comment).
- `countValueUsage(valueId): Promise<number>` (returns 0 with `TODO(products)` comment).
When count > 0, throws `ConflictException` advising deactivation, matching category and brand safeguard behaviors.

### D6. Admin UI Structure
`apps/admin/app/catalog/attributes/`:
- `page.tsx`: Server component or client container fetching paginated attributes.
- `components/AttributesTable.tsx`: AdminLTE card table with search, type badge, visual values preview (color swatch circles with tooltips for `COLOR`, pill chips for `TEXT`/`BUTTON`), values count, inline `isActive` toggle, sort headers, and action dropdowns.
- `components/AttributeFormModal.tsx`: Modal supporting attribute details and dynamic addition/removal of values. When `type === 'COLOR'`, reveals an HTML5 color picker sync'd with a hex text input.
- `components/AttributeDeleteModal.tsx`: Confirmation modal surfacing server 409 conflict errors.
- `apps/admin/services/attributes.ts`: Typed API client connecting to backend endpoints.

## Risks / Trade-offs

- **[Risk]** Administrator enters a color hex code for a `TEXT` attribute.  
  → *Mitigation*: The UI dynamically shows/hides the color picker based on selected `type`, and the DTO allows optional `colorCode` without error, while strictly validating hex format when provided.
- **[Risk]** Case collisions in value names (e.g. "red" vs "Red").  
  → *Mitigation*: DTO trims values; comparison in DB unique constraint enforces exact string uniqueness, and service trims inputs on save.
