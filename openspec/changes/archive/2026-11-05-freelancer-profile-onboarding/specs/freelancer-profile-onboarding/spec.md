# Spec Delta

## Purpose

Enables service professionals to register via mobile phone OTP, build comprehensive verified profiles with validated Bangladesh locations and services, submit for administrative moderation, and manage ongoing profile updates through a dual-track immediate vs pending revision workflow.

## ADDED Requirements

### Requirement: Freelancer Registration OTP Generation
The system SHALL provide an endpoint to initiate freelancer registration by sending a 4-digit SMS OTP to a normalized mobile phone number under purpose FREELANCER_REGISTER, rejecting numbers already bound to another profile.

#### Scenario: Request OTP for new phone
- **WHEN** customer submits a valid Bangladeshi mobile number not bound to an existing freelancer profile
- **THEN** system creates an OtpCode record with purpose FREELANCER_REGISTER, sends SMS, and returns success with 300-second expiry

#### Scenario: Request OTP with duplicate phone
- **WHEN** customer submits a mobile number already linked to another user's freelancer profile
- **THEN** system rejects the request with HTTP 409 Conflict

### Requirement: Freelancer Registration OTP Verification
The system SHALL verify the provided OTP code and initialize a DRAFT FreelancerProfile for the authenticated user, setting user phone if previously unset.

#### Scenario: Valid OTP verification creates draft profile
- **WHEN** user submits valid phone and matching 4-digit OTP for FREELANCER_REGISTER
- **THEN** system marks OTP as used, creates a FreelancerProfile in DRAFT status linked to the user, and returns profile details

#### Scenario: Invalid or expired OTP verification
- **WHEN** user submits an invalid or expired OTP code
- **THEN** system rejects the request with HTTP 400 Bad Request and tracks failed attempts

### Requirement: Freelancer Profile Information Management
The system SHALL allow a freelancer to retrieve and update their profile details including displayName, title, about bio, experienceYears, email, address, and primary profession.

#### Scenario: Update profile fields in draft status
- **WHEN** freelancer updates bio, display name, experience years, and profession on a DRAFT profile
- **THEN** system validates field constraints and saves the updated values

#### Scenario: Invalid experience or missing fields
- **WHEN** freelancer submits negative experience years or empty display name
- **THEN** system rejects the update with HTTP 400 Bad Request validation errors

### Requirement: Freelancer Service Locations Management
The system SHALL allow freelancers to manage between 1 and 5 hierarchical locations, ensuring base ancestry validity via LocationsValidationService and requiring exactly one primary location.

#### Scenario: Save valid primary and secondary locations
- **WHEN** freelancer submits 2 valid locations with division, district, thana, post office, mutual-exclusive local unit, and exactly one marked isPrimary true
- **THEN** system validates ancestry and saves locations replacing prior set

#### Scenario: Save location set with no primary or multiple primaries
- **WHEN** freelancer submits location set where isPrimary count is not exactly 1
- **THEN** system rejects the request with HTTP 400 Bad Request

#### Scenario: Save more than 5 locations
- **WHEN** freelancer attempts to save 6 locations
- **THEN** system rejects the request with HTTP 400 Bad Request

### Requirement: Freelancer Services and Pricing Management
The system SHALL allow freelancers to manage 1 to 10 services with title, description, price type (FIXED, HOURLY, DAILY, NEGOTIABLE), and amount in BDT, updating cached startingPrice.

#### Scenario: Save valid service offerings
- **WHEN** freelancer submits services with valid titles, price types, and amounts
- **THEN** system persists services and updates startingPrice to the minimum non-negotiable amount

#### Scenario: Exceeding maximum allowed services
- **WHEN** freelancer attempts to save more than 10 services
- **THEN** system rejects the request with HTTP 400 Bad Request

### Requirement: Freelancer Skills Association
The system SHALL allow freelancers to associate up to 10 active taxonomy skills belonging to their chosen profession.

#### Scenario: Associate valid skills
- **WHEN** freelancer submits an array of up to 10 active skill IDs matching their profession
- **THEN** system updates the freelancer's skills association

