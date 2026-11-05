# Marketplace Directory Specification

## Purpose

Provide search, filtering, and directory exploration of approved freelancers, full public profile viewing without contact information leakage, and gated phone reveal functionality for active members within daily quotas.

## Requirements

### Requirement: Login required to browse
The marketplace listing and public profile SHALL be available only to logged-in customers. Visitors MUST be redirected to login and returned to the page they requested.

#### Scenario: Visitor opens the directory
- **WHEN** a visitor who is not logged in opens the directory or a profile
- **THEN** the visitor is redirected to login with a return URL

#### Scenario: API without a token
- **WHEN** the listing or profile endpoint is called without authentication
- **THEN** the response is 401

### Requirement: Visible freelancers only
The listing and profile SHALL include only freelancers whose status is approved, whose account is active, and who have at least one location and one service. All others MUST be hidden from listing and profile.

#### Scenario: Suspended freelancer
- **WHEN** a freelancer is suspended
- **THEN** the freelancer is absent from the listing and the profile request returns 404

#### Scenario: Incomplete freelancer
- **WHEN** an approved freelancer has no service
- **THEN** the freelancer is absent from the listing

### Requirement: Freelancer cards
Each listing card SHALL show photo, name, profession, top skills, years of experience, primary location, starting price, an availability badge, and actions to view the profile, send a message and show the number. BUSY freelancers MUST show a grey badge.

#### Scenario: Card content
- **WHEN** the listing renders a freelancer
- **THEN** the card shows the fields above and never includes a phone number, email or address

### Requirement: Filters and search
The listing SHALL support filtering by category, profession, skills, experience range, price range, division, district, thana, address type and availability, plus text search over name and title. Filters MUST combine with AND.

#### Scenario: Filter by district and profession
- **WHEN** a customer filters by district and profession
- **THEN** only freelancers with a location in that district and that profession are returned

#### Scenario: No results
- **WHEN** no freelancer matches
- **THEN** the page shows an empty state with a control to clear filters

#### Scenario: Filters in the URL
- **WHEN** a customer applies filters
- **THEN** the filters are reflected in the page URL so the result can be shared and restored

### Requirement: Sorting and pagination
The listing SHALL default to available freelancers first, then most recently active, then newest. It SHALL also sort by price low to high, price high to low and experience. Results MUST be paged by cursor, 20 per page.

#### Scenario: Default order
- **WHEN** no sort is chosen
- **THEN** AVAILABLE freelancers appear before BUSY and UNAVAILABLE, ties broken by last activity then creation date

#### Scenario: Load more
- **WHEN** more than 20 freelancers match
- **THEN** the response includes a cursor, and requesting it returns the next 20 without repeats or gaps

### Requirement: Public profile
The profile page SHALL show photo, name, profession, title, about, experience, skills, services with price type and amount, portfolio, locations, availability and member-only contact actions. It MUST NOT include phone, email or address.

#### Scenario: Profile payload
- **WHEN** a customer opens a profile
- **THEN** the response and page contain no phone number, email or address

#### Scenario: Pending revision
- **WHEN** a freelancer has a pending sensitive revision
- **THEN** the profile still shows the previously approved data

### Requirement: Phone reveal
Revealing a phone number SHALL require an active membership. Each member MUST be limited to a configurable number of distinct freelancers per day, default 20. Revealing a freelancer already revealed is free. Every new reveal MUST be recorded.

#### Scenario: Member reveals a number
- **WHEN** a member with quota left requests a reveal
- **THEN** the number is returned and a reveal record is created

#### Scenario: No membership
- **WHEN** a customer without an active membership requests a reveal
- **THEN** the response is 403 and the page shows a prompt to buy a plan

#### Scenario: Quota exceeded
- **WHEN** a member has revealed the daily maximum of distinct freelancers and requests a new one
- **THEN** the response is 429 and the page states when the quota resets

#### Scenario: Repeat reveal
- **WHEN** a member reveals a freelancer already revealed that day
- **THEN** the number is returned and the quota is not consumed

#### Scenario: Suspended freelancer
- **WHEN** a reveal is requested for a suspended freelancer
- **THEN** the request is rejected as not found

### Requirement: Locked contact actions
Contact actions SHALL be locked for customers without an active membership. A locked action MUST explain why and link to the membership page.

#### Scenario: Locked state
- **WHEN** a customer without membership views a card or profile
- **THEN** Show number and Send message display a lock and point to the pricing page

### Requirement: Accessible and responsive interface
The directory and profile SHALL work from 360px width up, be fully keyboard operable with visible focus, respect reduced-motion preferences, and show Bangla names where available.

#### Scenario: Mobile filters
- **WHEN** the directory is opened on a narrow screen
- **THEN** filters open in a panel and the card list stays single-column

