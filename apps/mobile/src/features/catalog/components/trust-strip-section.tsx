import React from 'react';
import { StyleSheet, View } from 'react-native';
import { Surface, Text } from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { azColors, radius, spacing } from '@/shared/theme';

interface TrustStripSectionProps {
  settings?: Record<string, unknown>;
}

interface TrustCardItem {
  key: string;
  icon: keyof typeof MaterialCommunityIcons.glyphMap;
  iconColor: string;
  iconBg: string;
  iconBorder: string;
  title: string;
  subtitle: string;
}

function resolveFreeThreshold(settings?: Record<string, unknown>): string {
  const raw =
    settings?.['free_shipping_threshold'] ??
    settings?.['shipping.free_threshold'] ??
    settings?.['free_delivery_threshold'];
  const num = Number(raw);
  if (Number.isFinite(num) && num > 0) {
    return `৳${num.toLocaleString('en-IN')}`;
  }
  return '৳1,00,000';
}

function resolveHotline(settings?: Record<string, unknown>): string {
  const raw =
    settings?.['support_phone'] ??
    settings?.['store_phone'] ??
    settings?.['hotline'];
  if (typeof raw === 'string' && raw.trim()) {
    return raw.trim();
  }
  return '09678-123456';
}

export function TrustStripSection({ settings }: TrustStripSectionProps) {
  const { t } = useTranslation();
  const freeOver = resolveFreeThreshold(settings);
  const hotline = resolveHotline(settings);

  const items: TrustCardItem[] = [
    {
      key: 'courier',
      icon: 'truck-fast-outline',
      iconColor: '#1D4ED8',
      iconBg: '#EFF6FF',
      iconBorder: '#DBEAFE',
      title: t('trust.courierTitle'),
      subtitle: t('trust.courierDesc', { amount: freeOver }),
    },
    {
      key: 'replacement',
      icon: 'autorenew',
      iconColor: '#EA580C',
      iconBg: '#FFF7ED',
      iconBorder: '#FFEDD5',
      title: t('trust.replacementTitle'),
      subtitle: t('trust.replacementDesc'),
    },
    {
      key: 'payment',
      icon: 'lock-check-outline',
      iconColor: '#047857',
      iconBg: '#ECFDF5',
      iconBorder: '#D1FAE5',
      title: t('trust.paymentTitle'),
      subtitle: t('trust.paymentDesc'),
    },
    {
      key: 'concierge',
      icon: 'headset',
      iconColor: '#4338CA',
      iconBg: '#EEF2FF',
      iconBorder: '#E0E7FF',
      title: t('trust.conciergeTitle'),
      subtitle: t('trust.conciergeDesc', { phone: hotline }),
    },
    {
      key: 'authentic',
      icon: 'shield-check-outline',
      iconColor: '#1D4ED8',
      iconBg: '#EFF6FF',
      iconBorder: '#DBEAFE',
      title: t('trust.authenticTitle'),
      subtitle: t('trust.authenticDesc'),
    },
  ];

  return (
    <View style={styles.section} testID="home.trustStrip">
      {items.map((item) => (
        <Surface key={item.key} style={styles.card} elevation={1}>
          <View
            style={[
              styles.iconBox,
              { backgroundColor: item.iconBg, borderColor: item.iconBorder },
            ]}
          >
            <MaterialCommunityIcons name={item.icon} size={22} color={item.iconColor} />
          </View>
          <View style={styles.textCol}>
            <Text style={styles.title} numberOfLines={1}>
              {item.title}
            </Text>
            <Text style={styles.subtitle} numberOfLines={2}>
              {item.subtitle}
            </Text>
          </View>
        </Surface>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  section: {
    marginTop: spacing.lg,
    paddingHorizontal: spacing.md,
    gap: spacing.sm,
  },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: azColors.surface,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: azColors.border,
    padding: spacing.md,
    gap: spacing.md,
  },
  iconBox: {
    width: 44,
    height: 44,
    borderRadius: radius.md,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  textCol: {
    flex: 1,
    gap: 2,
  },
  title: {
    fontSize: 13.5,
    fontWeight: '800',
    color: azColors.navy,
  },
  subtitle: {
    fontSize: 12,
    color: azColors.muted,
    lineHeight: 17,
  },
});

