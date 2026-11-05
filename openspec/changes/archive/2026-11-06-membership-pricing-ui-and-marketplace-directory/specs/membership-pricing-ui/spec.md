## ADDED Requirements

### Requirement: Public pricing page
The system SHALL show all active membership plans on a public page, ordered by sort order, with name, duration, price in BDT and plan features. Visitors who are not logged in MUST be able to view it.

#### Scenario: Visitor views plans
- **WHEN** a visitor opens the membership page without logging in
- **THEN** every active plan is listed with its price and duration, and no plan data requires authentication

#### Scenario: No active plans
- **WHEN** the plan list is empty
- **THEN** the page says plans are not available yet and offers a link back to the marketplace

### Requirement: Buy a plan
A logged-in customer SHALL be able to start checkout for a plan and be redirected to the payment gateway. A visitor who is not logged in MUST be sent to login and returned to the membership page afterwards.

#### Scenario: Customer buys a plan
- **WHEN** a logged-in customer selects a plan
- **THEN** checkout starts and the browser is redirected to the gateway payment URL

#### Scenario: Visitor selects a plan
- **WHEN** a visitor who is not logged in selects a plan
- **THEN** the visitor is redirected to login with a return URL pointing to the membership page

#### Scenario: Checkout fails
- **WHEN** checkout cannot be started
- **THEN** the page shows what went wrong and keeps the plan selectable for retry

### Requirement: Current membership status
A logged-in customer SHALL see whether a membership is active, its expiry date and days remaining, and a renewal action. An expired or missing membership MUST be shown as inactive.

#### Scenario: Active membership
- **WHEN** a customer with an active membership opens the membership page
- **THEN** the expiry date and days remaining are shown, and buying another plan is labelled as renewal that extends the current term

#### Scenario: Expiring soon
- **WHEN** the membership expires in 7 days or fewer
- **THEN** the page highlights the remaining days and the renewal action

### Requirement: Membership history
A logged-in customer SHALL see past subscriptions and payments with plan, amount, status and dates.

#### Scenario: Customer with history
- **WHEN** a customer opens the history section
- **THEN** each payment shows plan, amount, status and date, newest first

#### Scenario: No history
- **WHEN** the customer has never paid
- **THEN** an empty state invites the customer to choose a plan

### Requirement: Payment result page
After returning from the gateway, the system SHALL show the payment outcome (success, failed or cancelled) and the next step.

#### Scenario: Successful payment
- **WHEN** the customer returns with a paid status
- **THEN** the page confirms the membership is active with its expiry date and links to the marketplace

#### Scenario: Failed or cancelled payment
- **WHEN** the customer returns with a failed or cancelled status
- **THEN** the page states the payment did not complete, that the customer was not charged for an active term, and offers a retry

