import React from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { Button, Divider, Modal, Portal, Surface, Text } from 'react-native-paper';
import { useTranslation } from 'react-i18next';
import { useCouponsControllerGetActiveCoupons } from '@repo/api-client';
import { STALE_TIMES } from '@/shared/api/query-client';
import { azColors, radius, spacing } from '@/shared/theme';
import { formatBDT } from '@/shared/utils/format-bdt';

interface CouponsSheetProps {
  visible: boolean;
  appliedCode?: string | null;
  subtotal?: number;
  onDismiss: () => void;
  onSelectCoupon: (code: string) => void;
}

function asNumber(val: unknown): number | null {
  if (typeof val === 'number' && Number.isFinite(val)) return val;
  if (typeof val === 'string' && val.trim() !== '') {
    const n = Number(val);
    return Number.isFinite(n) ? n : null;
  }
  return null;
}

function asString(val: unknown): string | null {
  return typeof val === 'string' && val.trim().length > 0 ? val : null;
}

export function CouponsSheet({
  visible,
  appliedCode,
  subtotal = 0,
  onDismiss,
  onSelectCoupon,
}: CouponsSheetProps) {
  const { t } = useTranslation();
  const couponsQuery = useCouponsControllerGetActiveCoupons({
    query: { enabled: visible, staleTime: STALE_TIMES.TAXONOMY_AND_SETTINGS },
  });

  const coupons = couponsQuery.data?.data ?? [];

  return (
    <Portal>
      <Modal
        visible={visible}
        onDismiss={onDismiss}
        contentContainerStyle={styles.modalContainer}
      >
        <View style={styles.header}>
          <Text variant="titleMedium" style={styles.title}>
            {t('cart.availableCoupons')}
          </Text>
          <Button compact onPress={onDismiss}>
            {t('app.cancel')}
          </Button>
        </View>
        <Divider />

        <ScrollView contentContainerStyle={styles.list}>
          {coupons.length === 0 ? (
            <Text variant="bodyMedium" style={styles.emptyText}>
              No active coupons available right now.
            </Text>
          ) : (
            coupons.map((coupon) => {
              const minOrder = asNumber(coupon.minOrderAmount) ?? 0;
              const eligible = subtotal <= 0 || subtotal >= minOrder;
              const isApplied =
                appliedCode?.toUpperCase() === coupon.code.toUpperCase();
              const discountLabel =
                coupon.discountType === 'PERCENTAGE'
                  ? `${coupon.discountValue}% OFF`
                  : `${formatBDT(coupon.discountValue)} OFF`;

              return (
                <Surface key={coupon.id} style={styles.couponCard} elevation={1}>
                  <View style={styles.couponTop}>
                    <View style={styles.codeBadge}>
                      <Text variant="labelLarge" style={styles.codeText}>
                        {coupon.code}
                      </Text>
                    </View>
                    <Text variant="labelLarge" style={styles.discountText}>
                      {discountLabel}
                    </Text>
                  </View>
                  {asString(coupon.description) ? (
                    <Text variant="bodySmall" style={styles.descText}>
                      {asString(coupon.description)}
                    </Text>
                  ) : null}
                  {minOrder > 0 ? (
                    <Text variant="labelSmall" style={styles.minOrderText}>
                      Min. order: {formatBDT(minOrder)}
                    </Text>
                  ) : null}
                  <Button
                    testID={`coupons.apply.${coupon.code}`}
                    mode={isApplied ? 'outlined' : 'contained'}
                    compact
                    disabled={!eligible}
                    onPress={() => {
                      onSelectCoupon(coupon.code);
                      onDismiss();
                    }}
                    style={styles.applyBtn}
                  >
                    {isApplied ? 'Applied' : t('app.apply')}
                  </Button>
                </Surface>
              );
            })
          )}
        </ScrollView>
      </Modal>
    </Portal>
  );
}

const styles = StyleSheet.create({
  modalContainer: {
    backgroundColor: azColors.surface,
    margin: spacing.md,
    borderRadius: radius.lg,
    maxHeight: '75%',
    overflow: 'hidden',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  title: { fontWeight: '700', color: azColors.navy },
  list: { padding: spacing.md, gap: spacing.sm },
  emptyText: { color: azColors.muted, textAlign: 'center', paddingVertical: spacing.lg },
  couponCard: {
    padding: spacing.md,
    borderRadius: radius.md,
    backgroundColor: azColors.page,
    gap: spacing.xs,
  },
  couponTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  codeBadge: {
    backgroundColor: azColors.primarySoft,
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
    borderRadius: radius.sm,
    borderWidth: 1,
    borderStyle: 'dashed',
    borderColor: azColors.primary,
  },
  codeText: { color: azColors.primary, fontWeight: '800' },
  discountText: { color: azColors.accentText, fontWeight: '700' },
  descText: { color: azColors.navy },
  minOrderText: { color: azColors.muted },
  applyBtn: { alignSelf: 'flex-end', marginTop: 4 },
});
