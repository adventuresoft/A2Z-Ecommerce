# Tasks

## 1. Database Schema & Taxonomy Seeding

- [x] 1.1 Add `SkillStatus` enum and `ProfessionCategory`, `Profession`, `Skill` models with foreign key constraints and indexes to `apps/api/prisma/schema.prisma`.
- [x] 1.2 Synchronize PostgreSQL database schema via Prisma and regenerate Prisma client.
- [x] 1.3 Create and execute `apps/api/prisma/seed-taxonomy.ts` populating core Bangladesh trades, professions, and skills.

## 2. Taxonomy DTOs & Validation

- [x] 2.1 Create query, create, and update DTOs for categories, professions, and skills in `apps/api/src/taxonomy/dto`.
- [x] 2.2 Create skill suggestion and moderation DTOs (`SuggestSkillDto`, `MergeSkillDto`) with validation pipes.

## 3. Core Service & Public/Freelancer Endpoints

- [x] 3.1 Implement `TaxonomyService` methods for hierarchical querying, duplicate checking, and skill suggestions.
- [x] 3.2 Implement `TaxonomyPublicController` exposing `GET /taxonomy/categories`, `GET /taxonomy/professions`, and `GET /taxonomy/skills`.
- [x] 3.3 Implement `TaxonomyFreelancerController` exposing `POST /freelancer/skills/suggest` with JWT authentication.

## 4. Admin Management, Moderation & Tests

- [x] 4.1 Implement `TaxonomyAdminController` with category/profession management and suggestion review endpoints (approve, reject, merge).
- [x] 4.2 Write comprehensive unit tests for `TaxonomyService` and controllers covering valid queries, suggestions, duplicates, and admin moderation.

