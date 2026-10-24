# tax-management Specification

## Purpose

Enables creation and administrative management of tax classes and statutory VAT rates, resolves catalog tax inheritance across categories and products, executes tax-inclusive reverse calculations, enforces shipping tax exemption, and provides administrative oversight.

## Requirements

### Requirement: Tax Class Configuration and Management
The system SHALL maintain `TaxClass` entities storing a unique identifier, human-readable name, unique alphanumeric code, percentage decimal rate, active status flag, and a default indicator.

#### Scenario: Admin creates a new tax class
- **WHEN** an administrator submits a POST request to `/api/v1/admin/taxes` with name "Standard Electronics VAT", code "VAT-ELEC-5", and rate 5.00
- **THEN** the system validates uniqueness of the code, creates the `TaxClass` record, and returns HTTP 201 Created with the persisted entity.

#### Scenario: Admin designates a default tax class
- **WHEN** an administrator sets a tax class as the default via the admin API
- **THEN** the system marks the selected tax class with `isDefault: true` and clears the default flag from all other tax classes.

### Requirement: Tax Rate Inheritance and Resolution
The system SHALL resolve a variant's effective tax class by evaluating product-level assignment first, falling back to parent category assignment, and finally applying the store's default tax class if neither is defined.

#### Scenario: Product inherits category default tax class
- **WHEN** a product has no explicit `taxClassId` but belongs to a category assigned to tax class "General 15%"
- **THEN** the calculation engine resolves the product's tax rate as 15.00%.

#### Scenario: Product explicit tax class overrides category
- **WHEN** a product is explicitly assigned to tax class "Reduced 5%" and belongs to a category assigned to "General 15%"
- **THEN** the calculation engine applies the product override rate of 5.00%.

### Requirement: Tax-Inclusive VAT Reverse Calculation Engine
The system SHALL treat catalog retail prices as inclusive of tax, reverse-calculating the embedded VAT amount per line item using the formula `net = price / (1 + (rate / 100))` and `taxAmount = price - net`, rounded to 2 decimal places.

#### Scenario: Reverse extraction of embedded 15% VAT
- **WHEN** a line item with unit price ৳11,500.00 and quantity 1 is processed under a 15.00% tax class
- **THEN** the system computes the net base amount as ৳10,000.00 and the included tax amount as ৳1,500.00.

#### Scenario: Zero-rated tax class produces zero tax
- **WHEN** a line item is processed under a 0.00% tax class
- **THEN** the system computes the tax amount as ৳0.00 and the net amount equals the full line item total.

### Requirement: Shipping Fee Tax Exemption
The system SHALL treat all customer delivery and shipping fees as strictly tax-exempt, applying VAT calculations exclusively to taxable physical product line items.

#### Scenario: Shipping fee incurs zero tax
- **WHEN** an order includes a shipping fee of ৳60.00 alongside taxable items
- **THEN** the system applies 0% tax to the shipping fee, ensuring the total tax amount reflects only product line item VAT.

### Requirement: Administrative Taxes API
The system SHALL expose REST endpoints under `/api/v1/admin/taxes` restricted to administrative roles for paginated retrieval, detail inspection, creation, updating, and deactivation of tax classes.

#### Scenario: Admin retrieves tax classes list
- **WHEN** an authenticated administrator sends a GET request to `/api/v1/admin/taxes`
- **THEN** the system returns HTTP 200 OK with all configured tax classes, including assigned product counts and active statuses.

#### Scenario: Admin deactivates tax class
- **WHEN** an administrator submits a PATCH request deactivating an existing tax class
- **THEN** the system marks `isActive: false` and prevents new products from selecting this tax class while preserving existing order snapshots.

### Requirement: Admin Dashboard Taxes UI
The system SHALL render an administrative interface at `/system/taxes` within the AdminLTE layout, providing a responsive data table of tax classes, rate badges, default indicators, and a modal for creating and editing tax classes.

#### Scenario: Admin views taxes management page
- **WHEN** an administrator navigates to `/system/taxes` in the admin dashboard
- **THEN** the system displays the Tax Classes table with columns for Name, Code, Rate (%), Default status, and action buttons.
