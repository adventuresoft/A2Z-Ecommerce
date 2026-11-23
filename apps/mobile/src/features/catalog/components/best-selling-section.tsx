import React from 'react';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { Text } from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { azColors, spacing } from '@/shared/theme';
import { ProductCard, type ProductCardModel } from './product-card';
import { mapProductSummaryToCard } from '../utils/product-mapper';

interface BestSellingSectionProps {
  items: Array<Record<string, unknown>> | undefined;
  wishlistedIds: Set<string>;
  title: string;
  badgeText: string;
  seeAllLabel: string;
  onSeeAll: () => void;
  onPressProduct: (slug: string) => void;
  onToggleWishlist: (product: ProductCardModel) => void;
  onQuickAdd: (product: ProductCardModel) => void;
}

export function BestSellingSection({
  items,
  wishlistedIds,
  title,
  badgeText,
  seeAllLabel,
  onSeeAll,
  onPressProduct,
  onToggleWishlist,
  onQuickAdd,
}: BestSellingSectionProps) {
  if (!items || items.length === 0) {
    return null;
  }

  return (
    <View style={styles.section} testID="home.bestSellingHardware">
      <View style={styles.headerRow}>
        <View style={styles.headerLeft}>
          <View style={styles.badge}>
            <MaterialCommunityIcons name="fire" size={13} color={azColors.accent} />
            <Text style={styles.badgeText}>{badgeText}</Text>
          </View>
          <Text variant="titleMedium" style={styles.title}>
            {title}
          </Text>
        </View>

        <Pressable onPress={onSeeAll} hitSlop={8} style={styles.seeAllBtn}>
          <Text style={styles.seeAllText}>{seeAllLabel}</Text>
          <MaterialCommunityIcons name="chevron-right" size={16} color={azColors.primary} />
        </Pressable>
      </View>

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.rail}
      >
        {items.map((raw) => {
          const card = mapProductSummaryToCard(raw);
          return (
            <View key={card.id} style={styles.cardWrap}>
              <ProductCard
                product={card}
                isWishlisted={wishlistedIds.has(card.id)}
                onPress={onPressProduct}
                onToggleWishlist={onToggleWishlist}
                onQuickAdd={onQuickAdd}
              />
            </View>
          );
        })}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  section: {
    marginTop: spacing.lg,
    backgroundColor: azColors.surface,
    paddingVertical: spacing.md,
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: azColors.border,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.md,
    marginBottom: spacing.sm,
  },
  headerLeft: {
    flex: 1,
    gap: 4,
  },
  badge: {
    alignSelf: 'flex-start',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#FFF7ED',
    borderWidth: 1,
    borderColor: '#FFEDD5',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 999,
  },
  badgeText: {
    fontSize: 10,
    fontWeight: '800',
    color: azColors.accent,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  title: {
    color: azColors.navy,
    fontWeight: '800',
  },
  seeAllBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
  },
  seeAllText: {
    color: azColors.primary,
    fontWeight: '700',
    fontSize: 13,
  },
  rail: {
    paddingHorizontal: spacing.md,
    gap: spacing.sm,
  },
  cardWrap: {
    width: 168,
  },
});

