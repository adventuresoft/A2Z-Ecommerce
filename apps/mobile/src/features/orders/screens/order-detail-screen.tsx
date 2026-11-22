import React, { useState } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import {
  ActivityIndicator,
  Appbar,
  Button,
  Chip,
  Dialog,
  Divider,
  IconButton,
  Portal,
  Snackbar,
  Surface,
  Text,
  TextInput,
} from 'react-native-paper';
import * as Clipboard from 'expo-clipboard';
import * as WebBrowser from 'expo-web-browser';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import {
  ApiError,
  ordersControllerCancelOrder,
  paystationControllerGetStatus,
  paystationControllerInitiate,
  paystationControllerVerify,
  reviewsPublicControllerSubmitReview,
  useOrdersControllerGetOrderById,
} from '@repo/api-client';
import { STALE_TIMES } from '@/shared/api/query-client';
import { analytics } from '@/shared/analytics';
import { azColors, radius, spacing } from '@/shared/theme';
import { formatBDT } from '@/shared/utils/format-bdt';
import { EmptyState } from '@/shared/components/empty-state';
import { useCartStore } from '@/features/cart/cart-store';
import {
  parsePaystationCallbackUrl,
  PAYSTATION_MOBILE_CALLBACK_URL,
} from '@/features/checkout/utils/checkout-utils';
import { generateAndShareOrderPdf } from '../utils/invoice-pdf';
import { statusColor } from './orders-list-screen';

function asStr(val: unknown): string | null {
  return typeof val === 'string' && val.trim().length > 0 ? val : null;
}

