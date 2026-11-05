# Tasks

## 1. Database Schema & Migration

- [x] 1.1 Add freelancer enums (`FreelancerStatus`, `FreelancerAvailability`, `ServicePriceType`, `RevisionStatus`) and models (`FreelancerProfile`, `FreelancerLocation`, `FreelancerService`, `FreelancerSkill`, `PortfolioItem`, `ProfileRevision`) to `schema.prisma` and verify generation with `pnpm --filter api run prisma:generate`.
- [x] 1.2 Synchronize the database schema using `pnpm --filter api run prisma:push` and verify the tables and indexes exist in PostgreSQL.

## 2. Backend Freelancer Registration & Profile Module

- [x] 2.1 Create DTOs for registration, profile updates, locations, services, skills, portfolio, and submission validation in `apps/api/src/freelancers/dto`.
- [x] 2.2 Implement `FreelancerRegistrationService` and `FreelancerRegistrationController` with OTP generation and verification for `FREELANCER_REGISTER`, verifying with unit tests in `freelancer-registration.service.spec.ts`.
- [x] 2.3 Implement `FreelancerProfileService` and `FreelancerProfileController` for CRUD on profile, services (auto-recalculating `startingPrice`), locations (validating via `LocationsValidationService`), skills, portfolio, availability, and submission, verifying with unit tests in `freelancer-profile.service.spec.ts`.
- [x] 2.4 Implement two-track profile revision logic routing sensitive updates (`displayName`, `photoUrl`, `professionId`, `about`, `portfolio`) to `ProfileRevision` when profile is `APPROVED`, verifying with revision tests in `freelancer-revision.service.spec.ts`.

## 3. Backend Admin Moderation & Revisions Queue

- [x] 3.1 Implement `AdminFreelancersService` and `AdminFreelancersController` for listing profiles, approving (`approvedAt`, `approvedById`), rejecting (with mandatory reason & counter increment), suspending, and reinstating freelancers, verifying with unit tests in `admin-freelancers.service.spec.ts`.
- [x] 3.2 Implement admin revision endpoints (`GET /admin/revisions`, `POST /admin/revisions/:id/approve`, `POST /admin/revisions/:id/reject`) that merge approved diffs into live profiles, verifying with tests in `admin-revisions.service.spec.ts`.
- [x] 3.3 Register `FreelancersModule` in `apps/api/src/app.module.ts` and verify end-to-end API test suite passes with `pnpm --filter api test`.

## 4. Frontend Freelancer Onboarding & Management UI

- [x] 4.1 Create bilingual API client hooks and state management for freelancer onboarding and profile management in `apps/web/lib/freelancer-client.ts`.
- [x] 4.2 Build accessible, responsive 5-step onboarding wizard (`/freelancer/onboarding`) integrating `CascadingLocationSelector`, touch targets >= 44px, and WCAG AA contrast following `frontend-design` and `ui-ux-pro-max`.
- [x] 4.3 Build Freelancer Dashboard / Profile Management view displaying status banners (Draft, Pending, Approved, Revision Under Review, Suspended) and instant availability toggle.
- [x] 4.4 Run frontend test and lint suite (`pnpm --filter web test` or build check) to verify zero regressions.

