import {
  authControllerLogout,
  authControllerMe,
  authControllerRefresh,
  configureApiClient,
  type AuthUserSummaryDto,
} from '@repo/api-client';
import { env } from '@/shared/config/env';
import { analytics } from '@/shared/analytics';
import { queryClient } from '@/shared/api/query-client';
import {
  clearSecureRefreshToken,
  getCachedDeviceId,
  getOrCreateDeviceId,
  getSecureRefreshToken,
  setSecureRefreshToken,
} from '@/shared/storage/secure-store';
import {
  getInMemoryAccessToken,
  setInMemoryAccessToken,
  useAuthStore,
} from './auth-store';

type AuthLifecycleHook = () => Promise<void> | void;

const postLoginHooks = new Set<AuthLifecycleHook>();
const preLogoutHooks = new Set<AuthLifecycleHook>();

export function registerPostLoginHook(hook: AuthLifecycleHook): () => void {
  postLoginHooks.add(hook);
  return () => postLoginHooks.delete(hook);
}

export function registerPreLogoutHook(hook: AuthLifecycleHook): () => void {
  preLogoutHooks.add(hook);
  return () => preLogoutHooks.delete(hook);
}

const AUTH_SCOPED_QUERY_PREFIXES = [
  '/api/v1/account',
  '/api/v1/orders',
  '/api/v1/cart',
  '/api/v1/wishlist',
  '/api/v1/notifications',
  '/api/v1/auth/me',
];

function clearAuthQueries(): void {
  queryClient.removeQueries({
    predicate: (query) => {
      const first = query.queryKey[0];
      return (
        typeof first === 'string' &&
        AUTH_SCOPED_QUERY_PREFIXES.some((prefix) => first.startsWith(prefix))
      );
    },
  });
}

export async function refreshSessionToken(): Promise<string | null> {
  const storedRefresh = await getSecureRefreshToken();
  if (!storedRefresh) {
    return null;
  }

  const deviceId = await getOrCreateDeviceId();
  const res = await authControllerRefresh({
    refreshToken: storedRefresh,
    deviceId,
  });

  const nextAccess = res.data?.accessToken;
  const nextRefresh = res.data?.refreshToken;
  if (!nextAccess || !nextRefresh) {
    return null;
  }

  setInMemoryAccessToken(nextAccess);
  await setSecureRefreshToken(nextRefresh);
  return nextAccess;
}

export async function clearLocalAuthState(): Promise<void> {
  await clearSecureRefreshToken();
  useAuthStore.getState().clearSessionState();
  clearAuthQueries();
  analytics.reset();
}

export async function completeAuthSession(params: {
  accessToken: string;
  refreshToken: string;
  user: AuthUserSummaryDto;
}): Promise<void> {
  setInMemoryAccessToken(params.accessToken);
  await setSecureRefreshToken(params.refreshToken);
  useAuthStore.getState().setSessionUser(params.user);
  analytics.identify(params.user.id, { role: params.user.role });

  // Run registered post-login sync hooks (cart sync, wishlist sync, push token registration)
  await Promise.allSettled(Array.from(postLoginHooks).map((hook) => hook()));
}

export async function logoutCurrentDevice(): Promise<void> {
  const [refreshToken, deviceId] = await Promise.all([
    getSecureRefreshToken(),
    getOrCreateDeviceId(),
  ]);

  await Promise.allSettled(Array.from(preLogoutHooks).map((hook) => hook()));

  try {
    if (getInMemoryAccessToken()) {
      await authControllerLogout({
        refreshToken: refreshToken ?? undefined,
        deviceId,
      });
    }
  } catch {
    // Even if server logout fails due to offline/expired token, always clear local credentials
  } finally {
    await clearLocalAuthState();
  }
}

export async function hydrateAuthSession(): Promise<void> {
  const deviceId = await getOrCreateDeviceId();

  configureApiClient({
    baseUrl: env.API_URL,
    getAccessToken: () => getInMemoryAccessToken(),
    getDeviceId: () => getCachedDeviceId() ?? deviceId,
    onRefreshToken: refreshSessionToken,
    onAuthFailure: () => {
      void clearLocalAuthState();
    },
  });

  try {
    const existingRefresh = await getSecureRefreshToken();
    if (!existingRefresh) {
      return;
    }
    const nextAccess = await refreshSessionToken();
    if (!nextAccess) {
      await clearLocalAuthState();
      return;
    }
    const meRes = await authControllerMe();
    if (meRes.data) {
      useAuthStore.getState().setSessionUser({
        id: meRes.data.id,
        email: meRes.data.email ?? null,
        name: meRes.data.name,
        phone: meRes.data.phone ?? null,
        role: meRes.data.role,
      });
      analytics.identify(meRes.data.id, { role: meRes.data.role });
    }
  } catch {
    await clearLocalAuthState();
  } finally {
    useAuthStore.getState().setHydrated(true);
  }
}
