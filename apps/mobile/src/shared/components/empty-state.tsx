import React from 'react';
import { StyleSheet, View } from 'react-native';
import { Button, Text } from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { azColors, spacing } from '../theme';

interface EmptyStateProps {
  icon?: keyof typeof MaterialCommunityIcons.glyphMap;
  title: string;
  subtitle?: string;
  ctaLabel?: string;
  onCtaPress?: () => void;
  testID?: string;
}

export function EmptyState({
  icon = 'package-variant',
  title,
  subtitle,
  ctaLabel,
  onCtaPress,
  testID,
}: EmptyStateProps) {
  return (
    <View style={styles.container} testID={testID}>
      <View style={styles.iconCircle}>
        <MaterialCommunityIcons name={icon} size={36} color={azColors.primary} />
      </View>
      <Text variant="titleMedium" style={styles.title}>
        {title}
      </Text>
      {subtitle ? (
        <Text variant="bodyMedium" style={styles.subtitle}>
          {subtitle}
        </Text>
      ) : null}
      {ctaLabel && onCtaPress ? (
        <Button
          mode="contained"
          onPress={onCtaPress}
          style={styles.button}
          contentStyle={styles.buttonContent}
        >
          {ctaLabel}
        </Button>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.xl,
  },
  iconCircle: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: azColors.primarySoft,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.md,
  },
  title: {
    color: azColors.navy,
    fontWeight: '700',
    textAlign: 'center',
    lineHeight: 26,
  },
  subtitle: {
    color: azColors.muted,
    textAlign: 'center',
    marginTop: spacing.xs,
    lineHeight: 22,
  },
  button: {
    marginTop: spacing.lg,
    borderRadius: 12,
  },
  buttonContent: {
    minHeight: 48,
    paddingHorizontal: spacing.md,
  },
});
