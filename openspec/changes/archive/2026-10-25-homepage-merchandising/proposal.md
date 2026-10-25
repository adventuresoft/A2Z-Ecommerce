# Proposal: Homepage Merchandising & Admin Hero Banner Management

## Why

The storefront homepage currently displays hardcoded mock products and static banners, creating a disconnect between catalog changes in PostgreSQL and what shoppers see. To complete Phase 3 of the storefront-backend integration requirements, we need a live merchandising pipeline: an unauthenticated curated products endpoint delivering dynamic promotional shelves, public hero banner configuration, and an Admin Dashboard visual hero banner management interface.

## What Changes

- **Backend Curated Products Endpoint**: Implement `GET /api/v1/products/curated` returning:
  - `flashDeals`: active variants where `salePrice < regularPrice`, sorted by discount percentage descending
  - `featured`: active products flagged with `isFeatured: true`
  - `newArrivals`: active products sorted by `createdAt DESC`
  - `bestSellers`: top-selling products based on order line frequency with fallback to high-demand active items
- **Backend Public Settings & Hero Banner DTOs**: Expose `GET /api/v1/settings/public` and provide validated JSON schema/DTOs for `storefront.hero_banners` in `SettingsModule`.
- **Admin Hero Banners Visual Manager**: Build a visual banner editor component in `apps/admin/app/system/settings` allowing admins to add, edit, reorder, toggle, and delete hero slides without raw JSON editing.
- **Storefront Homepage Live Integration**: Wire `apps/web/app/page.tsx` to fetch curated collections and hero banners in parallel, dynamically rendering `HeroSlider`, `FlashSaleSection`, `FeaturedTabs`, `NewArrivalsSection`, and `BrandStrip`. Empty shelves hide cleanly without layout disruption.

## Capabilities

### Modified Capabilities
- `product-catalog`: Expose curated merchandising endpoint `GET /api/v1/products/curated` delivering flash deals, featured, new arrivals, and best seller collections.
- `store-settings`: Support validated hero banner array management and public storefront delivery of active hero slides.

## Impact
- **Backend**: New endpoint in `ProductsPublicController` (`GET /api/v1/products/curated`), public settings endpoint in `SettingsModule` (`GET /api/v1/settings/public`), and schema validation for banner items.
- **Admin App**: Enhanced settings UI in `apps/admin/app/system/settings` with a dedicated, interactive Hero Banners manager.
- **Web App**: `apps/web/app/page.tsx`, `HeroSlider`, `FlashSaleSection`, `FeaturedTabs`, `NewArrivalsSection`, and `BrandStrip` converted to consume real backend data.
