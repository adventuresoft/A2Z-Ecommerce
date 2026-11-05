# Spec Delta

## Purpose

Provides a three-tier professional taxonomy (Category -> Profession -> Skill), public classification queries, freelancer skill suggestions, and administrative moderation workflows.

## ADDED Requirements

### Requirement: Query Active Profession Categories
The system SHALL provide a public endpoint to retrieve all active profession categories ordered by sortOrder ascending.

#### Scenario: List active categories
- **WHEN** client requests GET /taxonomy/categories
- **THEN** system returns active categories containing id, name, bnName, icon, and sortOrder

### Requirement: Query Professions by Category
The system SHALL provide an endpoint to list active professions, supporting filtering by parent category identifier.

#### Scenario: List all active professions
- **WHEN** client requests GET /taxonomy/professions
- **THEN** system returns active professions with category associations

#### Scenario: Filter professions by category
- **WHEN** client requests GET /taxonomy/professions with categoryId
- **THEN** system returns only active professions belonging to that category

### Requirement: Query Skills by Profession
The system SHALL provide an endpoint to retrieve active skills belonging to a specific profession.

#### Scenario: List active skills for a profession
- **WHEN** client requests GET /taxonomy/skills with a valid professionId
- **THEN** system returns all active skills associated with that profession

### Requirement: Freelancer Skill Suggestion
The system SHALL allow authenticated users to submit a new skill under a profession, recording the suggestion in PENDING status.

#### Scenario: Submit valid skill suggestion
- **WHEN** authenticated user sends POST /freelancer/skills/suggest with professionId and skill name
- **THEN** system creates a skill record with status PENDING and records the user as suggestedById

#### Scenario: Suggest duplicate active skill
- **WHEN** user submits a skill name that already exists as ACTIVE under the same profession
- **THEN** system rejects the request with HTTP 409 Conflict

### Requirement: Admin Taxonomy Management
The system SHALL provide authorized administrators with endpoints to create and update categories and professions.

#### Scenario: Create profession category
- **WHEN** authorized admin sends POST /admin/taxonomy/categories with name and sortOrder
- **THEN** system creates the category and returns HTTP 201 Created

#### Scenario: Create profession under category
- **WHEN** authorized admin sends POST /admin/taxonomy/professions with categoryId, name, and bnName
- **THEN** system creates the profession linked to the category

### Requirement: Admin Skill Suggestion Moderation
The system SHALL provide endpoints for administrators to review, approve, reject, or merge pending skill suggestions.

#### Scenario: Approve pending skill suggestion
- **WHEN** admin sends POST /admin/skills/suggestions/:id/approve
- **THEN** system updates the skill status to ACTIVE making it immediately available for selection

#### Scenario: Reject pending skill suggestion
- **WHEN** admin sends POST /admin/skills/suggestions/:id/reject
- **THEN** system marks the skill status as REJECTED

#### Scenario: Merge suggested skill into target skill
- **WHEN** admin sends POST /admin/skills/suggestions/:id/merge with targetSkillId
- **THEN** system sets status to REJECTED and sets mergedIntoId to targetSkillId

