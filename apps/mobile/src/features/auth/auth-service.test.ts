import * as SecureStore from 'expo-secure-store';
import {
  authControllerLogout,
  authControllerMe,
  authControllerRefresh,
} from '@repo/api-client';
import {
  completeAuthSession,
  hydrateAuthSession,
  logoutCurrentDevice,
  refreshSessionToken,
  registerPostLoginHook,
} from './auth-service';
import { getInMemoryAccessToken, useAuthStore } from './auth-store';
import { phoneStepSchema, otpVerifySchema } from './schemas';

jest.mock('@repo/api-client', () => ({
  configureApiClient: jest.fn(),
  authControllerRefresh: jest.fn(),
  authControllerLogout: jest.fn(),
  authControllerMe: jest.fn(),
}));

const mockedRefresh = authControllerRefresh as jest.Mock;
const mockedLogout = authControllerLogout as jest.Mock;
const mockedMe = authControllerMe as jest.Mock;

describe('auth-service & schemas', () => {
  beforeEach(() => {
    (SecureStore as unknown as { __resetMockStore?: () => void }).__resetMockStore?.();
    useAuthStore.getState().clearSessionState();
    useAuthStore.getState().setHydrated(false);
    jest.clearAllMocks();
  });

  it('stores refreshToken in SecureStore, accessToken in memory, and runs post-login hooks', async () => {
    const syncHook = jest.fn();
    const unsubscribe = registerPostLoginHook(syncHook);

    await completeAuthSession({
      accessToken: 'acc-jwt-1',
      refreshToken: 'ref-jwt-1',
      user: {
        id: 'u-1',
        name: 'Rahim',
        phone: '01707819647' as unknown as Record<string, unknown>,
        email: null as unknown as Record<string, unknown>,
        role: 'CUSTOMER',
      },
    });

    expect(getInMemoryAccessToken()).toBe('acc-jwt-1');
    expect(await SecureStore.getItemAsync('az_auth_refresh_token')).toBe('ref-jwt-1');
    expect(useAuthStore.getState().isAuthenticated).toBe(true);
    expect(syncHook).toHaveBeenCalledTimes(1);
    unsubscribe();
  });

  it('rotates refreshToken securely in SecureStore on refreshSessionToken', async () => {
    await SecureStore.setItemAsync('az_auth_refresh_token', 'old-ref');
    mockedRefresh.mockResolvedValue({
      status: 200,
      headers: new Headers(),
      data: { accessToken: 'new-acc', refreshToken: 'new-ref' },
    });

    const nextAccess = await refreshSessionToken();
    expect(nextAccess).toBe('new-acc');
    expect(getInMemoryAccessToken()).toBe('new-acc');
    expect(await SecureStore.getItemAsync('az_auth_refresh_token')).toBe('new-ref');
  });

  it('sends deviceId and refreshToken on single-device logout and clears local secrets', async () => {
    await completeAuthSession({
      accessToken: 'acc-1',
      refreshToken: 'ref-1',
      user: { id: 'u-1', name: 'Rahim', role: 'CUSTOMER' },
    });
    mockedLogout.mockResolvedValue({
      status: 200,
      headers: new Headers(),
      data: { message: 'Successfully logged out' },
    });

    await logoutCurrentDevice();

    expect(mockedLogout).toHaveBeenCalledWith(
      expect.objectContaining({
        refreshToken: 'ref-1',
        deviceId: expect.stringMatching(/^az-mobile-/),
      }),
    );
    expect(getInMemoryAccessToken()).toBeNull();
    expect(await SecureStore.getItemAsync('az_auth_refresh_token')).toBeNull();
    expect(useAuthStore.getState().isAuthenticated).toBe(false);
  });

  it('hydrates existing SecureStore session on cold app boot', async () => {
    await SecureStore.setItemAsync('az_auth_refresh_token', 'boot-ref');
    mockedRefresh.mockResolvedValue({
      status: 200,
      headers: new Headers(),
      data: { accessToken: 'boot-acc', refreshToken: 'boot-ref-2' },
    });
    mockedMe.mockResolvedValue({
      status: 200,
      headers: new Headers(),
      data: { id: 'u-99', name: 'Karim', role: 'CUSTOMER', isActive: true, createdAt: '' },
    });

    await hydrateAuthSession();

    expect(useAuthStore.getState().isHydrated).toBe(true);
    expect(useAuthStore.getState().isAuthenticated).toBe(true);
    expect(useAuthStore.getState().user?.id).toBe('u-99');
  });

  it('validates BD phone and 4-digit OTP schemas', () => {
    expect(phoneStepSchema.safeParse({ phone: '01707819647' }).success).toBe(true);
    expect(phoneStepSchema.safeParse({ phone: '01012345678' }).success).toBe(false);
    expect(otpVerifySchema.safeParse({ code: '1234' }).success).toBe(true);
    expect(otpVerifySchema.safeParse({ code: '12ab' }).success).toBe(false);
  });
});
