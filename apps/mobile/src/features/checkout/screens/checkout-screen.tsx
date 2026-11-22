import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';
import {
  ActivityIndicator,
  Appbar,
  Button,
  Divider,
  RadioButton,
  Snackbar,
  Surface,
  Text,
  TextInput,
} from 'react-native-paper';
import * as WebBrowser from 'expo-web-browser';
import NetInfo from '@react-native-community/netinfo';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import {
  ApiError,
  checkoutControllerCalculate,
  ordersControllerCreate,
  paystationControllerGetStatus,
  paystationControllerInitiate,
  paystationControllerVerify,
  useAccountAddressesControllerListAddresses,
  usePaymentMethodsControllerFindActive,
  useShipmentsControllerGetActiveMethods,
  type CheckoutCalculationResponseDto,
  type UserAddressResponseDto,
} from '@repo/api-client';
import { STALE_TIMES } from '@/shared/api/query-client';
import { analytics } from '@/shared/analytics';
import { azColors, radius, spacing } from '@/shared/theme';
import { formatBDT } from '@/shared/utils/format-bdt';
import { EmptyState } from '@/shared/components/empty-state';
import { useAuthStore } from '@/features/auth/auth-store';
import { useCartStore } from '@/features/cart/cart-store';
import { CouponsSheet } from '@/features/cart/components/coupons-sheet';
import { AddressFormModal } from '../components/address-form-modal';
import {
  buildCheckoutFingerprint,
  generateIdempotencyKey,
  mapAddressToOrderDto,
  normalizePaymentMethodCode,
  parsePaystationCallbackUrl,
  PAYSTATION_MOBILE_CALLBACK_URL,
} from '../utils/checkout-utils';

