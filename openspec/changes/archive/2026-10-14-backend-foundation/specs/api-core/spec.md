# Spec Delta: api-core

## Purpose

Provides foundational runtime behaviors for the NestJS REST API, including endpoint version routing, automated OpenAPI documentation, global payload validation, unified error responses, CORS access controls, and health monitoring.

## ADDED Requirements

### Requirement: Global API Prefix and Versioning
The backend API SHALL expose all operational REST endpoints beneath the global prefix `/api/v1`.

#### Scenario: Requesting versioned endpoint
- **WHEN** client sends a request to `/api/v1/health`
- **THEN** system routes the request to the corresponding controller beneath the v1 namespace

#### Scenario: Requesting unversioned root route
- **WHEN** client sends a request to an unversioned route such as `/health`
- **THEN** system returns HTTP 404 Not Found

### Requirement: Interactive OpenAPI Documentation
The system SHALL generate and serve OpenAPI specification documentation at `/api/docs`.

#### Scenario: Accessing Swagger documentation
- **WHEN** a client navigates to `/api/docs`
- **THEN** system serves the Swagger UI explorer with all registered endpoints, schemas, and descriptions

### Requirement: Strict Request Body and Parameter Validation
The system SHALL validate all incoming request payloads against their declared DTO classes and reject unknown properties.

#### Scenario: Invalid payload submission
- **WHEN** client sends a request body containing properties that fail class validation rules
- **THEN** system responds with HTTP 400 Bad Request detailing each validation violation

#### Scenario: Stripping and forbidding non-whitelisted properties
- **WHEN** client submits extraneous fields not declared in the target DTO
- **THEN** system rejects the request with HTTP 400 Bad Request indicating unauthorized properties

### Requirement: Standardized Error Response Format
The system SHALL catch all unhandled exceptions and format HTTP error responses into a consistent JSON structure.

#### Scenario: Exception thrown during request execution
- **WHEN** any HTTP or unexpected runtime error occurs during a request
- **THEN** system responds with JSON containing `statusCode`, `message`, `error`, `timestamp`, and `path`

### Requirement: Cross-Origin Resource Sharing Policy
The system SHALL allow cross-origin requests originating from configured client origins including the storefront and admin dashboard.

#### Scenario: Request from permitted origin
- **WHEN** client from `http://localhost:3000` or `http://localhost:3002` issues a cross-origin request
- **THEN** system responds with appropriate `Access-Control-Allow-Origin` headers and credentials support

#### Scenario: Preflight OPTIONS request
- **WHEN** client sends an HTTP OPTIONS preflight request from an allowed origin
- **THEN** system returns HTTP 204 or 200 with permitted HTTP methods and headers

### Requirement: Health and Readiness Probing
The system SHALL provide a health check endpoint at `/api/v1/health` that reports service status and database connectivity.

#### Scenario: System and database are healthy
- **WHEN** client sends `GET /api/v1/health` while PostgreSQL is accessible
- **THEN** system returns HTTP 200 with status `ok`, current server timestamp, uptime, and database status `connected`

#### Scenario: Database is unreachable
- **WHEN** client sends `GET /api/v1/health` while PostgreSQL connection fails
- **THEN** system returns HTTP 503 Service Unavailable with database status `disconnected`
