# Proposal

## Why

The upcoming Freelancer Marketplace ("Hire a Professional") requires a standardized, hierarchical classification system for trades, professions, and skills. Freelancers must be categorized by a single profession and tagged with relevant skills to enable faceted filtering and search. Additionally, when a specialized skill is missing from the system, freelancers need a suggestion mechanism that routes to an administrative approval queue. Implementing this taxonomy now establishes the required relational foundation for freelancer onboarding and profiles in Stage 1.2.

## What Changes

- **Database Models**:
  - Add `ProfessionCategory` (`id`, `name`, `bnName`, `icon`, `isActive`, `sortOrder`, `createdAt`, `updatedAt`).
  - Add `Profession` (`id`, `categoryId`, `name`, `bnName`, `isActive`, `sortOrder`, `createdAt`, `updatedAt`).
  - Add `Skill` (`id`, `professionId`, `name`, `bnName`, `status` enum [`ACTIVE`, `PENDING`, `REJECTED`], `suggestedById`, `mergedIntoId`, `createdAt`, `updatedAt`).
- **Initial Taxonomy Seed Data**:
  - Seed core Bangladesh service categories (e.g., Home Maintenance, Electrical & Electronics, Construction, Vehicle Repair, Personal Care), professions (e.g., Electrician, Plumber, AC Technician, Carpenter, Painter), and standard skills.
- **Public & Freelancer APIs**:
  - `GET /taxonomy/categories`: List active categories with sort order.
  - `GET /taxonomy/professions?categoryId=...`: List professions (optionally filtered by category).
  - `GET /taxonomy/skills?professionId=...`: List active skills for a profession.
  - `POST /freelancer/skills/suggest`: Allow authenticated users to suggest a new skill under a profession (created as `PENDING`).
- **Admin Moderation & Management APIs**:
  - CRUD operations for categories, professions, and skills.
  - `GET /admin/skills/suggestions`: Review pending skill suggestions.
  - `POST /admin/skills/suggestions/:id/approve`: Approve a suggested skill into `ACTIVE`.
  - `POST /admin/skills/suggestions/:id/reject`: Reject a suggested skill.
  - `POST /admin/skills/suggestions/:id/merge`: Merge a suggested skill into an existing target skill.

## Capabilities

### New Capabilities
- `marketplace-taxonomy`: Hierarchical trade and profession taxonomy management, public classification querying, and administrative skill suggestion moderation.

### Modified Capabilities
<!-- No existing spec requirements are modified. -->

## Impact

- **Database**: New tables `profession_categories`, `professions`, and `skills` added to PostgreSQL via Prisma.
- **API**: New `taxonomy` module in `apps/api/src/taxonomy` with public, freelancer, and admin controllers.
- **Downstream**: Required prerequisite for `FreelancerProfile` and `FreelancerSkill` relations in Stage 1.2.

