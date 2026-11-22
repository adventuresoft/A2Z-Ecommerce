import { QueryClient, onlineManager } from '@tanstack/react-query';
import { createSyncStoragePersister } from '@tanstack/query-sync-storage-persister';
import NetInfo from '@react-native-community/netinfo';
import { ApiError } from '@repo/api-client';
import { queryCacheStorage } from '../storage/mmkv';

export const STALE_TIMES = {
  LOCATIONS: 24 * 60 * 60 * 1000, // 24 hours
  TAXONOMY_AND_SETTINGS: 30 * 60 * 1000, // 30 minutes
  HOME_CURATED: 5 * 60 * 1000, // 5 minutes
  CATALOG_LIST: 2 * 60 * 1000, // 2 minutes
  PRODUCT_DETAIL: 60 * 1000, // 1 minute
  ORDERS_AND_NOTIFICATIONS: 30 * 1000, // 30 seconds
  LIVE_CHECKOUT: 0, // Never stale
} as const;

const PERSISTABLE_QUERY_PREFIXES = [
  '/api/v1/locations',
  '/api/v1/categories',
  '/api/v1/brands',
  '/api/v1/attributes',
  '/api/v1/settings',
  '/api/v1/products/curated',
  '/api/v1/collections/home',
];

export function shouldPersistQueryKey(queryKey: readonly unknown[]): boolean {
  const first = queryKey[0];
  if (typeof first !== 'string') return false;
  return PERSISTABLE_QUERY_PREFIXES.some((prefix) => first.startsWith(prefix));
}

export function setupNetInfoOnlineManager(): () => void {
  return NetInfo.addEventListener((state) => {
    const isOnline = Boolean(state.isConnected && state.isInternetReachable !== false);
    onlineManager.setOnline(isOnline);
  });
}

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: STALE_TIMES.CATALOG_LIST,
      gcTime: 24 * 60 * 60 * 1000,
      retry: (failureCount, error) => {
        if (error instanceof ApiError) {
          // Never retry client errors (400/401/403/404/409/422)
          if (error.status >= 400 && error.status < 500 && error.status !== 408 && error.status !== 429) {
            return false;
          }
        }
        return failureCount < 2;
      },
      retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 4000),
      refetchOnReconnect: true,
      refetchOnWindowFocus: false,
    },
    mutations: {
      retry: 0,
    },
  },
});

export const mmkvQueryPersister = createSyncStoragePersister({
  storage: {
    getItem: (key) => queryCacheStorage.getString(key) ?? null,
    setItem: (key, value) => queryCacheStorage.set(key, value),
    removeItem: (key) => queryCacheStorage.remove(key),
  },
  key: 'AZ_REACT_QUERY_OFFLINE_CACHE',
});
