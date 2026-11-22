import React from 'react';
import { useLocalSearchParams } from 'expo-router';
import { CatalogListingScreen } from '@/features/catalog/screens/catalog-listing-screen';

export default function CategoryRoute() {
  const { slug, name } = useLocalSearchParams<{ slug: string; name?: string }>();
  const title = typeof name === 'string' && name.trim() ? name : String(slug ?? 'Category');
  return <CatalogListingScreen title={title} categorySlug={String(slug ?? '')} />;
}
