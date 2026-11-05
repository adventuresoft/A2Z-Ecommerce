# Tasks

## 1. Database Schema & Migration

- [x] 1.1 Update `apps/api/prisma/schema.prisma` to rename `Upazila` to `Paurashava` (table `paurashavas`) with required `districtId` foreign key and relation.
- [x] 1.2 Update `Ward` model in `apps/api/prisma/schema.prisma` to add `cityCorporationId` (FK to `city_corporations`), `wardNo` (Int), and `@@unique([cityCorporationId, wardNo])`.
- [x] 1.3 Create and run Prisma database migration for table rename and ward updates.
- [x] 1.4 Regenerate Prisma client and verify Prisma types compile cleanly across the workspace.

## 2. API DTOs and Query Endpoints

- [x] 2.1 Add query and response DTOs for `city-corporations`, `paurashavas`, `unions`, and `wards` in `apps/api/src/locations/dto`.
- [x] 2.2 Implement service query methods `getCityCorporations`, `getPaurashavas`, `getUnions`, and `getWards` in `LocationsService`.
- [x] 2.3 Add controller routes in `LocationsController` for `GET /locations/city-corporations`, `GET /locations/paurashavas`, `GET /locations/unions`, and `GET /locations/wards`.
- [x] 2.4 Write controller/service tests for all location retrieval endpoints.

## 3. Location Hierarchy Consistency Validator

- [x] 3.1 Implement `LocationsValidationService` enforcing:
  - Base ancestry check (`postOfficeId` -> `thanaId` -> `districtId` -> `divisionId`).
  - Exactly one of `cityCorporationId`, `paurashavaId`, or `unionId` is provided.
  - Mandatory `wardId` when `cityCorporationId` is provided, and `wardId` belongs to that city corporation.
  - `wardId` is null when `paurashavaId` or `unionId` is provided.
- [x] 3.2 Write comprehensive unit tests for `LocationsValidationService` covering all valid and invalid scenarios.

## 4. Cascading Location Selector UI (with frontend-design & ui-ux-pro-max standards)

- [x] 4.1 Create `useLocationCascade` hook with cascading state reset logic, error handling, and caching.
- [x] 4.2 Build `CascadingLocationSelector` component applying `frontend-design` and `ui-ux-pro-max` standards:
  - 44px minimum touch targets on mobile and WCAG AA contrast (≥ 4.5:1).
  - Explicit `<label>` elements with visible focus rings (`focus-visible:ring-2`).
  - Screen reader announcements (`aria-live="polite"` and `aria-busy`) during async cascading fetches.
  - Interactive segmented pill buttons for area type selection (`City Corporation`, `Paurashava`, `Union`).
  - Smooth disclosure animations using `motion` with `prefers-reduced-motion` compliance.
  - Bilingual label rendering (`name` in English with secondary `bnName` in Bengali).
  - Contextual inline validation and helpful empty state guidance.
- [x] 4.3 Add component unit tests and visual verification for cascading transitions and empty states.
