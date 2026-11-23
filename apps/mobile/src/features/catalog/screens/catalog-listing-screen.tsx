import React, { useMemo, useState } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
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
import { useWishlistedIds, useWishlistStore } from '@/features/wishlist/wishlist-store';
import {
  FilterSheet,
  type CatalogFilterState,
  type FacetAttributeItem,
  type FacetBrandItem,
  type FacetCategoryItem,
} from '@/features/search/components/filter-sheet';
import { ProductCard, type ProductCardModel } from '../components/product-card';
import { mapProductSummaryToCard } from '../utils/product-mapper';

interface CatalogListingScreenProps {
  title: string;
  categorySlug?: string;
  collectionSlug?: string;
  initialQuery?: string;
  initialHasDiscount?: boolean;
  initialBrandSlug?: string;
  hideHeader?: boolean;
}

export function CatalogListingScreen({
  title,
  categorySlug,
  collectionSlug,
  initialQuery,
  initialHasDiscount = false,
  initialBrandSlug,
  hideHeader = false,
}: CatalogListingScreenProps) {
  const { t } = useTranslation();
  const router = useRouter();
  const addItem = useCartStore((s) => s.addItem);
  const wishlistedIds = useWishlistedIds();
  const toggleWishlist = useWishlistStore((s) => s.toggleWishlist);

  const [filterVisible, setFilterVisible] = useState(false);
  const [snackMsg, setSnackMsg] = useState<string | null>(null);
  const [filters, setFilters] = useState<CatalogFilterState>({
    sortBy: 'featured',
    inStock: false,
    hasDiscount: initialHasDiscount,
    brandSlugs: initialBrandSlug ? [initialBrandSlug] : [],
    attributeValues: [],
    categorySlug: undefined,
  });

  const activeCategorySlug = categorySlug ?? filters.categorySlug;

  const activeFilterCount =
    (filters.inStock ? 1 : 0) +
    (filters.hasDiscount ? 1 : 0) +
    (filters.minPrice != null ? 1 : 0) +
    (filters.maxPrice != null ? 1 : 0) +
    filters.brandSlugs.length +
    filters.attributeValues.length +
    (!categorySlug && filters.categorySlug ? 1 : 0) +
    (filters.sortBy !== 'featured' ? 1 : 0);

  const query = useInfiniteQuery({
    queryKey: [
      '/api/v1/products',
      { categorySlug: activeCategorySlug, collectionSlug, initialQuery, filters },
    ],
    initialPageParam: 1,
    staleTime: STALE_TIMES.CATALOG_LIST,
    queryFn: ({ pageParam }) =>
      productsPublicControllerGetCatalog({
        page: pageParam,
        limit: 16,
        q: initialQuery,
        categorySlug: activeCategorySlug,
        collectionSlug,
        brandSlug: filters.brandSlugs.length > 0 ? filters.brandSlugs.join(',') : undefined,
        attributeValues:
          filters.attributeValues.length > 0 ? filters.attributeValues.join(',') : undefined,
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
      normalizePage<Record<string, unknown>>(page.data).items.map((raw) =>
        mapProductSummaryToCard(raw),
      ),
    );
  }, [query.data]);

  const facets = useMemo(() => {
    const first = query.data?.pages?.[0]?.data as unknown as
      | {
          facets?: {
            brands?: FacetBrandItem[];
            attributes?: FacetAttributeItem[];
            categories?: FacetCategoryItem[];
          };
        }
      | undefined;
    return {
      brands: first?.facets?.brands ?? [],
      attributes: first?.facets?.attributes ?? [],
      categories: first?.facets?.categories ?? [],
    };
  }, [query.data]);

  const attrValueLabelMap = useMemo(() => {
    const map = new Map<string, string>();
    for (const attr of facets.attributes) {
      for (const val of attr.values ?? []) {
        map.set(val.id, `${attr.name}: ${val.label?.trim() || val.value}`);
      }
    }
    return map;
  }, [facets.attributes]);

  const resetAllFilters = () =>
    setFilters({
      sortBy: 'featured',
      inStock: false,
      hasDiscount: false,
      brandSlugs: [],
      attributeValues: [],
      categorySlug: undefined,
    });

  return (
    <View style={styles.screen} testID="catalog.listingScreen">
      {!hideHeader ? (
        <Appbar.Header style={styles.header}>
          <Appbar.BackAction onPress={() => router.back()} />
          <Appbar.Content title={title} />
          <Appbar.Action icon="magnify" onPress={() => router.push('/search' as never)} />
        </Appbar.Header>
      ) : null}

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.filterBarScroll}
        contentContainerStyle={styles.filterBar}
      >
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

        {filters.brandSlugs.map((slug) => (
          <Chip
            key={`b-${slug}`}
            selected
            onClose={() =>
              setFilters((f) => ({
                ...f,
                brandSlugs: f.brandSlugs.filter((s) => s !== slug),
              }))
            }
          >
            {facets.brands.find((b) => b.slug === slug)?.name ?? slug}
          </Chip>
        ))}

        {filters.attributeValues.map((valId) => (
          <Chip
            key={`a-${valId}`}
            selected
            onClose={() =>
              setFilters((f) => ({
                ...f,
                attributeValues: f.attributeValues.filter((id) => id !== valId),
              }))
            }
          >
            {attrValueLabelMap.get(valId) ?? valId}
          </Chip>
        ))}
      </ScrollView>

      {query.isLoading ? (
        <ProductGridSkeleton count={6} />
      ) : products.length === 0 ? (
        <EmptyState
          icon="magnify-close"
          title={t('catalog.noProducts')}
          subtitle={t('catalog.noProductsSub')}
          ctaLabel={t('app.reset')}
          onCtaPress={resetAllFilters}
        />
      ) : (
        <FlashList
          data={products}
          numColumns={2}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.grid}
          onEndReached={() => {
            if (query.hasNextPage && !query.isFetchingNextPage) {
              void query.fetchNextPage();
            }
          }}
          onEndReachedThreshold={0.4}
          ListFooterComponent={
            query.isFetchingNextPage ? (
              <View style={styles.footerLoader}>
                <ActivityIndicator color={azColors.primary} />
              </View>
            ) : null
          }
          renderItem={({ item }) => (
            <View style={styles.cardCell}>
              <ProductCard
                product={item}
                isWishlisted={wishlistedIds.has(item.id)}
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
        brands={facets.brands}
        attributes={facets.attributes}
        categories={facets.categories}
        hideCategories={Boolean(categorySlug)}
        onDismiss={() => setFilterVisible(false)}
        onApply={(next) => {
          setFilters(next);
          analytics.track('filter_applied', {
            sortBy: next.sortBy,
            inStock: next.inStock,
            hasDiscount: next.hasDiscount,
            brandsCount: next.brandSlugs.length,
            attributesCount: next.attributeValues.length,
          });
        }}
      />

      <Snackbar visible={Boolean(snackMsg)} onDismiss={() => setSnackMsg(null)} duration={2200}>
        {snackMsg}
      </Snackbar>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: azColors.page },
  header: { backgroundColor: azColors.surface },
  filterBarScroll: {
    flexGrow: 0,
    backgroundColor: azColors.surface,
    borderBottomWidth: 1,
    borderBottomColor: azColors.border,
  },
  filterBar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  grid: { padding: spacing.sm },
  cardCell: { flex: 1, padding: spacing.xs },
  footerLoader: { paddingVertical: spacing.md },
});
