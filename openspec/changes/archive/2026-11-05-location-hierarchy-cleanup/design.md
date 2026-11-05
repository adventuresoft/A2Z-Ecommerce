# Design

## Context

The system currently has initial tables for `Division`, `District`, `CityCorporation`, `Thana`, `Union`, and recently added `PostOffice`. However:
1. `Upazila` is currently mapped to `upazilas` with an optional `districtId`, conflicting with the administrative model defined in `docs/freelancer.md` (Section 6.2) where municipalities are represented by `paurashavas`.
2. `Ward` has no relationship to `CityCorporation` and lacks a numerical `wardNo`.
3. `LocationsController` only exposes endpoints for `divisions`, `districts`, `thanas`, and `post-offices`. Endpoints for `city-corporations`, `paurashavas`, `unions`, and `wards` are missing.
4. There is no centralized consistency validator to enforce the required mutually exclusive address types and parent-child integrity.

## Goals / Non-Goals

**Goals:**
- Update Prisma schema to rename `Upazila` to `Paurashava` (`paurashavas`) with required `districtId`.
- Add `cityCorporationId` and `wardNo` to `Ward` with unique index `(cityCorporationId, wardNo)`.
- Expose parent-filtered query endpoints for all local administrative units in `LocationsController`.
- Implement a reusable `LocationsValidationService` that enforces mutual exclusivity and ancestry validity.
- Build a reusable frontend Cascading Location Selector component and state management hook conforming to `frontend-design` and `ui-ux-pro-max` design guidelines.

**Non-Goals:**
- Creating freelancer tables (`FreelancerProfile`, `FreelancerLocation`) - deferred to Phase 1.
- Altering existing e-commerce checkout and order tables.
- Geospatial mapping or GIS polygon boundaries.

## Decisions

### 1. Rename `Upazila` to `Paurashava` with required `districtId`
- **Choice**: Rename the model `Upazila` to `Paurashava` and map to table `paurashavas`. Make `districtId Int` non-nullable.
- **Rationale**: In Bangladesh local governance, Thana represents administrative/police territory (already in the DB linked to District), while Paurashava represents urban municipalities within a district.
- **Alternatives Considered**: Keeping `upazilas` as a synonym for thanas was rejected because thanas are already the parent of unions and post offices in this schema.

### 2. Ward Schema Relationship
- **Choice**: Add `cityCorporationId Int` (FK referencing `city_corporations.id` on delete Cascade) and `wardNo Int` to `Ward`. Add `@@unique([cityCorporationId, wardNo])`.
- **Rationale**: Wards in this scope specifically partition City Corporations (Paurashava wards and Union wards are omitted or captured as locality free-text in MVP per Section 6.2).
- **Alternatives Considered**: Allowing Wards to attach polymorphically to either City Corporation or Paurashava was rejected to avoid unnecessary polymorphic complexity.

### 3. API Query Parameter Convention
- **Choice**: Standardize on singular parent IDs:
  - `GET /locations/districts?divisionId=:id`
  - `GET /locations/thanas?districtId=:id`
  - `GET /locations/post-offices?thanaId=:id`
  - `GET /locations/city-corporations?districtId=:id`
  - `GET /locations/paurashavas?districtId=:id`
  - `GET /locations/unions?thanaId=:id`
  - `GET /locations/wards?cityCorporationId=:id`
- **Rationale**: Clean, consistent, and maps directly to indexed foreign keys in PostgreSQL.

### 4. Mutual Exclusivity and Hierarchy Validation
- **Choice**: Encapsulate validation in `LocationsValidationService.validateLocationSelection(input)`.
- **Validation Rules**:
  - `divisionId`, `districtId`, `thanaId`, and `postOfficeId` are mandatory.
  - Exactly one of (`cityCorporationId`, `paurashavaId`, `unionId`) must be provided.
  - If `cityCorporationId` is provided, `wardId` must be provided (and must belong to that `cityCorporationId`).
  - If `paurashavaId` or `unionId` is provided, `wardId` must be null.
  - Verify that `postOffice.thanaId === thanaId`, `thana.districtId === districtId`, and `district.divisionId === divisionId`.

### 5. Cascading Location UI Component
- **Choice**: Implement a headless hook `useLocationCascade()` paired with a responsive form component in `packages/ui` or storefront/admin shared components.
- **Behavior**:
  - Changing Division resets District, Thana, Post Office, and local units.
  - Selecting Thana & Post Office unlocks address type selection: `[City Corporation | Paurashava | Union]`.
  - Selecting an address type conditionally displays the corresponding dropdowns.

### 6. UI/UX Design System Guidelines (`frontend-design` & `ui-ux-pro-max`)
To avoid generic templated forms and deliver a high-quality, distinctive user experience:
- **Grounded Subject Matter & Bilingual Display**:
  - Ground typography and options in Bangladesh geography.
  - Support bilingual labels (`name` in English with secondary `bnName` in Bengali where available) to enhance legibility and local authenticity.
- **Accessibility & Interaction (WCAG AA Compliance)**:
  - Minimum touch target of 44×44px on mobile devices.
  - Explicit `<label>` elements tied with `htmlFor` / `id` (no placeholder-only inputs).
  - High visible focus rings (`focus-visible:ring-2 focus-visible:ring-primary-500 focus-visible:outline-none`).
  - WCAG AA contrast ratio (minimum 4.5:1 for text against backgrounds).
  - Screen reader announcements (`aria-live="polite"` and `aria-busy`) when options are loading dynamically.
- **Visual Structure & Progressive Disclosure**:
  - Stepped disclosure: Division → District → Thana → Post Office renders cleanly without layout thrashing (CLS < 0.1) by reserving container space or using smooth CSS grid/height transitions.
  - Segmented control / interactive pill tabs for selecting the administrative unit:
    ```
    +-------------------------------------------------------------+
    | Select Area Type:                                           |
    | [ * City Corporation ]   [   Paurashava   ]   [   Union   ] |
    +-------------------------------------------------------------+
    ```
  - Immediate visual feedback on selection; non-applicable sections are smoothly hidden rather than disabled to reduce cognitive clutter.
- **Motion with Purpose**:
  - Use `motion` for purposeful accordion/expansion transitions when opening dependent sections (150–250ms ease-out).
  - Respect `prefers-reduced-motion` to immediately display states without animation for sensitive users.
- **Conversational & Helpful Copywriting**:
  - User-centric labels: "Select your division", "Choose municipality/paurashava".
  - Empty states guide next steps: e.g., "No paurashavas found in this district. Please select Union or City Corporation instead."
  - Errors are inline, contextual, and explain how to resolve them directly under the offending field.

## Risks / Trade-offs

- **[Risk] Existing Upazila data inconsistency during rename** → **Mitigation**: Generate an SQL migration using `ALTER TABLE upazilas RENAME TO paurashavas;` and ensure any orphan records have valid `districtId` before enforcing NOT NULL.
- **[Risk] Multiple DB queries in validation** → **Mitigation**: Batch query parent relationships in a single transaction or rely on cached/indexed lookup queries.
- **[Risk] Incomplete Ward records** → **Mitigation**: Seed core city corporation wards and allow graceful fallback in UI if a ward list is empty.

## Migration Plan

1. Execute Prisma migration to rename table `upazilas` -> `paurashavas` and alter `wards`.
2. Regenerate Prisma Client.
3. Update `apps/api/src/locations` module with new DTOs, service queries, and validation logic.
4. Add unit and integration tests for query endpoints and validation rules.
5. Create and export the Cascading Location Selector component in frontend apps conforming to the UI/UX standards.
