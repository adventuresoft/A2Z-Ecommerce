# Spec Delta: Server-Authoritative Pre-Checkout Calculation

## Purpose

Provides a secure, server-authoritative checkout calculation API verifying variant pricing, live warehouse stock, shipping fees, reverse-extracted VAT, and promotional discounts before order placement.

## ADDED Requirements

### Requirement: Server-Authoritative Pre-Checkout Calculation Endpoint
The system SHALL expose `POST /api/v1/checkout/calculate` accessible by guests and authenticated users, accepting a list of variant IDs and quantities, optional shipping method ID, optional destination city/division, and optional coupon code, returning server-calculated financial totals and item availability statuses.

#### Scenario: Authoritative calculation with valid items and standard delivery
- **WHEN** a client submits a calculation request with valid active variant IDs, quantities, and a Dhaka destination
- **THEN** the system calculates `subtotal` from active variant database prices, extracts line-item taxes into `totalTaxAmount`, resolves standard delivery fee (৳60), checks warehouse stock availability, and returns HTTP 200 OK with `grandTotal: subtotal + shippingFee - discountAmount`.

#### Scenario: Free shipping threshold applied
- **WHEN** a client submits a calculation request where subtotal exceeds ৳100,000
- **THEN** the system returns `shippingFee: 0.00` with standard delivery method details.

#### Scenario: Line item exceeds available warehouse inventory
- **WHEN** a calculation request includes a variant whose requested quantity exceeds `quantity - reservedQuantity` in warehouse inventory
- **THEN** the item is flagged in `itemsValidation` with `isValid: false`, `availableQuantity`, and `isEligibleForCheckout: false`.

#### Scenario: Calculation with verified coupon discount
- **WHEN** a calculation request includes a valid active coupon code "AZDEAL" meeting spend requirements
- **THEN** the system applies the discount amount, reflects it in `discountAmount`, and includes the coupon breakdown in the calculation response.
