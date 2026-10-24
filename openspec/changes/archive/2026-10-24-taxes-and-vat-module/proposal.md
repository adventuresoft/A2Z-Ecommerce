# Proposal

## Why

The platform currently lacks a tax and VAT calculation engine and regulatory compliance tracking. In e-commerce retail (specifically in Bangladesh), statutory VAT must be accounted for on consumer physical goods with transparent itemization on invoices and order breakdowns. 

Introducing a flexible Tax & VAT module now ensures accurate financial reporting, supports multiple VAT brackets across distinct product categories, establishes financial immutability for tax audits, and enables store administrators to configure tax classes directly from the admin dashboard without altering historical orders.

## What Changes

- **New TaxClass Domain Entity**: Add `TaxClass` model in PostgreSQL via Prisma with fields for `id`, `name`, `code`, `rate` (percentage decimal), `isDefault`, `isActive`, and `description`.
- **Tax-Inclusive Pricing Model**: Support tax-inclusive retail pricing where storefront catalog prices embed VAT, and checkout/invoicing reverse-extracts the statutory VAT portion (`net = price / (1 + rate/100)`, `vat = price - net`).
- **Catalog Tax Assignment**: Enable Category-level default `taxClassId` with optional Product-level override `taxClassId`.
- **VAT-Exempt Shipping**: Enforce 0% tax on shipping and delivery fees, applying VAT strictly to taxable product line items.
- **Order Financial Snapshots**: Update `OrderItem` to freeze `taxRate`, `taxAmount`, and `taxClassName` upon checkout, and update `Order` to store `totalTaxAmount` for financial audit compliance.
- **Backend Admin Taxes API**: Implement NestJS REST endpoints under `/api/v1/admin/taxes` for listing, creating, reading, updating, and deactivating tax classes.
- **Admin Dashboard Management UI**: Build a responsive AdminLTE 5 / Bootstrap management interface at `/system/taxes` with data table, status toggles, default rate indicators, and create/edit modal.

## Capabilities

### New Capabilities
- `tax-management`: Defines configuration of tax classes, tax rates, default VAT assignments, catalog inheritance rules, and the tax extraction engine.

### Modified Capabilities
- `order-management`: Updates order creation and data structure requirements to mandate frozen tax snapshots (`taxRate`, `taxAmount`, `taxClassName` on `OrderItem`, and `totalTaxAmount` on `Order`).

## Impact

- **Database**: Adds `TaxClass` model; adds nullable foreign keys `taxClassId` to `Category` and `Product`; adds `taxRate`, `taxAmount`, `taxClassName` to `OrderItem`; adds `totalTaxAmount` to `Order`.
- **API**: Adds NestJS `TaxesModule` under `apps/api/src/taxes`; updates checkout & order creation services in `apps/api/src/orders` to calculate and store tax snapshots.
- **Admin Dashboard**: Adds `/system/taxes` route and navigation menu link under System in `apps/admin`.
- **Storefront / Checkout**: Displays itemized VAT breakdown ("Includes ৳X.XX VAT") in order review and confirmation modals.
