import React, { memo } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { IconButton, Surface, Text } from 'react-native-paper';
import { Image } from 'expo-image';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { resolveMediaUrl } from '@repo/api-client';
import { env } from '@/shared/config/env';
import { azColors, radius, spacing } from '@/shared/theme';
import { PriceText } from '@/shared/components/price-text';

export interface ProductCardModel {
  id: string;
  slug: string;
  title: string;
  imageUrl?: string | null;
  price: number;
  regularPrice?: number | null;
  rating?: number;
  reviewsCount?: number;
  inStock: boolean;
  defaultVariantId?: string | null;
  variantsCount?: number;
}

interface ProductCardProps {
  product: ProductCardModel;
  isWishlisted: boolean;
  onPress: (slug: string) => void;
  onToggleWishlist: (product: ProductCardModel) => void;
  onQuickAdd: (product: ProductCardModel) => void;
  testIDPrefix?: string;
}

export const ProductCard = memo(function ProductCard({
  product,
  isWishlisted,
  onPress,
  onToggleWishlist,
  onQuickAdd,
  testIDPrefix = 'catalog.productCard',
}: ProductCardProps) {
  const thumbUri = resolveMediaUrl(product.imageUrl, env.API_ORIGIN, 'thumb');

  return (
    <Surface style={styles.card} elevation={1} testID={`${testIDPrefix}.${product.slug}`}>
      <Pressable
        onPress={() => onPress(product.slug)}
        accessibilityRole="button"
        accessibilityLabel={product.title}
      >
        <View style={styles.imageFrame}>
          {thumbUri ? (
            <Image
              source={{ uri: thumbUri }}
              recyclingKey={product.id}
              contentFit="contain"
              cachePolicy="memory-disk"
              transition={180}
              style={styles.image}
            />
          ) : (
            <View style={styles.placeholder}>
              <MaterialCommunityIcons name="image-outline" size={32} color={azColors.disabled} />
            </View>
          )}

          <IconButton
            testID={`${testIDPrefix}.${product.slug}.wishlist`}
            icon={isWishlisted ? 'heart' : 'heart-outline'}
            iconColor={isWishlisted ? azColors.danger : azColors.muted}
            size={20}
            style={styles.wishlistBtn}
            accessibilityLabel={isWishlisted ? 'Remove from wishlist' : 'Add to wishlist'}
            onPress={() => onToggleWishlist(product)}
          />
        </View>

        <View style={styles.body}>
          <Text numberOfLines={2} style={styles.title}>
            {product.title}
          </Text>

          <PriceText price={product.price} regularPrice={product.regularPrice} size="sm" />

          <View style={styles.footerRow}>
            {product.rating ? (
              <View style={styles.ratingRow}>
                <MaterialCommunityIcons name="star" size={14} color={azColors.warning} />
                <Text style={styles.ratingText}>
                  {product.rating.toFixed(1)}
                </Text>
              </View>
            ) : (
              <View />
            )}

            <Pressable
              testID={`${testIDPrefix}.${product.slug}.quickAdd`}
              disabled={!product.inStock}
              onPress={() => onQuickAdd(product)}
              hitSlop={8}
              accessibilityRole="button"
              accessibilityLabel={`Add ${product.title} to cart`}
              style={[
                styles.quickAddBtn,
                !product.inStock && styles.quickAddDisabled,
              ]}
            >
              <MaterialCommunityIcons
                name={product.variantsCount && product.variantsCount > 1 ? 'tune-variant' : 'plus'}
                size={18}
                color="#FFFFFF"
              />
            </Pressable>
          </View>
        </View>
      </Pressable>
    </Surface>
  );
});

const styles = StyleSheet.create({
  card: {
    flex: 1,
    backgroundColor: azColors.surface,
    borderRadius: radius.md,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: azColors.border,
  },
  imageFrame: {
    width: '100%',
    aspectRatio: 1,
    backgroundColor: '#FFFFFF',
    position: 'relative',
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.xs,
  },
  image: {
    width: '100%',
    height: '100%',
  },
  placeholder: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  wishlistBtn: {
    position: 'absolute',
    top: 2,
    right: 2,
    backgroundColor: 'rgba(255,255,255,0.9)',
    margin: 0,
  },
  body: {
    padding: spacing.sm,
    gap: spacing.xs,
  },
  title: {
    fontSize: 13,
    fontWeight: '600',
    color: azColors.navy,
    lineHeight: 20,
    minHeight: 40,
  },
  footerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 2,
  },
  ratingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
  },
  ratingText: {
    fontSize: 12,
    color: azColors.muted,
    fontWeight: '600',
  },
  quickAddBtn: {
    width: 34,
    height: 34,
    borderRadius: radius.pill,
    backgroundColor: azColors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  quickAddDisabled: {
    backgroundColor: azColors.disabled,
  },
});
