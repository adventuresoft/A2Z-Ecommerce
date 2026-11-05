# Proposal

## Why

To expand the platform from pure e-commerce to a two-sided marketplace offering home and professional services, service professionals need a streamlined, verified onboarding journey. Allowing customers to register as freelancers using their mobile phone and OTP ensures real identity verification, while a multi-step profile builder with admin moderation guarantees high-quality listings, structured locations, and verified skill sets before public listing.

## What Changes

- **Freelancer Onboarding & OTP Registration**: Allow existing or new customers to initiate freelancer registration via mobile OTP (`FREELANCER_REGISTER` purpose), creating a `DRAFT` profile linked 1:1 to `User`.
- **Comprehensive Profile Model**:
  - `FreelancerProfile` table holding identity, bio, experience years, primary profession, availability (`AVAILABLE`, `BUSY`, `UNAVAILABLE`), cached starting price, and status (`DRAFT`, `PENDING`, `APPROVED`, `REJECTED`, `SUSPENDED`).
  - `FreelancerLocation` table supporting 1 to 5 hierarchical service locations per freelancer (with exactly one primary) validated using `LocationsValidationService`.
  - `FreelancerService` table allowing 1 to 10 offerings with price types (`FIXED`, `HOURLY`, `DAILY`, `NEGOTIABLE`) and amounts.
  - `FreelancerSkill` link table allowing up to 10 skills per freelancer.
  - `PortfolioItem` table supporting up to 10 image uploads with captions and sort orders.
- **Two-Track Profile Revisions**:
  - Minor updates (availability, services, pricing, locations, skills) apply immediately to the live profile.
  - Sensitive updates (display name, profile photo, profession, about/bio, portfolio) create a `ProfileRevision` record in `PENDING` status while existing live data remains visible.
- **Admin Review & Moderation Queue**:
  - Admin endpoints to inspect pending profiles and profile revisions.
  - Ability to approve (`APPROVED`) or reject (`REJECTED` with mandatory rejection reason and rejection counter tracking).
  - Ability to suspend (`SUSPENDED`) and reinstate approved freelancers.
- **Frontend Onboarding & Management Experience**:
  - Responsive, multi-step onboarding wizard in `apps/web` adhering to `frontend-design` and `ui-ux-pro-max` (bilingual English + বাংলা, 44px touch targets, visible focus rings, WCAG AA contrast, motion with `useSafeReducedMotion`).
  - Freelancer dashboard and profile edit view indicating live vs revision review states.

## Capabilities

### New Capabilities
- `freelancer-profile-onboarding`: End-to-end freelancer profile registration via phone OTP, multi-step profile builder (locations, services, skills, portfolio), profile submission to admin moderation, immediate vs pending revision management, and admin review workflows.

### Modified Capabilities
*(None. Existing capabilities remain unaffected.)*

## Impact

- **Database / Prisma**:
  - New enums: `FreelancerStatus` (`DRAFT`, `PENDING`, `APPROVED`, `REJECTED`, `SUSPENDED`), `FreelancerAvailability` (`AVAILABLE`, `BUSY`, `UNAVAILABLE`), `ServicePriceType` (`FIXED`, `HOURLY`, `DAILY`, `NEGOTIABLE`), `RevisionStatus` (`PENDING`, `APPROVED`, `REJECTED`).
  - New models: `FreelancerProfile`, `FreelancerLocation`, `FreelancerService`, `FreelancerSkill`, `PortfolioItem`, `ProfileRevision`.
  - Relation updates on `User` and `Profession`.
- **Backend (`apps/api`)**:
  - New `FreelancersModule` with services and controllers:
    - `FreelancerRegistrationController` / `Service` (`POST /freelancer/register/otp`, `POST /freelancer/register/verify`).
    - `FreelancerProfileController` / `Service` (`GET /freelancer/profile`, `PUT /freelancer/profile`, `POST /freelancer/profile/submit`, sub-resource updates for services, locations, skills, portfolio, availability).
    - `AdminFreelancersController` / `Service` (`GET /admin/freelancers`, `POST /admin/freelancers/:id/approve|reject|suspend|reinstate`, `GET /admin/revisions`, `POST /admin/revisions/:id/approve|reject`).
  - Integration with existing `LocationsValidationService` to enforce mutual exclusivity and valid ancestry for freelancer service locations.
  - Integration with `AuditLog` for admin approval/rejection actions and notification triggers.
- **Frontend (`apps/web`)**:
  - Multi-step onboarding wizard at `/freelancer/onboarding`.
  - Freelancer management dashboard at `/freelancer/dashboard` or `/freelancer/profile`.