export function CheckoutScreen({ initialCoupon }: { initialCoupon?: string }) {
  const { t } = useTranslation();
  const router = useRouter();
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const serverItems = useCartStore((s) => s.serverItems);
  const guestItems = useCartStore((s) => s.guestItems);
  const clearAllCart = useCartStore((s) => s.clearAll);

  const addressesQuery = useAccountAddressesControllerListAddresses({
    query: { enabled: isAuthenticated },
  });
  const shippingMethodsQuery = useShipmentsControllerGetActiveMethods(undefined, {
    query: { staleTime: STALE_TIMES.TAXONOMY_AND_SETTINGS },
  });
  const paymentMethodsQuery = usePaymentMethodsControllerFindActive({
    query: { staleTime: STALE_TIMES.TAXONOMY_AND_SETTINGS },
  });

  const addresses: UserAddressResponseDto[] = useMemo(
    () => (addressesQuery.data?.status === 200 ? addressesQuery.data.data : []),
    [addressesQuery.data],
  );
  const shippingMethods = useMemo(
    () => shippingMethodsQuery.data?.data ?? [],
    [shippingMethodsQuery.data],
  );
  const paymentMethods = useMemo(
    () => paymentMethodsQuery.data?.data ?? [],
    [paymentMethodsQuery.data],
  );

  const activeItems = useMemo(() => {
    const raw = isAuthenticated ? serverItems : guestItems;
    return raw.map((i) => ({
      variantId: i.variantId,
      title: i.title,
      quantity: i.quantity,
      price: 'effectivePrice' in i ? i.effectivePrice : i.price,
    }));
  }, [isAuthenticated, serverItems, guestItems]);

  const [selectedAddressId, setSelectedAddressId] = useState<string | null>(null);
  const [selectedShippingId, setSelectedShippingId] = useState<string | null>(null);
  const [selectedPaymentCode, setSelectedPaymentCode] = useState<string>('CASH_ON_DELIVERY');
  const [paymentReference, setPaymentReference] = useState('');
  const [customerNotes, setCustomerNotes] = useState('');
  const [couponInput, setCouponInput] = useState(initialCoupon ?? '');
  const [appliedCoupon, setAppliedCoupon] = useState<string | undefined>(
    initialCoupon?.trim() ? initialCoupon.trim().toUpperCase() : undefined,
  );
  const [couponsVisible, setCouponsVisible] = useState(false);
  const [addressModalVisible, setAddressModalVisible] = useState(false);

  const [calcData, setCalcData] = useState<CheckoutCalculationResponseDto | null>(null);
  const [calculating, setCalculating] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [isOffline, setIsOffline] = useState(false);
  const [snackMsg, setSnackMsg] = useState<string | null>(null);

  useEffect(() => {
    const unsub = NetInfo.addEventListener((state) => {
      setIsOffline(state.isConnected === false);
    });
    return () => unsub();
  }, []);

  useEffect(() => {
    if (!selectedAddressId && addresses.length > 0) {
      const def = addresses.find((a) => a.isDefaultShipping) ?? addresses[0];
      if (def) setSelectedAddressId(def.id);
    }
  }, [addresses, selectedAddressId]);

  useEffect(() => {
    if (!selectedShippingId && shippingMethods.length > 0) {
      setSelectedShippingId(shippingMethods[0]?.id ?? null);
    }
  }, [shippingMethods, selectedShippingId]);

  useEffect(() => {
    if (paymentMethods.length > 0 && !paymentMethods.some((m) => m.code === selectedPaymentCode)) {
      setSelectedPaymentCode(paymentMethods[0]?.code ?? 'CASH_ON_DELIVERY');
    }
  }, [paymentMethods, selectedPaymentCode]);

  const selectedAddress = useMemo(
    () => addresses.find((a) => a.id === selectedAddressId) ?? null,
    [addresses, selectedAddressId],
  );

  // Stable idempotency key per checkout fingerprint
  const fingerprint = useMemo(
    () =>
      buildCheckoutFingerprint({
        items: activeItems.map((i) => ({ variantId: i.variantId, quantity: i.quantity })),
        addressId: selectedAddressId,
        shippingMethodId: selectedShippingId,
        paymentMethod: selectedPaymentCode,
        couponCode: appliedCoupon,
      }),
    [activeItems, selectedAddressId, selectedShippingId, selectedPaymentCode, appliedCoupon],
  );
  const idempotencyRef = useRef<{ fp: string; key: string }>({
    fp: '',
    key: generateIdempotencyKey(),
  });
  if (idempotencyRef.current.fp !== fingerprint) {
    idempotencyRef.current = { fp: fingerprint, key: generateIdempotencyKey() };
  }

  useEffect(() => {
    if (activeItems.length === 0 || isOffline) return;
    const timer = setTimeout(() => {
      setCalculating(true);
      checkoutControllerCalculate({
        items: activeItems.map((i) => ({ variantId: i.variantId, quantity: i.quantity })),
        shippingMethodId: selectedShippingId ?? undefined,
        shippingCity: selectedAddress?.city,
        couponCode: appliedCoupon,
      })
        .then((res) => setCalcData(res.data))
        .catch((err) => {
          setSnackMsg(err instanceof ApiError ? err.message : t('app.errorSubtitle'));
        })
        .finally(() => setCalculating(false));
    }, 250);
    return () => clearTimeout(timer);
  }, [activeItems, selectedShippingId, selectedAddress?.city, appliedCoupon, isOffline, t]);

  if (!isAuthenticated) {
    return (
      <View style={styles.screen}>
        <Appbar.Header style={styles.header}>
          <Appbar.BackAction onPress={() => router.back()} />
          <Appbar.Content title={t('checkout.title')} />
        </Appbar.Header>
        <EmptyState
          icon="lock-outline"
          title={t('auth.welcome')}
          subtitle={t('account.signInPrompt')}
          ctaLabel={t('auth.login')}
          onCtaPress={() =>
            router.push({ pathname: '/(auth)/login', params: { redirect: '/checkout' } } as never)
          }
        />
      </View>
    );
  }

  if (activeItems.length === 0) {
    return (
      <View style={styles.screen}>
        <Appbar.Header style={styles.header}>
          <Appbar.BackAction onPress={() => router.back()} />
          <Appbar.Content title={t('checkout.title')} />
        </Appbar.Header>
        <EmptyState
          icon="cart-outline"
          title={t('cart.emptyTitle')}
          subtitle={t('cart.emptySub')}
          ctaLabel={t('cart.startShopping')}
          onCtaPress={() => router.replace('/(tabs)' as never)}
        />
      </View>
    );
  }

  const normalizedPayment = normalizePaymentMethodCode(selectedPaymentCode);
  const grandTotal = calcData?.grandTotal ?? 0;

  const handlePlaceOrder = async () => {
    if (isOffline) {
      setSnackMsg(t('cart.offlineCheckoutBlocked'));
      return;
    }
    if (!selectedAddress) {
      setSnackMsg('Please select or add a delivery address.');
      return;
    }
    if (calcData && !calcData.isEligibleForCheckout) {
      setSnackMsg('Some items in your cart are out of stock.');
      return;
    }

    setSubmitting(true);
    try {
      const orderDto = mapAddressToOrderDto({
        address: selectedAddress,
        items: activeItems.map((i) => ({ variantId: i.variantId, quantity: i.quantity })),
        shippingMethodId: selectedShippingId ?? undefined,
        couponCode: appliedCoupon,
        paymentMethod: normalizedPayment,
        paymentReference: normalizedPayment === 'MOBILE_BANKING' ? paymentReference : undefined,
        customerNotes,
      });

      const orderRes = await ordersControllerCreate(orderDto, {
        headers: { 'idempotency-key': idempotencyRef.current.key },
      });

      const createdOrder = orderRes.data;
      analytics.track('order_created', {
        orderId: createdOrder.id,
        orderNumber: createdOrder.orderNumber,
        paymentMethod: normalizedPayment,
        grandTotal: Number(createdOrder.grandTotal ?? grandTotal),
      });

      if (normalizedPayment !== 'PAYSTATION') {
        await clearAllCart();
        router.replace({
          pathname: '/checkout/success',
          params: {
            orderId: createdOrder.id,
            orderNumber: createdOrder.orderNumber,
            paymentMethod: normalizedPayment,
          },
        } as never);
        return;
      }

      // PayStation Hosted Gateway flow
      const initRes = await paystationControllerInitiate({
        orderId: createdOrder.id,
        callbackUrl: PAYSTATION_MOBILE_CALLBACK_URL,
      });

      if (initRes.status !== 200 || !initRes.data.payment_url) {
        setSnackMsg('Unable to start PayStation session. Please retry from My Orders.');
        router.replace(`/orders/${createdOrder.id}` as never);
        return;
      }

      const invoiceNumber = initRes.data.invoice_number;
      const browserResult = await WebBrowser.openAuthSessionAsync(
        initRes.data.payment_url,
        PAYSTATION_MOBILE_CALLBACK_URL,
      );

      let verified = false;
      if (browserResult.type === 'success' && browserResult.url) {
        const parsed = parsePaystationCallbackUrl(browserResult.url);
        const verifyInvoice = parsed.invoiceNumber ?? invoiceNumber;
        const verifyRes = await paystationControllerVerify({
          invoice_number: verifyInvoice,
        });
        verified = Boolean(verifyRes.data.verified);
      } else {
        // Fallback status reconciliation when user closes Chrome Custom Tabs / Safari sheet
        const statusRes = await paystationControllerGetStatus(invoiceNumber);
        verified = Boolean(statusRes.data.verified);
      }

      if (verified) {
        analytics.track('payment_completed', {
          orderId: createdOrder.id,
          invoiceNumber,
        });
        await clearAllCart();
        router.replace({
          pathname: '/checkout/success',
          params: {
            orderId: createdOrder.id,
            orderNumber: createdOrder.orderNumber,
            paymentMethod: 'PAYSTATION',
          },
        } as never);
      } else {
        analytics.track('payment_failed', {
          orderId: createdOrder.id,
          invoiceNumber,
        });
        router.replace({
          pathname: '/checkout/payment-callback',
          params: {
            orderId: createdOrder.id,
            orderNumber: createdOrder.orderNumber,
            invoice_number: invoiceNumber,
          },
        } as never);
      }
    } catch (err) {
      setSnackMsg(err instanceof ApiError ? err.message : t('app.errorSubtitle'));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <View style={styles.screen} testID="checkout.screen">
      <Appbar.Header style={styles.header}>
        <Appbar.BackAction onPress={() => router.back()} />
        <Appbar.Content title={t('checkout.title')} />
      </Appbar.Header>

      <ScrollView contentContainerStyle={styles.scroll}>
        {/* 1. Delivery Address */}
        <Surface style={styles.card} elevation={1}>
          <View style={styles.sectionHeader}>
            <Text variant="titleSmall" style={styles.sectionTitle}>
              {t('checkout.deliveryAddress')}
            </Text>
            <Button
              testID="checkout.addAddressButton"
              compact
              onPress={() => setAddressModalVisible(true)}
            >
              {t('checkout.addAddress')}
            </Button>
          </View>

          {addresses.length === 0 ? (
            <Button
              mode="outlined"
              icon="map-marker-plus"
              onPress={() => setAddressModalVisible(true)}
            >
              {t('checkout.addAddress')}
            </Button>
          ) : (
            <RadioButton.Group
              value={selectedAddressId ?? ''}
              onValueChange={setSelectedAddressId}
            >
              {addresses.map((addr) => (
                <Pressable
                  key={addr.id}
                  testID={`checkout.address.${addr.id}`}
                  style={[
                    styles.radioRow,
                    selectedAddressId === addr.id && styles.radioRowSelected,
                  ]}
                  onPress={() => setSelectedAddressId(addr.id)}
                >
                  <RadioButton value={addr.id} />
                  <View style={styles.radioInfo}>
                    <Text variant="labelLarge" style={styles.boldNavy}>
                      {addr.recipientName} • {addr.phone}
                    </Text>
                    <Text variant="bodySmall" style={styles.muted}>
                      {addr.streetAddress}, {addr.city} {addr.postalCode}
                    </Text>
                  </View>
                </Pressable>
              ))}
            </RadioButton.Group>
          )}
        </Surface>

        {/* 2. Shipping Method */}
        <Surface style={styles.card} elevation={1}>
          <Text variant="titleSmall" style={styles.sectionTitle}>
            {t('checkout.shippingMethod')}
          </Text>
          <RadioButton.Group
            value={selectedShippingId ?? ''}
            onValueChange={setSelectedShippingId}
          >
            {shippingMethods.map((method) => (
              <Pressable
                key={method.id}
                testID={`checkout.shipping.${method.id}`}
                style={[
                  styles.radioRow,
                  selectedShippingId === method.id && styles.radioRowSelected,
                ]}
                onPress={() => setSelectedShippingId(method.id)}
              >
                <RadioButton value={method.id} />
                <View style={styles.radioInfo}>
                  <Text variant="labelLarge" style={styles.boldNavy}>
                    {method.name}
                  </Text>
                  <Text variant="labelSmall" style={styles.muted}>
                    Est. {method.estimatedDays} days
                  </Text>
                </View>
                <Text variant="labelLarge" style={styles.boldNavy}>
                  {formatBDT(method.cost)}
                </Text>
              </Pressable>
            ))}
          </RadioButton.Group>
        </Surface>

        {/* 3. Payment Method */}
        <Surface style={styles.card} elevation={1}>
          <Text variant="titleSmall" style={styles.sectionTitle}>
            {t('checkout.paymentMethod')}
          </Text>
          <RadioButton.Group
            value={selectedPaymentCode}
            onValueChange={setSelectedPaymentCode}
          >
            {(paymentMethods.length > 0
              ? paymentMethods
              : [
                  { code: 'CASH_ON_DELIVERY', name: t('checkout.cod'), sortOrder: 1 },
                  { code: 'PAYSTATION', name: t('checkout.paystation'), sortOrder: 2 },
                ]
            ).map((pm) => (
              <Pressable
                key={pm.code}
                testID={`checkout.payment.${pm.code}`}
                style={[
                  styles.radioRow,
                  selectedPaymentCode === pm.code && styles.radioRowSelected,
                ]}
                onPress={() => setSelectedPaymentCode(pm.code)}
              >
                <RadioButton value={pm.code} />
                <View style={styles.radioInfo}>
                  <Text variant="labelLarge" style={styles.boldNavy}>
                    {pm.name}
                  </Text>
                  {'description' in pm && typeof pm.description === 'string' ? (
                    <Text variant="labelSmall" style={styles.muted}>
                      {pm.description}
                    </Text>
                  ) : null}
                </View>
              </Pressable>
            ))}
          </RadioButton.Group>

          {normalizedPayment === 'MOBILE_BANKING' ? (
            <TextInput
              testID="checkout.paymentReferenceInput"
              mode="outlined"
              label="Sender Phone & TrxID"
              value={paymentReference}
              onChangeText={setPaymentReference}
            />
          ) : null}
        </Surface>

        {/* 4. Coupon & Notes */}
        <Surface style={styles.card} elevation={1}>
          <View style={styles.sectionHeader}>
            <Text variant="titleSmall" style={styles.sectionTitle}>
              Coupon & Delivery Notes
            </Text>
            <Button compact onPress={() => setCouponsVisible(true)}>
              {t('cart.availableCoupons')}
            </Button>
          </View>
          <View style={styles.couponRow}>
            <TextInput
              mode="outlined"
              dense
              autoCapitalize="characters"
              placeholder={t('cart.couponPlaceholder')}
              value={couponInput}
              onChangeText={setCouponInput}
              style={styles.couponInput}
            />
            <Button
              mode="contained-tonal"
              onPress={() => setAppliedCoupon(couponInput.trim().toUpperCase() || undefined)}
            >
              {t('app.apply')}
            </Button>
          </View>
          <TextInput
            mode="outlined"
            label="Delivery instructions (optional)"
            value={customerNotes}
            onChangeText={setCustomerNotes}
          />
        </Surface>

        {/* 5. Summary */}
        <Surface style={styles.card} elevation={1}>
          <View style={styles.sectionHeader}>
            <Text variant="titleSmall" style={styles.sectionTitle}>
              Order Summary ({activeItems.reduce((s, i) => s + i.quantity, 0)} items)
            </Text>
            {calculating ? <ActivityIndicator size="small" color={azColors.primary} /> : null}
          </View>
          <Row label={t('cart.subtotal')} value={formatBDT(calcData?.subtotal ?? 0)} />
          {(calcData?.discountAmount ?? 0) > 0 ? (
            <Row
              label={t('cart.discount')}
              value={`- ${formatBDT(calcData?.discountAmount ?? 0)}`}
              color={azColors.success}
            />
          ) : null}
          <Row label={t('cart.shipping')} value={formatBDT(calcData?.shippingFee ?? 0)} />
          {(calcData?.totalTaxAmount ?? 0) > 0 ? (
            <Row label={t('cart.taxIncluded')} value={formatBDT(calcData?.totalTaxAmount ?? 0)} />
          ) : null}
          <Divider style={styles.divider} />
          <View style={styles.totalRow}>
            <Text variant="titleMedium" style={styles.boldNavy}>
              {t('cart.grandTotal')}
            </Text>
            <Text variant="titleMedium" style={styles.totalVal}>
              {formatBDT(grandTotal)}
            </Text>
          </View>
        </Surface>
      </ScrollView>

      <Surface style={styles.footer} elevation={4}>
        <Button
          testID="checkout.placeOrderButton"
          mode="contained"
          buttonColor={azColors.accent}
          loading={submitting}
          disabled={submitting || calculating || isOffline || !selectedAddress}
          onPress={() => void handlePlaceOrder()}
          contentStyle={styles.placeBtnContent}
          style={styles.placeBtn}
        >
          {t('checkout.placeOrder')} • {formatBDT(grandTotal)}
        </Button>
      </Surface>

      <AddressFormModal
        visible={addressModalVisible}
        onDismiss={() => setAddressModalVisible(false)}
        onSaved={(addr) => {
          setSelectedAddressId(addr.id);
          void addressesQuery.refetch();
        }}
      />

      <CouponsSheet
        visible={couponsVisible}
        appliedCode={appliedCoupon}
        subtotal={calcData?.subtotal ?? 0}
        onDismiss={() => setCouponsVisible(false)}
        onSelectCoupon={(code) => {
          setCouponInput(code);
          setAppliedCoupon(code);
        }}
      />

      <Snackbar visible={Boolean(snackMsg)} onDismiss={() => setSnackMsg(null)} duration={3000}>
        {snackMsg}
      </Snackbar>
    </View>
  );
}

function Row({ label, value, color }: { label: string; value: string; color?: string }) {
  return (
    <View style={styles.row}>
      <Text variant="bodyMedium" style={styles.muted}>
        {label}
      </Text>
      <Text variant="bodyMedium" style={[styles.boldNavy, color ? { color } : null]}>
        {value}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: azColors.page },
  header: { backgroundColor: azColors.surface },
  scroll: { padding: spacing.md, gap: spacing.sm, paddingBottom: 100 },
  card: {
    backgroundColor: azColors.surface,
    borderRadius: radius.md,
    padding: spacing.md,
    gap: spacing.xs,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  sectionTitle: { color: azColors.navy, fontWeight: '700' },
  radioRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.xs,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: azColors.border,
    marginBottom: spacing.xs,
  },
  radioRowSelected: {
    borderColor: azColors.primary,
    backgroundColor: azColors.primarySoft,
  },
  radioInfo: { flex: 1, gap: 2 },
  boldNavy: { color: azColors.navy, fontWeight: '600' },
  muted: { color: azColors.muted },
  couponRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs },
  couponInput: { flex: 1, backgroundColor: azColors.surface },
  row: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 2 },
  divider: { marginVertical: spacing.xs },
  totalRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  totalVal: { color: azColors.navy, fontWeight: '800' },
  footer: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    padding: spacing.md,
    backgroundColor: azColors.surface,
    borderTopWidth: 1,
    borderTopColor: azColors.border,
  },
  placeBtn: { borderRadius: radius.md },
  placeBtnContent: { minHeight: 50 },
});
