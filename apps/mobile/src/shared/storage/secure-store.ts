import * as SecureStore from 'expo-secure-store';
import { createIdempotencyKey } from '../utils/bd-phone';

const REFRESH_TOKEN_KEY = 'az_auth_refresh_token';
const DEVICE_ID_KEY = 'az_auth_device_id';

const SECURE_OPTIONS: SecureStore.SecureStoreOptions = {
  keychainAccessible: SecureStore.WHEN_UNLOCKED_THIS_DEVICE_ONLY,
};

let cachedDeviceId: string | null = null;

export async function getSecureRefreshToken(): Promise<string | null> {
  return SecureStore.getItemAsync(REFRESH_TOKEN_KEY);
}

export async function setSecureRefreshToken(token: string): Promise<void> {
  await SecureStore.setItemAsync(REFRESH_TOKEN_KEY, token, SECURE_OPTIONS);
}

export async function clearSecureRefreshToken(): Promise<void> {
  await SecureStore.deleteItemAsync(REFRESH_TOKEN_KEY);
}

export async function getOrCreateDeviceId(): Promise<string> {
  if (cachedDeviceId) {
    return cachedDeviceId;
  }
  const existing = await SecureStore.getItemAsync(DEVICE_ID_KEY);
  if (existing) {
    cachedDeviceId = existing;
    return existing;
  }
  const generated = `az-mobile-${createIdempotencyKey()}`;
  await SecureStore.setItemAsync(DEVICE_ID_KEY, generated, SECURE_OPTIONS);
  cachedDeviceId = generated;
  return generated;
}

export function getCachedDeviceId(): string | null {
  return cachedDeviceId;
}
