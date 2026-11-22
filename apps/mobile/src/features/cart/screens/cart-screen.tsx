import React, { useEffect, useMemo, useState } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import {
  ActivityIndicator,
  Appbar,
  Banner,
  Button,
  Divider,
  IconButton,
  Snackbar,
  Surface,
  Text,
  TextInput,
} from 'react-native-paper';
import { Image } from 'expo-image';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import NetInfo from '@react-native-community/netinfo';
import {
  ApiError,
  checkoutControllerCalculate,
  resolveMediaUrl,
  type CheckoutCalculationResponseDto,
} from '@repo/api-client';
import { env } from '@/shared/config/env';
import { analytics } from '@/shared/analytics';
import { azColors, radius, spacing } from '@/shared/theme';
import { formatBDT } from '@/shared/utils/format-bdt';
import { EmptyState } from '@/shared/components/empty-state';
import { useAuthStore } from '@/features/auth/auth-store';
import { useRequireAuth } from '@/features/auth/use-require-auth';
import { useCartStore } from '../cart-store';
import { CouponsSheet } from '../components/coupons-sheet';

interface DisplayCartItem {
  variantId: string;
  productId: string;
  title: string;
  slug: string;
  sku: string;
  variantLabel?: string | null;
  imageUrl?: string | null;
  price: number;
  quantity: number;
  inStock: boolean;
}

