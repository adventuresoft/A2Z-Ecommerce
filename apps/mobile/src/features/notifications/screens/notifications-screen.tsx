import React, { useMemo } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { ActivityIndicator, Appbar, Button, Surface, Text } from 'react-native-paper';
import { FlashList } from '@shopify/flash-list';
import { useInfiniteQuery } from '@tanstack/react-query';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import {
  normalizePage,
  notificationsUserControllerGetMyNotifications,
  notificationsUserControllerMarkAllRead,
  notificationsUserControllerMarkAsRead,
  type NotificationResponseDto,
} from '@repo/api-client';
import { STALE_TIMES } from '@/shared/api/query-client';
import { azColors, radius, spacing } from '@/shared/theme';
import { resolveSafeInternalRoute } from '@/shared/utils/deep-link';
import { EmptyState } from '@/shared/components/empty-state';

export function NotificationsScreen() {
  const { t } = useTranslation();
  const router = useRouter();

  const query = useInfiniteQuery({
    queryKey: ['/api/v1/notifications/my'],
    initialPageParam: 1,
    staleTime: STALE_TIMES.ORDERS_AND_NOTIFICATIONS,
    queryFn: ({ pageParam }) =>
      notificationsUserControllerGetMyNotifications({ page: pageParam, limit: 20 }),
    getNextPageParam: (lastPage) => {
      const normalized = normalizePage<NotificationResponseDto>(lastPage.data);
      return normalized.hasNextPage ? normalized.page + 1 : undefined;
    },
  });

  const items = useMemo(
    () =>
      (query.data?.pages ?? []).flatMap(
        (page) => normalizePage<NotificationResponseDto>(page.data).items,
      ),
    [query.data],
  );

  const handleMarkAllRead = async () => {
    await notificationsUserControllerMarkAllRead();
    void query.refetch();
  };

  const handlePressItem = async (item: NotificationResponseDto) => {
    if (!item.isRead) {
      void notificationsUserControllerMarkAsRead(item.id).then(() => query.refetch());
    }
    const route = resolveSafeInternalRoute(item.linkUrl);
    if (route) {
      router.push(route as never);
    }
  };

  return (
    <View style={styles.screen} testID="notifications.screen">
      <Appbar.Header style={styles.header}>
        <Appbar.BackAction onPress={() => router.back()} />
        <Appbar.Content title={t('account.notifications')} />
        {items.some((i) => !i.isRead) ? (
          <Button compact onPress={() => void handleMarkAllRead()}>
            Mark all read
          </Button>
        ) : null}
      </Appbar.Header>

      {query.isLoading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color={azColors.primary} />
        </View>
      ) : items.length === 0 ? (
        <EmptyState
          icon="bell-outline"
          title="No notifications yet"
          subtitle="Order updates, shipping milestones, and exclusive deals will appear here."
        />
      ) : (
        <FlashList
          data={items}
          keyExtractor={(item) => item.id}
          refreshing={query.isRefetching}
          onRefresh={() => void query.refetch()}
          contentContainerStyle={styles.list}
          onEndReached={() => {
            if (query.hasNextPage && !query.isFetchingNextPage) {
              void query.fetchNextPage();
            }
          }}
          renderItem={({ item }) => (
            <Pressable onPress={() => void handlePressItem(item)}>
              <Surface
                style={[styles.card, !item.isRead && styles.cardUnread]}
                elevation={1}
              >
                <View style={styles.rowBetween}>
                  <Text variant="titleSmall" style={styles.title}>
                    {item.title}
                  </Text>
                  {!item.isRead ? <View style={styles.unreadDot} /> : null}
                </View>
                <Text variant="bodySmall" style={styles.message}>
                  {item.message}
                </Text>
                <Text variant="labelSmall" style={styles.date}>
                  {new Date(item.createdAt).toLocaleString('en-GB')}
                </Text>
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
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  list: { padding: spacing.md },
  card: {
    backgroundColor: azColors.surface,
    borderRadius: radius.md,
    padding: spacing.md,
    marginBottom: spacing.xs,
    gap: 4,
  },
  cardUnread: {
    borderLeftWidth: 3,
    borderLeftColor: azColors.primary,
    backgroundColor: '#F8FAFF',
  },
  rowBetween: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  title: { color: azColors.navy, fontWeight: '700', flex: 1 },
  unreadDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: azColors.primary },
  message: { color: azColors.navy, lineHeight: 20 },
  date: { color: azColors.muted },
});
