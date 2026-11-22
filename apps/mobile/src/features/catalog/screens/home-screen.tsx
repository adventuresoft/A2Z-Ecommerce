import React, { useCallback, useState } from 'react';
import { Pressable, RefreshControl, ScrollView, StyleSheet, View } from 'react-native';
import { Badge, IconButton, Searchbar, Snackbar, Surface, Text } from 'react-native-paper';
import { Image } from 'expo-image';
import { useRouter } from 'expo-router';
import { useQuery } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import {
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
import { azColors, radius, spacing } from '@/shared/theme';
import { ProductGridSkeleton } from '@/shared/components/skeleton';
import { useAuthStore } from '@/features/auth/auth-store';
import { useCartStore } from '@/features/cart/cart-store';
import { useWishlistStore } from '@/features/wishlist/wishlist-store';
import { ProductCard, type ProductCardModel } from '../components/product-card';
import { QuickVariantSheet } from '../components/quick-variant-sheet';
import type { ResolvableVariant } from '../utils/variant-resolver';

function toCardModel(raw: Record<string, unknown>): ProductCardModel {
  const minPrice = Number(raw.minPrice ?? raw.salePrice ?? raw.regularPrice ?? raw.price ?? 0);
  const regularPrice = Number(raw.regularPrice ?? raw.maxPrice ?? minPrice);
  const images = Array.isArray(raw.images) ? raw.images : [];
  const firstImg = images[0] as Record<string, unknown> | undefined;

  return {
    id: String(raw.id ?? ''),
    slug: String(raw.slug ?? raw.id ?? ''),
    title: String(raw.title ?? ''),
    imageUrl:
      (typeof raw.thumbnailUrl === 'string' && raw.thumbnailUrl) ||
      (typeof firstImg?.imageUrl === 'string' && firstImg.imageUrl) ||
      (typeof raw.imageUrl === 'string' && raw.imageUrl) ||
      null,
    price: minPrice,
    regularPrice: regularPrice > minPrice ? regularPrice : null,
    rating: typeof raw.rating === 'number' ? raw.rating : undefined,
    reviewsCount: typeof raw.reviewsCount === 'number' ? raw.reviewsCount : undefined,
    inStock: raw.inStock !== false,
    defaultVariantId:
      typeof raw.defaultVariantId === 'string' ? raw.defaultVariantId : null,
    variantsCount: typeof raw.variantsCount === 'number' ? raw.variantsCount : undefined,
  };
}

export function HomeScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const addItem = useCartStore((s) => s.addItem);
  const isWishlisted = useWishlistStore((s) => s.isWishlisted);
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
        const variants = ((detail.data as unknown as { variants?: ResolvableVariant[] })?.variants ?? []);
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

  const heroBanners = settingsQ.data?.data?.heroBanners ?? [];
  const categories = (categoriesQ.data?.data ?? []) as unknown as Array<{
    id: string;
    name: string;
    slug: string;
    imageUrl?: string | null;
  }>;
  const curated = curatedQ.data?.data as unknown as
    | {
        flashDeals?: Array<Record<string, unknown>>;
        featured?: Array<Record<string, unknown>>;
        newArrivals?: Array<Record<string, unknown>>;
        bestSellers?: Array<Record<string, unknown>>;
      }
    | undefined;
  const collections = collectionsQ.data?.data ?? [];
  const unreadCount = unreadQ.data?.data?.unreadCount ?? 0;

  const isRefreshing = curatedQ.isRefetching || collectionsQ.isRefetching;
  const onRefresh = () => {
    void Promise.all([
      settingsQ.refetch(),
      categoriesQ.refetch(),
      curatedQ.refetch(),
      collectionsQ.refetch(),
    ]);
  };

  const renderProductRail = (
    title: string,
    items: Array<Record<string, unknown>> | undefined,
    onSeeAll?: () => void,
  ) => {
    if (!items || items.length === 0) return null; // Empty section rule
    return (
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text variant="titleMedium" style={styles.sectionTitle}>
            {title}
          </Text>
          {onSeeAll ? (
            <Pressable onPress={onSeeAll} hitSlop={8}>
              <Text style={styles.seeAll}>{t('home.seeAll')}</Text>
            </Pressable>
          ) : null}
        </View>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.rail}>
          {items.map((raw) => {
            const card = toCardModel(raw);
            return (
              <View key={card.id} style={styles.railCardWrap}>
                <ProductCard
                  product={card}
                  isWishlisted={isWishlisted(card.id)}
                  onPress={(slug) => router.push(`/product/${slug}` as never)}
                  onToggleWishlist={(p) => void toggleWishlist(p.id)}
                  onQuickAdd={(p) => void handleQuickAdd(p)}
                />
              </View>
            );
          })}
        </ScrollView>
      </View>
    );
  };

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
        {heroBanners.length > 0 ? (
          <ScrollView
            horizontal
            pagingEnabled
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.bannerRail}
          >
            {heroBanners.map((banner, idx) => {
              const uri = resolveMediaUrl(banner.imageUrl, env.API_ORIGIN, 'medium');
              return (
                <Pressable
                  key={banner.id || idx}
                  style={styles.bannerCard}
                  onPress={() => {
                    if (banner.linkUrl?.startsWith('/')) {
                      router.push(banner.linkUrl as never);
                    }
                  }}
                >
                  {uri ? (
                    <Image source={{ uri }} contentFit="cover" style={styles.bannerImage} />
                  ) : null}
                  <View style={styles.bannerOverlay}>
                    {banner.badgeText ? (
                      <Text style={styles.bannerBadge}>{banner.badgeText}</Text>
                    ) : null}
                    <Text variant="titleLarge" style={styles.bannerTitle} numberOfLines={2}>
                      {banner.title}
                    </Text>
                    {banner.subtitle ? (
                      <Text style={styles.bannerSubtitle} numberOfLines={1}>
                        {banner.subtitle}
                      </Text>
                    ) : null}
                  </View>
                </Pressable>
              );
            })}
          </ScrollView>
        ) : null}

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
                    onPress={() => router.push(`/category/${cat.slug}` as never)}
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

        {curatedQ.isLoading ? (
          <ProductGridSkeleton count={4} />
        ) : (
          <>
            {renderProductRail(t('home.flashDeals'), curated?.flashDeals, () =>
              router.push('/search?hasDiscount=true' as never),
            )}
            {collections.map((col) =>
              renderProductRail(
                col.name,
                col.products as unknown as Array<Record<string, unknown>>,
                () => router.push(`/collection/${col.slug}` as never),
              ),
            )}
            {renderProductRail(t('home.featured'), curated?.featured)}
            {renderProductRail(t('home.newArrivals'), curated?.newArrivals)}
            {renderProductRail(t('home.bestSellers'), curated?.bestSellers)}
          </>
        )}
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
  bannerRail: { padding: spacing.md, gap: spacing.sm },
  bannerCard: {
    width: 320,
    height: 156,
    borderRadius: radius.lg,
    overflow: 'hidden',
    backgroundColor: azColors.navy,
  },
  bannerImage: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 },
  bannerOverlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.55)',
    padding: spacing.md,
    justifyContent: 'flex-end',
  },
  bannerBadge: {
    alignSelf: 'flex-start',
    backgroundColor: azColors.accent,
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '700',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
    marginBottom: 6,
  },
  bannerTitle: { color: '#FFFFFF', fontWeight: '700' },
  bannerSubtitle: { color: '#E2E8F0', fontSize: 12, marginTop: 2 },
  section: { marginTop: spacing.md },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.md,
    marginBottom: spacing.xs,
  },
  sectionTitle: {
    color: azColors.navy,
    fontWeight: '700',
    paddingHorizontal: spacing.md,
    marginBottom: spacing.xs,
  },
  seeAll: { color: azColors.primary, fontWeight: '600', fontSize: 13 },
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
  rail: { paddingHorizontal: spacing.md, gap: spacing.sm },
  railCardWrap: { width: 168 },
});
