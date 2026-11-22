# Spec Delta

## ADDED Requirements

### Requirement: Mobile Application Version Gate Configuration
The system SHALL seed and expose public store settings keys `mobile.min_supported_version` and `mobile.latest_version` (marked `isPublic: true`) via `GET /api/v1/settings/public` and `GET /api/v1/settings` so mobile clients can determine whether a soft update banner or blocking force-update prompt is required on startup.

#### Scenario: Mobile client fetches public version gate settings
- **WHEN** a mobile client sends an unauthenticated `GET /api/v1/settings/public` request
- **THEN** the response includes `mobile.min_supported_version` and `mobile.latest_version` semantic version strings alongside existing public store settings

#### Scenario: Administrator updates minimum supported mobile version
- **WHEN** an authenticated `ADMIN` or `SUPER_ADMIN` updates `mobile.min_supported_version` via `PATCH /api/v1/admin/settings`
- **THEN** the updated version string is persisted and immediately returned on subsequent `GET /api/v1/settings/public` calls
