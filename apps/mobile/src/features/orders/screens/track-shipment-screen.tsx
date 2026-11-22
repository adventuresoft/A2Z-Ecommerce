import React, { useState } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import {
  ActivityIndicator,
  Appbar,
  Button,
  Chip,
  Surface,
  Text,
  TextInput,
} from 'react-native-paper';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { useShipmentsControllerTrackShipment } from '@repo/api-client';
import { azColors, radius, spacing } from '@/shared/theme';
import { EmptyState } from '@/shared/components/empty-state';

export function TrackShipmentScreen({ initialTrackingNumber = '' }: { initialTrackingNumber?: string }) {
  const { t } = useTranslation();
  const router = useRouter();
  const [input, setInput] = useState(initialTrackingNumber);
  const [activeCode, setActiveCode] = useState(initialTrackingNumber.trim());

  const trackQuery = useShipmentsControllerTrackShipment(activeCode, {
    query: { enabled: activeCode.length > 0 },
  });

  const tracking = trackQuery.data?.data ?? null;

  return (
    <View style={styles.screen} testID="track.screen">
      <Appbar.Header style={styles.header}>
        <Appbar.BackAction onPress={() => router.back()} />
        <Appbar.Content title={t('orders.trackShipment')} />
      </Appbar.Header>

      <View style={styles.searchBox}>
        <TextInput
          testID="track.input"
          mode="outlined"
          dense
          placeholder={t('orders.trackingNumber')}
          value={input}
          onChangeText={setInput}
          style={styles.input}
        />
        <Button
          testID="track.submitButton"
          mode="contained"
          onPress={() => setActiveCode(input.trim())}
          disabled={!input.trim()}
        >
          Track
        </Button>
      </View>

      {trackQuery.isLoading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color={azColors.primary} />
        </View>
      ) : !activeCode ? (
        <EmptyState
          icon="truck-delivery-outline"
          title={t('orders.trackShipment')}
          subtitle="Enter your courier tracking number to see live shipment milestones."
        />
      ) : !tracking ? (
        <EmptyState
          icon="magnify-close"
          title="Tracking number not found"
          subtitle="Double-check the tracking ID from your order details or SMS."
          ctaLabel={t('app.retry')}
          onCtaPress={() => void trackQuery.refetch()}
        />
      ) : (
        <ScrollView contentContainerStyle={styles.scroll}>
          <Surface style={styles.card} elevation={1}>
            <View style={styles.rowBetween}>
              <Text variant="titleMedium" style={styles.boldNavy}>
                {tracking.courierName}
              </Text>
              <Chip compact style={styles.statusChip}>
                {tracking.status}
              </Chip>
            </View>
            <Text variant="bodySmall" style={styles.muted}>
              {t('orders.trackingNumber')}: {tracking.trackingNumber}
            </Text>
          </Surface>

          <Surface style={styles.card} elevation={1}>
            <Text variant="titleSmall" style={styles.sectionTitle}>
              Shipment Milestones
            </Text>
            {(tracking.statusHistory ?? []).map((ev, idx) => (
              <View key={ev.id} style={styles.eventRow}>
                <View style={[styles.dot, idx === 0 && { backgroundColor: azColors.primary }]} />
                <View style={styles.eventBody}>
                  <Text variant="labelLarge" style={styles.boldNavy}>
                    {ev.toStatus}
                  </Text>
                  {typeof ev.notes === 'string' && ev.notes ? (
                    <Text variant="bodySmall" style={styles.muted}>
                      {ev.notes}
                    </Text>
                  ) : null}
                  <Text variant="labelSmall" style={styles.muted}>
                    {new Date(ev.createdAt).toLocaleString('en-GB')}
                  </Text>
                </View>
              </View>
            ))}
          </Surface>
        </ScrollView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: azColors.page },
  header: { backgroundColor: azColors.surface },
  searchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    padding: spacing.md,
    backgroundColor: azColors.surface,
    borderBottomWidth: 1,
    borderBottomColor: azColors.border,
  },
  input: { flex: 1, backgroundColor: azColors.surface },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  scroll: { padding: spacing.md, gap: spacing.sm },
  card: {
    backgroundColor: azColors.surface,
    borderRadius: radius.md,
    padding: spacing.md,
    gap: spacing.xs,
  },
  rowBetween: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  boldNavy: { color: azColors.navy, fontWeight: '700' },
  sectionTitle: { color: azColors.navy, fontWeight: '700', marginBottom: 4 },
  muted: { color: azColors.muted },
  statusChip: { backgroundColor: azColors.primarySoft },
  eventRow: { flexDirection: 'row', gap: spacing.sm, paddingVertical: 6 },
  dot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: azColors.muted,
    marginTop: 5,
  },
  eventBody: { flex: 1, gap: 2 },
});
