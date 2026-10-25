# Tasks

## 1. Backend Curated Products & Public Settings

- [x] 1.1 Add `CuratedProductsDto` in `apps/api/src/products/dto/public-product.dto.ts` and `HeroBannerItemDto` in `apps/api/src/settings/dto/hero-banner.dto.ts` and verify DTO validation
- [x] 1.2 Implement `getCuratedProducts` in `ProductsService` and expose `GET /api/v1/products/curated` in `ProductsPublicController`, and verify unit tests pass
- [x] 1.3 Update `SettingsService` and `SettingsController` to expose `GET /api/v1/settings/public` and validate `storefront.hero_banners`, and verify settings tests pass

## 2. Admin Visual Hero Banners Manager

- [x] 2.1 Build `HeroBannersManager.tsx` component in `apps/admin/components/settings/HeroBannersManager.tsx` with slide preview, form editor, and reordering
- [x] 2.2 Integrate `HeroBannersManager` into `apps/admin/app/system/settings/page.tsx` under a dedicated Storefront / Hero Banners section and verify saving

## 3. Storefront Homepage Live Merchandising

- [x] 3.1 Update `apps/web/app/page.tsx` to fetch curated products and public store settings in parallel with error fallbacks
- [x] 3.2 Update `HeroSlider.tsx` to render dynamic banner objects from store settings with fallback slides
- [x] 3.3 Update `FlashSaleSection.tsx` to render live deals from `curated.flashDeals` with real percentage discounts, hiding when empty
- [x] 3.4 Update `FeaturedSection.tsx`, `NewArrivalsSection.tsx`, `BestSellersTopViewSection.tsx`, and `BrandStrip.tsx` to render live curated data, hiding empty sections

## 4. Integration Verification

- [x] 4.1 Run `turbo check-types` and `turbo lint` across the monorepo and verify zero TypeScript or lint errors
- [x] 4.2 Verify automated tests and end-to-end homepage merchandising rendering (Banners -> Flash Deals -> Featured -> New Arrivals)
