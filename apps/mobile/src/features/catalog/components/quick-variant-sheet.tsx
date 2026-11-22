import React, { useEffect, useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { Button, Chip, Modal, Portal, Text } from 'react-native-paper';
import { useTranslation } from 'react-i18next';
import { azColors, radius, spacing } from '@/shared/theme';
import { PriceText } from '@/shared/components/price-text';
import {
  extractAttributeGroups,
  getEffectivePrice,
  getInitialVariantSelection,
  getStockStatus,
  resolveSelectedVariant,
  type ResolvableVariant,
} from '../utils/variant-resolver';

interface QuickVariantSheetProps {
  visible: boolean;
  productTitle: string;
  variants: ResolvableVariant[];
  onDismiss: () => void;
  onConfirmAdd: (variant: ResolvableVariant) => void;
}

export function QuickVariantSheet({
  visible,
  productTitle,
  variants,
  onDismiss,
  onConfirmAdd,
}: QuickVariantSheetProps) {
  const { t } = useTranslation();
  const [selected, setSelected] = useState<Record<string, string>>({});

  useEffect(() => {
    if (visible && variants.length > 0) {
      setSelected(getInitialVariantSelection(variants));
    }
  }, [visible, variants]);

  const groups = useMemo(
    () => extractAttributeGroups(variants, selected),
    [variants, selected],
  );
  const activeVariant = useMemo(
    () => resolveSelectedVariant(variants, selected),
    [variants, selected],
  );
  const stockStatus = getStockStatus(activeVariant);

  return (
    <Portal>
      <Modal
        visible={visible}
        onDismiss={onDismiss}
        contentContainerStyle={styles.sheet}
      >
        <Text variant="titleMedium" numberOfLines={2} style={styles.title}>
          {productTitle}
        </Text>

        {activeVariant ? (
          <View style={styles.priceRow}>
            <PriceText
              price={getEffectivePrice(activeVariant)}
              regularPrice={activeVariant.regularPrice}
              size="lg"
            />
            <Text
              style={[
                styles.stockLabel,
                stockStatus === 'OUT_OF_STOCK' && styles.stockOut,
                stockStatus === 'LOW_STOCK' && styles.stockLow,
              ]}
            >
              {stockStatus === 'OUT_OF_STOCK'
                ? t('catalog.outOfStock')
                : stockStatus === 'LOW_STOCK'
                  ? t('catalog.lowStock', { count: activeVariant.stockQuantity })
                  : t('catalog.inStock')}
            </Text>
          </View>
        ) : null}

        <ScrollView style={styles.scroll} showsVerticalScrollIndicator={false}>
          {groups.map((group) => (
            <View key={group.name} style={styles.group}>
              <Text variant="labelLarge" style={styles.groupLabel}>
                {group.name}: {selected[group.name] ?? ''}
              </Text>
              <View style={styles.optionsRow}>
                {group.options.map((option) => {
                  const isSelected = selected[group.name] === option.value;
                  if (group.type === 'COLOR' && option.colorCode) {
                    return (
                      <Pressable
                        key={option.value}
                        disabled={!option.available}
                        onPress={() =>
                          setSelected((prev) => ({ ...prev, [group.name]: option.value }))
                        }
                        accessibilityRole="radio"
                        accessibilityState={{ selected: isSelected, disabled: !option.available }}
                        accessibilityLabel={`${group.name} ${option.value}`}
                        style={[
                          styles.swatchOuter,
                          isSelected && styles.swatchSelected,
                          !option.available && styles.swatchDisabled,
                        ]}
                      >
                        <View
                          style={[
                            styles.swatchInner,
                            { backgroundColor: option.colorCode },
                          ]}
                        />
                      </Pressable>
                    );
                  }
                  return (
                    <Chip
                      key={option.value}
                      selected={isSelected}
                      disabled={!option.available}
                      mode={isSelected ? 'flat' : 'outlined'}
                      onPress={() =>
                        setSelected((prev) => ({ ...prev, [group.name]: option.value }))
                      }
                      style={isSelected ? styles.selectedChip : undefined}
                    >
                      {option.value}
                    </Chip>
                  );
                })}
              </View>
            </View>
          ))}
        </ScrollView>

        <Button
          testID="catalog.quickVariant.confirmButton"
          mode="contained"
          disabled={!activeVariant || stockStatus === 'OUT_OF_STOCK'}
          onPress={() => {
            if (activeVariant) {
              onConfirmAdd(activeVariant);
              onDismiss();
            }
          }}
          style={styles.cta}
          contentStyle={styles.ctaContent}
        >
          {t('catalog.addToCart')}
        </Button>
      </Modal>
    </Portal>
  );
}

const styles = StyleSheet.create({
  sheet: {
    backgroundColor: azColors.surface,
    margin: spacing.md,
    padding: spacing.lg,
    borderRadius: radius.lg,
    maxHeight: '80%',
  },
  title: { color: azColors.navy, fontWeight: '700', lineHeight: 24 },
  priceRow: {
    marginTop: spacing.sm,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  stockLabel: { fontSize: 12, fontWeight: '700', color: azColors.success },
  stockLow: { color: azColors.accentText },
  stockOut: { color: azColors.danger },
  scroll: { marginTop: spacing.md },
  group: { marginBottom: spacing.md },
  groupLabel: { color: azColors.navy, marginBottom: spacing.xs },
  optionsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.xs },
  swatchOuter: {
    width: 38,
    height: 38,
    borderRadius: 19,
    borderWidth: 2,
    borderColor: azColors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  swatchSelected: { borderColor: azColors.primary },
  swatchDisabled: { opacity: 0.3 },
  swatchInner: { width: 28, height: 28, borderRadius: 14 },
  selectedChip: { backgroundColor: azColors.primarySoft },
  cta: { marginTop: spacing.sm, borderRadius: radius.md },
  ctaContent: { minHeight: 48 },
});
