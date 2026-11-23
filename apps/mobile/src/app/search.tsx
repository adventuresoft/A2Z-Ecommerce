import React from 'react';
import { useLocalSearchParams } from 'expo-router';
import { SearchScreen } from '@/features/search/screens/search-screen';
import { CatalogListingScreen } from '@/features/catalog/screens/catalog-listing-screen';

export default function SearchRoute() {
  const { q, brand, brandName, hasDiscount, browseAll } = useLocalSearchParams<{
    q?: string;
    brand?: string;
    brandName?: string;
    hasDiscount?: string;
    browseAll?: string;
  }>();

  const brandSlug = typeof brand === 'string' && brand.trim() ? brand.trim() : undefined;
  const discountOnly = hasDiscount === 'true';
  const showAll = browseAll === 'true';

  if (brandSlug || discountOnly || showAll) {
    const title = brandSlug
      ? typeof brandName === 'string' && brandName.trim()
        ? brandName.trim()
        : brandSlug.toUpperCase()
      : discountOnly
        ? 'Special Deals'
        : 'All Products';

    return (
      <CatalogListingScreen
        title={title}
        initialBrandSlug={brandSlug}
        initialHasDiscount={discountOnly}
      />
    );
  }

  return <SearchScreen initialQuery={typeof q === 'string' ? q : ''} />;
}
