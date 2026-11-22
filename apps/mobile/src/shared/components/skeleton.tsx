import React from 'react';
import { StyleSheet, View, type DimensionValue, type ViewStyle } from 'react-native';
import { azColors, radius, spacing } from '../theme';

interface SkeletonBoxProps {
  width?: DimensionValue;
  height: number;
  borderRadius?: number;
  style?: ViewStyle;
}

export function SkeletonBox({
  width = '100%',
  height,
  borderRadius = radius.sm,
  style,
}: SkeletonBoxProps) {
  return (
    <View
      accessible={false}
      style={[
        styles.box,
        { width, height, borderRadius },
        style,
      ]}
    />
  );
}

export function ProductGridSkeleton({ count = 4 }: { count?: number }) {
  return (
    <View style={styles.grid}>
      {Array.from({ length: count }).map((_, index) => (
        <View key={index} style={styles.card}>
          <SkeletonBox height={140} borderRadius={radius.md} />
          <SkeletonBox height={14} width="90%" style={styles.mtSm} />
          <SkeletonBox height={14} width="65%" style={styles.mtXs} />
          <SkeletonBox height={18} width="50%" style={styles.mtSm} />
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  box: {
    backgroundColor: azColors.border,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
    padding: spacing.md,
  },
  card: {
    width: '48%',
    backgroundColor: azColors.surface,
    borderRadius: radius.md,
    padding: spacing.sm,
    borderWidth: 1,
    borderColor: azColors.border,
  },
  mtSm: {
    marginTop: spacing.xs,
  },
  mtXs: {
    marginTop: spacing.xxs,
  },
});
