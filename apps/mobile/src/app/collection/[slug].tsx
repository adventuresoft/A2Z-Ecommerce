import React from 'react';
import { useLocalSearchParams } from 'expo-router';
import { CatalogListingScreen } from '@/features/catalog/screens/catalog-listing-screen';

export default function CollectionRoute() {
  const { slug, name, hasDiscount } = useLocalSearchParams<{
    slug: string;
    name?: string;
    hasDiscount?: string;
  }>();
  const title = typeof name === 'string' && name.trim() ? name : String(slug ?? 'Collection');
  const slugVal = String(slug ?? '');
  return (
    <CatalogListingScreen
      title={title}
      collectionSlug={slugVal === 'all' ? undefined : slugVal}
      initialHasDiscount={hasDiscount === 'true'}
    />
  );
}
