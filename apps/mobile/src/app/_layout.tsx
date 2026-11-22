import React, { useEffect } from 'react';
import { StyleSheet } from 'react-native';
import { Stack, useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import * as Notifications from 'expo-notifications';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { PaperProvider } from 'react-native-paper';
import { PersistQueryClientProvider } from '@tanstack/react-query-persist-client';
import { configureApiClient } from '@repo/api-client';
import '@/shared/i18n';
import { env } from '@/shared/config/env';
import { azLightTheme } from '@/shared/theme';
import { initObservability } from '@/shared/analytics';
import {
  mmkvQueryPersister,
  queryClient,
  setupNetInfoOnlineManager,
  shouldPersistQueryKey,
} from '@/shared/api/query-client';
import { resolveSafeInternalRoute } from '@/shared/utils/deep-link';
import { ErrorBoundary } from '@/shared/components/error-boundary';
import { OfflineBanner } from '@/shared/components/offline-banner';
import { VersionGateDialog } from '@/shared/components/version-gate-dialog';
import { hydrateAuthSession } from '@/features/auth/auth-service';
import { initPushChannels } from '@/features/notifications/push-service';
// Ensure post-login & pre-logout lifecycle hooks are registered at startup
import '@/features/cart/cart-store';
import '@/features/wishlist/wishlist-store';

initObservability();
configureApiClient({ baseUrl: env.API_URL });

function NotificationDeepLinkHandler() {
  const router = useRouter();
  const lastResponse = Notifications.useLastNotificationResponse();

  useEffect(() => {
    const rawLink = lastResponse?.notification?.request?.content?.data?.linkUrl;
    const safeRoute = resolveSafeInternalRoute(rawLink);
    if (safeRoute) {
      router.push(safeRoute as never);
    }
  }, [lastResponse, router]);

  return null;
}

export default function RootLayout() {
  useEffect(() => {
    const unsubscribeNetInfo = setupNetInfoOnlineManager();
    void initPushChannels();
    void hydrateAuthSession();
    return () => {
      unsubscribeNetInfo();
    };
  }, []);

  return (
    <GestureHandlerRootView style={styles.root}>
      <SafeAreaProvider>
        <PaperProvider theme={azLightTheme}>
          <ErrorBoundary>
            <PersistQueryClientProvider
              client={queryClient}
              persistOptions={{
                persister: mmkvQueryPersister,
                dehydrateOptions: {
                  shouldDehydrateQuery: (query) =>
                    query.state.status === 'success' &&
                    shouldPersistQueryKey(query.queryKey),
                },
              }}
            >
              <StatusBar style="dark" />
              <OfflineBanner />
              <VersionGateDialog />
              <NotificationDeepLinkHandler />
              <Stack
                screenOptions={{
                  headerShown: false,
                  contentStyle: { backgroundColor: azLightTheme.colors.background },
                }}
              >
                <Stack.Screen name="(tabs)" />
                <Stack.Screen name="(auth)" options={{ presentation: 'modal' }} />
                <Stack.Screen name="search" />
                <Stack.Screen name="category/[slug]" />
                <Stack.Screen name="collection/[slug]" />
                <Stack.Screen name="product/[slug]" />
                <Stack.Screen name="addresses/index" />
                <Stack.Screen name="checkout/index" />
                <Stack.Screen name="checkout/payment-callback" />
                <Stack.Screen name="checkout/success" />
                <Stack.Screen name="orders/index" />
                <Stack.Screen name="orders/[id]" />
                <Stack.Screen name="track/[trackingNumber]" />
                <Stack.Screen name="notifications/index" />
              </Stack>
            </PersistQueryClientProvider>
          </ErrorBoundary>
        </PaperProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
});