export function CartScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const { requireAuth } = useRequireAuth();

  const guestItems = useCartStore((s) => s.guestItems);
  const serverItems = useCartStore((s) => s.serverItems);
  const syncWarnings = useCartStore((s) => s.syncWarnings);
  const updateQuantity = useCartStore((s) => s.updateQuantity);
  const removeItem = useCartStore((s) => s.removeItem);
  const refreshServerCart = useCartStore((s) => s.refreshServerCart);
  const clearWarnings = useCartStore((s) => s.clearWarnings);

  const [couponInput, setCouponInput] = useState('');
  const [appliedCoupon, setAppliedCoupon] = useState<string | undefined>(undefined);
  const [couponsVisible, setCouponsVisible] = useState(false);
  const [calcData, setCalcData] = useState<CheckoutCalculationResponseDto | null>(null);
  const [calculating, setCalculating] = useState(false);
  const [calcError, setCalcError] = useState<string | null>(null);
  const [isOffline, setIsOffline] = useState(false);
  const [snackMsg, setSnackMsg] = useState<string | null>(null);

  useEffect(() => {
    const unsub = NetInfo.addEventListener((state) => {
      setIsOffline(state.isConnected === false);
    });
    return () => unsub();
  }, []);

  useEffect(() => {
    if (isAuthenticated) {
      void refreshServerCart();
    }
  }, [isAuthenticated, refreshServerCart]);

  const items: DisplayCartItem[] = useMemo(() => {
    if (isAuthenticated) {
      return serverItems.map((i) => ({
        variantId: i.variantId,
        productId: i.productId,
        title: i.title,
        slug: i.slug,
        sku: i.sku,
        variantLabel: typeof i.variantLabel === 'string' ? i.variantLabel : null,
        imageUrl: typeof i.imageUrl === 'string' ? i.imageUrl : null,
        price: i.effectivePrice,
        quantity: i.quantity,
        inStock: i.inStock && !i.isUnavailable,
      }));
    }
    return guestItems.map((i) => ({
      variantId: i.variantId,
      productId: i.productId,
      title: i.title,
      slug: i.slug,
      sku: i.sku,
      variantLabel: i.variantLabel ?? null,
      imageUrl: i.imageUrl ?? null,
      price: i.price,
      quantity: i.quantity,
      inStock: true,
    }));
  }, [isAuthenticated, serverItems, guestItems]);

  const itemsFingerprint = useMemo(
    () => items.map((i) => `${i.variantId}:${i.quantity}`).join('|'),
    [items],
  );

  useEffect(() => {
    if (items.length === 0) {
      setCalcData(null);
      setCalcError(null);
      return;
    }
    if (isOffline) return;

    const timer = setTimeout(() => {
      setCalculating(true);
      setCalcError(null);
      checkoutControllerCalculate({
        items: items.map((i) => ({ variantId: i.variantId, quantity: i.quantity })),
        couponCode: appliedCoupon,
      })
        .then((res) => {
          setCalcData(res.data);
          if (appliedCoupon && res.data.discountAmount > 0) {
            analytics.track('coupon_applied', {
              code: appliedCoupon,
              discountAmount: res.data.discountAmount,
            });
          }
        })
        .catch((err) => {
          const msg = err instanceof ApiError ? err.message : t('app.errorSubtitle');
          setCalcError(msg);
          if (appliedCoupon) {
            setAppliedCoupon(undefined);
            setSnackMsg(msg);
          }
        })
        .finally(() => setCalculating(false));
    }, 250);

    return () => clearTimeout(timer);
  }, [itemsFingerprint, appliedCoupon, isOffline, items, t]);

  const localFallbackSubtotal = useMemo(
    () => items.reduce((sum, i) => sum + i.price * i.quantity, 0),
    [items],
  );

  const subtotal = calcData?.subtotal ?? localFallbackSubtotal;
  const discountAmount = calcData?.discountAmount ?? 0;
  const shippingFee = calcData?.shippingFee ?? 0;
  const totalTaxAmount = calcData?.totalTaxAmount ?? 0;
  const grandTotal = calcData?.grandTotal ?? Math.max(0, subtotal - discountAmount + shippingFee);
  const canCheckout =
    items.length > 0 &&
    !isOffline &&
    (calcData ? calcData.isEligibleForCheckout : true);

  const handleApplyCoupon = (codeRaw: string) => {
    const cleaned = codeRaw.trim().toUpperCase();
    if (!cleaned) return;
    setCouponInput(cleaned);
    setAppliedCoupon(cleaned);
  };

  const handleProceedToCheckout = () => {
    if (isOffline) {
      setSnackMsg(t('cart.offlineCheckoutBlocked'));
      return;
    }
    const destination = appliedCoupon
      ? `/checkout?coupon=${encodeURIComponent(appliedCoupon)}`
      : '/checkout';
    requireAuth(destination, () => {
      analytics.track('begin_checkout', {
        itemCount: items.reduce((s, i) => s + i.quantity, 0),
        grandTotal,
      });
      router.push(destination as never);
    });
  };

  return (
    <View style={styles.screen} testID="cart.screen">
      <Appbar.Header style={styles.header}>
        <Appbar.Content title={t('cart.title')} />
      </Appbar.Header>

      {syncWarnings.length > 0 ? (
        <Banner
          visible
          icon="alert-circle-outline"
          actions={[{ label: 'OK', onPress: clearWarnings }]}
        >
          {syncWarnings.map((w) => w.message).join(' ')}
        </Banner>
      ) : null}

      {items.length === 0 ? (
        <EmptyState
          icon="cart-outline"
          title={t('cart.emptyTitle')}
          subtitle={t('cart.emptySub')}
          ctaLabel={t('cart.startShopping')}
          onCtaPress={() => router.push('/(tabs)' as never)}
        />
      ) : (
        <>
          <ScrollView contentContainerStyle={styles.scrollContent}>
            {items.map((item) => {
              const resolved = resolveMediaUrl(item.imageUrl ?? null, env.API_URL);
              const validation = calcData?.itemsValidation?.find(
                (v) => v.variantId === item.variantId,
              );
              const hasIssue = validation ? !validation.isValid : !item.inStock;

              return (
                <Surface
                  key={item.variantId}
                  style={styles.itemCard}
                  elevation={1}
                  testID={`cart.item.${item.variantId}`}
                >
                  {resolved ? (
                    <Image
                      source={{ uri: resolved }}
                      style={styles.itemImage}
                      contentFit="cover"
                    />
                  ) : (
                    <View style={[styles.itemImage, styles.imagePlaceholder]} />
                  )}
                  <View style={styles.itemBody}>
                    <Text variant="titleSmall" numberOfLines={2} style={styles.itemTitle}>
                      {item.title}
                    </Text>
                    {item.variantLabel ? (
                      <Text variant="labelSmall" style={styles.variantLabel}>
                        {item.variantLabel}
                      </Text>
                    ) : null}
                    <Text variant="titleSmall" style={styles.itemPrice}>
                      {formatBDT(item.price)}
                    </Text>
                    {hasIssue ? (
                      <Text variant="labelSmall" style={styles.stockWarning}>
                        {validation?.errorMessage ?? t('catalog.outOfStock')}
                      </Text>
                    ) : null}
                    <View style={styles.qtyRow}>
                      <View style={styles.stepper}>
                        <IconButton
                          testID={`cart.dec.${item.variantId}`}
                          icon="minus"
                          size={18}
                          onPress={() => void updateQuantity(item.variantId, item.quantity - 1)}
                        />
                        <Text variant="labelLarge" style={styles.qtyText}>
                          {item.quantity}
                        </Text>
                        <IconButton
                          testID={`cart.inc.${item.variantId}`}
                          icon="plus"
                          size={18}
                          onPress={() => void updateQuantity(item.variantId, item.quantity + 1)}
                        />
                      </View>
                      <Button
                        testID={`cart.remove.${item.variantId}`}
                        compact
                        textColor={azColors.danger}
                        onPress={() => void removeItem(item.variantId)}
                      >
                        {t('cart.remove')}
                      </Button>
                    </View>
                  </View>
                </Surface>
              );
            })}

            {/* Coupon Card */}
            <Surface style={styles.sectionCard} elevation={1}>
              <View style={styles.couponHeader}>
                <Text variant="titleSmall" style={styles.sectionTitle}>
                  Promo Coupon
                </Text>
                <Button
                  testID="cart.openCouponsButton"
                  compact
                  onPress={() => setCouponsVisible(true)}
                >
                  {t('cart.availableCoupons')}
                </Button>
              </View>
              <View style={styles.couponRow}>
                <TextInput
                  testID="cart.couponInput"
                  mode="outlined"
                  dense
                  autoCapitalize="characters"
                  placeholder={t('cart.couponPlaceholder')}
                  value={couponInput}
                  onChangeText={setCouponInput}
                  style={styles.couponField}
                />
                {appliedCoupon ? (
                  <Button
                    mode="outlined"
                    onPress={() => {
                      setAppliedCoupon(undefined);
                      setCouponInput('');
                    }}
                  >
                    {t('cart.remove')}
                  </Button>
                ) : (
                  <Button
                    testID="cart.applyCouponButton"
                    mode="contained"
                    onPress={() => handleApplyCoupon(couponInput)}
                    disabled={!couponInput.trim()}
                  >
                    {t('app.apply')}
                  </Button>
                )}
              </View>
              {appliedCoupon && discountAmount > 0 ? (
                <Text variant="labelMedium" style={styles.couponSuccess}>
                  Coupon {appliedCoupon} saved you {formatBDT(discountAmount)}
                </Text>
              ) : null}
            </Surface>

            {/* Authoritative Breakdown */}
            <Surface style={styles.sectionCard} elevation={1}>
              <View style={styles.calcHeader}>
                <Text variant="titleSmall" style={styles.sectionTitle}>
                  Order Summary
                </Text>
                {calculating ? <ActivityIndicator size="small" color={azColors.primary} /> : null}
              </View>
              <SummaryRow label={t('cart.subtotal')} value={formatBDT(subtotal)} />
              {discountAmount > 0 ? (
                <SummaryRow
                  label={t('cart.discount')}
                  value={`- ${formatBDT(discountAmount)}`}
                  highlight={azColors.success}
                />
              ) : null}
              <SummaryRow
                label={t('cart.shipping')}
                value={shippingFee > 0 ? formatBDT(shippingFee) : 'Calculated at checkout'}
              />
              {totalTaxAmount > 0 ? (
                <SummaryRow
                  label={t('cart.taxIncluded')}
                  value={formatBDT(totalTaxAmount)}
                />
              ) : null}
              <Divider style={styles.divider} />
              <View style={styles.totalRow}>
                <Text variant="titleMedium" style={styles.totalLabel}>
                  {t('cart.grandTotal')}
                </Text>
                <Text variant="titleMedium" style={styles.totalValue}>
                  {formatBDT(grandTotal)}
                </Text>
              </View>
              {calcError ? (
                <Text variant="labelSmall" style={styles.stockWarning}>
                  {calcError}
                </Text>
              ) : null}
            </Surface>
          </ScrollView>

          <Surface style={styles.stickyFooter} elevation={4}>
            <View>
              <Text variant="labelSmall" style={styles.mutedText}>
                {t('cart.grandTotal')}
              </Text>
              <Text variant="titleMedium" style={styles.totalValue}>
                {formatBDT(grandTotal)}
              </Text>
            </View>
            <Button
              testID="cart.checkoutButton"
              mode="contained"
              buttonColor={azColors.accent}
              disabled={!canCheckout}
              onPress={handleProceedToCheckout}
              contentStyle={styles.checkoutBtnContent}
              style={styles.checkoutBtn}
            >
              {t('cart.proceedCheckout')}
            </Button>
          </Surface>
        </>
      )}

      <CouponsSheet
        visible={couponsVisible}
        appliedCode={appliedCoupon}
        subtotal={subtotal}
        onDismiss={() => setCouponsVisible(false)}
        onSelectCoupon={handleApplyCoupon}
      />

      <Snackbar visible={Boolean(snackMsg)} onDismiss={() => setSnackMsg(null)} duration={2600}>
        {snackMsg}
      </Snackbar>
    </View>
  );
}

