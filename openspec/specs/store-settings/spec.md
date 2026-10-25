# store-settings Specification

## Purpose

Provides a centralized, extensible key-value store settings engine supporting grouped store configuration parameters, data type enforcement, public storefront visibility controls, and administrative management.

## Requirements

### Requirement: Extensible Store Settings Data Storage
The system SHALL persist store configuration key-value pairs with associated data type hints (`STRING`, `NUMBER`, `BOOLEAN`, `JSON`), logical group identifiers, descriptions, and public visibility indicators.

#### Scenario: Persistent setting retrieval
- **WHEN** the system looks up a setting by its unique key
- **THEN** it returns the stored setting entity with its typed value, data type metadata, group, and public flag.

#### Scenario: Unknown setting lookup
- **WHEN** a client queries a setting key that does not exist in the database
- **THEN** the system returns a 404 Not Found error with a clear message indicating the key was not found.

### Requirement: Grouped Settings Retrieval and Batch Updates
The system SHALL support retrieving all settings filtered by logical operational group (`GENERAL`, `LOCALIZATION`, `ORDER`, `INVENTORY`, `SHIPPING`, `NOTIFICATION`, `SECURITY`) and performing atomic batch updates across multiple settings in a single transaction.

#### Scenario: Admin queries settings by group
- **WHEN** an administrator requests settings for a specific group such as `LOCALIZATION`
- **THEN** the system returns all configured settings belonging to that group.

#### Scenario: Admin submits batch settings update
- **WHEN** an administrator submits an array of key-value updates across one or more settings
- **THEN** the system executes the updates atomically within a database transaction and returns the refreshed setting records.

### Requirement: Public Storefront Settings Query
The system SHALL provide an unauthenticated public API endpoint that returns only settings explicitly designated with `isPublic: true`, withholding private and security-sensitive configuration keys from unauthenticated callers.

#### Scenario: Unauthenticated customer requests store public settings
- **WHEN** a customer or storefront application calls `GET /api/v1/settings`
- **THEN** the system returns a key-value map containing only public settings (such as store name, currency code, currency symbol, and contact phone) without requiring authentication tokens.

#### Scenario: Public query filters private settings
- **WHEN** `GET /api/v1/settings` is executed
- **THEN** all settings marked with `isPublic: false` (such as admin notification credentials, internal order thresholds, and maintenance bypass rules) are completely omitted from the response.

### Requirement: Administrative Settings Management Authorization
The administrative settings endpoints under `/api/v1/admin/settings` SHALL be protected by JWT authentication and role authorization, allowing only users with `SUPER_ADMIN` or `ADMIN` roles to inspect and update store settings.

#### Scenario: Super admin updates setting
- **WHEN** an authenticated `SUPER_ADMIN` updates setting values via `PATCH /api/v1/admin/settings`
- **THEN** the system applies the changes and records the updated timestamp.

#### Scenario: Customer attempts admin settings access
- **WHEN** an authenticated user with `CUSTOMER` role attempts to access `/api/v1/admin/settings`
- **THEN** the system denies access with a 403 Forbidden error.

### Requirement: Storefront Hero Banners Configuration and Public Delivery
The system SHALL support configured hero banners with structured schema validation (`id`, `title`, `subtitle`, `imageUrl`, `linkUrl`, `badgeText`, `sortOrder`, `isActive`), persisting them in store settings under key `storefront.hero_banners`, and exposing active banners in public settings endpoint `GET /api/v1/settings/public`.

#### Scenario: Retrieving public store settings with active hero banners
- **WHEN** a client sends `GET /api/v1/settings/public`
- **THEN** the system returns HTTP 200 with public store configuration including `heroBanners` containing only active slides sorted by `sortOrder` ascending

#### Scenario: Updating hero banners via admin visual settings editor
- **WHEN** an administrator updates the `storefront.hero_banners` setting with valid banner objects
- **THEN** the system validates the structure, persists the updated JSON array, and immediately reflects the changes in subsequent public settings queries
