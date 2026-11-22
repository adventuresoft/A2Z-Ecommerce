import React, { useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { ActivityIndicator, Appbar, Chip, Surface, Text } from 'react-native-paper';
import { FlashList } from '@shopify/flash-list';
import { useInfiniteQuery } from '@tanstack/react-query';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import {
  normalizePage,
  ordersControllerGetMyOrders,
  type OrderResponseDto,
  type OrdersControllerGetMyOrdersOrderStatus,
} from '@repo/api-client';
import { STALE_TIMES } from '@/shared/api/query-client';
import { azColors, radius, spacing } from '@/shared/theme';
import { formatBDT } from '@/shared/utils/format-bdt';
import { EmptyState } from '@/shared/components/empty-state';

const STATUS_FILTERS: { label: string; value?: OrdersControllerGetMyOrdersOrderStatus }[] = [
  { label: 'All' },
  { label: 'Pending', value: 'PENDING' },
  { label: 'Processing', value: 'PROCESSING' },
  { label: 'Shipped', value: 'SHIPPED' },
  { label: 'Delivered', value: 'DELIVERED' },
  { label: 'Cancelled', value: 'CANCELLED' },
];

export function statusColor(status: string): string {
  switch (status) {
    case 'DELIVERED':
    case 'PAID':
      return azColors.success;
    case 'CANCELLED':
    case 'FAILED':
      return azColors.danger;
    case 'SHIPPED':
    case 'PROCESSING':
      return azColors.primary;
    default:
      return azColors.accentText;
  }
}

export function OrdersListScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const [selectedStatus, setSelectedStatus] = useState<
    OrdersControllerGetMyOrdersOrderStatus | undefined
  >(undefined);

  const query = useInfiniteQuery({
    queryKey: ['/api/v1/orders', { orderStatus: selectedStatus }],
    initialPageParam: 1,
    staleTime: STALE_TIMES.ORDERS_AND_NOTIFICATIONS,
    queryFn: ({ pageParam }) =>
      ordersControllerGetMyOrders({
        page: pageParam,
        limit: 15,
        orderStatus: selectedStatus,
      }),
    getNextPageParam: (lastPage) => {
      const page = normalizePage<OrderResponseDto>(lastPage.data);
      return page.hasNextPage ? page.page + 1 : undefined;
    },
  });

  const orders = useMemo(
    () =>
      (query.data?.pages ?? []).flatMap(
        (page) => normalizePage<OrderResponseDto>(page.data).items,
      ),
    [query.data],
  );

  return (
    <View style={styles.screen} testID="orders.listScreen">
      <Appbar.Header style={styles.header}>
        <Appbar.BackAction onPress={() => router.back()} />
        <Appbar.Content title={t('orders.title')} />
      </Appbar.Header>

      <View style={styles.filterWrap}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.filterChips}
        >
          {STATUS_FILTERS.map((f) => (
            <Chip
              key={f.label}
              testID={`orders.filter.${f.value ?? 'ALL'}`}
              selected={selectedStatus === f.value}
              onPress={() => setSelectedStatus(f.value)}
            >
              {f.label}
            </Chip>
          ))}
        </ScrollView>
      </View>

      {query.isLoading ? (
        <View style={styles.loader}>
          <ActivityIndicator size="large" color={azColors.primary} />
        </View>
      ) : orders.length === 0 ? (
        <EmptyState
          icon="package-variant-closed"
          title={t('orders.emptyTitle')}
          subtitle={t('orders.emptySub')}
          ctaLabel={t('cart.startShopping')}
          onCtaPress={() => router.replace('/(tabs)' as never)}
        />
      ) : (
        <FlashList
          data={orders}
          keyExtractor={(item) => item.id}
          refreshing={query.isRefetching}
          onRefresh={() => void query.refetch()}
          contentContainerStyle={styles.listContent}
          onEndReached={() => {
            if (query.hasNextPage && !query.isFetchingNextPage) {
              void query.fetchNextPage();
            }
          }}
          onEndReachedThreshold={0.4}
          ListFooterComponent={
            query.isFetchingNextPage ? (
              <ActivityIndicator style={styles.footerLoader} color={azColors.primary} />
            ) : null
          }
          renderItem={({ item }) => (
            <Pressable
              testID={`orders.card.${item.orderNumber}`}
              onPress={() => router.push(`/orders/${item.id}` as never)}
            >
              <Surface style={styles.card} elevation={1}>
                <View style={styles.rowBetween}>
                  <Text variant="titleSmall" style={styles.orderNum}>
                    #{item.orderNumber}
                  </Text>
                  <Chip
                    compact
                    textStyle={[styles.statusText, { color: statusColor(item.orderStatus) }]}
                    style={styles.statusChip}
                  >
                    {item.orderStatus}
                  </Chip>
                </View>

                <Text variant="labelSmall" style={styles.muted}>
                  {new Date(item.createdAt).toLocaleDateString('en-GB')} •{' '}
                  {item.items?.length ?? 0} item(s) • Payment: {item.paymentStatus}
                </Text>

                <View style={styles.rowBetween}>
                  <Text variant="bodySmall" style={styles.muted} numberOfLines={1}>
                    {item.shippingCity}
                  </Text>
                  <Text variant="titleSmall" style={styles.total}>
                    {formatBDT(item.grandTotal)}
                  </Text>
                </View>
              </Surface>
            </Pressable>
          )}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: azColors.page },
  header: { backgroundColor: azColors.surface },
  filterWrap: {
    backgroundColor: azColors.surface,
    borderBottomWidth: 1,
    borderBottomColor: azColors.border,
  },
  filterChips: { paddingHorizontal: spacing.md, paddingVertical: spacing.xs, gap: spacing.xs },
  loader: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  listContent: { padding: spacing.md },
  footerLoader: { marginVertical: spacing.md },
  card: {
    backgroundColor: azColors.surface,
    borderRadius: radius.md,
    padding: spacing.md,
    marginBottom: spacing.sm,
    gap: 6,
  },
  rowBetween: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: spacing.xs,
  },
  orderNum: { color: azColors.navy, fontWeight: '700' },
  statusChip: { backgroundColor: azColors.page },
  statusText: { fontSize: 11, fontWeight: '700' },
  muted: { color: azColors.muted },
  total: { color: azColors.primary, fontWeight: '800' },
});
