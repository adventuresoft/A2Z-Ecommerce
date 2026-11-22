import React from 'react';
import { StyleSheet, View } from 'react-native';
import { Button, Surface, Text } from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { azColors, radius, spacing } from '@/shared/theme';

interface OrderSuccessScreenProps {
  orderId?: string;
  orderNumber?: string;
  paymentMethod?: string;
}

export function OrderSuccessScreen({
  orderId,
  orderNumber,
  paymentMethod,
}: OrderSuccessScreenProps) {
  const { t } = useTranslation();
  const router = useRouter();

  return (
    <View style={styles.screen} testID="checkout.successScreen">
      <Surface style={styles.card} elevation={2}>
        <View style={styles.iconCircle}>
          <MaterialCommunityIcons name="check-bold" size={44} color="#FFFFFF" />
        </View>
        <Text variant="headlineSmall" style={styles.title}>
          {t('checkout.orderSuccessTitle')}
        </Text>
        {orderNumber ? (
          <Text variant="titleMedium" style={styles.orderNum}>
            {t('checkout.orderNumber', { number: orderNumber })}
          </Text>
        ) : null}
        <Text variant="bodyMedium" style={styles.subtitle}>
          {paymentMethod === 'PAYSTATION'
            ? 'Your online payment has been verified securely. We are preparing your shipment.'
            : 'Thank you for shopping with A to Z Ecommerce. Pay comfortably upon delivery.'}
        </Text>

        <View style={styles.actions}>
          {orderId ? (
            <Button
              testID="checkout.viewOrderButton"
              mode="contained"
              onPress={() => router.replace(`/orders/${orderId}` as never)}
              style={styles.btn}
              contentStyle={styles.btnContent}
            >
              {t('checkout.viewOrder')}
            </Button>
          ) : null}
          <Button
            testID="checkout.continueShoppingButton"
            mode="outlined"
            onPress={() => router.replace('/(tabs)' as never)}
            style={styles.btn}
            contentStyle={styles.btnContent}
          >
            {t('checkout.continueShopping')}
          </Button>
        </View>
      </Surface>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: azColors.page,
    justifyContent: 'center',
    padding: spacing.lg,
  },
  card: {
    backgroundColor: azColors.surface,
    borderRadius: radius.xl,
    padding: spacing.xl,
    alignItems: 'center',
    gap: spacing.sm,
  },
  iconCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: azColors.success,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: spacing.xs,
  },
  title: { color: azColors.navy, fontWeight: '800', textAlign: 'center' },
  orderNum: { color: azColors.primary, fontWeight: '700' },
  subtitle: { color: azColors.muted, textAlign: 'center', lineHeight: 22 },
  actions: { width: '100%', gap: spacing.sm, marginTop: spacing.md },
  btn: { borderRadius: radius.md },
  btnContent: { minHeight: 48 },
});
