import React, { useMemo, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { ActivityIndicator, Appbar, Chip, Snackbar } from 'react-native-paper';
import { FlashList } from '@shopify/flash-list';
import { useInfiniteQuery } from '@tanstack/react-query';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import {
  normalizePage,
  productsPublicControllerGetCatalog,
} from '@repo/api-client';
import { STALE_TIMES } from '@/shared/api/query-client';
import { analytics } from '@/shared/analytics';
import { azColors, spacing } from '@/shared/theme';
import { EmptyState } from '@/shared/components/empty-state';
import { ProductGridSkeleton } from '@/shared/components/skeleton';
import { useCartStore } from '@/features/cart/cart-store';
import { useWishlistStore } from '@/features/wishlist/wishlist-store';
import {
  FilterSheet,
  type CatalogFilterState,
  type FacetBrandItem,
} from '@/features/search/components/filter-sheet';
import { ProductCard, type ProductCardModel } from '../components/product-card';

interface CatalogListingScreenProps {
  title: string;
  categorySlug?: string;
  collectionSlug?: string;
  initialQuery?: string;
  initialHasDiscount?: boolean;
}

export function CatalogListingScreen({
  title,
  categorySlug,
  collectionSlug,
  initialQuery,
  initialHasDiscount = false,
}: CatalogListingScreenProps) {
  const { t } = useTranslation();
  const router = useRouter();
  const addItem = useCartStore((s) => s.addItem);
  const isWishlisted = useWishlistStore((s) => s.isWishlisted);
  const toggleWishlist = useWishlistStore((s) => s.toggleWishlist);

  const [filterVisible, setFilterVisible] = useState(false);
  const [snackMsg, setSnackMsg] = useState<string | null>(null);
  const [filters, setFilters] = useState<CatalogFilterState>({
    sortBy: 'featured',
    inStock: false,
    hasDiscount: initialHasDiscount,
  });

  const activeFilterCount =
    (filters.inStock ? 1 : 0) +
    (filters.hasDiscount ? 1 : 0) +
    (filters.minPrice != null ? 1 : 0) +
    (filters.maxPrice != null ? 1 : 0) +
    (filters.brandSlug ? 1 : 0) +
    (filters.sortBy !== 'featured' ? 1 : 0);

  const query = useInfiniteQuery({
    queryKey: ['/api/v1/products', { categorySlug, collectionSlug, initialQuery, filters }],
    initialPageParam: 1,
    staleTime: STALE_TIMES.CATALOG_LIST,
    queryFn: ({ pageParam }) =>
      productsPublicControllerGetCatalog({
        page: pageParam,
        limit: 16,
        q: initialQuery,
        categorySlug,
        collectionSlug,
        brandSlug: filters.brandSlug,
        minPrice: filters.minPrice,
        maxPrice: filters.maxPrice,
        inStock: filters.inStock ? true : undefined,
        hasDiscount: filters.hasDiscount ? true : undefined,
        sortBy: filters.sortBy,
      }),
    getNextPageParam: (lastPage) => {
      const normalized = normalizePage(lastPage.data);
      return normalized.hasNextPage ? normalized.page + 1 : undefined;
    },
  });

  const products: ProductCardModel[] = useMemo(() => {
    const pages = query.data?.pages ?? [];
    return pages.flatMap((page) =>
      normalizePage<Record<string, unknown>>(page.data).items.map((raw) => {
        const minPrice = Number(raw.minPrice ?? raw.salePrice ?? raw.regularPrice ?? 0);
        const regularPrice = Number(raw.regularPrice ?? raw.maxPrice ?? minPrice);
        return {
          id: String(raw.id ?? ''),
          slug: String(raw.slug ?? raw.id ?? ''),
          title: String(raw.title ?? ''),
          imageUrl: (raw.thumbnailUrl as string | null) ?? null,
          price: minPrice,
          regularPrice: regularPrice > minPrice ? regularPrice : null,
          rating: typeof raw.rating === 'number' ? raw.rating : undefined,
          inStock: raw.inStock !== false,
          defaultVariantId: (raw.defaultVariantId as string | null) ?? null,
          variantsCount: typeof raw.variantsCount === 'number' ? raw.variantsCount : undefined,
        };
      }),
    );
  }, [query.data]);

  const facetBrands: FacetBrandItem[] = useMemo(() => {
    const first = query.data?.pages?.[0]?.data as unknown as
      | { facets?: { brands?: FacetBrandItem[] } }
      | undefined;
    return first?.facets?.brands ?? [];
  }, [query.data]);

  return (
    <View style={styles.screen} testID="catalog.listingScreen">
      <Appbar.Header style={styles.header}>
        <Appbar.BackAction onPress={() => router.back()} />
        <Appbar.Content title={title} />
        <Appbar.Action icon="magnify" onPress={() => router.push('/search' as never)} />
      </Appbar.Header>

      <View style={styles.filterBar}>
        <Chip
          testID="catalog.openFiltersChip"
          icon="tune"
          selected={activeFilterCount > 0}
          onPress={() => setFilterVisible(true)}
        >
          {activeFilterCount > 0
            ? `${t('catalog.filters')} (${activeFilterCount})`
            : t('catalog.filters')}
        </Chip>
        <Chip
          selected={filters.inStock}
          onPress={() => setFilters((f) => ({ ...f, inStock: !f.inStock }))}
        >
          {t('catalog.inStock')}
        </Chip>
        <Chip
          selected={filters.hasDiscount}
          onPress={() => setFilters((f) => ({ ...f, hasDiscount: !f.hasDiscount }))}
        >
          {t('catalog.onSale')}
        </Chip>
      </View>

      {query.isLoading ? (
        <ProductGridSkeleton count={6} />
      ) : products.length === 0 ? (
        <EmptyState
          icon="magnify-close"
          title={t('catalog.noProducts')}
          subtitle={t('catalog.noProductsSub')}
          ctaLabel={t('app.reset')}
          onCtaPress={() =>
            setFilters({ sortBy: 'featured', inStock: false, hasDiscount: false })
          }
        />
      ) : (
        <FlashList
          data={products}
          numColumns={2}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.gridContent}
          onEndReached={() => {
            if (query.hasNextPage && !query.isFetchingNextPage) {
              void query.fetchNextPage();
            }
          }}
          onEndReachedThreshold={0.5}
          ListFooterComponent={
            query.isFetchingNextPage ? (
              <ActivityIndicator style={styles.footerLoader} color={azColors.primary} />
            ) : null
          }
          renderItem={({ item }) => (
            <View style={styles.cell}>
              <ProductCard
                product={item}
                isWishlisted={isWishlisted(item.id)}
                onPress={(slug) => router.push(`/product/${slug}` as never)}
                onToggleWishlist={(p) => void toggleWishlist(p.id)}
                onQuickAdd={(p) => {
                  if (p.defaultVariantId && (!p.variantsCount || p.variantsCount <= 1)) {
                    void addItem(
                      {
                        variantId: p.defaultVariantId,
                        productId: p.id,
                        title: p.title,
                        slug: p.slug,
                        sku: p.slug,
                        imageUrl: p.imageUrl,
                        price: p.price,
                        regularPrice: p.regularPrice,
                        quantity: 1,
                      },
                      'catalog_grid',
                    ).then(() => setSnackMsg(t('catalog.addedToCart')));
                  } else {
                    router.push(`/product/${p.slug}` as never);
                  }
                }}
              />
            </View>
          )}
        />
      )}

      <FilterSheet
        visible={filterVisible}
        initialState={filters}
        brands={facetBrands}
        onDismiss={() => setFilterVisible(false)}
        onApply={(next) => {
          setFilters(next);
          analytics.track('filter_applied', {
            category: categorySlug ?? null,
            brand: next.brandSlug ?? null,
            sortBy: next.sortBy,
            filterCount: activeFilterCount,
          });
        }}
      />

      <Snackbar visible={Boolean(snackMsg)} onDismiss={() => setSnackMsg(null)} duration={2000}>
        {snackMsg}
      </Snackbar>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: azColors.page },
  header: { backgroundColor: azColors.surface },
  filterBar: {
    flexDirection: 'row',
    gap: spacing.xs,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    backgroundColor: azColors.surface,
    borderBottomWidth: 1,
    borderBottomColor: azColors.border,
  },
  gridContent: { padding: spacing.sm },
  cell: { flex: 1, padding: spacing.xxs },
  footerLoader: { marginVertical: spacing.md },
});