#### Scenario: Associate skill from different profession or non-active status
- **WHEN** freelancer submits a skill ID that is not ACTIVE or belongs to a different profession
- **THEN** system rejects the association with HTTP 400 Bad Request

### Requirement: Freelancer Portfolio Management
The system SHALL allow freelancers to manage up to 10 portfolio items consisting of image URLs, captions, and display sort order.

#### Scenario: Add and reorder portfolio items
- **WHEN** freelancer saves portfolio items with image URLs and sortOrder
- **THEN** system stores the items linked to the profile

#### Scenario: Exceeding maximum portfolio items
- **WHEN** freelancer submits more than 10 portfolio items
- **THEN** system rejects the request with HTTP 400 Bad Request

### Requirement: Freelancer Availability Management
The system SHALL allow approved or draft freelancers to switch availability status between AVAILABLE, BUSY, and UNAVAILABLE with immediate effect.

#### Scenario: Change availability to busy
- **WHEN** freelancer updates availability to BUSY
- **THEN** system immediately updates availability status on the live profile

### Requirement: Profile Submission for Moderation
The system SHALL validate complete profile prerequisites (display name, profession, at least one location, and at least one service) before transitioning profile from DRAFT or REJECTED to PENDING status.

#### Scenario: Submit complete profile
- **WHEN** freelancer with complete profile submits POST /freelancer/profile/submit
- **THEN** system transitions profile status to PENDING and timestamps submission

#### Scenario: Submit incomplete profile
- **WHEN** freelancer submits profile missing locations or services
- **THEN** system rejects submission with HTTP 400 detailing incomplete sections

### Requirement: Admin Profile Approval and Rejection
The system SHALL allow authorized administrators to review pending profiles, approve them into ACTIVE marketplace visibility, or reject them with a mandatory reason.

#### Scenario: Admin approves profile
- **WHEN** administrator approves a PENDING profile
- **THEN** system sets status to APPROVED, records approvedAt and approvedById, and creates approval notification

#### Scenario: Admin rejects profile with reason
- **WHEN** administrator rejects a PENDING profile with a specific reason
- **THEN** system sets status to REJECTED, records rejectionReason, increments rejectionCount, and notifies freelancer

### Requirement: Admin Profile Suspension and Reinstatement
The system SHALL allow authorized administrators to suspend an approved freelancer profile with a reason and subsequently reinstate the profile to approved status.

#### Scenario: Admin suspends freelancer
- **WHEN** administrator suspends an APPROVED profile specifying a suspension reason
- **THEN** system sets status to SUSPENDED, hides profile from marketplace, and logs suspension

#### Scenario: Admin reinstates suspended freelancer
- **WHEN** administrator reinstates a SUSPENDED profile
- **THEN** system restores status to APPROVED

### Requirement: Two-Track Profile Revision Workflow
The system SHALL apply minor profile edits immediately to live approved profiles, while routing sensitive field edits (displayName, photoUrl, professionId, about, portfolio) into a PENDING ProfileRevision without altering live visibility.

#### Scenario: Approved freelancer updates minor fields
- **WHEN** approved freelancer updates availability, service prices, or locations
- **THEN** system applies changes directly to the live profile

#### Scenario: Approved freelancer updates sensitive fields
- **WHEN** approved freelancer updates displayName, about text, or portfolio
- **THEN** system creates a ProfileRevision in PENDING status containing the proposed changes while live profile retains original values

### Requirement: Admin Profile Revision Moderation
The system SHALL provide authorized administrators with endpoints to review, approve, or reject pending profile revisions.

#### Scenario: Admin approves profile revision
- **WHEN** administrator approves a PENDING ProfileRevision
- **THEN** system merges revision payload into FreelancerProfile, marks revision APPROVED, and logs action

#### Scenario: Admin rejects profile revision
- **WHEN** administrator rejects a PENDING ProfileRevision with reason
- **THEN** system marks revision REJECTED with rejection reason and leaves live profile untouched