export function OrderDetailScreen({ orderId }: { orderId: string }) {
  const { t } = useTranslation();
  const router = useRouter();
  const addItem = useCartStore((s) => s.addItem);

  const orderQuery = useOrdersControllerGetOrderById(orderId, {
    query: { staleTime: STALE_TIMES.ORDERS_AND_NOTIFICATIONS },
  });

  const order = orderQuery.data?.data ?? null;

  const [cancelDialogVisible, setCancelDialogVisible] = useState(false);
  const [cancelReason, setCancelReason] = useState('Changed my mind');
  const [busyAction, setBusyAction] = useState<string | null>(null);
  const [snackMsg, setSnackMsg] = useState<string | null>(null);

  const [reviewDialogVisible, setReviewDialogVisible] = useState(false);
  const [reviewProductId, setReviewProductId] = useState('');
  const [reviewRating, setReviewRating] = useState(5);
  const [reviewTitle, setReviewTitle] = useState('');
  const [reviewComment, setReviewComment] = useState('');

  if (orderQuery.isLoading) {
    return (
      <View style={styles.screen}>
        <Appbar.Header style={styles.header}>
          <Appbar.BackAction onPress={() => router.back()} />
          <Appbar.Content title={t('orders.title')} />
        </Appbar.Header>
        <View style={styles.center}>
          <ActivityIndicator size="large" color={azColors.primary} />
        </View>
      </View>
    );
  }

  if (!order) {
    return (
      <View style={styles.screen}>
        <Appbar.Header style={styles.header}>
          <Appbar.BackAction onPress={() => router.back()} />
          <Appbar.Content title={t('orders.title')} />
        </Appbar.Header>
        <EmptyState
          icon="file-document-alert-outline"
          title="Order not found"
          subtitle="Unable to load this order."
          ctaLabel={t('app.retry')}
          onCtaPress={() => void orderQuery.refetch()}
        />
      </View>
    );
  }

  const paymentMethod = asStr(order.paymentMethod) ?? 'CASH_ON_DELIVERY';
  const canCancel = order.orderStatus === 'PENDING';
  const canPayNow =
    paymentMethod === 'PAYSTATION' &&
    order.paymentStatus !== 'PAID' &&
    order.orderStatus !== 'CANCELLED';
  const canReview = order.orderStatus === 'DELIVERED';
  const primaryShipment = order.shipments?.[0] ?? null;
  const trackingNumber = asStr(primaryShipment?.trackingNumber);

  const handleCancelOrder = async () => {
    setBusyAction('cancel');
    try {
      await ordersControllerCancelOrder(order.id, {
        reason: cancelReason.trim() || 'Cancelled by customer',
      });
      analytics.track('order_cancelled', { orderId: order.id });
      setCancelDialogVisible(false);
      setSnackMsg('Order cancelled successfully.');
      void orderQuery.refetch();
    } catch (err) {
      setSnackMsg(err instanceof ApiError ? err.message : t('app.errorSubtitle'));
    } finally {
      setBusyAction(null);
    }
  };

  const handlePayNow = async () => {
    setBusyAction('pay');
    try {
      const initRes = await paystationControllerInitiate({
        orderId: order.id,
        callbackUrl: PAYSTATION_MOBILE_CALLBACK_URL,
      });
      if (initRes.status !== 200 || !initRes.data.payment_url) {
        setSnackMsg('Unable to start PayStation checkout.');
        return;
      }
      const invoice = initRes.data.invoice_number;
      const result = await WebBrowser.openAuthSessionAsync(
        initRes.data.payment_url,
        PAYSTATION_MOBILE_CALLBACK_URL,
      );
      if (result.type === 'success' && result.url) {
        const parsed = parsePaystationCallbackUrl(result.url);
        await paystationControllerVerify({
          invoice_number: parsed.invoiceNumber ?? invoice,
        });
      } else {
        await paystationControllerGetStatus(invoice);
      }
      void orderQuery.refetch();
      setSnackMsg('Payment status refreshed.');
    } catch (err) {
      setSnackMsg(err instanceof ApiError ? err.message : t('app.errorSubtitle'));
    } finally {
      setBusyAction(null);
    }
  };

  const handleDownloadPdf = async () => {
    setBusyAction('pdf');
    try {
      await generateAndShareOrderPdf(order);
    } catch {
      setSnackMsg('Unable to generate PDF receipt right now.');
    } finally {
      setBusyAction(null);
    }
  };

  const handleReorder = async () => {
    setBusyAction('reorder');
    try {
      let addedCount = 0;
      for (const item of order.items ?? []) {
        const variantId = asStr(item.variantId);
        if (!variantId) continue;
        await addItem(
          {
            variantId,
            productId: variantId,
            title: item.productTitle,
            slug: item.sku,
            sku: item.sku,
            imageUrl: asStr(item.thumbnailUrl),
            price: item.unitPrice,
            quantity: item.quantity,
          },
          'order_reorder',
        );
        addedCount += 1;
      }
      if (addedCount > 0) {
        router.push('/(tabs)/cart' as never);
      } else {
        setSnackMsg('Items from this order are no longer available.');
      }
    } catch (err) {
      setSnackMsg(err instanceof ApiError ? err.message : t('app.errorSubtitle'));
    } finally {
      setBusyAction(null);
    }
  };

  const handleSubmitReview = async () => {
    if (!reviewProductId || !reviewComment.trim()) {
      setSnackMsg('Please enter your review feedback.');
      return;
    }
    setBusyAction('review');
    try {
      await reviewsPublicControllerSubmitReview({
        productId: reviewProductId,
        orderId: order.id,
        rating: reviewRating,
        title: reviewTitle.trim() || undefined,
        comment: reviewComment.trim(),
      });
      setReviewDialogVisible(false);
      setReviewTitle('');
      setReviewComment('');
      setSnackMsg('Thank you! Your review has been submitted.');
    } catch (err) {
      setSnackMsg(err instanceof ApiError ? err.message : t('app.errorSubtitle'));
    } finally {
      setBusyAction(null);
    }
  };

  return (
    <View style={styles.screen} testID="orders.detailScreen">
      <Appbar.Header style={styles.header}>
        <Appbar.BackAction onPress={() => router.back()} />
        <Appbar.Content title={`#${order.orderNumber}`} />
        <Appbar.Action
          testID="orders.downloadPdfAction"
          icon="file-pdf-box"
          disabled={busyAction !== null}
          onPress={() => void handleDownloadPdf()}
        />
      </Appbar.Header>

      <ScrollView contentContainerStyle={styles.scroll}>
        {/* Status Header */}
        <Surface style={styles.card} elevation={1}>
          <View style={styles.rowBetween}>
            <Text variant="titleMedium" style={styles.boldNavy}>
              Order #{order.orderNumber}
            </Text>
            <Chip
              compact
              textStyle={{ color: statusColor(order.orderStatus), fontWeight: '700' }}
              style={styles.statusChip}
            >
              {order.orderStatus}
            </Chip>
          </View>
          <Text variant="bodySmall" style={styles.muted}>
            Placed on {new Date(order.createdAt).toLocaleString('en-GB')}
          </Text>
          <Text variant="bodySmall" style={styles.muted}>
            Payment: {paymentMethod} ({order.paymentStatus}) • Shipment: {order.shipmentStatus}
          </Text>
        </Surface>

        {/* Shipment Tracking */}
        {primaryShipment ? (
          <Surface style={styles.card} elevation={1}>
            <Text variant="titleSmall" style={styles.sectionTitle}>
              {t('orders.trackShipment')}
            </Text>
            <View style={styles.rowBetween}>
              <View style={styles.flex1}>
                <Text variant="labelLarge" style={styles.boldNavy}>
                  {primaryShipment.courierName}
                </Text>
                <Text variant="bodySmall" style={styles.muted}>
                  {trackingNumber ?? 'Tracking pending'} • {primaryShipment.status}
                </Text>
              </View>
              {trackingNumber ? (
                <IconButton
                  testID="orders.copyTrackingButton"
                  icon="content-copy"
                  size={20}
                  onPress={() => {
                    void Clipboard.setStringAsync(trackingNumber).then(() =>
                      setSnackMsg(t('orders.copied')),
                    );
                  }}
                />
              ) : null}
            </View>
            {trackingNumber ? (
              <Button
                testID="orders.openTrackScreenButton"
                mode="outlined"
                icon="map-marker-path"
                onPress={() => router.push(`/track/${trackingNumber}` as never)}
              >
                {t('orders.trackShipment')}
              </Button>
            ) : null}
          </Surface>
        ) : null}

        {/* Status Timeline */}
        {order.statusHistory && order.statusHistory.length > 0 ? (
          <Surface style={styles.card} elevation={1}>
            <Text variant="titleSmall" style={styles.sectionTitle}>
              Order Timeline
            </Text>
            {order.statusHistory.map((step, idx) => (
              <View key={step.id} style={styles.timelineRow}>
                <View style={styles.timelineMarkerCol}>
                  <View
                    style={[
                      styles.timelineDot,
                      idx === 0 && { backgroundColor: azColors.primary },
                    ]}
                  />
                  {idx < (order.statusHistory?.length ?? 0) - 1 ? (
                    <View style={styles.timelineLine} />
                  ) : null}
                </View>
                <View style={styles.timelineContent}>
                  <Text variant="labelLarge" style={styles.boldNavy}>
                    {step.toStatus}
                  </Text>
                  {asStr(step.notes) ? (
                    <Text variant="bodySmall" style={styles.muted}>
                      {asStr(step.notes)}
                    </Text>
                  ) : null}
                  <Text variant="labelSmall" style={styles.muted}>
                    {new Date(step.createdAt).toLocaleString('en-GB')}
                  </Text>
                </View>
              </View>
            ))}
          </Surface>
        ) : null}

        {/* Items Breakdown */}
        <Surface style={styles.card} elevation={1}>
          <Text variant="titleSmall" style={styles.sectionTitle}>
            Items ({order.items?.length ?? 0})
          </Text>
          {(order.items ?? []).map((item, idx) => (
            <View key={item.id}>
              <View style={styles.itemRow}>
                <View style={styles.flex1}>
                  <Text variant="bodyMedium" style={styles.boldNavy}>
                    {item.productTitle}
                  </Text>
                  <Text variant="labelSmall" style={styles.muted}>
                    SKU: {item.sku} • {item.quantity} × {formatBDT(item.unitPrice)}
                  </Text>
                </View>
                <Text variant="labelLarge" style={styles.boldNavy}>
                  {formatBDT(item.totalPrice)}
                </Text>
              </View>
              {canReview ? (
                <Button
                  compact
                  mode="text"
                  style={styles.reviewLink}
                  onPress={() => {
                    setReviewProductId(asStr(item.variantId) ?? item.id);
                    setReviewDialogVisible(true);
                  }}
                >
                  {t('orders.writeReview')}
                </Button>
              ) : null}
              {idx < (order.items?.length ?? 0) - 1 ? <Divider /> : null}
            </View>
          ))}
        </Surface>

        {/* Shipping Address */}
        <Surface style={styles.card} elevation={1}>
          <Text variant="titleSmall" style={styles.sectionTitle}>
            {t('checkout.deliveryAddress')}
          </Text>
          <Text variant="bodyMedium" style={styles.boldNavy}>
            {order.recipientName} • {order.recipientPhone}
          </Text>
          <Text variant="bodySmall" style={styles.muted}>
            {order.shippingStreet}, {order.shippingCity} {order.shippingPostalCode}
          </Text>
        </Surface>

        {/* Financial Summary */}
        <Surface style={styles.card} elevation={1}>
          <SummaryRow label={t('cart.subtotal')} value={formatBDT(order.subtotal)} />
          {order.discountAmount > 0 ? (
            <SummaryRow
              label={t('cart.discount')}
              value={`- ${formatBDT(order.discountAmount)}`}
              color={azColors.success}
            />
          ) : null}
          <SummaryRow label={t('cart.shipping')} value={formatBDT(order.shippingFee)} />
          {order.totalTaxAmount > 0 ? (
            <SummaryRow label={t('cart.taxIncluded')} value={formatBDT(order.totalTaxAmount)} />
          ) : null}
          <Divider style={styles.divider} />
          <View style={styles.rowBetween}>
            <Text variant="titleMedium" style={styles.boldNavy}>
              {t('cart.grandTotal')}
            </Text>
            <Text variant="titleMedium" style={styles.grandTotal}>
              {formatBDT(order.grandTotal)}
            </Text>
          </View>
        </Surface>

        {/* Action Buttons */}
        <View style={styles.actionsWrap}>
          {canPayNow ? (
            <Button
              testID="orders.payNowButton"
              mode="contained"
              buttonColor={azColors.accent}
              loading={busyAction === 'pay'}
              disabled={busyAction !== null}
              onPress={() => void handlePayNow()}
              contentStyle={styles.actionBtnContent}
              style={styles.actionBtn}
            >
              {t('orders.payNow')}
            </Button>
          ) : null}

          <Button
            testID="orders.downloadInvoiceButton"
            mode="contained-tonal"
            icon="file-pdf-box"
            loading={busyAction === 'pdf'}
            disabled={busyAction !== null}
            onPress={() => void handleDownloadPdf()}
            contentStyle={styles.actionBtnContent}
            style={styles.actionBtn}
          >
            {t('orders.downloadInvoice')}
          </Button>

          <Button
            testID="orders.reorderButton"
            mode="outlined"
            icon="cart-plus"
            loading={busyAction === 'reorder'}
            disabled={busyAction !== null}
            onPress={() => void handleReorder()}
            contentStyle={styles.actionBtnContent}
            style={styles.actionBtn}
          >
            {t('orders.reorder')}
          </Button>

          {canCancel ? (
            <Button
              testID="orders.cancelOrderButton"
              mode="outlined"
              textColor={azColors.danger}
              disabled={busyAction !== null}
              onPress={() => setCancelDialogVisible(true)}
              contentStyle={styles.actionBtnContent}
              style={styles.actionBtn}
            >
              {t('orders.cancelOrder')}
            </Button>
          ) : null}
        </View>
      </ScrollView>

      {/* Cancel Dialog */}
      <Portal>
        <Dialog visible={cancelDialogVisible} onDismiss={() => setCancelDialogVisible(false)}>
          <Dialog.Title>{t('orders.cancelOrder')}</Dialog.Title>
          <Dialog.Content>
            <TextInput
              testID="orders.cancelReasonInput"
              mode="outlined"
              label="Reason for cancellation"
              value={cancelReason}
              onChangeText={setCancelReason}
            />
          </Dialog.Content>
          <Dialog.Actions>
            <Button onPress={() => setCancelDialogVisible(false)}>{t('app.cancel')}</Button>
            <Button
              testID="orders.confirmCancelButton"
              textColor={azColors.danger}
              loading={busyAction === 'cancel'}
              onPress={() => void handleCancelOrder()}
            >
              {t('orders.cancelOrder')}
            </Button>
          </Dialog.Actions>
        </Dialog>

        {/* Review Dialog */}
        <Dialog visible={reviewDialogVisible} onDismiss={() => setReviewDialogVisible(false)}>
          <Dialog.Title>{t('orders.writeReview')}</Dialog.Title>
          <Dialog.Content style={styles.reviewDialogBody}>
            <View style={styles.starsRow}>
              {[1, 2, 3, 4, 5].map((star) => (
                <IconButton
                  key={star}
                  icon={star <= reviewRating ? 'star' : 'star-outline'}
                  iconColor="#F59E0B"
                  onPress={() => setReviewRating(star)}
                />
              ))}
            </View>
            <TextInput
              mode="outlined"
              label="Headline (optional)"
              value={reviewTitle}
              onChangeText={setReviewTitle}
            />
            <TextInput
              mode="outlined"
              label="Share your experience"
              multiline
              numberOfLines={3}
              value={reviewComment}
              onChangeText={setReviewComment}
            />
          </Dialog.Content>
          <Dialog.Actions>
            <Button onPress={() => setReviewDialogVisible(false)}>{t('app.cancel')}</Button>
            <Button loading={busyAction === 'review'} onPress={() => void handleSubmitReview()}>
              Submit
            </Button>
          </Dialog.Actions>
        </Dialog>
      </Portal>

      <Snackbar visible={Boolean(snackMsg)} onDismiss={() => setSnackMsg(null)} duration={2600}>
        {snackMsg}
      </Snackbar>
    </View>
  );
}

