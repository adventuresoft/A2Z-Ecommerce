"use client";

import React, { useState, useEffect } from "react";
import { StorefrontShell } from "../components/Shell/StorefrontShell";
import { useStore } from "../context/StoreContext";
import { HeroSlider } from "../components/Hero/HeroSlider";
import { CategoryPills } from "../components/Categories/CategoryPills";
import { FlashSaleSection } from "../components/FlashSale/FlashSaleSection";
import { PromoGrid } from "../components/PromoBanners/PromoGrid";
import { SmartphoneDealsSection } from "../components/CategoryDeals/SmartphoneDealsSection";
import { FeaturedSection } from "../components/Featured/FeaturedSection";
import { BestSellersTopViewSection } from "../components/Showcase/BestSellersTopViewSection";
import { NewArrivalsSection } from "../components/NewArrivals/NewArrivalsSection";
import { BrandStrip } from "../components/Brands/BrandStrip";
import { TrustStrip } from "../components/Trust/TrustStrip";
import { NewsletterBanner } from "../components/Newsletter/NewsletterBanner";
import { apiClient } from "../lib/api-client";
import { CuratedProductsResponse, PublicSettingsResponse } from "../lib/curated";
import { BrowseCatalogCategory } from "../lib/categories";

export default function HomePage() {
  const { addToCart, toggleWishlist, wishlistIds } = useStore();
  const [curatedData, setCuratedData] = useState<CuratedProductsResponse | null>(null);
  const [publicSettings, setPublicSettings] = useState<PublicSettingsResponse | null>(null);
  const [brands, setBrands] = useState<any[] | null>(null);
  const [categories, setCategories] = useState<BrowseCatalogCategory[] | null>(null);

  useEffect(() => {
    let isMounted = true;

    async function loadHomepageMerchandising() {
      try {
        const [curatedRes, settingsRes, brandsRes, categoriesRes] = await Promise.allSettled([
          apiClient.get<CuratedProductsResponse>("/products/curated", { skipAuth: true }),
          apiClient.get<PublicSettingsResponse>("/settings/public", { skipAuth: true }),
          apiClient.get<any[]>("/brands/public", { skipAuth: true }),
          apiClient.get<BrowseCatalogCategory[]>("/categories/browse-catalog", { skipAuth: true }),
        ]);

        if (!isMounted) return;

        if (curatedRes.status === "fulfilled" && curatedRes.value) {
          setCuratedData(curatedRes.value);
        }
        if (settingsRes.status === "fulfilled" && settingsRes.value) {
          setPublicSettings(settingsRes.value);
        }
        if (brandsRes.status === "fulfilled" && Array.isArray(brandsRes.value)) {
          setBrands(brandsRes.value);
        }
        if (categoriesRes.status === "fulfilled" && Array.isArray(categoriesRes.value)) {
          setCategories(categoriesRes.value);
        }
      } catch (err) {
        console.warn("Could not load dynamic homepage merchandising, using fallbacks:", err);
      }
    }

    loadHomepageMerchandising();
    return () => {
      isMounted = false;
    };
  }, []);

  return (
    <StorefrontShell>
      {/* 1. Interactive Hero Carousel with Dynamic Settings / Banners */}
      <HeroSlider banners={publicSettings?.heroBanners} />

      {/* 2. Circular Category Strip */}
      <CategoryPills categories={categories || undefined} />

      {/* 3. Flash Sale Section with Live Deals & Countdown (auto-hides when empty) */}
      <FlashSaleSection
        products={curatedData ? curatedData.flashDeals : undefined}
        onAddToCart={addToCart}
        onToggleWishlist={toggleWishlist}
        wishlistIds={wishlistIds}
      />

      {/* 4. Promotional 3-Card Banner Grid with Motion Scale */}
      <PromoGrid />

      {/* 5. Category Deals: Best Deals on Official Smartphones */}
      <SmartphoneDealsSection
        onAddToCart={addToCart}
        onToggleWishlist={toggleWishlist}
        wishlistIds={wishlistIds}
      />

      {/* 6. Tabbed Featured Products Grid with Layout Animation (auto-hides when empty) */}
      <FeaturedSection
        products={curatedData ? curatedData.featured : undefined}
        onAddToCart={addToCart}
        onToggleWishlist={toggleWishlist}
        wishlistIds={wishlistIds}
      />

      {/* 7. Trending Showcase: Best Sellers & Top Viewed Products (auto-hides when empty) */}
      <BestSellersTopViewSection
        bestSellers={curatedData ? curatedData.bestSellers : undefined}
        onAddToCart={addToCart}
        onToggleWishlist={toggleWishlist}
        wishlistIds={wishlistIds}
      />

      {/* 8. New Arrivals Shelf with Motion Scroll Reveal (auto-hides when empty) */}
      <NewArrivalsSection
        products={curatedData ? curatedData.newArrivals : undefined}
        onAddToCart={addToCart}
        onToggleWishlist={toggleWishlist}
        wishlistIds={wishlistIds}
      />

      {/* 9. Official Brand Partners */}
      <BrandStrip brands={brands ?? undefined} />

      {/* 10. Storefront Value Propositions */}
      <TrustStrip />

      {/* 11. AZ Insider Club Newsletter */}
      <NewsletterBanner />
    </StorefrontShell>
  );
}
