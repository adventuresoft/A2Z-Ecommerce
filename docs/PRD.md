# PRD.md — Single-Vendor E-commerce Backend

## 1. Project Overview

Build a secure, maintainable, single-vendor e-commerce backend for selling physical products.

The backend will provide APIs for customer authentication, product catalog, product variants, inventory, cart, checkout, orders, payments, shipping, coupons, reviews, and administration.

The backend will be consumed by a Next.js storefront and an admin dashboard.

## 2. Technology Stack

- **Backend:** NestJS
- **Language:** TypeScript
- **Database:** PostgreSQL
- **ORM:** Prisma
- **API Architecture:** REST API with JSON
- **Authentication:** JWT access and refresh tokens
- **Validation:** DTOs and class-validator
- **API Documentation:** Swagger / OpenAPI
- **Testing:** Postman
- **Architecture:** Modular Monolith

Inspect the existing repository before selecting or installing additional packages. Reuse compatible dependencies wherever possible.

## 3. Project Goals

1. Build a modular backend that is easy to maintain and extend.
2. Establish a reliable relational data model.
3. Enforce authentication and role-based authorization.
4. Maintain accurate product prices and inventory.
5. Process checkout and orders safely.
6. Support Cash on Delivery initially, with an extensible payment architecture.
7. Support future courier and online payment integrations.
8. Provide documented and testable APIs.
9. Build features incrementally through GRILL-ME and OpenSpec.
10. Avoid unnecessary complexity and premature microservices.

## 4. User Types and Permissions

### Customer
- Register and log in.
- Manage profile and delivery addresses.
- Browse products and categories.
- Manage shopping cart.
- Apply eligible coupons.
- Place orders.
- View order history and order details.
- Cancel eligible orders.
- Track shipments.
- Submit reviews for eligible purchases.

### Administrator
- Access protected admin APIs.
- Manage products, categories, brands, attributes, and variants.
- Manage inventory and stock movements.
- View and process orders.
- Manage payments, refunds, and shipping.
- Manage customers and coupons.
- View reports and update system settings.

### Additional Roles
Support configurable roles and permissions if required. Confirm the permission model during the requirements interview.

## 5. Functional Requirements

### 5.1 Authentication and Users
- Customer registration and login.
- Administrator authentication.
- Secure password hashing.
- Access and refresh token management.
- Logout and token invalidation strategy.
- Password reset workflow.
- Role-based authorization.
- Profile and address management.

### 5.2 Product Catalog
- Product CRUD operations.
- Categories and nested categories.
- Brands.
- Product descriptions, images, and slugs.
- SKU and pricing.
- Regular price and sale price.
- Product attributes and variants.
- Product activation and archiving.
- Search, filtering, sorting, and pagination.
- Featured products where required.

### 5.3 Inventory
- Inventory overview.
- Stock adjustments.
- Stock movement history.
- Low-stock thresholds.
- Inventory validation during checkout.
- Defined stock reservation and deduction rules.
- Stock restoration for eligible cancellations and returns.
- Transaction-safe updates to prevent overselling.

### 5.4 Cart and Checkout
- Add, update, and remove cart items.
- Retrieve the current cart.
- Validate product availability and current prices.
- Calculate subtotal, discounts, shipping, and grand total.
- Apply and remove coupons.
- Validate delivery address and shipping options.
- Create orders without trusting client-submitted totals.
- Prevent duplicate orders from repeated checkout requests.

### 5.5 Orders
- Create and view customer orders.
- View customer order history.
- Administrative order list and details.
- Order status history.
- Order item snapshots.
- Cancellation rules.
- Return and refund eligibility rules.
- Invoice or receipt data where required.

Order status, payment status, and shipment status must be modeled separately.

Possible order statuses include `PENDING`, `CONFIRMED`, `PROCESSING`, `SHIPPED`, `DELIVERED`, `CANCELLED`, and `RETURNED`. Final transitions must be agreed upon before implementation.

### 5.6 Payments
- Cash on Delivery as the initial payment method.
- Payment records and status tracking.
- Transaction references.
- Payment history.
- Refund records.
- Duplicate payment prevention.
- Extensible integration interfaces for future payment gateways.

Online payments must be verified through the payment provider's trusted verification mechanism.

### 5.7 Shipping
- Shipping methods and charges.
- Delivery zones or areas.
- Shipment creation.
- Tracking numbers.
- Shipment status history.
- Courier integration interfaces.
- Delivery status updates.

### 5.8 Coupons and Discounts
- Fixed-amount and percentage discounts.
- Validity dates.
- Minimum order amount.
- Maximum discount limits.
- Usage limits.
- Per-customer limits.
- Coupon activation and deactivation.
- Transaction-safe coupon usage recording.

### 5.9 Reviews and Notifications
- Product reviews and ratings.
- Purchase eligibility validation.
- Review moderation where required.
- Order and delivery notifications.
- Notification history.
- Extensible email and SMS provider interfaces.

### 5.10 Reports and Settings
- Sales reports.
- Order reports.
- Inventory and low-stock reports.
- Customer reports.
- Payment and refund reports.
- General store settings.
- Audit logs for important administrative actions.

