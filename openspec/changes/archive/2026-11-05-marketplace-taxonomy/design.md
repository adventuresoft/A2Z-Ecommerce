# Design

## Context

The Freelancer Marketplace ("Hire a Professional") specification (`docs/freelancer.md` Section 1, Decision 12 & Section 6.3) defines a three-tier taxonomy:
`ProfessionCategory` -> `Profession` -> `Skill`.

Currently, the e-commerce platform has product categories (`Category`), brands, and tags, but lacks any professional trades taxonomy. Before professionals can register profiles, tag their proficiencies, or appear in filtered directory listings, this taxonomy structure and administrative moderation engine must be implemented.

## Goals / Non-Goals

**Goals:**
- Define Prisma schema for `ProfessionCategory`, `Profession`, and `Skill` with status tracking and self-referencing merge relations.
- Seed a rich, localized Bangladesh trade and profession taxonomy (Electrician, Plumber, Appliance Technician, Carpenter, Painter, etc.) with bilingual names.
- Provide high-performance, public query endpoints for hierarchical taxonomy browsing.
- Provide authenticated skill suggestion endpoints for freelancers.
- Provide permission-guarded admin management and suggestion moderation endpoints (approve, reject, merge).

**Non-Goals:**
- Creating `FreelancerProfile` or linking freelancers to skills (handled in Stage 1.2).
- Public directory search and contact reveals (Phase 3).

## Decisions

### 1. Data Model & Foreign Key Cascades
- **`ProfessionCategory`**:
  - `id`: UUID primary key.
  - `name`: string (e.g., "Home Services").
  - `bnName`: nullable string (e.g., "গৃহস্থালি সেবা").
  - `icon`: string identifier for icons.
  - `isActive`: boolean, default true.
  - `sortOrder`: integer, default 0.
- **`Profession`**:
  - `id`: UUID primary key.
  - `categoryId`: UUID FK referencing `ProfessionCategory(id)` on delete Cascade.
  - `name`: string (e.g., "Electrician").
  - `bnName`: nullable string (e.g., "ইলেকট্রিশিয়ান").
  - `isActive`: boolean, default true.
  - `sortOrder`: integer, default 0.
  - `@@index([categoryId])`.
- **`Skill`**:
  - `id`: UUID primary key.
  - `professionId`: UUID FK referencing `Profession(id)` on delete Cascade.
  - `name`: string.
  - `bnName`: nullable string.
  - `status`: Enum `ACTIVE | PENDING | REJECTED` (default `ACTIVE` when created by admin, `PENDING` when suggested by user).
  - `suggestedById`: nullable UUID FK referencing `User(id)` on delete SetNull.
  - `mergedIntoId`: nullable UUID FK referencing `Skill(id)` on delete SetNull.
  - `@@unique([professionId, name])`: Prevents exact duplicate skill names under the same profession.
  - `@@index([professionId, status])`.

### 2. Suggestion Merge Architecture
- When users suggest a skill that closely matches an existing active skill (e.g., "AC Gas Refill" vs "AC Gas Charging"), admins can merge the suggestion:
  - `status` is set to `REJECTED`.
  - `mergedIntoId` is set to the target canonical skill ID.
  - This allows future profile lookups to automatically remap historical references without losing suggestion audit trails.

### 3. Controller & Route Separation
Following project conventions:
- `apps/api/src/taxonomy/taxonomy.public.controller.ts`:
  - `GET /taxonomy/categories`
  - `GET /taxonomy/professions`
  - `GET /taxonomy/skills`
- `apps/api/src/taxonomy/taxonomy.freelancer.controller.ts`:
  - `POST /freelancer/skills/suggest` (guarded by `JwtAuthGuard`)
- `apps/api/src/taxonomy/taxonomy.admin.controller.ts`:
  - `POST /admin/taxonomy/categories`, `PUT /admin/taxonomy/categories/:id`
  - `POST /admin/taxonomy/professions`, `PUT /admin/taxonomy/professions/:id`
  - `GET /admin/skills/suggestions`
  - `POST /admin/skills/suggestions/:id/approve`
  - `POST /admin/skills/suggestions/:id/reject`
  - `POST /admin/skills/suggestions/:id/merge`

## Risks / Trade-offs

- **[Risk] Proliferation of low-quality or duplicate suggestions** → **Mitigation**: Status defaults to `PENDING` so unmoderated skills never appear in public dropdowns. `@@unique([professionId, name])` blocks duplicate submissions.
- **[Risk] High query volume on taxonomy during onboarding and directory filters** → **Mitigation**: Compound index on `(professionId, status)` and sorting by `sortOrder, name`.

## Migration Plan

1. Add models to `apps/api/prisma/schema.prisma` and synchronize database schema.
2. Create seed script `apps/api/prisma/seed-taxonomy.ts` populating core trades and skills.
3. Build DTOs, service, and controllers in `apps/api/src/taxonomy`.
4. Add unit and integration tests.

