# Proposal: Admin Users, Roles & Permissions Management Module

## Why

Following the implementation of product catalog, inventory stock movements, orders, and courier logistics, the administrative platform requires a comprehensive user directory, security role governance, and granular ability matrix enforcement. Operating an e-commerce platform requires differentiated staff access (e.g., operations administrators, shop managers, inventory dispatchers, customer service) without granting root system access or dangerous deletion abilities.

The previous baseline had only hardcoded role enums without UI management screens, preventing administrators from managing staff profiles, inspecting assigned capability matrices, registering fine-grained permission descriptors, or creating custom organizational roles.

This module provides a unified three-tab administration hub adhering pixel-for-pixel to the reference design:
1. **Users Directory**: Employee directory table with profile avatars, contact details, department/section categorization, verification badges, filtering, and CRUD operations.
2. **Role Definitions**: Registered role cards with visual `[R] [C] [U] [D]` micro-badges, and the full interactive Ability Matrix Editor with module grouping, column bulk toggles, and row action controls.
3. **Permission Pool**: Global Permission Registry with stylized key identifier badges and on-the-fly permission registration.

## What Changes

- **Database Relational Models**:
  - `RoleDefinition`: `id`, `name`, `slug`, `description`, `isSystem`, `permissions` (array of string identifiers), `createdAt`, `updatedAt`, and relation to `User`.
  - `PermissionDefinition`: `id`, `name`, `key`, `module`, `action`, `description`, `isSystem`, `createdAt`, `updatedAt`.
  - `User`: Extended with `department`, `section`, `location`, `roleId`, and foreign key relation to `RoleDefinition`.
- **Backend API Endpoints (`apps/api`)**:
  - `AdminUsersController` (`/api/v1/admin/users`): List with search/filters, get by ID, create user with argon2id hashing, update profile/status, and delete with self-protection and last superadmin safeguards.
  - `AdminRolesController` (`/api/v1/admin/roles`): List all roles with computed module capabilities, get by ID, create role, update role, delete custom role.
  - `AdminPermissionsController` (`/api/v1/admin/permissions`): List permissions, define new permission descriptor, update, delete custom permission.
  - Automatic idempotent seeding of 60 core module permissions and 4 system roles on bootstrap.
- **Admin Frontend (`apps/admin`)**:
  - Service layer in `apps/admin/services/users.ts`.
  - Navigation config in `apps/admin/config/navigation.ts` updated with `Live` badge.
  - Unified hub at `apps/admin/app/system/users/page.tsx` with top tab bar matching the 4 reference designs:
    - Tab 1: `Users Directory` (Image 3)
    - Tab 2: `Role Definitions` (Image 4 and Image 1)
    - Tab 3: `Permission Pool` (Image 2)
  - Interactive modals for adding, editing, viewing, and deleting users, roles, and permissions.
- **Verification**:
  - 11 unit tests in `apps/api/src/users/`.
  - 12 comprehensive end-to-end tests in `apps/api/test/users.e2e-spec.ts`.
  - Full TypeScript & Next.js production builds verified across Turborepo monorepo.
