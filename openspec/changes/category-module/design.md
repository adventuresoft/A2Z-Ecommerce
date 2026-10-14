# Technical Design: Product Category Module

## Context

The backend is built with NestJS 12, Prisma 7, and PostgreSQL 18 with global prefix `/api/v1`, class-validator DTOs, and JWT authorization (`SUPER_ADMIN`, `ADMIN`). The admin dashboard is built with Next.js 16 (App Router) styled with AdminLTE 4 (Bootstrap 5.3 + Bootstrap Icons). See `proposal.md` for motivation and background.

## Goals / Non-Goals

**Goals:**
- Implement the approved `Category` data model in `apps/api/prisma/schema.prisma` with an atomic Prisma migration.
- Provide secure administrative CRUD endpoints with validation, pagination, keyword search, status filtering, and eligible parent selection.
- Enforce the 3-level maximum taxonomy hierarchy and cycle prevention in the service layer.
- Enforce strict deletion safeguards (HTTP 409 Conflict) when subcategories exist.
- Support smart slug generation with URL stability and auto-collision resolution.
- Deliver public storefront endpoints for active nested tree navigation (`/api/v1/categories/tree`) and slug lookups (`/api/v1/categories/:slug`).
- Replace the admin placeholder at `/catalog/categories` with a functional, responsive AdminLTE data table, search/filter controls, and modal forms with live image preview.

**Non-Goals:**
- Binary file upload handling (S3, Cloudinary, or local multipart disk streaming) is deferred to the dedicated asset upload module (PRD Phase 10). Categories accept and store validated image URL strings.
- Product assignment editing is part of the upcoming Product Catalog slice; this slice establishes the `Category` foundation and prepares the `Product.categoryId` foreign key target.

## Decisions

### 1. Database Schema & Self-Referencing Hierarchy
- **Choice:** Add the `Category` model directly to `apps/api/prisma/schema.prisma` matching `docs/data-model.md §4.2`.
  ```prisma
  model Category {
    id          String     @id @default(uuid())
    name        String     @db.VarChar(100)
    slug        String     @unique @db.VarChar(120)
    description String?    @db.Text
    imageUrl    String?    @db.VarChar(255)
    parentId    String?    @db.Uuid
    isActive    Boolean    @default(true)
    sortOrder   Int        @default(0)
    createdAt   DateTime   @default(now())
    updatedAt   DateTime   @updatedAt

    parent      Category?  @relation("CategoryHierarchy", fields: [parentId], references: [id], onDelete: SetNull)
    children    Category[] @relation("CategoryHierarchy")

    @@index([parentId])
    @@index([slug])
    @@index([isActive])
    @@map("Category")
  }
  ```
- **Rationale:** Preserves the approved relational schema. `onDelete: SetNull` satisfies database constraints, while service-layer logic enforces strict deletion blocking when subcategories exist.

### 2. NestJS Architecture & Dual Controller Pattern
- **Choice:** Separate administrative endpoints from public customer endpoints into two controllers within `apps/api/src/categories/`:
  - `CategoriesAdminController` mounted at `/api/v1/admin/categories` guarded with `@UseGuards(JwtAuthGuard, RolesGuard)` and `@Roles(Role.ADMIN, Role.SUPER_ADMIN)`.
  - `CategoriesPublicController` mounted at `/api/v1/categories` open for public storefront consumption.
- **Rationale:** Isolates administrative operations and security policies from public storefront endpoints, ensuring clean OpenAPI documentation and distinct response schemas.

### 3. Hierarchy Depth & Cycle Prevention Logic
- **Choice:** Before creating or updating a category with a `parentId`:
  1. Retrieve the target parent along with its parent (`include: { parent: { include: { parent: true } } }`).
  2. If the target parent is already at depth 3 (i.e., `parent.parent.parentId !== null`), reject with `BadRequestException('Categories cannot exceed 3 levels of depth.')`.
  3. When updating, verify `parentId !== id` and traverse descendants to ensure the parent is not an existing child/grandchild of the updated category.
- **Alternatives Considered:** Storing a materialized path or recursive CTE queries. A lightweight 3-level parent lookup was selected because it incurs minimal database overhead and matches the 3-level business limit.

### 4. Smart Slug Auto-Generation & Stability
- **Choice:**
  - On `create`: If `slug` is omitted or empty, generate a URL-safe kebab-case slug from `name`. If the slug exists, query matching prefixes and append `-1`, `-2`, etc.
  - On `update`: If `slug` is omitted from the update payload, preserve the existing slug. If an explicit slug is provided, validate uniqueness against other category IDs.
- **Rationale:** Protects storefront search engine rankings and bookmarks from accidental title edits.

### 5. Admin UI Component Architecture (`apps/admin`)
- **Choice:** Native React client components using AdminLTE 4 styling:
  - `CategoriesTable`: Displays rows, parent category name badges, direct subcategory counts, active toggle switches, and row action buttons (Edit, Delete).
  - `CategoryFormModal`: Clean Bootstrap modal with fields for Name, Slug, Parent Category (populated from `/parent-options`), Sort Order, Description, Image URL (with real-time thumbnail preview), and Active Status.
  - `CategoryDeleteDialog`: Confirmation modal that highlights warning notes and disables the submit button if the category has subcategories.

## Risks / Trade-offs

- **[Risk]** Administrator tries to delete a parent category with subcategories.
  - **Mitigation:** The API checks `children.length > 0` before deletion and returns `HTTP 409 Conflict`. The Admin UI also disables the delete button or presents a clear warning banner.
- **[Risk]** Duplicate slug errors on simultaneous creations.
  - **Mitigation:** Database has a unique constraint on `slug`. The service catches unique constraint violations and retries with an incremented suffix counter.
- **[Risk]** Heavy navigation tree computation on public storefront traffic.
  - **Mitigation:** The public tree query selects only `isActive: true` records with minimal fields (`id, name, slug, imageUrl, sortOrder`), ordered by `sortOrder ASC`.

## Migration Plan

1. Update `apps/api/prisma/schema.prisma` with `Category` model and relation.
2. Generate and run the Prisma migration against PostgreSQL 18: `pnpm --filter api exec prisma migrate dev --name add_category_model`.
3. Regenerate Prisma Client.
4. Implement NestJS `CategoriesModule` and run unit tests.
5. Implement `apps/admin/app/catalog/categories` UI and test integration.