function SummaryRow({ label, value, color }: { label: string; value: string; color?: string }) {
  return (
    <View style={styles.rowBetween}>
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
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  scroll: { padding: spacing.md, gap: spacing.sm, paddingBottom: 48 },
  card: {
    backgroundColor: azColors.surface,
    borderRadius: radius.md,
    padding: spacing.md,
    gap: spacing.xs,
  },
  rowBetween: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: spacing.xs,
  },
  flex1: { flex: 1 },
  boldNavy: { color: azColors.navy, fontWeight: '700' },
  sectionTitle: { color: azColors.navy, fontWeight: '700', marginBottom: 4 },
  muted: { color: azColors.muted },
  statusChip: { backgroundColor: azColors.page },
  timelineRow: { flexDirection: 'row', gap: spacing.sm },
  timelineMarkerCol: { alignItems: 'center', width: 16 },
  timelineDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: azColors.muted,
    marginTop: 5,
  },
  timelineLine: { flex: 1, width: 2, backgroundColor: azColors.border, marginVertical: 2 },
  timelineContent: { flex: 1, paddingBottom: spacing.sm, gap: 2 },
  itemRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: spacing.xs,
    gap: spacing.sm,
  },
  reviewLink: { alignSelf: 'flex-start' },
  divider: { marginVertical: spacing.xs },
  grandTotal: { color: azColors.primary, fontWeight: '800' },
  actionsWrap: { gap: spacing.xs, marginTop: spacing.xs },
  actionBtn: { borderRadius: radius.md },
  actionBtnContent: { minHeight: 48 },
  reviewDialogBody: { gap: spacing.sm },
  starsRow: { flexDirection: 'row', justifyContent: 'center' },
});
