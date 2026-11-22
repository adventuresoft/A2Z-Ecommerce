import React, { useEffect, useState } from 'react';
import { FlatList, Pressable, StyleSheet, View } from 'react-native';
import { Appbar, Button, IconButton, Snackbar, Surface, Text } from 'react-native-paper';
import { Image } from 'expo-image';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { resolveMediaUrl } from '@repo/api-client';
import { env } from '@/shared/config/env';
import { azColors, radius, spacing } from '@/shared/theme';
import { PriceText } from '@/shared/components/price-text';
import { EmptyState } from '@/shared/components/empty-state';
import { useAuthStore } from '@/features/auth/auth-store';
import { useCartStore } from '@/features/cart/cart-store';
import { useWishlistStore } from '../wishlist-store';

export function WishlistScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const items = useWishlistStore((s) => s.items);
  const isLoading = useWishlistStore((s) => s.isLoading);
  const refreshWishlist = useWishlistStore((s) => s.refreshWishlist);
  const toggleWishlist = useWishlistStore((s) => s.toggleWishlist);
  const addItem = useCartStore((s) => s.addItem);

  const [snackMsg, setSnackMsg] = useState<string | null>(null);

  useEffect(() => {
    void refreshWishlist();
  }, [isAuthenticated, refreshWishlist]);

  return (
    <View style={styles.screen} testID="wishlist.screen">
      <Appbar.Header style={styles.header}>
        <Appbar.Content title={t('wishlist.title')} />
      </Appbar.Header>

      {items.length === 0 && !isLoading ? (
        <EmptyState
          icon="heart-outline"
          title={t('wishlist.emptyTitle')}
          subtitle={t('wishlist.emptySub')}
          ctaLabel={t('cart.startShopping')}
          onCtaPress={() => router.push('/(tabs)' as never)}
        />
      ) : (
        <FlatList
          data={items}
          keyExtractor={(item) => item.productId}
          refreshing={isLoading}
          onRefresh={() => void refreshWishlist()}
          contentContainerStyle={styles.list}
          renderItem={({ item }) => {
            const p = item.product as unknown as Record<string, unknown>;
            const title = String(p.title ?? '');
            const slug = String(p.slug ?? item.productId);
            const rawImg =
              (p.primaryImage as { imageUrl?: string } | undefined)?.imageUrl ??
              (typeof p.thumbnailUrl === 'string' ? p.thumbnailUrl : null);
            const resolved = resolveMediaUrl(rawImg ?? null, env.API_URL);
            const price = Number(p.salePrice ?? p.minPrice ?? p.regularPrice ?? 0);
            const regularPrice = Number(p.regularPrice ?? price);
            const defaultVariantId =
              typeof p.defaultVariantId === 'string' ? p.defaultVariantId : null;

            return (
              <Surface style={styles.card} elevation={1}>
                <Pressable
                  style={styles.cardMain}
                  onPress={() => router.push(`/product/${slug}` as never)}
                >
                  {resolved ? (
                    <Image source={{ uri: resolved }} style={styles.thumb} contentFit="cover" />
                  ) : (
                    <View style={[styles.thumb, styles.thumbFallback]} />
                  )}
                  <View style={styles.info}>
                    <Text variant="titleSmall" numberOfLines={2} style={styles.title}>
                      {title}
                    </Text>
                    <PriceText
                      price={price}
                      regularPrice={regularPrice > price ? regularPrice : null}
                      size="sm"
                    />
                    <View style={styles.actions}>
                      <Button
                        testID={`wishlist.moveToCart.${slug}`}
                        mode="contained-tonal"
                        compact
                        onPress={() => {
                          if (defaultVariantId) {
                            void addItem(
                              {
                                variantId: defaultVariantId,
                                productId: item.productId,
                                title,
                                slug,
                                sku: slug,
                                imageUrl: rawImg ?? null,
                                price,
                                regularPrice: regularPrice > price ? regularPrice : null,
                                quantity: 1,
                              },
                              'wishlist',
                            ).then(() => setSnackMsg(t('catalog.addedToCart')));
                          } else {
                            router.push(`/product/${slug}` as never);
                          }
                        }}
                      >
                        {t('wishlist.moveToCart')}
                      </Button>
                      <IconButton
                        testID={`wishlist.remove.${slug}`}
                        icon="trash-can-outline"
                        iconColor={azColors.danger}
                        size={20}
                        onPress={() => void toggleWishlist(item.productId)}
                      />
                    </View>
                  </View>
                </Pressable>
              </Surface>
            );
          }}
        />
      )}

      <Snackbar visible={Boolean(snackMsg)} onDismiss={() => setSnackMsg(null)} duration={2200}>
        {snackMsg}
      </Snackbar>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: azColors.page },
  header: { backgroundColor: azColors.surface },
  list: { padding: spacing.md, gap: spacing.sm },
  card: {
    backgroundColor: azColors.surface,
    borderRadius: radius.md,
    padding: spacing.sm,
  },
  cardMain: { flexDirection: 'row', gap: spacing.sm },
  thumb: { width: 88, height: 88, borderRadius: radius.sm },
  thumbFallback: { backgroundColor: azColors.border },
  info: { flex: 1, gap: 4 },
  title: { color: azColors.navy, fontWeight: '600' },
  actions: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 4,
  },
});
