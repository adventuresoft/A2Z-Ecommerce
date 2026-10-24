# Design

## Context

See [proposal.md](file:///c:/xampp/htdocs/office/az-ecommerce/openspec/changes/taxes-and-vat-module/proposal.md) for background and motivation. The system currently calculates `grandTotal = subtotal - discountAmount + shippingFee` without any tax breakdown. The platform is a single-vendor e-commerce application serving Bangladesh retail customers, where retail prices on consumer physical goods are standardly tax-inclusive. The backend is built with NestJS, Prisma 7, and PostgreSQL 18, and the admin dashboard uses Next.js 16 with AdminLTE 4 / Bootstrap 5.3.

## Goals / Non-Goals

**Goals:**
- Provide a relational `TaxClass` entity with percentage rate, unique code, active status, and default designation.
- Support catalog inheritance: Categories specify a default tax class, while individual Products can specify an override.
- Implement a reverse-calculation algorithm for tax-inclusive retail pricing that accurately extracts net price and VAT per line item.
- Freeze tax rates and amounts at the time of checkout in `OrderItem` (`taxRate`, `taxAmount`, `taxClassName`) and `Order` (`totalTaxAmount`) to maintain immutable financial records.
- Deliver full administrative CRUD capabilities via REST endpoints in NestJS and a responsive AdminLTE management table and modal under `/system/taxes`.

**Non-Goals:**
- Multi-jurisdictional geographic tax zones (e.g., US state/county nexus rules); this implementation targets single-vendor domestic commerce.
- Multi-currency conversions (all calculations operate in BDT).
- B2B customer VAT registration validation (e.g., automated Mushak 6.3 submission to government tax portals).

## Decisions

### Decision 1: Tax-Inclusive Pricing with Reverse Extraction
- **Choice:** Catalog prices remain gross (inclusive of VAT). Checkout reverse-extracts VAT using:
  ```
  netUnitPrice = unitPrice / (1 + (taxRate / 100))
  taxAmount = (unitPrice - netUnitPrice) * quantity
  ```
- **Rationale:** Aligns with standard retail practices in Bangladesh where consumers pay the displayed sticker price, while providing accounting transparency on receipts.
- **Alternatives Considered:**
  - *Tax-Exclusive Surcharge:* Rejected because customer friction increases when unexpected VAT is added on top of sticker prices at checkout.

### Decision 2: Tax Class Inheritance Hierarchy
- **Choice:** Evaluate `Product.taxClassId` first; if null, evaluate `Category.taxClassId`; if null, fall back to the store's default active `TaxClass` (`isDefault: true`). If no tax class is found, rate defaults to `0.00%`.
- **Rationale:** Minimizes redundant manual data entry for large product catalogs while providing precision overrides for specialized items (e.g., zero-rated books or educational gear).
- **Alternatives Considered:**
  - *Product-only assignment:* High maintenance burden when managing hundreds of products.
  - *Single global rate:* Inflexible when the catalog spans multiple statutory tax brackets.

### Decision 3: Financial Immutability via Snapshots
- **Choice:** Store frozen fields `taxRate`, `taxAmount`, and `taxClassName` directly on `OrderItem`, and `totalTaxAmount` on `Order`.
- **Rationale:** Statutory tax audits and customer return settlements must reflect the exact tax terms effective when the order was placed, immune to subsequent tax rate edits.
- **Alternatives Considered:**
  - *Dynamic calculation on order inspection:* Rejected because updating a tax class would retroactively rewrite past revenue and tax figures.

### Decision 4: Admin UI Route Placement
- **Choice:** Position Taxes management under System navigation at `/system/taxes` in `apps/admin`.
- **Rationale:** Consistent with AdminLTE information architecture. Tax management involves its own entity lifecycle, data table, and modal interactions, which fit better as a dedicated administrative page rather than a crowded tab inside generic store settings.
- **Alternatives Considered:**
  - *Tab in Store Settings:* Rejected because tax classes are relational entities with their own metrics and actions, unlike simple key-value store configurations.

### Decision 5: Tax Exemption for Shipping Fees
- **Choice:** Shipping fees carry 0% VAT.
- **Rationale:** Delivery costs are fulfillment fees that in this business model are passed through without additional commercial markup, keeping shipping calculations simple.

## Risks / Trade-offs

- **Line-Item Rounding Discrepancies** → *Mitigation:* Calculate VAT per line item rounded to 2 decimal places using standard half-up arithmetic (`Math.round`), then sum line item tax amounts to derive `Order.totalTaxAmount`.
- **Deletion of Referenced Tax Classes** → *Mitigation:* Use `onDelete: SetNull` on foreign keys and implement soft deactivation (`isActive: false`) in application logic so tax classes associated with active products cannot be accidentally dropped.
- **Existing Orders Backward Compatibility** → *Mitigation:* Database migration assigns `@default(0.00)` to all new tax columns, ensuring pre-existing orders retain valid decimal totals without data corruption.

## Migration Plan

1. Create Prisma migration adding `TaxClass` model, relations on `Category` and `Product`, and snapshot columns on `Order` and `OrderItem`.
2. Seed initial baseline tax classes (e.g., "Standard Electronics VAT" at 5.00% and "General VAT" at 15.00%).
3. Deploy NestJS `TaxesModule` and integrate calculation in `OrdersService`.
4. Deploy Admin Dashboard screen at `/system/taxes` and update sidebar navigation.
