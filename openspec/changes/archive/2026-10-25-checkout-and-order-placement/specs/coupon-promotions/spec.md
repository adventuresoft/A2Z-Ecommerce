# Spec Delta: Coupon & Promotions Management

## Purpose

Enables creation, validation, and usage tracking of discount coupons to power promotional campaigns with strict financial limits.

## ADDED Requirements

### Requirement: Promotional Coupon Model and Validation Rules
The system SHALL maintain promotional coupons defined by a unique uppercase code, discount type (percentage or fixed amount), discount value, active status, date validity window, optional minimum order spend, optional maximum discount cap, total global usage limit, and per-customer usage limit.

#### Scenario: Valid fixed-amount coupon within validity period
- **WHEN** a customer applies an active fixed-amount coupon with code "AZDEAL" for an order meeting minimum spend requirements
- **THEN** the system validates that the current time is between the coupon's start and end dates and computes the exact discount amount.

#### Scenario: Rejection of expired coupon
- **WHEN** a customer attempts to apply a coupon whose end date is in the past
- **THEN** the system rejects the coupon with HTTP 400 Bad Request indicating the coupon has expired.

#### Scenario: Rejection when order subtotal is below minimum spend
- **WHEN** a customer applies coupon "AZDEAL" requiring minimum spend of ৳1,000 on a cart with subtotal ৳800
- **THEN** the system rejects the coupon with HTTP 400 Bad Request indicating the minimum order amount has not been met.

### Requirement: Per-Customer and Global Coupon Usage Limits
The system SHALL track coupon redemptions via recorded `CouponUsage` records and enforce both per-customer usage limits and global usage caps before allowing discount application.

#### Scenario: Customer exceeds per-customer coupon limit
- **WHEN** a customer who has already redeemed coupon "AZDEAL" attempts to reuse it for a subsequent order with perCustomerLimit: 1
- **THEN** the system rejects the coupon with HTTP 400 Bad Request indicating the redemption limit per customer has been reached.

#### Scenario: Global coupon usage limit exhausted
- **WHEN** a customer applies a coupon that has reached its configured totalUsageLimit
- **THEN** the system rejects the coupon with HTTP 400 Bad Request indicating the coupon is fully redeemed.

### Requirement: Transactional Coupon Usage Recording
The system SHALL record an immutable `CouponUsage` record within the order creation transaction linking the coupon, the customer, the created order, and the applied discount amount.

#### Scenario: Successful coupon redemption recorded
- **WHEN** an order with an applied coupon is successfully created in the database
- **THEN** a `CouponUsage` record is created inside the database transaction with `couponId`, `orderId`, `userId`, and `discountApplied`.