function SummaryRow({
  label,
  value,
  highlight,
}: {
  label: string;
  value: string;
  highlight?: string;
}) {
  return (
    <View style={styles.summaryRow}>
      <Text variant="bodyMedium" style={styles.mutedText}>
        {label}
      </Text>
      <Text variant="bodyMedium" style={[styles.summaryVal, highlight ? { color: highlight } : null]}>
        {value}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: azColors.page },
  header: { backgroundColor: azColors.surface },
  scrollContent: { padding: spacing.md, gap: spacing.sm, paddingBottom: 110 },
  itemCard: {
    flexDirection: 'row',
    backgroundColor: azColors.surface,
    borderRadius: radius.md,
    padding: spacing.sm,
    gap: spacing.sm,
  },
  itemImage: { width: 84, height: 84, borderRadius: radius.sm },
  imagePlaceholder: { backgroundColor: azColors.border },
  itemBody: { flex: 1, gap: 4 },
  itemTitle: { color: azColors.navy, fontWeight: '600' },
  variantLabel: { color: azColors.muted },
  itemPrice: { color: azColors.primary, fontWeight: '700' },
  stockWarning: { color: azColors.danger, fontWeight: '600' },
  qtyRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 4,
  },
  stepper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: azColors.page,
    borderRadius: radius.md,
  },
  qtyText: { minWidth: 24, textAlign: 'center', color: azColors.navy, fontWeight: '700' },
  sectionCard: {
    backgroundColor: azColors.surface,
    borderRadius: radius.md,
    padding: spacing.md,
    gap: spacing.xs,
  },
  sectionTitle: { color: azColors.navy, fontWeight: '700' },
  couponHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  couponRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs },
  couponField: { flex: 1, backgroundColor: azColors.surface },
  couponSuccess: { color: azColors.success, fontWeight: '600' },
  calcHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  summaryRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 2 },
  summaryVal: { color: azColors.navy, fontWeight: '600' },
  mutedText: { color: azColors.muted },
  divider: { marginVertical: spacing.xs },
  totalRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  totalLabel: { color: azColors.navy, fontWeight: '700' },
  totalValue: { color: azColors.navy, fontWeight: '800' },
  stickyFooter: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: spacing.md,
    backgroundColor: azColors.surface,
    borderTopWidth: 1,
    borderTopColor: azColors.border,
    gap: spacing.md,
  },
  checkoutBtn: { flex: 1, borderRadius: radius.md },
  checkoutBtnContent: { minHeight: 48 },
});
