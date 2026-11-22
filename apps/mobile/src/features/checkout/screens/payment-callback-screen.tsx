import React, { useCallback, useEffect, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { ActivityIndicator, Appbar, Button, Text } from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import {
  ApiError,
  paystationControllerGetStatus,
  paystationControllerVerify,
} from '@repo/api-client';
import { azColors, radius, spacing } from '@/shared/theme';
import { useCartStore } from '@/features/cart/cart-store';

interface PaymentCallbackScreenProps {
  invoiceNumber?: string;
  trxId?: string;
  orderId?: string;
  orderNumber?: string;
}

export function PaymentCallbackScreen({
  invoiceNumber,
  trxId,
  orderId,
  orderNumber,
}: PaymentCallbackScreenProps) {
  const { t } = useTranslation();
  const router = useRouter();
  const clearAllCart = useCartStore((s) => s.clearAll);

  const [checking, setChecking] = useState(true);
  const [message, setMessage] = useState<string>(t('checkout.verifyingPayment'));

  const runVerification = useCallback(async () => {
    if (!invoiceNumber) {
      setChecking(false);
      setMessage('Payment invoice reference is missing. Check status in My Orders.');
      return;
    }

    setChecking(true);
    setMessage(t('checkout.verifyingPayment'));
    try {
      const res = trxId
        ? await paystationControllerVerify({ invoice_number: invoiceNumber })
        : await paystationControllerGetStatus(invoiceNumber);

      if (res.data.verified) {
        await clearAllCart();
        router.replace({
          pathname: '/checkout/success',
          params: {
            orderId: res.data.orderId ?? orderId ?? '',
            orderNumber: res.data.orderNumber || orderNumber || '',
            paymentMethod: 'PAYSTATION',
          },
        } as never);
        return;
      }

      setMessage(
        res.data.message ||
          'Payment is not confirmed yet. You can retry payment or re-verify from your order details.',
      );
    } catch (err) {
      setMessage(err instanceof ApiError ? err.message : t('app.errorSubtitle'));
    } finally {
      setChecking(false);
    }
  }, [invoiceNumber, trxId, orderId, orderNumber, clearAllCart, router, t]);

  useEffect(() => {
    void runVerification();
  }, [runVerification]);

  return (
    <View style={styles.screen} testID="checkout.paymentCallbackScreen">
      <Appbar.Header style={styles.header}>
        <Appbar.Content title={t('checkout.title')} />
      </Appbar.Header>

      <View style={styles.center}>
        {checking ? (
          <>
            <ActivityIndicator size="large" color={azColors.primary} />
            <Text variant="titleMedium" style={styles.title}>
              {t('checkout.verifyingPayment')}
            </Text>
          </>
        ) : (
          <>
            <MaterialCommunityIcons name="alert-circle-outline" size={64} color={azColors.accent} />
            <Text variant="titleLarge" style={styles.title}>
              Payment Pending / Unverified
            </Text>
            <Text variant="bodyMedium" style={styles.body}>
              {message}
            </Text>
            <View style={styles.actions}>
              <Button
                mode="contained"
                onPress={() => void runVerification()}
                style={styles.btn}
                contentStyle={styles.btnContent}
              >
                {t('app.retry')}
              </Button>
              {orderId ? (
                <Button
                  mode="outlined"
                  onPress={() => router.replace(`/orders/${orderId}` as never)}
                  style={styles.btn}
                  contentStyle={styles.btnContent}
                >
                  {t('checkout.viewOrder')}
                </Button>
              ) : null}
            </View>
          </>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: azColors.page },
  header: { backgroundColor: azColors.surface },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.xl,
    gap: spacing.md,
  },
  title: { color: azColors.navy, fontWeight: '700', textAlign: 'center' },
  body: { color: azColors.muted, textAlign: 'center', lineHeight: 22 },
  actions: { width: '100%', gap: spacing.sm, marginTop: spacing.md },
  btn: { borderRadius: radius.md },
  btnContent: { minHeight: 48 },
});
