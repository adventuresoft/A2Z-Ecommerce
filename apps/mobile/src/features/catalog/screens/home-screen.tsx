import React, { useCallback, useState } from 'react';
import { Pressable, RefreshControl, ScrollView, StyleSheet, View } from 'react-native';
import { Badge, IconButton, Searchbar, Snackbar, Surface, Text } from 'react-native-paper';
import { Image } from 'expo-image';
import { useRouter } from 'expo-router';
import { useQuery } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import {
  brandsPublicControllerFindAll,
  categoriesPublicControllerGetBrowseCatalog,
  collectionsPublicControllerGetHomeCollections,
  notificationsUserControllerGetUnreadCount,
  productsPublicControllerGetBySlug,
  productsPublicControllerGetCurated,
  resolveMediaUrl,
  settingsControllerGetPublicSettingsExplicit,
} from '@repo/api-client';
import { env } from '@/shared/config/env';
import { STALE_TIMES } from '@/shared/api/query-client';
import { azColors, spacing } from '@/shared/theme';
import { ProductGridSkeleton } from '@/shared/components/skeleton';
import { useAuthStore } from '@/features/auth/auth-store';
import { useCartStore } from '@/features/cart/cart-store';
import { useWishlistedIds, useWishlistStore } from '@/features/wishlist/wishlist-store';
import { type ProductCardModel } from '../components/product-card';
import { QuickVariantSheet } from '../components/quick-variant-sheet';
import { HomeHeroSlider } from '../components/home-hero-slider';
import { HomeCollectionSection, type HomeCollectionData } from '../components/home-collection-section';
import { BestSellingSection } from '../components/best-selling-section';
import { AuthorizedBrandsSlider } from '../components/authorized-brands-slider';
import { TrustStripSection } from '../components/trust-strip-section';
import type { ResolvableVariant } from '../utils/variant-resolver';

function resolveMobileBannerRoute(rawLink?: string | null): string | null {
  if (!rawLink || !rawLink.trim()) return null;
  const link = rawLink.trim();
  if (!link.startsWith('/')) return null;

  if (link.startsWith('/products/')) {
    return `/product/${link.slice('/products/'.length)}`;
  }
  if (link.startsWith('/collections/')) {
    return `/collection/${link.slice('/collections/'.length)}`;
  }
  if (link === '/flash-sale') {
    return '/search?hasDiscount=true';
  }
  if (link === '/shop' || link === '/products' || link === '/new-arrivals') {
    return '/search';
  }
  if (link.startsWith('/category/') || link.startsWith('/product/') || link.startsWith('/collection/') || link.startsWith('/search')) {
    return link;
  }
  return null;
}

