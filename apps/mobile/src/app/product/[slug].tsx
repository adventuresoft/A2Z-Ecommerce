import React from 'react';
import { useLocalSearchParams } from 'expo-router';
import { ProductDetailScreen } from '@/features/catalog/screens/product-detail-screen';

export default function ProductDetailRoute() {
  const { slug } = useLocalSearchParams<{ slug: string }>();
  return <ProductDetailScreen slug={String(slug ?? '')} />;
}
