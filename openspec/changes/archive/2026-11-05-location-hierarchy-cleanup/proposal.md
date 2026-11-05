# Proposal

## Why

The freelancer marketplace ("Hire a Professional") and checkout address systems require an accurate, mutually exclusive Bangladesh administrative location model. The existing database schema retains legacy Upazila naming, lacks structured city corporation ward associations, and lacks dedicated query endpoints and hierarchical consistency validation required for freelancer and customer addresses. Completing this foundation now ensures all downstream features (freelancer profiles, service locations, and filtered directory search) operate on a validated, normalized taxonomy.

## What Changes

- **Database Model Refactoring**:
  - Rename `Upazila` model and underlying table `upazilas` to `Paurashava` / `paurashavas` with required `districtId` foreign key.
  - Enhance `Ward` / `wards` with `cityCorporationId` foreign key and `wardNo` integer column, enforcing a composite unique constraint `(cityCorporationId, wardNo)`.
- **Location Query API Endpoints**:
  - Add query endpoints with parent-filtered DTOs for `city-corporations` (by `districtId`), `paurashavas` (by `districtId`), `unions` (by `thanaId`), and `wards` (by `cityCorporationId`).
- **Hierarchical Consistency & Mutual Exclusion Validator**:
  - Implement reusable validation logic enforcing:
    1. Base chain integrity: `PostOffice` belongs to `Thana`, `Thana` belongs to `District`, `District` belongs to `Division`.
    2. Mutual exclusivity: Exactly one of (`cityCorporationId`, `paurashavaId`, `unionId`) is selected.
    3. Ward constraints: `wardId` is permissible only when `cityCorporationId` is present and must belong to that city corporation.
- **Cascading Location Selector UI**:
  - Build reusable selector components for web storefront and admin dashboards implementing the standardized address flow: `Division -> District -> Thana -> Post Office -> [City Corporation + Ward | Paurashava | Union]`.

## Capabilities

### New Capabilities
- `location-hierarchy`: Bangladesh administrative location hierarchy querying, hierarchical consistency validation, and cascading address selection components.

### Modified Capabilities
<!-- No existing spec requirements are modified. -->

## Impact

- **Database & Prisma**: Migration for `upazilas` -> `paurashavas`, schema changes in `Ward`.
- **API**: `apps/api/src/locations` module expanded with new DTOs, service methods, and controller routes.
- **Frontend**: Cascading selector UI components for `apps/web` and `apps/admin`.
- **Downstream**: Establishes prerequisite schemas and validation logic for `FreelancerLocation` in the upcoming Freelancer Marketplace.

