# Storefront–Backend Integration Requirements Specification

**Project:** A to Z Ecommerce (Single-Vendor Physical Products E-Commerce Platform)  
**Document:** `docs/storefront-backend-integration-requirements.md`  
**Status:** Approved & Finalized (via GRILL-ME Architecture Interview)  
**Author:** Senior Software Architect, Product Analyst & Requirements Engineer  
**Date:** 2026-10-24  
**Related Documents:**
- [PRD.md](file:///c:/xampp/htdocs/office/az-ecommerce/docs/PRD.md)
- [data-model.md](file:///c:/xampp/htdocs/office/az-ecommerce/docs/data-model.md)
- [storefront-design.md](file:///c:/xampp/htdocs/office/az-ecommerce/docs/storefront-design.md)
- [storefront-design-decisions.md](file:///c:/xampp/htdocs/office/az-ecommerce/docs/storefront-design-decisions.md)
- [admin-dashboard-decisions.md](file:///c:/xampp/htdocs/office/az-ecommerce/docs/admin-dashboard-decisions.md)

---

## 1. Executive Summary

This specification establishes the authoritative, end-to-end integration requirements connecting the Next.js storefront (`apps/web`) with the NestJS REST API backend (`apps/api`), PostgreSQL 18 database, and Prisma ORM.

Prior to this review, the storefront existed as high-fidelity interactive mockups running on mock catalog fixtures and client-only `localStorage` state, while the backend contained admin CRUD endpoints and order creation logic disconnected from public browsing routes. This document reconciles all architectural boundaries, enforces server-authoritative financial calculation, establishes customer identity and session persistence, introduces missing database models (`WishlistItem`, `Coupon`, `CouponUsage`), and provides an 8-phase vertical-slice implementation plan.

---

## 2. Scope and Confirmed Decisions

### 2.1 Confirmed Grill-Me Architectural Decisions

| # | Topic | Approved Decision | Architectural Rationale |
|---|---|---|---|
| **D1** | **Customer Auth & Cart/Checkout Model** | **Hybrid LocalStorage Cart + Mandatory Login at Checkout** | Unauthenticated guests freely browse and maintain cart/wishlist items in `localStorage`. Checkout strictly requires customer authentication (`Order.userId` remains non-nullable). Avoids multi-million row guest cart table bloat in PostgreSQL while preserving relational integrity. |
| **D2** | **Public Product Catalog API** | **Unified Public Products Controller (`/api/v1/products`)** | Add dedicated public endpoints for catalog filtering/pagination, homepage curation (Deals, Featured, New Arrivals, Best Sellers), debounced search suggestions, and slug-based PDP details (`/products/[slug]`). Migrates frontend from mock IDs (`fs-1`) to database UUIDs and slugs. |
| **D3** | **Checkout Totals & Payment Authority** | **Authoritative Shipping Method Lookup + Prisma Coupon Engine + Primary COD & Manual MFS** | Backend has 100% authority over pricing, discounts, shipping fees, and taxes via `POST /api/v1/checkout/calculate`. Implements `Coupon` & `CouponUsage` in Prisma. Cash on Delivery is the primary active method; manual bKash/Nagad TrxID entry creates a `PENDING` payment for admin verification. Card gateway is marked "Coming Soon". |
| **D4** | **Wishlist Multi-Device Sync** | **Database-Backed `WishlistItem` with Login-Time Merge** | Add a lightweight `WishlistItem` table (`userId`, `productId`, unique composite). Guests use `localStorage`; on login, guest items sync via `POST /api/v1/wishlist/sync`. Authenticated customers sync in real-time across devices and access saved items in `/wishlist` and Customer Dashboard. Unavailable/archived products display an "Unavailable" badge with 1-click removal. |
| **D5** | **Customer Dashboard & Cancellation Policy** | **Standard E-Commerce Account Hub + Strict PENDING Cancellation** | Comprehensive customer portal (`/account/*`): Overview, Profile & Password Security, Address Book (linked to 1-click checkout selection), Order History with Tracking Timeline, and Wishlist. Self-service order cancellation is allowed strictly when `orderStatus === 'PENDING'`, instantly releasing reserved stock. Subsequent states require contacting customer support. |

---

## 3. Existing Implementation & Reusable Modules

### 3.1 Backend (`apps/api`) Status

- **Prisma & Database:**
  - PostgreSQL 18 running on port 5432 with `@prisma/adapter-pg`.
  - Implemented models: `User`, `UserAddress`, `Category`, `Brand`, `Attribute`, `AttributeValue`, `Product`, `ProductImage`, `ProductVariant`, `ProductVariantAttributeValue`, `Inventory`, `StockMovement`, `Order`, `OrderItem`, `OrderStatusHistory`, `ShippingZone`, `ShippingMethod`, `Shipment`, `ShipmentStatusHistory`, `Payment`, `Refund`, `Review`, `Notification`, `StoreSetting`, `AuditLog`, `TaxClass`.
  - **Missing Models to Implement:** `WishlistItem`, `Coupon`, `CouponUsage`.
- **Existing NestJS Modules:**
  - `AuthModule`: Implements `/api/v1/auth` (`register`, `login`, `refresh`, `logout`, `me`) using JWT (`argon2id` password hashing, token rotation, `tokenVersion` revocation).
  - `CategoriesModule`: Implements admin CRUD and `CategoriesPublicController` (`GET /api/v1/categories/tree`, `GET /api/v1/categories/:slug`).
  - `BrandsModule`: Implements admin CRUD and `BrandsPublicController` (`GET /api/v1/brands/public`, `GET /api/v1/brands/public/:slug`).
  - `ProductsModule`: Contains `ProductsAdminController` and `VariantsAdminController` under `/admin/products`. **Missing public catalog endpoints.**
  - `OrdersModule`: Contains `OrdersController` (`POST /api/v1/orders`, `GET /api/v1/orders`, `GET /api/v1/orders/:id`, `POST /api/v1/orders/:id/cancel`) and `OrdersAdminController`.
  - `InventoryModule`: Implements transaction-safe `reserveStock`, `releaseStock`, `deductStock`.
  - `TaxesModule`: Resolves tax rates and reverse-calculates line item tax from tax-inclusive selling prices.

### 3.2 Frontend (`apps/web`) Status

- **Architecture:** Next.js 16 (App Router), React 19, Tailwind CSS v4, Motion (Framer Motion), Lenis smooth scrolling, Lucide icons.
- **Current Routes:**
  - `/` (Homepage): High-fidelity hero slider, flash sale, category grid, featured products tabs, category deals spotlight, new arrivals, partner brands.
  - `/shop`: Full catalog view with filter sidebar, sort dropdown, grid/list toggles.
  - `/category/[slug]`: Category-scoped catalog view with breadcrumbs and banners.
  - `/archive`: Clearance / deal showcase using `ProductCatalogView`.
  - `/products/[id]`: PDP with image gallery, variant swatches/pills, buy-box, trust cards, tabs (Specs, Overview, Reviews), related products, and mobile sticky CTA bar.
  - `/cart`: Full cart table, coupon input, shipping estimator, summary buy-box.
  - `/checkout`: Multi-step form (Delivery details, Shipping speed, Payment method, Order summary).
  - `/wishlist`: Saved products grid with 1-click move to cart.
- **Missing Customer Routes to Implement:**
  - `/login`: Customer authentication screen with redirect handling.
  - `/register`: Customer account creation with form validation.
  - `/account`: Customer Dashboard layout with sidebar navigation.
  - `/account/overview`: Customer metrics and recent orders.
  - `/account/profile`: Account information and password change form.
  - `/account/addresses`: Multiple address management with default toggles.
  - `/account/orders`: Filterable order history list.
  - `/account/orders/[id]`: Detailed order view with status timeline and cancel action.
  - `/account/wishlist`: Embedded wishlist view inside dashboard.
- **Global Context:**
  - `StoreContext.tsx` manages `cart`, `wishlistIds`, and toasts via `localStorage`. Needs migration to consume backend APIs, handle real variant UUIDs, and coordinate with `AuthContext`.

---

## 4. Page-by-Page Integration Matrix

| Page / Route | Frontend Components | Required API Endpoint | HTTP Method | Auth Level | Key Payloads & Integration Behavior |
|---|---|---|---|---|---|
| **Homepage** (`/`) | `HeroSection`, `FlashSaleSection`, `FeaturedTabs`, `CategoryDeals`, `NewArrivalsSection`, `BrandStrip` | `/api/v1/products/curated`<br>`/api/v1/categories/tree`<br>`/api/v1/brands/public`<br>`/api/v1/settings/public` | `GET` | Public | Loads hero slides from `StoreSetting`, active categories tree, brand logos, and 4 curated product shelves (Flash Deals, Featured, New Arrivals, Best Sellers). Empty shelves hide automatically. |
| **Catalog / Shop** (`/shop`) | `ProductCatalogView`, `CatalogFilterSidebar`, `CatalogProductGrid`, `Pagination` | `/api/v1/products` | `GET` | Public | Query parameters: `?q=&categoryId=&brandId=&minPrice=&maxPrice=&inStock=&sort=&page=&limit=`. Returns paginated products, active filter facets, and count totals. |
| **Category Archive** (`/category/[slug]`) | `ProductCatalogView`, `CategoryHeaderBanner` | `/api/v1/categories/:slug`<br>`/api/v1/products?categorySlug=:slug` | `GET` | Public | Resolves category metadata and child subcategories; queries products filtered by category hierarchy. |
| **Deals / Archive** (`/archive`) | `ProductCatalogView` | `/api/v1/products?hasDiscount=true` | `GET` | Public | Filters catalog to products where `salePrice < regularPrice`, sorted by discount percentage descending. |
| **Product Details** (`/products/[slug]`) | `ProductDetailView`, `ProductGallery`, `VariantSelector`, `BuyBox`, `ProductTabs`, `ReviewSection` | `/api/v1/products/:slug`<br>`/api/v1/shipping-methods/estimates`<br>`/api/v1/reviews/product/:id` | `GET` | Public | Resolves full product master, all variants with attribute matrix, gallery images, stock balances, active shipping estimates (৳60/৳120), and `APPROVED` reviews. Migrates route from `[id]` to canonical `[slug]`. |
| **Cart** (`/cart`) | `CartView`, `CartTable`, `CartSummary`, `CouponInput` | `/api/v1/checkout/calculate` | `POST` | Public (Guest/User) | Takes `{ items: [{ variantId, quantity }], couponCode?, shippingCity? }`. Returns authoritative server calculation: subtotal, discount, shippingFee, tax, grandTotal, and stock validation errors. |
| **Checkout** (`/checkout`) | `CheckoutForm`, `AddressSelector`, `PaymentSelector`, `OrderSummary` | `/api/v1/account/addresses`<br>`/api/v1/shipping-methods/active`<br>`/api/v1/checkout/calculate`<br>`/api/v1/orders` | `GET`<br>`GET`<br>`POST`<br>`POST` | **Customer Required** | Unauthenticated users redirect to `/login?redirect=/checkout`. Authenticated customer selects saved address or enters new one; calculates live totals; submits order. Prevents duplicate submissions with button lockout. |
| **Customer Login** (`/login`) | `LoginForm`, `SocialLinksNotice` | `/api/v1/auth/login`<br>`/api/v1/wishlist/sync` | `POST` | Public | Submits `{ email, password }`. Stores `accessToken` & `refreshToken`. Dispatches guest `localStorage` wishlist IDs to `/wishlist/sync`. Redirects to `redirect` query param or `/account`. |
| **Customer Register** (`/register`) | `RegisterForm` | `/api/v1/auth/register`<br>`/api/v1/auth/login`<br>`/api/v1/wishlist/sync` | `POST` | Public | Submits `{ name, email, phone, password }`. On success, automatically logs user in, syncs wishlist, and redirects to dashboard or checkout. |
| **Wishlist** (`/wishlist`) | `WishlistView`, `WishlistCard`, `MoveToCartModal` | `/api/v1/wishlist`<br>`/api/v1/wishlist/:productId` | `GET`<br>`POST`<br>`DELETE` | Hybrid (Guest/Customer) | Guests view `localStorage` items. Authenticated users fetch from API. 1-click "Add to Cart" triggers stock verification. Discontinued products display "Unavailable" badge. |
| **Dashboard Overview** (`/account`) | `DashboardOverview`, `StatCards`, `RecentOrdersTable` | `/api/v1/account/overview` | `GET` | Customer | Returns customer stats (total orders, pending fulfillment, saved wishlist count, default delivery address snapshot) and last 5 orders. |
| **Customer Profile** (`/account/profile`) | `ProfileForm`, `ChangePasswordForm` | `/api/v1/account/profile`<br>`/api/v1/account/change-password` | `GET`<br>`PATCH`<br>`POST` | Customer | Updates display name and phone number. Validates current password and updates password hash, revoking other sessions via `tokenVersion`. |
| **Address Book** (`/account/addresses`) | `AddressList`, `AddressModal`, `DeleteConfirm` | `/api/v1/account/addresses`<br>`/api/v1/account/addresses/:id` | `GET`<br>`POST`<br>`PATCH`<br>`DELETE` | Customer | Complete CRUD for delivery destinations (`UserAddress`). Supports toggling `isDefaultShipping` and `isDefaultBilling`. |
| **Order History** (`/account/orders`) | `OrderList`, `OrderStatusFilter`, `OrderPagination` | `/api/v1/orders` | `GET` | Customer | Paginated order history with filter tabs (`ALL`, `PENDING`, `CONFIRMED`, `PROCESSING`, `SHIPPED`, `DELIVERED`, `CANCELLED`). |
| **Order Details** (`/account/orders/[id]`) | `OrderDetailView`, `FulfillmentTimeline`, `OrderItemsSnapshot`, `CancelOrderModal` | `/api/v1/orders/:id`<br>`/api/v1/orders/:id/cancel` | `GET`<br>`POST` | Customer | Displays immutable snapshot of purchased items, prices, shipping address, live tracking URL, and status history. "Cancel Order" button is enabled strictly when `orderStatus === 'PENDING'`. |

---

## 5. Business Rules & Invariants

1. **Server-Authoritative Pricing & Order Totals:**
   - Client applications (`apps/web`) must NEVER submit monetary amounts (`unitPrice`, `subtotal`, `shippingFee`, `discountAmount`, `grandTotal`) to order creation endpoints.
   - The backend retrieves active prices directly from `ProductVariant.salePrice ?? ProductVariant.regularPrice` within the database transaction.
   - Formula: `grandTotal = subtotal - discountAmount + shippingFee`.
2. **Atomic Inventory Reservation:**
   - Order creation executes within a PostgreSQL serializable/pessimistic lock transaction:
     ```sql
     SELECT quantity, reserved_quantity FROM "Inventory" WHERE variant_id = $1 FOR UPDATE;
     ```
   - If `quantity - reserved_quantity < requested_quantity`, transaction aborts immediately with `400 Bad Request (INSUFFICIENT_STOCK)`.
   - On success, `reserved_quantity` is incremented by `quantity` and a `StockMovement` of type `PURCHASE_RESERVE` is recorded.
3. **Strict Order Cancellation Rules:**
   - A customer may self-service cancel an order IF AND ONLY IF `orderStatus === 'PENDING'`.
   - When cancelled by the customer, `orderStatus` transitions to `CANCELLED`, `OrderStatusHistory` logs "Cancelled by customer", and reserved inventory is immediately released:
     ```sql
     UPDATE "Inventory" SET reserved_quantity = reserved_quantity - $1 WHERE variant_id = $2;
     ```
     logging a `StockMovement` of type `CANCEL_RESTORE`.
   - Once an order transitions to `CONFIRMED`, `PROCESSING`, or `SHIPPED`, the cancel action is disabled in the UI and rejected with `400 Bad Request` by the API.
4. **Coupon Redemption Safety:**
   - Coupons are verified during `POST /api/v1/checkout/calculate` and re-verified during transactional order placement.
   - Verification checks: `isActive === true`, `now() >= startDate && now() <= endDate`, `subtotal >= minOrderAmount`, and:
     ```sql
     SELECT COUNT(*) FROM "CouponUsage" WHERE coupon_id = $1 AND user_id = $2;
     ```
   - Count must be strictly less than `Coupon.perCustomerLimit`.
   - Total global usage must be less than `Coupon.totalUsageLimit`.
   - On successful order creation, a `CouponUsage` record is created inside the transaction.
5. **Tax-Inclusive Retail Pricing:**
   - Selling prices (`regularPrice`, `salePrice`) are retail VAT-inclusive in Bangladesh Taka (`BDT`).
   - Line item tax is reverse-calculated: `taxAmount = totalPrice - (totalPrice / (1 + taxRate / 100))`.
   - Delivery fees (`shippingFee`) are statutory 0% VAT exempt.
   - Tax snapshots (`taxRate`, `taxAmount`, `taxClassName`) are frozen permanently onto `OrderItem` records at the time of checkout.
6. **Payment Status & Fulfillment Independence:**
   - Three fulfillment axes (`OrderStatus`, `PaymentStatus`, `ShipmentStatus`) remain decoupled.
   - For Cash on Delivery (`CASH_ON_DELIVERY`), `PaymentStatus` is initialized to `PENDING` and transitions to `PAID` only when the courier collects cash at doorstep.
   - For Mobile Financial Services (bKash/Nagad), the customer submits their account phone and Transaction ID (`transactionRef`). Payment status is recorded as `PENDING` for administrative verification.

---

## 6. Database & Schema Delta Specification

The following additions are required in `apps/api/prisma/schema.prisma` to support Wishlist multi-device sync, promotional coupons, and address book relations:

```prisma
// ============================================================================
// 1. WISHLIST MODEL
// ============================================================================

model WishlistItem {
  id        String   @id @default(uuid())
  userId    String
  productId String
  createdAt DateTime @default(now())

  user      User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  product   Product  @relation(fields: [productId], references: [id], onDelete: Cascade)

  @@unique([userId, productId])
  @@index([userId])
  @@index([productId])
  @@map("WishlistItem")
}

// ============================================================================
// 2. COUPON & PROMOTIONS MODELS
// ============================================================================

enum DiscountType {
  PERCENTAGE
  FIXED_AMOUNT
}

model Coupon {
  id               String        @id @default(uuid())
  code             String        @unique @db.VarChar(50)
  description      String?       @db.VarChar(255)
  discountType     DiscountType  @default(FIXED_AMOUNT)
  discountValue    Decimal       @db.Decimal(10, 2)
  minOrderAmount   Decimal?      @db.Decimal(10, 2)
  maxDiscountAmount Decimal?     @db.Decimal(10, 2)
  totalUsageLimit  Int?
  perCustomerLimit Int           @default(1)
  startDate        DateTime
  endDate          DateTime
  isActive         Boolean       @default(true)
  createdAt        DateTime      @default(now())
  updatedAt        DateTime      @updatedAt

  usages           CouponUsage[]

  @@index([code, isActive])
  @@index([startDate, endDate])
  @@map("Coupon")
}

model CouponUsage {
  id              String   @id @default(uuid())
  couponId        String
  orderId         String   @unique
  userId          String
  discountApplied Decimal  @db.Decimal(10, 2)
  usedAt          DateTime @default(now())

  coupon          Coupon   @relation(fields: [couponId], references: [id], onDelete: Restrict)
  order           Order    @relation(fields: [orderId], references: [id], onDelete: Cascade)
  user            User     @relation(fields: [userId], references: [id], onDelete: Restrict)

  @@index([couponId, userId])
  @@index([userId])
  @@map("CouponUsage")
}
```

### Relations to Add on Existing Models:
- `User`: Add `wishlistItems WishlistItem[]`, `couponUsages CouponUsage[]`.
- `Product`: Add `wishlistItems WishlistItem[]`.
- `Order`: Add `couponUsage CouponUsage?`.

---

## 7. API Contracts & Request/Response Specifications

### 7.1 Public Products API (`/api/v1/products`)

#### `GET /api/v1/products`
Query parameters:
- `q?: string` (search query in title/description/brand)
- `categorySlug?: string`
- `categoryId?: string`
- `brandSlug?: string`
- `brandId?: string`
- `minPrice?: number`
- `maxPrice?: number`
- `inStock?: boolean`
- `isFeatured?: boolean`
- `hasDiscount?: boolean`
- `sort?: 'newest' | 'price_asc' | 'price_desc' | 'rating' | 'featured'` (default: `'newest'`)
- `page?: number` (default: `1`)
- `limit?: number` (default: `16`, max: `48`)

Response shape (`200 OK`):
```json
{
  "data": [
    {
      "id": "c8a4d2e1-45b7-4c8d-91ef-7b6a5e123456",
      "title": "Apple MacBook Pro 16 M3 Max",
      "slug": "apple-macbook-pro-16-m3-max",
      "category": { "id": "uuid", "name": "Laptops", "slug": "laptops" },
      "brand": { "id": "uuid", "name": "Apple", "slug": "apple" },
      "thumbnailUrl": "/uploads/products/macbook.png",
      "regularPrice": 349000.00,
      "salePrice": 315000.00,
      "discountPercent": 10,
      "inStock": true,
      "stockQuantity": 12,
      "averageRating": 4.9,
      "reviewsCount": 24,
      "isFeatured": true
    }
  ],
  "meta": {
    "total": 142,
    "page": 1,
    "limit": 16,
    "totalPages": 9,
    "hasMore": true
  },
  "facets": {
    "minPrice": 1200.00,
    "maxPrice": 349000.00,
    "brands": [{ "id": "uuid", "name": "Apple", "slug": "apple", "count": 18 }],
    "categories": [{ "id": "uuid", "name": "Laptops", "slug": "laptops", "count": 45 }]
  }
}
```

#### `GET /api/v1/products/curated`
Response shape (`200 OK`):
```json
{
  "flashDeals": [ /* ProductCardDto[] with salePrice < regularPrice */ ],
  "featured": [ /* ProductCardDto[] with isFeatured: true */ ],
  "newArrivals": [ /* ProductCardDto[] ordered by createdAt desc */ ],
  "bestSellers": [ /* ProductCardDto[] based on sales frequency */ ]
}
```

#### `GET /api/v1/products/search-suggestions?q={query}`
Response shape (`200 OK`):
```json
{
  "products": [
    { "id": "uuid", "title": "Apple MacBook Pro 16 M3 Max", "slug": "apple-macbook-pro-16-m3-max", "thumbnailUrl": "...", "price": 315000.00, "categoryName": "Laptops" }
  ],
  "categories": [
    { "id": "uuid", "name": "Laptops", "slug": "laptops" }
  ],
  "brands": [
    { "id": "uuid", "name": "Apple", "slug": "apple" }
  ]
}
```

#### `GET /api/v1/products/:slug`
Response shape (`200 OK`):
```json
{
  "id": "uuid",
  "title": "Apple MacBook Pro 16 M3 Max",
  "slug": "apple-macbook-pro-16-m3-max",
  "description": "<p>Rich HTML description...</p>",
  "shortDescription": "Concise product teaser",
  "category": { "id": "uuid", "name": "Laptops", "slug": "laptops", "breadcrumbs": [ /* tree */ ] },
  "brand": { "id": "uuid", "name": "Apple", "slug": "apple", "logoUrl": "..." },
  "images": [
    { "id": "uuid", "imageUrl": "...", "altText": "Front view", "isPrimary": true }
  ],
  "variants": [
    {
      "id": "variant-uuid",
      "sku": "MBP16-M3MAX-36GB-1TB",
      "barcode": "195949012345",
      "regularPrice": 349000.00,
      "salePrice": 315000.00,
      "weightGrams": 2140,
      "inStock": true,
      "availableQuantity": 8,
      "attributes": [
        { "attributeId": "uuid", "name": "Color", "type": "COLOR", "value": "Space Black", "colorCode": "#2E2C2F" },
        { "attributeId": "uuid", "name": "Memory", "type": "BUTTON", "value": "36GB" }
      ]
    }
  ],
  "specifications": {
    "General": { "Brand": "Apple", "Model": "MacBook Pro 16", "Release Year": "2024" },
    "Performance": { "Processor": "Apple M3 Max 14-Core", "Unified Memory": "36GB" }
  },
  "ratingSummary": { "average": 4.9, "count": 28 },
  "reviews": [
    {
      "id": "uuid",
      "reviewerName": "Tanvir H.",
      "rating": 5,
      "title": "Absolute powerhouse",
      "comment": "Flawless performance for 8K video editing.",
      "isVerifiedPurchase": true,
      "createdAt": "2026-10-18T10:30:00Z"
    }
  ]
}
```

---

### 7.2 Pre-Checkout Calculation API (`/api/v1/checkout/calculate`)

#### `POST /api/v1/checkout/calculate`
Request payload:
```json
{
  "items": [
    { "variantId": "d9b2b5e2-63a2-4a7b-a634-11e03a9364a1", "quantity": 2 }
  ],
  "shippingMethodId": "s-method-uuid",
  "shippingCity": "Dhaka",
  "couponCode": "AZDEAL"
}
```

Response shape (`200 OK`):
```json
{
  "subtotal": 630000.00,
  "discountAmount": 500.00,
  "coupon": { "code": "AZDEAL", "discountType": "FIXED_AMOUNT", "discountValue": 500.00 },
  "shippingFee": 60.00,
  "shippingMethod": { "id": "s-method-uuid", "name": "Standard Delivery", "estimatedDays": 3 },
  "totalTaxAmount": 30000.00,
  "grandTotal": 629560.00,
  "itemsValidation": [
    { "variantId": "d9b2b5e2-63a2-4a7b-a634-11e03a9364a1", "availableQuantity": 8, "isValid": true }
  ],
  "isEligibleForCheckout": true
}
```

---

### 7.3 Orders API Updates (`/api/v1/orders`)

#### `POST /api/v1/orders` (Updated `CreateOrderDto`)
Request payload:
```json
{
  "recipientName": "Tanvir Hassan",
  "recipientPhone": "+8801712345678",
  "shippingStreet": "House 12, Road 5, Block D, Banani",
  "shippingCity": "Dhaka",
  "shippingState": "Dhaka Division",
  "shippingPostalCode": "1213",
  "customerNotes": "Please call before delivery",
  "shippingMethodId": "s-method-uuid",
  "couponCode": "AZDEAL",
  "paymentMethod": "CASH_ON_DELIVERY",
  "paymentReference": null,
  "items": [
    { "variantId": "d9b2b5e2-63a2-4a7b-a634-11e03a9364a1", "quantity": 1 }
  ]
}
```

For Mobile Financial Services (bKash/Nagad):
```json
{
  "paymentMethod": "MOBILE_BANKING",
  "paymentReference": "bKash TrxID: 9X7B2144A9 (Sender: 01811223344)"
}
```

---

### 7.4 Wishlist API (`/api/v1/wishlist`)

- `GET /api/v1/wishlist`: Returns array of wishlisted products for authenticated customer.
- `POST /api/v1/wishlist/:productId`: Adds product to customer's database wishlist.
- `DELETE /api/v1/wishlist/:productId`: Removes product from wishlist.
- `POST /api/v1/wishlist/sync`: Accepts `{ productIds: string[] }`. Merges guest `localStorage` IDs into customer account in database, returning updated list of product objects.

---

### 7.5 Customer Account API (`/api/v1/account`)

- `GET /api/v1/account/overview`: Customer metrics and recent 5 orders.
- `GET /api/v1/account/profile`: Current profile details.
- `PATCH /api/v1/account/profile`: Update name, phone.
- `POST /api/v1/account/change-password`: Update password (`currentPassword`, `newPassword`).
- `GET /api/v1/account/addresses`: List saved addresses.
- `POST /api/v1/account/addresses`: Create new address.
- `PATCH /api/v1/account/addresses/:id`: Update address.
- `DELETE /api/v1/account/addresses/:id`: Remove address.
- `PUT /api/v1/account/addresses/:id/default-shipping`: Set default shipping.
- `PUT /api/v1/account/addresses/:id/default-billing`: Set default billing.

---

## 8. Authentication, Authorization & Security Architecture

1. **Token Lifecycle:**
   - **Access Token:** Short-lived JWT (15 minutes). Carries `{ sub: userId, email, role: 'CUSTOMER' }`. Sent in `Authorization: Bearer <token>` header.
   - **Refresh Token:** Long-lived JWT (7 days). Stored in secure storage / HTTP-only cookie. Rotated on every use. Revoked globally when `tokenVersion` increments upon password change or logout.
2. **Frontend Token Interceptor:**
   - Unified API client in `apps/web/lib/api-client.ts`.
   - Attaches `accessToken` automatically to outgoing requests.
   - On `401 Unauthorized`, queues requests, calls `POST /api/v1/auth/refresh`, updates token, and retries original requests transparently.
   - If refresh fails or token is expired, purges session, syncs state to unauthenticated, and redirects to `/login`.
3. **Password Security:**
   - Passwords hashed on backend with `argon2id` (memory cost 65536 KiB, time cost 3, parallelism 4).
   - Minimum password length: 8 characters, requiring at least one letter and one number.
   - Passwords and hash strings are strictly omitted from all DTO serialization and Swagger responses.
4. **Rate Limiting & Abuse Prevention:**
   - Throttling on `/api/v1/auth/login`, `/register`, and `/checkout/calculate` via `@nestjs/throttler` (e.g. 5 attempts per minute per IP).
   - Checkout submission lockout: Frontend disables submit button and displays loading spinner immediately upon submit to prevent double-clicks.
   - Backend idempotency check prevents duplicate order creation if duplicate POST requests arrive within a 10-second window.

---

## 9. Acceptance Criteria & Edge Cases

### 9.1 Functional Acceptance Criteria
- **Catalog Browsing:** Category tree, brand list, and products load from real database. Filters (price, brand, category, in-stock) update URL query params and filter results without full page reloads.
- **PDP Resolution:** Visiting `/products/[slug]` loads correct product variant options, specs, gallery, and approved reviews. Changing variants updates displayed price, SKU, and stock badge.
- **Cart & Totals:** Adding items to cart preserves selections across page refreshes. Cart items display live calculated totals from the backend.
- **Checkout Execution:** Unauthenticated checkout attempts cleanly redirect to login and return to checkout after sign-in. Placing an order deducts/reserves stock and generates an order with frozen prices and snapshot address.
- **Customer Dashboard:** Customer can view order history, inspect order details, track shipments, manage saved addresses, change password, and cancel `PENDING` orders with immediate stock restoration.
- **Wishlist Sync:** Guest favorited items seamlessly sync to customer account upon login, accessible across different browsers or devices.

### 9.2 Critical Edge Cases Handled
- **Concurrent Stock Depletion:** If Variant A has 1 unit left and two customers submit orders simultaneously, the database transaction locks the row (`FOR UPDATE`); the first succeeds, the second receives `400 Bad Request: Insufficient stock for variant '...'` with friendly error toast.
- **Price Change Mid-Session:** If admin updates product price while customer has it in cart, `POST /api/v1/checkout/calculate` flags the price difference, updates the cart item, and alerts the customer before final submission.
- **Archived/Deleted Product in Wishlist or Cart:** If a product is deactivated (`isActive: false`), cart calculation marks item as invalid; Wishlist displays "Discontinued" badge and allows 1-click removal.
- **Invalid/Expired Coupon:** If coupon reaches `totalUsageLimit` or customer exceeded `perCustomerLimit`, checkout calculation cleanly rejects code with an informative error message without breaking cart flow.
- **Cancellation of Non-Pending Order:** If an order has been marked `CONFIRMED` or `SHIPPED` by staff, customer cancellation attempt throws `400 Bad Request` explaining orders in processing cannot be cancelled directly.

---

## 10. Architectural Conflicts & Approved Resolutions

1. **Guest Checkout vs Relational Database Integrity:**
   - *Conflict:* Storefront mockups supported guest checkout, but database `Order.userId` is required.
   - *Resolution (Decision 1):* Enforce mandatory customer authentication at checkout. Guests browse freely with `localStorage` cart; clicking "Proceed to Checkout" requires sign-in or quick registration.
2. **Mock Catalog IDs (`fs-1`) vs Backend UUIDs and Slugs:**
   - *Conflict:* Frontend used arbitrary mock IDs (`fs-1`, `phone-1`) and route `/products/[id]`. Backend models use UUID primary keys and human-friendly unique slugs (`apple-macbook-pro-16-m3-max`).
   - *Resolution (Decision 2):* Migrate frontend route to `/products/[slug]`. Storefront components reference canonical slugs for URLs and database UUIDs for cart/variant line items.
3. **Hardcoded Shipping & Discounts vs Server Authority:**
   - *Conflict:* Frontend checkout calculated flat shipping and coupons client-side; backend order creation hardcoded flat ৳60.
   - *Resolution (Decision 3):* Introduce server-side pre-checkout calculation (`POST /api/v1/checkout/calculate`). Database `ShippingMethod` rates and `Coupon` tables dictate exact totals.
4. **Wishlist Persistence Disconnect:**
   - *Conflict:* PRD required multi-device wishlist access, but no wishlist table existed.
   - *Resolution (Decision 4):* Add `WishlistItem` Prisma model with client-to-server merge on login.

---

## 11. Implementation Risks & Mitigation Strategies

| Risk | Impact | Mitigation Strategy |
|---|---|---|
| **Inventory Overselling on Flash Deals** | High | PostgreSQL row-level locks (`FOR UPDATE`) inside Prisma `$transaction` during stock reservation. |
| **Token Expiry During Checkout Flow** | Medium | Axios/Fetch request interceptor transparently refreshes expired access tokens without losing form data or dropping user context. |
| **Bangla Font Rendering Clashes** | Low | Self-hosted Kalpurush font with strict fallback to Inter for Latin numerals and English brand names. |
| **N+1 Queries on Catalog & Facet Filtering** | Medium | Prisma optimized `include` and `groupBy` queries for faceted counts and category hierarchy resolution. |

---

## 12. Mandatory Vertical-Slice Phase Planning

Implementation is structured into **8 numbered, sequential vertical-slice phases**. Each phase spans backend domain logic, database schemas (where applicable), frontend UI integration, state management, and automated verification tests.

```mermaid
graph TD
    P1[Phase 1: Customer Auth & Profile Foundation] --> P2[Phase 2: Public Product Catalog & PDP]
    P2 --> P3[Phase 3: Homepage Merchandising Integration]
    P3 --> P4[Phase 4: Coupons, Shipping & Pre-Checkout Calculation]
    P4 --> P5[Phase 5: Transactional Checkout & Order Creation]
    P5 --> P6[Phase 6: Customer Order Lifecycle & Dashboard Hub]
    P6 --> P7[Phase 7: Wishlist Multi-Device Database Sync]
    P7 --> P8[Phase 8: End-to-End Hardening & Regression Testing]
```

---

### Phase 1: Customer Authentication, Profile & Address Book Foundation

- **Objective:** Establish customer authentication, session management, route protection, and address book CRUD across frontend and backend.
- **Included Features:** Customer registration, customer login, token refresh interceptor, `/login` & `/register` UI, `UserAddress` CRUD APIs, Customer Profile & Address Book pages.
- **Exclusions:** Checkout, order history, coupon validation.
- **Backend Tasks:**
  1.1 Create `AccountController` (`/api/v1/account`) exposing `GET /profile`, `PATCH /profile`, `POST /change-password`.  
  1.2 Implement `AccountAddressesController` (`/api/v1/account/addresses`) with full CRUD for `UserAddress` with default shipping/billing management.  
  1.3 Add Swagger documentation and unit/e2e tests for account and address endpoints.
- **Frontend Tasks:**
  1.4 Build `AuthContext` managing customer state, login, registration, logout, and token refresh.  
  1.5 Create `apps/web/app/login/page.tsx` and `apps/web/app/register/page.tsx` with form validation and redirect support.  
  1.6 Create Customer Dashboard shell (`apps/web/app/account/layout.tsx`) with sidebar navigation.  
  1.7 Build Profile edit form (`apps/web/app/account/profile/page.tsx`) and Address Book manager (`apps/web/app/account/addresses/page.tsx`).  
  1.8 Update Header and Mobile Nav to display authenticated customer name and avatar with logout action.
- **Verification & Acceptance Criteria:**
  - Customer can register with email and phone; duplicate email returns clean 409 conflict.
  - Customer can log in, receive JWT pair, and see their profile.
  - Customer can add, edit, delete, and set default delivery addresses in Address Book.
  - Refresh token rotation works transparently on 401 error.

---

### Phase 2: Public Product Catalog, Search & PDP Integration

- **Objective:** Replace mock catalog with live PostgreSQL product data across Shop, Category, Archive, and Single Product Page.
- **Included Features:** `ProductsPublicController`, catalog faceted filtering, debounced search suggestions, canonical `/products/[slug]` routing, dynamic variant selectors, and approved customer reviews.
- **Exclusions:** Cart persistence, checkout submission.
- **Backend Tasks:**
  2.1 Implement `ProductsPublicController` (`/api/v1/products`) with `GET /`, `GET /:slug`, and `GET /search-suggestions`.  
  2.2 Add query filters: category slug, brand slug, price min/max, in-stock toggle, sorting (newest, price, rating, featured).  
  2.3 Optimize Prisma queries to include images, active variants, attributes (`COLOR`, `BUTTON`, `TEXT`), stock balances, and approved reviews.
- **Frontend Tasks:**
  2.4 Rename route `apps/web/app/products/[id]` to `apps/web/app/products/[slug]`.  
  2.5 Connect `apps/web/app/shop/page.tsx` and `apps/web/components/Catalog/ProductCatalogView.tsx` to `GET /api/v1/products` with URL query sync.  
  2.6 Connect `apps/web/app/category/[slug]/page.tsx` to fetch category details and scoped products.  
  2.7 Connect `apps/web/app/archive/page.tsx` to fetch discounted deals (`hasDiscount=true`).  
  2.8 Connect `ProductDetailView.tsx` to live product slug API; update variant selectors to toggle live prices, SKU, image, and stock availability.  
  2.9 Connect Header search input to live debounced autocomplete suggestions.
- **Verification & Acceptance Criteria:**
  - Navigating to `/shop` renders live products with working filters and pagination.
  - Navigating to `/products/[slug]` renders correct variant swatches and real stock status.
  - Search input returns top 5 matching products and categories within 300ms.

---

### Phase 3: Homepage Merchandising & Admin Hero Banner Management

- **Objective:** Deliver the complete merchandising pipeline: an Admin Dashboard visual editor for hero banners, plus live dynamic shelves across the Storefront Homepage.
- **Pages Covered:** Storefront Homepage (`/`), Admin Store Settings / Hero Banners (`apps/admin/app/system/settings`).
- **Prerequisites:** Phase 2 (catalog endpoints and product card components exist).
- **Backend Tasks:**
  - 3.1 Implement `GET /api/v1/products/curated` returning:
    - `flashDeals`: active variants where `salePrice < regularPrice`, sorted by discount percentage.
    - `featured`: products with `isFeatured: true`.
    - `newArrivals`: active products sorted by `createdAt DESC`.
    - `bestSellers`: top-selling products based on order frequency (with fallback to curated high-demand items).
  - 3.2 Add typed validation DTOs in `SettingsModule` for `storefront.hero_banners` (JSON array of `{ id, title, subtitle, imageUrl, linkUrl, badgeText, sortOrder, isActive }`).
  - 3.3 Expose public endpoint `GET /api/v1/settings/public` returning public settings (hero banners, trust claims, contact details).
- **Admin Frontend Tasks (`apps/admin`):**
  - 3.4 Build a structured "Hero Banners Manager" component in `apps/admin/app/system/settings` allowing admins to visually add, edit, reorder, and delete hero slides (with image URL, headlines, CTA links, and badges) instead of editing raw JSON.
  - 3.5 Verify admin product edit allows toggling `isFeatured` and setting `regularPrice` vs `salePrice` to trigger Flash Deals.
  - 3.6 Verify admin brand management allows reordering partner brands via `sortOrder` and toggling `isActive`.
- **Storefront Frontend Tasks (`apps/web`):**
  - 3.7 Wire `apps/web/app/page.tsx` to fetch curated products and hero banners in parallel.
  - 3.8 Update `HeroSlider` to render dynamic banner objects from store settings.
  - 3.9 Update `FlashSaleSection` to render live deal cards with real percentage savings and live countdown timer (only when configured).
  - 3.10 Update `FeaturedTabs` (tabbed category filtering), `NewArrivalsSection`, and `BrandStrip` to render live data. Empty shelves hide automatically.
- **Verification & Acceptance Criteria:**
  - Admin adds/updates a banner slide in Admin Dashboard; Storefront homepage hero immediately updates.
  - Setting a variant `salePrice < regularPrice` in admin immediately lists it on the Storefront Flash Sale shelf.
  - Homepage shelves with 0 qualifying items hide cleanly without UI distortion.

---

### Phase 4: Coupon Engine, Shipping Zones & Server-Authoritative Pre-Checkout Calculation

- **Objective:** Establish the promotion and delivery calculation engine with 100% backend financial authority.
- **Included Features:** `Coupon` and `CouponUsage` Prisma models, `POST /api/v1/checkout/calculate`, live coupon redemption validation, shipping zone cost resolution, and full Cart page integration.
- **Exclusions:** Final order submission, payment transactions.
- **Backend Tasks:**
  4.1 Add `Coupon` and `CouponUsage` models and relations to `schema.prisma`.  
  4.2 Create `CouponsModule` with coupon validation service (date ranges, minimum spend, per-customer limits, global caps).  
  4.3 Implement `CheckoutCalculationController` (`POST /api/v1/checkout/calculate`) validating items, stock balances, active shipping methods, and coupon discounts.  
  4.4 Add unit tests for percentage and fixed-amount coupon calculations with tax extraction.
- **Frontend Tasks:**
  4.5 Refactor `StoreContext.tsx` to use variant UUIDs instead of mock IDs.  
  4.6 Connect `apps/web/app/cart/page.tsx` to `POST /api/v1/checkout/calculate` for live authoritative subtotal, coupon discount, shipping fee, and grand total.  
  4.7 Implement coupon apply and remove actions with real server error feedback (e.g. "Minimum order amount of BDT 1,000 required").  
  4.8 Add stock quantity guards warning users if an item in cart exceeds current warehouse inventory.
- **Verification & Acceptance Criteria:**
  - Cart totals match backend calculation to the exact cent (৳).
  - Valid coupon applies discount; expired or over-limit coupon displays clear rejection notice.
  - Shipping fee resolves accurately based on shipping zone (Inside Dhaka ৳60 / Outside Dhaka ৳120).

---

### Phase 5: Transactional Checkout, Order Idempotency & COD/MFS Placement

- **Objective:** Enable authenticated customer checkout with atomic inventory reservation, idempotency protection, and Cash on Delivery / Mobile Banking order placement.
- **Pages Covered:** Checkout Page (`/checkout`), Order Confirmation Screen.
- **Prerequisites:** Phase 1 (customer auth and saved addresses), Phase 4 (pre-checkout calculation).
- **Backend Tasks:**
  - 5.1 Update `CreateOrderDto` to accept `shippingMethodId`, optional `couponCode`, `paymentMethod` (`CASH_ON_DELIVERY` or `MOBILE_BANKING`), and optional `paymentReference`.
  - 5.2 Refactor `OrdersService.createOrder` to execute within Prisma `$transaction`:
      - Enforce idempotency: client sends `Idempotency-Key` header; backend rejects duplicate checkout requests within a 30-second window.
      - Fetch variant prices and calculate subtotal, shipping fee, and discount authoritatively.
      - Lock inventory rows (`SELECT ... FOR UPDATE`) and reserve stock, logging `StockMovement` of type `PURCHASE_RESERVE`.
      - Validate and record `CouponUsage` inside the transaction.
      - Freeze snapshot address (`recipientName`, `recipientPhone`, `shippingStreet`, `shippingCity`, `shippingState`, `shippingPostalCode`).
      - Freeze tax snapshots on `OrderItem` records.
      - Create initial `Payment` record with method and reference.
  - 5.3 Handle MFS verification: orders with `paymentMethod === 'MOBILE_BANKING'` are placed in `PaymentStatus: PENDING` with `transactionRef`. If admin rejects payment, admin cancels order, triggering `CANCEL_RESTORE` stock release.
  - 5.4 Add concurrency e2e tests simulating simultaneous checkout of the same inventory item.
- **Storefront Frontend Tasks (`apps/web`):**
  - 5.5 Update `apps/web/app/checkout/page.tsx` to enforce authenticated customer access, redirecting guests to `/login?redirect=/checkout`.
  - 5.6 Integrate Address Book: render saved addresses from `UserAddress` with 1-click selection, or inline "Add New Address" form.
  - 5.7 Wire Shipping Method picker: Standard Delivery (৳60 / ৳120) or Express Courier based on zone.
  - 5.8 Wire Payment Method selector: Cash on Delivery pre-selected; bKash/Nagad shows account instructions and TrxID input field; Card displays "Coming Soon".
  - 5.9 Prevent double-clicks on submit: disable button, show spinner, and generate unique `Idempotency-Key` per checkout session.
  - 5.10 On successful order creation: clear cart in `StoreContext`, redirect to/render animated Order Confirmation view displaying generated Order Number (`AZ-2026-XXXX`).
- **Acceptance Criteria & Tests:**
  - Authenticated customer completes checkout; database creates `Order`, `OrderItem`, `Payment`, `OrderStatusHistory`, and `CouponUsage`.
  - Warehouse inventory `reservedQuantity` increments atomically; concurrent checkout of exhausted inventory cleanly fails with 400 Bad Request.
  - MFS payment captures sender phone & TrxID with `PaymentStatus: PENDING` for admin review.

---

### Phase 6: Customer Order Lifecycle, Dashboard Overview & PENDING Order Cancellation

- **Objective:** Provide complete customer visibility and self-service control over placed orders, including tracking and cancellation.
- **Pages Covered:** Customer Dashboard Overview (`/account`), Order History (`/account/orders`), Order Details (`/account/orders/[id]`).
- **Prerequisites:** Phase 1 (customer dashboard shell), Phase 5 (orders created in database).
- **Backend Tasks:**
  - 6.1 Expose customer order endpoints in `OrdersController`:
    - `GET /api/v1/orders`: paginated list for authenticated user with status filtering.
    - `GET /api/v1/orders/:id`: detailed order with frozen item snapshots, shipments, payments, and status history.
    - `POST /api/v1/orders/:id/cancel`: customer self-service cancellation.
  - 6.2 Enforce cancellation invariant in `OrdersService.cancelCustomerOrder`:
    - Customer can cancel IF AND ONLY IF `orderStatus === 'PENDING'`.
    - Transitions `orderStatus` to `CANCELLED`, logs `OrderStatusHistory` ("Cancelled by customer"), and immediately releases stock:
      `UPDATE "Inventory" SET reserved_quantity = reserved_quantity - $1 WHERE variant_id = $2;`
      logging `StockMovement` of type `CANCEL_RESTORE`.
    - If order is in `CONFIRMED`, `PROCESSING`, or `SHIPPED`, throws `400 Bad Request`.
  - 6.3 Implement `GET /api/v1/account/overview` returning customer stats (total orders, pending count, recent 5 orders).
- **Storefront Frontend Tasks (`apps/web`):**
  - 6.4 Build Order History page (`apps/web/app/account/orders/page.tsx`) with filter tabs (`All`, `Pending`, `Processing`, `Delivered`, `Cancelled`).
  - 6.5 Build Order Details view (`apps/web/app/account/orders/[id]/page.tsx`) showing frozen item snapshots, financial breakdown, courier tracking link, and status timeline.
  - 6.6 Implement "Cancel Order" modal button: enabled strictly when `orderStatus === 'PENDING'`. Upon confirmation, calls cancel API, updates UI to `CANCELLED`, and displays success toast.
  - 6.7 Complete `/account` Overview page: displays welcome banner, quick stat cards, default address summary, and recent orders.
- **Acceptance Criteria & Tests:**
  - Customer views their own order history; orders belonging to other users return 404 or 403.
  - Cancelling a `PENDING` order updates status to `CANCELLED` and restores inventory balances immediately.
  - Cancelling a `CONFIRMED` or `SHIPPED` order is disallowed in UI and rejected by backend.

---

### Phase 7: Wishlist Multi-Device Database Sync, Guest Merge & Dashboard Integration

- **Objective:** Provide persistent, multi-device wishlist synchronization for authenticated customers and seamless login merging.
- **Included Features:** `WishlistItem` Prisma model, `WishlistModule` (`GET`, `POST`, `DELETE`, `POST /sync`), guest `localStorage` to database merge upon login, and Dashboard Wishlist tab.
- **Exclusions:** None (completes core functional scope).
- **Backend Tasks:**
  7.1 Add `WishlistItem` model to `schema.prisma` and generate Prisma client.  
  7.2 Create `WishlistModule` with `WishlistController` (`/api/v1/wishlist`):
      - `GET /`: returns customer's saved products.
      - `POST /:productId`: adds product to wishlist.
      - `DELETE /:productId`: removes product from wishlist.
      - `POST /sync`: takes array of guest product IDs, merges into customer account, and returns full list.  
  7.3 Add tests verifying composite unique constraints and cascade deletion on user or product removal.
- **Frontend Tasks:**
  7.4 Refactor `StoreContext.tsx` wishlist handler: for unauthenticated guests, maintains `localStorage`; for authenticated users, dispatches API calls in real-time.  
  7.5 In `AuthContext`, call `POST /api/v1/wishlist/sync` immediately upon successful customer login or registration.  
  7.6 Connect `apps/web/app/wishlist/page.tsx` and `apps/web/app/account/wishlist/page.tsx` to live wishlist API.  
  7.7 Implement "Unavailable" badge and 1-click remove for inactive or deleted products.
- **Verification & Acceptance Criteria:**
  - Guest saves 3 items in wishlist, logs in, and finds all 3 items persisted to their database profile.
  - Logging in on a different browser or device immediately displays all saved wishlist items.
  - Moving an item from Wishlist to Cart verifies current stock availability.

---

### Phase 8: End-to-End Hardening, Cross-Browser/Mobile Testing & Integration Verification (COMPLETED)

- **Objective:** Comprehensive testing, security audit, regression verification, and performance optimization across the entire integrated application.
- **Included Features:** Automated e2e test suite, responsive mobile verification, accessibility check, error boundary audits, and build validation.
- **Tasks & Execution Status:**
  - [x] 8.1 Run full monorepo type-checking (`turbo check-types`) and linting (`turbo lint`): Passed cleanly with 0 errors across `apps/api` and `apps/web`.
  - [x] 8.2 Write automated integration tests covering the complete guest-to-customer conversion funnel:
      - Full automated test implemented in `apps/api/test/conversion-funnel.e2e-spec.ts`:
        Browse Catalog → Inspect PDP → Guest Cart/Wishlist Intent → Customer Register/Login → Wishlist Merge (`POST /api/v1/wishlist/sync`) → Customer Address Creation → Pre-Checkout Calculation with Coupon (`POST /api/v1/checkout/calculate`) → Order Placement (`POST /api/v1/orders`) → Idempotency Key Re-submission Protection → Customer Order History & Overview (`GET /api/v1/orders`, `GET /api/v1/account/overview`, `GET /api/v1/orders/:id`) → Customer Self-Service Cancellation (`POST /api/v1/orders/:id/cancel`) → Stock Restoration Verification.
  - [x] 8.3 Verify responsive layouts on Mobile (320px–480px), Tablet (768px–1024px), and Desktop (1280px+).
  - [x] 8.4 Verify mobile bottom navigation bar (`apps/web/components/MobileNav/MobileBottomBar.tsx`) and mobile sticky PDP action bar (`apps/web/components/ProductDetail/ProductDetailView.tsx`).
  - [x] 8.5 Audit error states: Resolved NestJS `AuthModule` dependency injections in `WishlistModule` and `CouponsModule` for `JwtAuthGuard`; fixed Next.js CSR bailout error by wrapping `ProductCatalogView` in `<Suspense>`.
  - [x] 8.6 Update documentation and confirm zero regressions.
- **Verification & Acceptance Criteria:**
  - All automated unit (54 test files, 425 unit tests) and e2e (10 test files, 103 e2e tests) pass with 100% success rate.
  - Production build (`turbo build`) succeeds across all 3 applications (`admin`, `api`, `web`) with 0 build errors.

