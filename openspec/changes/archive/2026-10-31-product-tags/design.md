# Design: Product Tags Architecture & Implementation

## Context

The system is a modular monolith e-commerce platform built with NestJS, PostgreSQL 18, Prisma 7, and Next.js (AdminLTE 4.10.0 + Bootstrap 5.3.8). Products are managed in `apps/api/src/products` and admin screens in `apps/admin/app/catalog/products`. As captured in `proposal.md` and agreed during the GRILL-ME alignment, products require a multiple-selection tagging mechanism with on-the-fly tag creation, centralized tag management, and public filtering.

## Goals / Non-Goals

**Goals:**
- Add `Tag` and `ProductTag` models to Prisma with clean cascading detach semantics.
- Provide a dedicated NestJS `TagsModule` for administrative CRUD and public discovery.
- Allow `CreateProductDto` and `UpdateProductDto` to accept both existing `tagIds` and on-the-fly `tags` (names), resolving and linking tags in an atomic Prisma transaction.
- Create an AdminLTE-styled, accessible multi-select Tag component with tag badges, deletion pills, and a quick-create trigger.
- Build the dedicated `Catalog > Tags` admin page (`apps/admin/app/catalog/tags/page.tsx`).
- Support tag filtering in both admin product tables and public catalog endpoints.

**Non-Goals:**
- Hierarchical or nested tags (tags are flat keywords/labels; categories remain the hierarchical taxonomy).
- Tag-specific custom SEO landing pages or rich HTML descriptions (reserved for categories).

## Decisions

### Decision 1: Relational Join Table (`ProductTag`) vs PostgreSQL Array (`text[]`)
- **Chosen:** Relational `Tag` entity with `ProductTag` join table.
- **Rationale:** Ensures referential integrity, unique slugs, tag reuse across products, fast indexing on `tagId`, centralized renaming without updating thousands of product rows, and reliable product counts.
- **Alternative Considered:** `tags: text[]` array column on `Product`. Rejected because it prevents centralized tag management, causes string inconsistencies (casing/typos), and complicates faceted queries.

### Decision 2: Atomic Tag Resolution in Product DTOs
- **Chosen:** The backend receives `tagIds?: string[]` and/or `tags?: string[]` (names). In `ProductsService.create` and `update`, existing tags are validated, any new string tags are upserted/created, and `ProductTag` rows are synced within the Prisma transaction.
- **Rationale:** Eliminates race conditions or orphaned tags if a product save fails, and provides seamless UX so users don't need to leave the product form to create tags.
- **Alternative Considered:** Requiring client to call `POST /admin/tags` prior to product save. Rejected because it complicates client-side error handling and leaves unused tags if product creation is canceled.

### Decision 3: Safe Detach On Delete (`onDelete: Cascade` on `ProductTag`)
- **Chosen:** When a `Tag` is deleted via `DELETE /api/v1/admin/tags/:id`, Prisma cascades delete to `ProductTag` join rows only, leaving the products untouched.
- **Rationale:** Prevents accidental data loss while ensuring clean database foreign keys.
- **Alternative Considered:** Restricting tag deletion if products reference it. Rejected as unnecessarily cumbersome for merchandising tags.

### Decision 4: Admin UI Styling Stack
- **Chosen:** Pure Bootstrap 5.3.8 and Bootstrap Icons 1.13.2 complying with the single-framework AdminLTE discipline defined in `docs/admin-dashboard-design.md`.
- **Rationale:** Prevents CSS collisions with Tailwind and ensures native responsive behavior.

## Risks / Trade-offs

- **[Risk] High-volume on-the-fly tag creation could create near-duplicates (e.g. "summer" vs "Summer")**  
  → *Mitigation:* Normalize slugs to lowercase kebab-case and perform case-insensitive name matching before creating a new tag.
- **[Risk] Large number of tags per product impacting query performance**  
  → *Mitigation:* Create compound indexes on `ProductTag(productId, tagId)` and `ProductTag(tagId, productId)`. Include tags in product queries using Prisma `include: { tags: { include: { tag: true } } }`.

## Migration Plan

1. Update `apps/api/prisma/schema.prisma` with `Tag` and `ProductTag` models.
2. Run Prisma migration (`pnpm --filter api prisma:migrate` or push).
3. Implement `TagsModule` and extend `ProductsModule`.
4. Deploy admin dashboard updates with `TagMultiSelect` and `Catalog > Tags`.