export function HomeScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const addItem = useCartStore((s) => s.addItem);
  const wishlistedIds = useWishlistedIds();
  const toggleWishlist = useWishlistStore((s) => s.toggleWishlist);

  const [snackMsg, setSnackMsg] = useState<string | null>(null);
  const [quickVariantModal, setQuickVariantModal] = useState<{
    visible: boolean;
    product: ProductCardModel | null;
    variants: ResolvableVariant[];
  }>({ visible: false, product: null, variants: [] });

  const settingsQ = useQuery({
    queryKey: ['/api/v1/settings/public'],
    queryFn: () => settingsControllerGetPublicSettingsExplicit(),
    staleTime: STALE_TIMES.TAXONOMY_AND_SETTINGS,
  });

  const categoriesQ = useQuery({
    queryKey: ['/api/v1/categories/browse-catalog'],
    queryFn: () => categoriesPublicControllerGetBrowseCatalog(),
    staleTime: STALE_TIMES.TAXONOMY_AND_SETTINGS,
  });

  const curatedQ = useQuery({
    queryKey: ['/api/v1/products/curated'],
    queryFn: () => productsPublicControllerGetCurated(),
    staleTime: STALE_TIMES.HOME_CURATED,
  });

  const collectionsQ = useQuery({
    queryKey: ['/api/v1/collections/home'],
    queryFn: () => collectionsPublicControllerGetHomeCollections({ limit: 8 }),
    staleTime: STALE_TIMES.HOME_CURATED,
  });

  const homeBrandsQ = useQuery({
    queryKey: ['/api/v1/brands', { showOnHome: true }],
    queryFn: () => brandsPublicControllerFindAll({ showOnHome: true }),
    staleTime: STALE_TIMES.TAXONOMY_AND_SETTINGS,
  });

  const unreadQ = useQuery({
    queryKey: ['/api/v1/notifications/unread-count'],
    queryFn: () => notificationsUserControllerGetUnreadCount(),
    enabled: isAuthenticated,
    staleTime: STALE_TIMES.ORDERS_AND_NOTIFICATIONS,
  });

  const handleQuickAdd = useCallback(
    async (product: ProductCardModel) => {
      try {
        if (product.defaultVariantId && (!product.variantsCount || product.variantsCount <= 1)) {
          await addItem(
            {
              variantId: product.defaultVariantId,
              productId: product.id,
              title: product.title,
              slug: product.slug,
              sku: product.slug,
              imageUrl: product.imageUrl,
              price: product.price,
              regularPrice: product.regularPrice,
              quantity: 1,
            },
            'home_card',
          );
          setSnackMsg(t('catalog.addedToCart'));
          return;
        }
        const detail = await productsPublicControllerGetBySlug(product.slug);
        const variants =
          (detail.data as unknown as { variants?: ResolvableVariant[] })?.variants ?? [];
        if (variants.length === 1 && variants[0]) {
          await addItem(
            {
              variantId: variants[0].id,
              productId: product.id,
              title: product.title,
              slug: product.slug,
              sku: variants[0].sku,
              imageUrl: variants[0].imageUrl || product.imageUrl,
              price: variants[0].salePrice ?? variants[0].regularPrice,
              regularPrice: variants[0].regularPrice,
              quantity: 1,
            },
            'home_card',
          );
          setSnackMsg(t('catalog.addedToCart'));
          return;
        }
        setQuickVariantModal({ visible: true, product, variants });
      } catch {
        router.push(`/product/${product.slug}` as never);
      }
    },
    [addItem, router, t],
  );

  const publicSettings = settingsQ.data?.data as Record<string, unknown> | undefined;
  const heroBanners = settingsQ.data?.data?.heroBanners ?? [];
  const categories = (categoriesQ.data?.data ?? []) as unknown as Array<{
    id: string;
    name: string;
    slug: string;
    imageUrl?: string | null;
  }>;
  const curated = curatedQ.data?.data as unknown as
    | {
        bestSellers?: Array<Record<string, unknown>>;
      }
    | undefined;
  const collections = (collectionsQ.data?.data ?? []) as unknown as HomeCollectionData[];
  const homeBrands = homeBrandsQ.data?.data ?? [];
  const unreadCount = unreadQ.data?.data?.unreadCount ?? 0;

  const isRefreshing =
    curatedQ.isRefetching || collectionsQ.isRefetching || homeBrandsQ.isRefetching;

  const onRefresh = () => {
    void Promise.all([
      settingsQ.refetch(),
      categoriesQ.refetch(),
      curatedQ.refetch(),
      collectionsQ.refetch(),
      homeBrandsQ.refetch(),
    ]);
  };

  const handlePressProduct = useCallback(
    (slug: string) => router.push(`/product/${slug}` as never),
    [router],
  );

  const handleToggleWishlist = useCallback(
    (product: ProductCardModel) => {
      void toggleWishlist(product.id);
    },
    [toggleWishlist],
  );

  return (
    <View style={styles.screen} testID="home.screen">
      <Surface style={styles.topBar} elevation={1}>
        <Pressable
          testID="home.searchTrigger"
          style={styles.searchWrap}
          onPress={() => router.push('/search' as never)}
          accessibilityRole="search"
        >
          <Searchbar
            placeholder={t('home.searchPlaceholder')}
            value=""
            editable={false}
            pointerEvents="none"
            style={styles.searchbar}
            inputStyle={styles.searchInput}
          />
        </Pressable>

        <View style={styles.bellWrap}>
          <IconButton
            testID="home.notificationsButton"
            icon="bell-outline"
            iconColor={azColors.navy}
            onPress={() => router.push('/notifications' as never)}
            accessibilityLabel={t('account.notifications')}
          />
          {unreadCount > 0 ? (
            <Badge style={styles.bellBadge} size={18}>
              {unreadCount > 99 ? '99+' : unreadCount}
            </Badge>
          ) : null}
        </View>
      </Surface>

      <ScrollView
        refreshControl={<RefreshControl refreshing={isRefreshing} onRefresh={onRefresh} />}
        contentContainerStyle={styles.scrollContent}
      >
        {/* 1. Dynamic Obsidian Hero Slider (Shared with Web Admin Settings) */}
        <HomeHeroSlider
          banners={heroBanners}
          onNavigateLink={(rawLink) => {
            const target = resolveMobileBannerRoute(rawLink);
            if (target) {
              router.push(target as never);
            }
          }}
        />

        {/* 2. Circular Category Strip */}
        {categories.length > 0 ? (
          <View style={styles.section}>
            <Text variant="titleMedium" style={styles.sectionTitle}>
              {t('home.shopByCategory')}
            </Text>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.catRail}
            >
              {categories.map((cat) => {
                const uri = resolveMediaUrl(cat.imageUrl, env.API_ORIGIN, 'thumb');
                return (
                  <Pressable
                    key={cat.id}
                    testID={`home.category.${cat.slug}`}
                    style={styles.catItem}
                    onPress={() =>
                      router.push({
                        pathname: `/category/${cat.slug}` as never,
                        params: { name: cat.name },
                      } as never)
                    }
                  >
                    <View style={styles.catCircle}>
                      {uri ? (
                        <Image source={{ uri }} contentFit="cover" style={styles.catImage} />
                      ) : (
                        <Text style={styles.catInitial}>{cat.name.slice(0, 1).toUpperCase()}</Text>
                      )}
                    </View>
                    <Text numberOfLines={2} style={styles.catLabel}>
                      {cat.name}
                    </Text>
                  </Pressable>
                );
              })}
            </ScrollView>
          </View>
        ) : null}

        {/* 3. Dynamic Home Page Collections (Web templates: default / collection-1 / collection-2) */}
        {collectionsQ.isLoading && curatedQ.isLoading ? (
          <ProductGridSkeleton count={4} />
        ) : (
          <>
            {collectionsQ.isError && collections.length === 0 ? (
              <Surface style={styles.errorBox} elevation={0}>
                <Text variant="bodyMedium" style={styles.errorText}>
                  {t('common.errorOccurred', { defaultValue: 'Could not load collections. Check your server connection.' })}
                </Text>
                <Pressable
                  onPress={() => {
                    void collectionsQ.refetch();
                    void curatedQ.refetch();
                  }}
                  style={styles.retryBtn}
                >
                  <Text style={styles.retryText}>
                    {t('common.retry', { defaultValue: 'Retry' })}
                  </Text>
                </Pressable>
              </Surface>
            ) : null}

            {collections.map((col) => (
              <HomeCollectionSection
                key={col.id}
                collection={col}
                wishlistedIds={wishlistedIds}
                seeAllLabel={t('home.seeAll')}
                onSeeAll={() =>
                  router.push({
                    pathname: `/collection/${col.slug}` as never,
                    params: { name: col.name },
                  } as never)
                }
                onPressProduct={handlePressProduct}
                onToggleWishlist={handleToggleWishlist}
                onQuickAdd={(p) => void handleQuickAdd(p)}
              />
            ))}

            {/* 4. Best Selling Hardware (Live Best Sellers from /products/curated) */}
            <BestSellingSection
              items={curated?.bestSellers}
              wishlistedIds={wishlistedIds}
              title={t('home.bestSellingHardware')}
              badgeText={t('home.trendingNow')}
              seeAllLabel={t('home.seeAll')}
              onSeeAll={() => router.push('/search?browseAll=true' as never)}
              onPressProduct={handlePressProduct}
              onToggleWishlist={handleToggleWishlist}
              onQuickAdd={(p) => void handleQuickAdd(p)}
            />
          </>
        )}

        {/* 5. Authorized Distribution — Dynamic Brands Slider (showOnHome=true) */}
        <AuthorizedBrandsSlider
          brands={homeBrands}
          eyebrow={t('home.authorizedDistribution')}
          title={t('home.officialPartnerBrands')}
          warrantyBadge={t('home.directWarranty')}
          onPressBrand={(brand) =>
            router.push({
              pathname: '/search' as never,
              params: { brand: brand.slug, brandName: brand.name },
            } as never)
          }
        />

        {/* 6. Storefront Value Propositions (5 Service Cards, semi-dynamic from Settings) */}
        <TrustStripSection settings={publicSettings} />
      </ScrollView>

      <QuickVariantSheet
        visible={quickVariantModal.visible}
        productTitle={quickVariantModal.product?.title ?? ''}
        variants={quickVariantModal.variants}
        onDismiss={() =>
          setQuickVariantModal({ visible: false, product: null, variants: [] })
        }
        onConfirmAdd={(variant) => {
          const p = quickVariantModal.product;
          if (!p) return;
          void addItem(
            {
              variantId: variant.id,
              productId: p.id,
              title: p.title,
              slug: p.slug,
              sku: variant.sku,
              variantLabel: variant.attributes.map((a) => a.value).join(' / '),
              imageUrl: variant.imageUrl || p.imageUrl,
              price: variant.salePrice ?? variant.regularPrice,
              regularPrice: variant.regularPrice,
              quantity: 1,
            },
            'home_quick_sheet',
          ).then(() => setSnackMsg(t('catalog.addedToCart')));
        }}
      />

      <Snackbar
        visible={Boolean(snackMsg)}
        onDismiss={() => setSnackMsg(null)}
        duration={2500}
        action={{
          label: t('catalog.viewCart'),
          onPress: () => router.push('/(tabs)/cart' as never),
        }}
      >
        {snackMsg}
      </Snackbar>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: azColors.page },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.sm,
    paddingTop: spacing.xl + spacing.sm,
    paddingBottom: spacing.xs,
    backgroundColor: azColors.surface,
    gap: spacing.xxs,
  },
  searchWrap: { flex: 1 },
  searchbar: { backgroundColor: azColors.page, height: 44, elevation: 0 },
  searchInput: { minHeight: 0, fontSize: 13 },
  bellWrap: { position: 'relative' },
  bellBadge: { position: 'absolute', top: 4, right: 4, backgroundColor: azColors.accent },
  scrollContent: { paddingBottom: spacing.xxl },
  section: { marginTop: spacing.md },
  sectionTitle: {
    color: azColors.navy,
    fontWeight: '800',
    paddingHorizontal: spacing.md,
    marginBottom: spacing.sm,
  },
  catRail: { paddingHorizontal: spacing.md, gap: spacing.md },
  catItem: { width: 72, alignItems: 'center' },
  catCircle: {
    width: 58,
    height: 58,
    borderRadius: 29,
    backgroundColor: azColors.primarySoft,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: azColors.border,
  },
  catImage: { width: '100%', height: '100%' },
  catInitial: { fontSize: 20, fontWeight: '700', color: azColors.primary },
  catLabel: {
    fontSize: 11,
    color: azColors.navy,
    textAlign: 'center',
    marginTop: 6,
    lineHeight: 15,
  },
  errorBox: {
    marginHorizontal: spacing.md,
    marginTop: spacing.md,
    padding: spacing.md,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: azColors.border,
    backgroundColor: azColors.surface,
    alignItems: 'center',
    gap: spacing.sm,
  },
  errorText: {
    color: azColors.muted,
    textAlign: 'center',
  },
  retryBtn: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: 8,
    backgroundColor: azColors.primary,
  },
  retryText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 13,
  },
});
