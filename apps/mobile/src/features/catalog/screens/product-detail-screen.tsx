import React, { useEffect, useMemo, useState } from 'react';
import {
  Dimensions,
  FlatList,
  Pressable,
  ScrollView,
  StyleSheet,
  View,
} from 'react-native';
import {
  Appbar,
  Button,
  Chip,
  Divider,
  IconButton,
  Snackbar,
  Surface,
  Text,
} from 'react-native-paper';
import { Image } from 'expo-image';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import {
  resolveMediaUrl,
  useProductsPublicControllerGetBySlug,
  useShipmentsControllerGetActiveMethods,
} from '@repo/api-client';
import { env } from '@/shared/config/env';
import { STALE_TIMES } from '@/shared/api/query-client';
import { analytics } from '@/shared/analytics';
import { azColors, radius, spacing } from '@/shared/theme';
import { formatBDT } from '@/shared/utils/format-bdt';
import { PriceText } from '@/shared/components/price-text';
import { SkeletonBox } from '@/shared/components/skeleton';
import { EmptyState } from '@/shared/components/empty-state';
import { useCartStore } from '@/features/cart/cart-store';
import { useWishlistStore } from '@/features/wishlist/wishlist-store';
import { ProductCard, type ProductCardModel } from '../components/product-card';
import {
  extractAttributeGroups,
  getEffectivePrice,
  getInitialVariantSelection,
  getStockStatus,
  resolveSelectedVariant,
  type ResolvableVariant,
} from '../utils/variant-resolver';

const SCREEN_WIDTH = Dimensions.get('window').width;

function asString(value: unknown): string | null {
  return typeof value === 'string' && value.trim().length > 0 ? value : null;
}

function asNumber(value: unknown): number | null {
  if (typeof value === 'number' && Number.isFinite(value)) return value;
  if (typeof value === 'string' && value.trim() !== '') {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : null;
  }
  return null;
}

