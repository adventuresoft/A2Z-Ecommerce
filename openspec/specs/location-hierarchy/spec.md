# location-hierarchy Specification

## Purpose

Provides a normalized Bangladesh administrative location hierarchy, cascading query APIs, and cross-level consistency validation for customer addresses and freelancer service areas.

## Requirements

### Requirement: Query Divisions and Districts
The system SHALL provide public endpoints to retrieve active administrative divisions, and active districts filtered by parent division identifier.

#### Scenario: Query all active divisions
- **WHEN** client requests GET /locations/divisions
- **THEN** system returns an ascending sorted list of active divisions containing id, name, and bnName

#### Scenario: Query districts filtered by division
- **WHEN** client requests GET /locations/districts with a valid divisionId
- **THEN** system returns active districts belonging strictly to that division

### Requirement: Query Thanas and Post Offices
The system SHALL provide endpoints to query active thanas by district identifier, and active post offices by thana identifier including postal codes.

#### Scenario: Query thanas by district
- **WHEN** client requests GET /locations/thanas with districtId
- **THEN** system returns active thanas belonging to that district

#### Scenario: Query post offices by thana
- **WHEN** client requests GET /locations/post-offices with thanaId
- **THEN** system returns active post offices with name, bnName, and postalCode belonging to that thana

### Requirement: Query Local Administrative Units (City Corporations, Paurashavas, Unions)
The system SHALL provide endpoints to retrieve City Corporations by district, Paurashavas by district, and rural Unions by thana.

#### Scenario: Query city corporations by district
- **WHEN** client requests GET /locations/city-corporations with districtId
- **THEN** system returns active city corporations situated within the specified district

#### Scenario: Query paurashavas by district
- **WHEN** client requests GET /locations/paurashavas with districtId
- **THEN** system returns active paurashavas situated within the specified district

#### Scenario: Query unions by thana
- **WHEN** client requests GET /locations/unions with thanaId
- **THEN** system returns active unions situated within the specified thana

### Requirement: Query City Corporation Wards
The system SHALL provide an endpoint to retrieve wards for a specific city corporation, returning ward numbers and localized identifiers.

#### Scenario: Query wards by city corporation
- **WHEN** client requests GET /locations/wards with cityCorporationId
- **THEN** system returns an ordered list of wards belonging to that city corporation including wardNo, name, and bnName

### Requirement: Location Mutual Exclusivity Validation
The location validation service SHALL enforce that any structured address or freelancer location designates exactly one administrative type among City Corporation, Paurashava, or Union.

#### Scenario: Valid city corporation selection with ward
- **WHEN** an address payload provides divisionId, districtId, thanaId, postOfficeId, cityCorporationId, and wardId while paurashavaId and unionId are null
- **THEN** system validation succeeds

#### Scenario: Invalid multiple administrative types provided
- **WHEN** an address payload provides both cityCorporationId and paurashavaId (or unionId)
- **THEN** system rejects the payload with a 400 Bad Request error indicating conflicting location types

#### Scenario: City corporation without ward
- **WHEN** an address payload provides cityCorporationId but omits wardId
- **THEN** system rejects the payload with a validation error indicating wardId is required for city corporations

### Requirement: Location Ancestor Hierarchy Validation
The location validation service SHALL verify that each child administrative unit directly belongs to its declared parent units in the database.

#### Scenario: Valid ancestor hierarchy
- **WHEN** an address specifies postOfficeId that belongs to thanaId, thanaId that belongs to districtId, and districtId that belongs to divisionId
- **THEN** system validation passes

#### Scenario: Inconsistent ancestor relationship
- **WHEN** an address specifies a postOfficeId whose parent thana in the database does not match the provided thanaId
- **THEN** system validation fails and rejects the payload with an inconsistency error