## 6. Data Model Requirements

The final database model must be designed through an interview before coding.

Potential entities include:

- User
- Role
- Permission
- UserAddress
- Category
- Brand
- Product
- ProductImage
- ProductAttribute
- ProductAttributeValue
- ProductVariant
- Inventory
- StockMovement
- Cart
- CartItem
- Order
- OrderItem
- OrderAddress
- OrderStatusHistory
- Payment
- Refund
- Shipment
- Coupon
- CouponUsage
- Review
- Notification
- Setting
- AuditLog

This is an initial candidate list, not an approved final schema. Add, remove, merge, or separate entities based on the requirements interview.

For each entity, determine:
- Purpose and ownership.
- Fields and data types.
- Primary and foreign keys.
- Relationships and cardinality.
- Unique constraints and indexes.
- Required versus optional fields.
- Deletion and archival rules.
- Status fields and valid transitions.
- Audit and historical snapshot requirements.

Use appropriate decimal types for monetary values. Preserve historical order prices, product descriptions, SKUs, and delivery addresses as needed so that later changes do not rewrite order history.

## 7. API Requirements

Use versioned REST endpoints under `/api/v1`.

Public/customer API groups may include:
- `/api/v1/auth`
- `/api/v1/products`
- `/api/v1/categories`
- `/api/v1/brands`
- `/api/v1/cart`
- `/api/v1/checkout`
- `/api/v1/orders`
- `/api/v1/addresses`
- `/api/v1/coupons`
- `/api/v1/reviews`

Administrative API groups may include:
- `/api/v1/admin/products`
- `/api/v1/admin/categories`
- `/api/v1/admin/brands`
- `/api/v1/admin/inventory`
- `/api/v1/admin/orders`
- `/api/v1/admin/payments`
- `/api/v1/admin/refunds`
- `/api/v1/admin/shipments`
- `/api/v1/admin/customers`
- `/api/v1/admin/reports`
- `/api/v1/admin/settings`

Finalize API contracts, validation, permissions, pagination, and error responses per feature.

## 8. Non-Functional Requirements

### Security
- Hash passwords securely.
- Validate and sanitize inputs.
- Enforce authorization on the server.
- Protect sensitive authentication endpoints with rate limiting.
- Keep credentials and secrets in environment variables.
- Do not expose sensitive data in API responses or logs.
- Validate file uploads and restrict allowed types and sizes.

### Data Integrity
- Use database transactions for related writes.
- Prevent invalid status transitions.
- Prevent duplicate checkout and payment processing.
- Protect inventory against concurrent updates.
- Apply appropriate database constraints and indexes.
- Preserve financial and order history.

### Performance
- Paginate large lists.
- Optimize database queries and indexes.
- Avoid N+1 query patterns.
- Add caching or background jobs only when justified by actual requirements.

### Maintainability
- Use clear NestJS modules, controllers, services, DTOs, guards, and shared utilities.
- Keep business logic out of controllers.
- Maintain Swagger documentation.
- Provide unit and integration tests.
- Keep the architecture modular without introducing unnecessary infrastructure.

## 9. Development Workflow

Follow this process for each feature:

1. Inspect the current project and dependencies.
2. Review this PRD against the existing implementation.
3. Use GRILL-ME to clarify requirements through an interview.
4. Use OpenSpec Explore to understand the existing code and design.
5. Use OpenSpec Propose to document the approved change.
6. Agree on the data model before implementing database changes.
7. Save the agreed model to `docs/data-model.md`.
8. Create an implementation plan.
9. Use the available OpenSpec Apply workflow to implement the approved change.
10. Review code, security, and database integrity.
11. Run relevant tests, linting, and build checks.
12. Fix issues and rerun affected checks.
13. Archive the completed OpenSpec change after verification.

Never implement the entire project in a single operation. Do not write data-model implementation code before the complete model is agreed upon.

## 10. Initial Development Phases

1. Repository inspection and backend foundation.
2. Authentication, users, and permissions.
3. Product catalog and product variants.
4. Inventory and stock movements.
5. Cart, addresses, and checkout.
6. Orders and order lifecycle.
7. COD payments and refund foundations.
8. Shipping and tracking.
9. Coupons, reviews, and notifications.
10. Reports, settings, audit logs, security review, and release preparation.

Reorder these phases if repository findings or dependencies justify a different sequence.

## 11. Acceptance Criteria

The backend is considered ready for release when:

- Required APIs have documented contracts.
- Authentication and permissions are enforced server-side.
- Database migrations run successfully.
- Core business operations preserve data integrity.
- Inventory and checkout handle concurrency safely.
- Order and payment statuses follow defined rules.
- Critical workflows have automated tests.
- Relevant lint, test, and build checks pass.
- Configuration and setup instructions are documented.
- No unverified tests are reported as passing.

## 12. First Action

Do not write implementation code immediately.

First inspect the repository, review the installed packages and dependencies, and compare the existing project with this PRD. Report the current architecture, missing or incompatible dependencies, and relevant implementation status.

Then begin a GRILL-ME interview, asking one question at a time and recommending a practical default for each decision.

The data model must be fully discussed and agreed upon before implementation begins.