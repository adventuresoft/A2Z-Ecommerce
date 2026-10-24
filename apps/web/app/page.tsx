"use client";

import React from "react";
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

export default function HomePage() {
  const { addToCart, toggleWishlist, wishlistIds } = useStore();

  return (
    <StorefrontShell>
      {/* 1. Interactive Hero Carousel with GSAP Parallax & Inline Trust */}
      <HeroSlider />

      {/* 2. Circular Category Strip */}
      <CategoryPills />

      {/* 3. Flash Sale Section with Live Countdown & Unified Cards */}
      <FlashSaleSection
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

      {/* 6. Tabbed Featured Products Grid with Layout Animation */}
      <FeaturedSection
        onAddToCart={addToCart}
        onToggleWishlist={toggleWishlist}
        wishlistIds={wishlistIds}
      />

      {/* 7. Trending Showcase: Best Sellers & Top Viewed Products */}
      <BestSellersTopViewSection
        onAddToCart={addToCart}
        onToggleWishlist={toggleWishlist}
        wishlistIds={wishlistIds}
      />

      {/* 8. New Arrivals Shelf with Motion Scroll Reveal */}
      <NewArrivalsSection
        onAddToCart={addToCart}
        onToggleWishlist={toggleWishlist}
        wishlistIds={wishlistIds}
      />

      {/* 9. Official Brand Partners */}
      <BrandStrip />

      {/* 10. Storefront Value Propositions */}
      <TrustStrip />

      {/* 11. AZ Insider Club Newsletter */}
      <NewsletterBanner />
    </StorefrontShell>
  );
}
