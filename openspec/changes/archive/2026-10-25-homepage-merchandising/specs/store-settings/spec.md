# Spec Delta

## ADDED Requirements

### Requirement: Storefront Hero Banners Configuration and Public Delivery
The system SHALL support configured hero banners with structured schema validation (`id`, `title`, `subtitle`, `imageUrl`, `linkUrl`, `badgeText`, `sortOrder`, `isActive`), persisting them in store settings under key `storefront.hero_banners`, and exposing active banners in public settings endpoint `GET /api/v1/settings/public`.

#### Scenario: Retrieving public store settings with active hero banners
- **WHEN** a client sends `GET /api/v1/settings/public`
- **THEN** the system returns HTTP 200 with public store configuration including `heroBanners` containing only active slides sorted by `sortOrder` ascending

#### Scenario: Updating hero banners via admin visual settings editor
- **WHEN** an administrator updates the `storefront.hero_banners` setting with valid banner objects
- **THEN** the system validates the structure, persists the updated JSON array, and immediately reflects the changes in subsequent public settings queries
