import React from 'react';
import { useLocalSearchParams } from 'expo-router';
import { SearchScreen } from '@/features/search/screens/search-screen';

export default function SearchRoute() {
  const { q } = useLocalSearchParams<{ q?: string }>();
  return <SearchScreen initialQuery={typeof q === 'string' ? q : ''} />;
}
