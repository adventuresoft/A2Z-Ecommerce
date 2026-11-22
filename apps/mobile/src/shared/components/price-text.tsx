import React from 'react';
import { StyleSheet, View, type TextStyle } from 'react-native';
import { Text } from 'react-native-paper';
import { azColors, spacing } from '../theme';
import { calculateDiscountPercent, formatBDT } from '../utils/format-bdt';

interface PriceTextProps {
  price: number;
  regularPrice?: number | null;
  size?: 'sm' | 'md' | 'lg';
  style?: TextStyle;
  testID?: string;
}

export function PriceText({
  price,
  regularPrice,
  size = 'md',
  style,
  testID,
}: PriceTextProps) {
  const showOriginal = regularPrice != null && regularPrice > price;
  const discount = showOriginal ? calculateDiscountPercent(regularPrice, price) : null;

  return (
    <View style={styles.row} accessibilityRole="text">
      <Text
        testID={testID}
        maxFontSizeMultiplier={1.35}
        style={[
          styles.price,
          size === 'sm' && styles.priceSm,
          size === 'lg' && styles.priceLg,
          style,
        ]}
      >
        {formatBDT(price)}
      </Text>
      {showOriginal ? (
        <Text maxFontSizeMultiplier={1.3} style={styles.regularPrice}>
          {formatBDT(regularPrice)}
        </Text>
      ) : null}
      {discount != null ? (
        <View style={styles.badge}>
          <Text maxFontSizeMultiplier={1.2} style={styles.badgeText}>
            -{discount}%
          </Text>
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: spacing.xxs + 2,
  },
  price: {
    fontSize: 15,
    fontWeight: '700',
    color: azColors.navy,
  },
  priceSm: {
    fontSize: 13,
  },
  priceLg: {
    fontSize: 22,
  },
  regularPrice: {
    fontSize: 12,
    color: azColors.muted,
    textDecorationLine: 'line-through',
  },
  badge: {
    backgroundColor: azColors.accentSoft,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  badgeText: {
    fontSize: 11,
    fontWeight: '700',
    color: azColors.accentText,
  },
});
