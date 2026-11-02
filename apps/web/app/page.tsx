"use client";

import React, { useState, useEffect } from "react";
import { StorefrontShell } from "../components/Shell/StorefrontShell";
import { useStore } from "../context/StoreContext";
import { HeroSlider } from "../components/Hero/HeroSlider";
import { CategoryPills } from "../components/Categories/CategoryPills";
import { HomeCollectionSliderSection } from "../components/Collections/HomeCollectionSliderSection";
import { PromoGrid } from "../components/PromoBanners/PromoGrid";
import { BestSellersTopViewSection } from "../components/Showcase/BestSellersTopViewSection";
import { BrandStrip } from "../components/Brands/BrandStrip";
import { TrustStrip } from "../components/Trust/TrustStrip";
import { NewsletterBanner } from "../components/Newsletter/NewsletterBanner";
import { apiClient } from "../lib/api-client";
import {
  CuratedProductsResponse,
  PublicHomeCollection,
  PublicSettingsResponse,
} from "../lib/curated";
import { BrowseCatalogCategory } from "../lib/categories";

export default function HomePage() {
  const { addToCart, toggleWishlist, wishlistIds } = useStore();
  const [curatedData, setCuratedData] = useState<CuratedProductsResponse | null>(null);
  const [publicSettings, setPublicSettings] = useState<PublicSettingsResponse | null>(null);
  const [brands, setBrands] = useState<any[] | null>(null);
  const [categories, setCategories] = useState<BrowseCatalogCategory[] | null>(null);
  const [homeCollections, setHomeCollections] = useState<PublicHomeCollection[] | null>(null);

  useEffect(() => {
    let isMounted = true;

    async function loadHomepageMerchandising() {
      try {
        const [curatedRes, settingsRes, brandsRes, categoriesRes, homeCollectionsRes] =
          await Promise.allSettled([
            apiClient.get<CuratedProductsResponse>("/products/curated", { skipAuth: true }),
            apiClient.get<PublicSettingsResponse>("/settings/public", { skipAuth: true }),
            apiClient.get<any[]>("/brands/public", { skipAuth: true }),
            apiClient.get<BrowseCatalogCategory[]>("/categories/browse-catalog", { skipAuth: true }),
            apiClient.get<PublicHomeCollection[]>("/collections/home", { skipAuth: true }),
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
        if (
          homeCollectionsRes.status === "fulfilled" &&
          Array.isArray(homeCollectionsRes.value)
        ) {
          setHomeCollections(homeCollectionsRes.value);
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

      {/* 2.5. Dynamic Home Page Collections (Show on Home Page = ON, using default / collection-1 / collection-2 templates) */}
      <HomeCollectionSliderSection
        collections={homeCollections}
        onAddToCart={addToCart}
        onToggleWishlist={toggleWishlist}
        wishlistIds={wishlistIds}
      />

      {/* 3. Promotional 3-Card Banner Grid with Motion Scale */}
      <PromoGrid />

      {/* 4. Trending Showcase: Best Sellers & Top Viewed Products (auto-hides when empty) */}
      <BestSellersTopViewSection
        bestSellers={curatedData ? curatedData.bestSellers : undefined}
        onAddToCart={addToCart}
        onToggleWishlist={toggleWishlist}
        wishlistIds={wishlistIds}
      />

      {/* 5. Official Brand Partners */}
      <BrandStrip brands={brands ?? undefined} />

      {/* 6. Storefront Value Propositions */}
      <TrustStrip />

      {/* 7. AZ Insider Club Newsletter */}
      <NewsletterBanner />
    </StorefrontShell>
  );
}