export function ProductDetailScreen({ slug }: { slug: string }) {
  const { t } = useTranslation();
  const router = useRouter();
  const addItem = useCartStore((s) => s.addItem);
  const isWishlisted = useWishlistStore((s) => s.isWishlisted);
  const toggleWishlist = useWishlistStore((s) => s.toggleWishlist);

  const productQuery = useProductsPublicControllerGetBySlug(slug, {
    query: { staleTime: STALE_TIMES.PRODUCT_DETAIL },
  });
  const shippingQuery = useShipmentsControllerGetActiveMethods(undefined, {
    query: { staleTime: STALE_TIMES.TAXONOMY_AND_SETTINGS },
  });

  const product = productQuery.data?.status === 200 ? productQuery.data.data : null;

  const variants: ResolvableVariant[] = useMemo(() => {
    if (!product?.variants) return [];
    return product.variants.map((v) => ({
      id: v.id,
      sku: v.sku,
      regularPrice: Number(v.regularPrice ?? 0),
      salePrice: asNumber(v.salePrice),
      imageUrl: asString(v.imageUrl),
      inStock: v.inStock,
      stockQuantity: v.stockQuantity,
      attributes: (v.attributes ?? []).map((a) => ({
        attributeName: a.attributeName,
        attributeType: a.attributeType,
        value: a.value,
        colorCode: asString(a.colorCode),
      })),
    }));
  }, [product?.variants]);

  const [selectedAttrs, setSelectedAttrs] = useState<Record<string, string>>({});
  const [activeImageIndex, setActiveImageIndex] = useState(0);
  const [snackMsg, setSnackMsg] = useState<string | null>(null);
  const [isAdding, setIsAdding] = useState(false);

  useEffect(() => {
    if (variants.length > 0) {
      setSelectedAttrs(getInitialVariantSelection(variants));
    }
  }, [variants]);

  useEffect(() => {
    if (product) {
      analytics.track('product_viewed', {
        productId: product.id,
        slug: product.slug,
        category: product.category?.name,
      });
    }
  }, [product]);

  const activeVariant = useMemo(
    () => resolveSelectedVariant(variants, selectedAttrs),
    [variants, selectedAttrs],
  );

  const attributeGroups = useMemo(
    () => extractAttributeGroups(variants, selectedAttrs),
    [variants, selectedAttrs],
  );

  const galleryUrls = useMemo(() => {
    const urls: string[] = [];
    const variantImg = resolveMediaUrl(activeVariant?.imageUrl ?? null, env.API_URL);
    if (variantImg) urls.push(variantImg);
    for (const img of product?.images ?? []) {
      const resolved = resolveMediaUrl(img.imageUrl, env.API_URL);
      if (resolved && !urls.includes(resolved)) {
        urls.push(resolved);
      }
    }
    return urls;
  }, [activeVariant?.imageUrl, product?.images]);

  if (productQuery.isLoading) {
    return (
      <View style={styles.screen}>
        <Appbar.Header style={styles.header}>
          <Appbar.BackAction onPress={() => router.back()} />
          <Appbar.Content title="" />
        </Appbar.Header>
        <SkeletonBox width={SCREEN_WIDTH} height={SCREEN_WIDTH * 0.9} borderRadius={0} />
        <View style={styles.pad}>
          <SkeletonBox width="80%" height={24} />
          <SkeletonBox width="45%" height={20} style={{ marginTop: 12 }} />
          <SkeletonBox width="100%" height={80} style={{ marginTop: 16 }} />
        </View>
      </View>
    );
  }

  if (!product) {
    return (
      <View style={styles.screen}>
        <Appbar.Header style={styles.header}>
          <Appbar.BackAction onPress={() => router.back()} />
          <Appbar.Content title={t('app.name')} />
        </Appbar.Header>
        <EmptyState
          icon="package-variant-remove"
          title={t('catalog.noProducts')}
          subtitle={t('catalog.noProductsSub')}
          ctaLabel={t('app.retry')}
          onCtaPress={() => void productQuery.refetch()}
        />
      </View>
    );
  }

  const effectivePrice = activeVariant ? getEffectivePrice(activeVariant) : 0;
  const regularPrice = activeVariant?.regularPrice ?? null;
  const stockStatus = getStockStatus(activeVariant);
  const canPurchase = Boolean(activeVariant) && stockStatus !== 'OUT_OF_STOCK';
  const wishlisted = isWishlisted(product.id);
  const variantLabel = activeVariant?.attributes.map((a) => a.value).join(' / ') || null;

  const specEntries: [string, string][] =
    product.specifications && typeof product.specifications === 'object'
      ? Object.entries(product.specifications as Record<string, unknown>)
          .filter(([, val]) => val !== null && val !== undefined && String(val).trim() !== '')
          .map(([k, val]) => [k, String(val)])
      : [];

  const warrantyText = asString(product.warrantyText);
  const shippingMethods = shippingQuery.data?.data ?? [];

  const relatedModels: ProductCardModel[] = (product.relatedProducts ?? []).map((p) => {
    const sale = asNumber(p.salePrice);
    const price = sale && sale < p.regularPrice ? sale : p.minPrice || p.regularPrice;
    return {
      id: p.id,
      slug: p.slug,
      title: p.title,
      imageUrl: p.primaryImage?.imageUrl ?? null,
      price,
      regularPrice: p.regularPrice > price ? p.regularPrice : null,
      rating: p.rating,
      inStock: p.inStock,
    };
  });

  const handleAdd = async (buyNow: boolean) => {
    if (!activeVariant || !canPurchase) return;
    setIsAdding(true);
    try {
      await addItem(
        {
          variantId: activeVariant.id,
          productId: product.id,
          title: product.title,
          slug: product.slug,
          sku: activeVariant.sku,
          variantLabel,
          imageUrl: activeVariant.imageUrl ?? product.images?.[0]?.imageUrl ?? null,
          price: effectivePrice,
          regularPrice,
          quantity: 1,
        },
        buyNow ? 'pdp_buy_now' : 'pdp',
      );
      if (buyNow) {
        router.push('/checkout' as never);
      } else {
        setSnackMsg(t('catalog.addedToCart'));
      }
    } finally {
      setIsAdding(false);
    }
  };

  return (
    <View style={styles.screen} testID="pdp.screen">
      <Appbar.Header style={styles.header}>
        <Appbar.BackAction onPress={() => router.back()} />
        <Appbar.Content title={product.category?.name ?? t('app.name')} />
        <IconButton
          testID="pdp.wishlistButton"
          icon={wishlisted ? 'heart' : 'heart-outline'}
          iconColor={wishlisted ? azColors.danger : azColors.navy}
          onPress={() => void toggleWishlist(product.id)}
        />
        <Appbar.Action icon="cart-outline" onPress={() => router.push('/(tabs)/cart' as never)} />
      </Appbar.Header>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Image Gallery */}
        <View style={styles.galleryContainer}>
          {galleryUrls.length > 0 ? (
            <FlatList
              horizontal
              pagingEnabled
              showsHorizontalScrollIndicator={false}
              data={galleryUrls}
              keyExtractor={(url) => url}
              onMomentumScrollEnd={(e) => {
                const idx = Math.round(e.nativeEvent.contentOffset.x / SCREEN_WIDTH);
                setActiveImageIndex(idx);
              }}
              renderItem={({ item }) => (
                <Image
                  source={{ uri: item }}
                  style={styles.heroImage}
                  contentFit="cover"
                  transition={150}
                />
              )}
            />
          ) : (
            <View style={[styles.heroImage, styles.heroFallback]}>
              <MaterialCommunityIcons name="image-outline" size={48} color={azColors.muted} />
            </View>
          )}
          {galleryUrls.length > 1 ? (
            <View style={styles.dotsRow}>
              {galleryUrls.map((url, idx) => (
                <View
                  key={url}
                  style={[styles.dot, idx === activeImageIndex && styles.dotActive]}
                />
              ))}
            </View>
          ) : null}
        </View>

        {/* Core Product Info */}
        <Surface style={styles.sectionCard} elevation={0}>
          {product.brand?.name ? (
            <Text variant="labelMedium" style={styles.brandLabel}>
              {product.brand.name}
            </Text>
          ) : null}
          <Text variant="titleLarge" style={styles.title}>
            {product.title}
          </Text>

          <View style={styles.ratingStockRow}>
            {product.reviewsCount > 0 ? (
              <View style={styles.ratingPill}>
                <MaterialCommunityIcons name="star" size={16} color="#F59E0B" />
                <Text variant="labelMedium" style={styles.ratingText}>
                  {product.rating.toFixed(1)} ({product.reviewsCount})
                </Text>
              </View>
            ) : null}
            <Chip
              compact
              textStyle={[
                styles.stockChipText,
                stockStatus === 'OUT_OF_STOCK'
                  ? { color: azColors.danger }
                  : stockStatus === 'LOW_STOCK'
                    ? { color: azColors.accentText }
                    : { color: azColors.success },
              ]}
              style={styles.stockChip}
            >
              {stockStatus === 'OUT_OF_STOCK'
                ? t('catalog.outOfStock')
                : stockStatus === 'LOW_STOCK'
                  ? t('catalog.lowStock', { count: activeVariant?.stockQuantity ?? 0 })
                  : t('catalog.inStock')}
            </Chip>
          </View>

          <PriceText price={effectivePrice} regularPrice={regularPrice} size="lg" />
          {activeVariant?.sku ? (
            <Text variant="labelSmall" style={styles.skuText}>
              SKU: {activeVariant.sku}
            </Text>
          ) : null}
        </Surface>

        {/* Variant Selectors */}
        {attributeGroups.length > 0 ? (
          <Surface style={styles.sectionCard} elevation={0}>
            {attributeGroups.map((group) => (
              <View key={group.name} style={styles.attrGroup}>
                <Text variant="labelLarge" style={styles.groupTitle}>
                  {group.name}:{' '}
                  <Text style={styles.selectedVal}>{selectedAttrs[group.name] ?? ''}</Text>
                </Text>
                <View style={styles.optionsWrap}>
                  {group.options.map((opt) => {
                    const isSelected = selectedAttrs[group.name] === opt.value;
                    if (group.type === 'COLOR' && opt.colorCode) {
                      return (
                        <Pressable
                          key={opt.value}
                          testID={`pdp.variant.${group.name}.${opt.value}`}
                          onPress={() =>
                            setSelectedAttrs((prev) => ({ ...prev, [group.name]: opt.value }))
                          }
                          style={[
                            styles.swatchOuter,
                            isSelected && styles.swatchSelected,
                            !opt.available && styles.optionDimmed,
                          ]}
                        >
                          <View style={[styles.swatchDot, { backgroundColor: opt.colorCode }]} />
                          <Text variant="labelSmall" style={styles.swatchLabel}>
                            {opt.value}
                          </Text>
                        </Pressable>
                      );
                    }
                    return (
                      <Chip
                        key={opt.value}
                        testID={`pdp.variant.${group.name}.${opt.value}`}
                        selected={isSelected}
                        disabled={!opt.available}
                        onPress={() =>
                          setSelectedAttrs((prev) => ({ ...prev, [group.name]: opt.value }))
                        }
                      >
                        {opt.value}
                      </Chip>
                    );
                  })}
                </View>
              </View>
            ))}
          </Surface>
        ) : null}

        {/* Delivery Estimate */}
        {shippingMethods.length > 0 ? (
          <Surface style={styles.sectionCard} elevation={0}>
            <Text variant="titleSmall" style={styles.sectionTitle}>
              {t('catalog.deliveryEstimate')}
            </Text>
            {shippingMethods.slice(0, 3).map((method) => (
              <View key={method.id} style={styles.shippingRow}>
                <MaterialCommunityIcons name="truck-fast-outline" size={20} color={azColors.primary} />
                <View style={styles.shippingMeta}>
                  <Text variant="bodyMedium" style={styles.shippingName}>
                    {method.name}
                  </Text>
                  <Text variant="labelSmall" style={styles.mutedText}>
                    {method.estimatedDays} days
                  </Text>
                </View>
                <Text variant="labelLarge" style={styles.shippingFee}>
                  {formatBDT(method.cost)}
                </Text>
              </View>
            ))}
          </Surface>
        ) : null}

        {/* Description & Warranty */}
        <Surface style={styles.sectionCard} elevation={0}>
          <Text variant="bodyMedium" style={styles.descriptionText}>
            {product.description}
          </Text>
          {warrantyText ? (
            <View style={styles.warrantyBox}>
              <MaterialCommunityIcons name="shield-check-outline" size={20} color={azColors.success} />
              <View style={styles.shippingMeta}>
                <Text variant="labelLarge" style={styles.warrantyTitle}>
                  {t('catalog.warranty')}
                </Text>
                <Text variant="bodySmall" style={styles.mutedText}>
                  {warrantyText}
                </Text>
              </View>
            </View>
          ) : null}
        </Surface>

        {/* Specifications Table */}
        {specEntries.length > 0 ? (
          <Surface style={styles.sectionCard} elevation={0}>
            <Text variant="titleSmall" style={styles.sectionTitle}>
              {t('catalog.specifications')}
            </Text>
            {specEntries.map(([key, val], idx) => (
              <View key={key}>
                <View style={styles.specRow}>
                  <Text variant="bodySmall" style={styles.specKey}>
                    {key}
                  </Text>
                  <Text variant="bodySmall" style={styles.specVal}>
                    {val}
                  </Text>
                </View>
                {idx < specEntries.length - 1 ? <Divider /> : null}
              </View>
            ))}
          </Surface>
        ) : null}

        {/* Reviews */}
        {product.reviews && product.reviews.length > 0 ? (
          <Surface style={styles.sectionCard} elevation={0}>
            <Text variant="titleSmall" style={styles.sectionTitle}>
              {t('catalog.reviews')} ({product.reviewsCount})
            </Text>
            {product.reviews.slice(0, 5).map((rev, idx) => (
              <View key={rev.id}>
                <View style={styles.reviewItem}>
                  <View style={styles.reviewHeader}>
                    <Text variant="labelLarge" style={styles.reviewerName}>
                      {rev.reviewerName}
                    </Text>
                    <Text variant="labelSmall" style={styles.reviewStars}>
                      {'★'.repeat(Math.max(1, Math.min(5, Math.round(rev.rating))))}
                    </Text>
                  </View>
                  {asString(rev.title) ? (
                    <Text variant="labelMedium" style={styles.reviewTitle}>
                      {asString(rev.title)}
                    </Text>
                  ) : null}
                  <Text variant="bodySmall" style={styles.reviewBody}>
                    {rev.comment}
                  </Text>
                </View>
                {idx < Math.min(product.reviews.length, 5) - 1 ? <Divider /> : null}
              </View>
            ))}
          </Surface>
        ) : null}

        {/* Related Products */}
        {relatedModels.length > 0 ? (
          <View style={styles.relatedSection}>
            <Text variant="titleMedium" style={styles.relatedHeading}>
              {t('catalog.relatedProducts')}
            </Text>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.relatedScroll}
            >
              {relatedModels.map((rel) => (
                <View key={rel.id} style={styles.relatedCardWrap}>
                  <ProductCard
                    product={rel}
                    isWishlisted={isWishlisted(rel.id)}
                    onPress={(nextSlug) => router.push(`/product/${nextSlug}` as never)}
                    onToggleWishlist={(p) => void toggleWishlist(p.id)}
                    onQuickAdd={(p) => router.push(`/product/${p.slug}` as never)}
                  />
                </View>
              ))}
            </ScrollView>
          </View>
        ) : null}
      </ScrollView>

      {/* Sticky Bottom CTA Bar */}
      <Surface style={styles.stickyBar} elevation={4}>
        <Button
          testID="pdp.addToCartButton"
          mode="outlined"
          disabled={!canPurchase || isAdding}
          loading={isAdding}
          onPress={() => void handleAdd(false)}
          style={styles.ctaFlex}
          contentStyle={styles.ctaContent}
        >
          {t('catalog.addToCart')}
        </Button>
        <Button
          testID="pdp.buyNowButton"
          mode="contained"
          buttonColor={azColors.accent}
          disabled={!canPurchase || isAdding}
          onPress={() => void handleAdd(true)}
          style={styles.ctaFlex}
          contentStyle={styles.ctaContent}
        >
          {t('catalog.buyNow')}
        </Button>
      </Surface>

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
  header: { backgroundColor: azColors.surface },
  pad: { padding: spacing.md },
  scrollContent: { paddingBottom: 100, gap: spacing.sm },
  galleryContainer: { backgroundColor: azColors.surface },
  heroImage: { width: SCREEN_WIDTH, height: SCREEN_WIDTH * 0.9 },
  heroFallback: { justifyContent: 'center', alignItems: 'center', backgroundColor: azColors.page },
  dotsRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: spacing.xs,
  },
  dot: { width: 7, height: 7, borderRadius: 4, backgroundColor: azColors.border },
  dotActive: { width: 18, backgroundColor: azColors.primary },
  sectionCard: {
    backgroundColor: azColors.surface,
    padding: spacing.md,
    gap: spacing.xs,
  },
  brandLabel: { color: azColors.primary, fontWeight: '700' },
  title: { color: azColors.navy, fontWeight: '700' },
  ratingStockRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, marginVertical: 4 },
  ratingPill: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  ratingText: { color: azColors.navy, fontWeight: '600' },
  stockChip: { backgroundColor: azColors.page },
  stockChipText: { fontSize: 12, fontWeight: '700' },
  skuText: { color: azColors.muted },
  attrGroup: { gap: spacing.xs, marginBottom: spacing.xs },
  groupTitle: { color: azColors.navy, fontWeight: '600' },
  selectedVal: { color: azColors.primary },
  optionsWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.xs },
  swatchOuter: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 8,
    minHeight: 40,
    borderRadius: radius.md,
    borderWidth: 1.5,
    borderColor: azColors.border,
    backgroundColor: azColors.surface,
  },
  swatchSelected: { borderColor: azColors.primary, backgroundColor: '#EFF6FF' },
  optionDimmed: { opacity: 0.45 },
  swatchDot: {
    width: 18,
    height: 18,
    borderRadius: 9,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.2)',
  },
  swatchLabel: { color: azColors.navy },
  sectionTitle: { color: azColors.navy, fontWeight: '700', marginBottom: 4 },
  shippingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingVertical: 4,
  },
  shippingMeta: { flex: 1 },
  shippingName: { color: azColors.navy, fontWeight: '600' },
  shippingFee: { color: azColors.navy, fontWeight: '700' },
  mutedText: { color: azColors.muted },
  descriptionText: { color: azColors.navy, lineHeight: 22 },
  warrantyBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    padding: spacing.sm,
    marginTop: spacing.xs,
    borderRadius: radius.md,
    backgroundColor: '#ECFDF5',
  },
  warrantyTitle: { color: azColors.success, fontWeight: '700' },
  specRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: spacing.xs,
    gap: spacing.md,
  },
  specKey: { color: azColors.muted, flex: 1 },
  specVal: { color: azColors.navy, fontWeight: '600', flex: 1, textAlign: 'right' },
  reviewItem: { paddingVertical: spacing.xs, gap: 4 },
  reviewHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  reviewerName: { color: azColors.navy, fontWeight: '700' },
  reviewStars: { color: '#F59E0B', fontSize: 13 },
  reviewTitle: { color: azColors.navy, fontWeight: '600' },
  reviewBody: { color: azColors.muted, lineHeight: 20 },
  relatedSection: { paddingVertical: spacing.sm, gap: spacing.xs },
  relatedHeading: { paddingHorizontal: spacing.md, fontWeight: '700', color: azColors.navy },
  relatedScroll: { paddingHorizontal: spacing.md, gap: spacing.sm },
  relatedCardWrap: { width: 168 },
  stickyBar: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    flexDirection: 'row',
    gap: spacing.sm,
    padding: spacing.md,
    backgroundColor: azColors.surface,
    borderTopWidth: 1,
    borderTopColor: azColors.border,
  },
  ctaFlex: { flex: 1, borderRadius: radius.md },
  ctaContent: { minHeight: 48 },
});
