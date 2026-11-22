import { Platform } from 'react-native';
import * as Notifications from 'expo-notifications';
import Constants from 'expo-constants';
import {
  notificationsUserControllerDeactivateDeviceToken,
  notificationsUserControllerRegisterDeviceToken,
} from '@repo/api-client';
import { getOrCreateDeviceId } from '@/shared/storage/secure-store';
import {
  registerPostLoginHook,
  registerPreLogoutHook,
} from '@/features/auth/auth-service';

let cachedPushToken: string | null = null;
let channelsInitialized = false;

export async function initPushChannels(): Promise<void> {
  if (channelsInitialized) return;
  channelsInitialized = true;

  Notifications.setNotificationHandler({
    handleNotification: async () => ({
      shouldShowAlert: true,
      shouldShowBanner: true,
      shouldShowList: true,
      shouldPlaySound: true,
      shouldSetBadge: true,
    }),
  });

  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync('orders', {
      name: 'Order Updates',
      importance: Notifications.AndroidImportance.HIGH,
      vibrationPattern: [0, 250, 250, 250],
    });
    await Notifications.setNotificationChannelAsync('promotions', {
      name: 'Offers & Promotions',
      importance: Notifications.AndroidImportance.DEFAULT,
    });
  }
}

export async function requestAndRegisterPushToken(promptIfUndetermined = false): Promise<string | null> {
  try {
    await initPushChannels();
    const existing = await Notifications.getPermissionsAsync();
    let finalStatus = existing.status;

    if (finalStatus !== 'granted' && promptIfUndetermined) {
      const requested = await Notifications.requestPermissionsAsync();
      finalStatus = requested.status;
    }

    if (finalStatus !== 'granted') {
      return null;
    }

    const projectId =
      Constants.expoConfig?.extra?.eas?.projectId ??
      (Constants as unknown as { easConfig?: { projectId?: string } }).easConfig?.projectId;

    const tokenObj = await Notifications.getExpoPushTokenAsync(
      projectId ? { projectId } : undefined,
    );
    const token = tokenObj.data;
    if (!token) return null;

    cachedPushToken = token;
    const deviceId = await getOrCreateDeviceId();
    const platform = Platform.OS === 'ios' ? 'IOS' : 'ANDROID';

    await notificationsUserControllerRegisterDeviceToken({
      token,
      platform,
      deviceId,
    });
    return token;
  } catch {
    return null;
  }
}

export async function deactivateCurrentPushToken(): Promise<void> {
  if (!cachedPushToken) return;
  const tokenToDeactivate = cachedPushToken;
  cachedPushToken = null;
  try {
    await notificationsUserControllerDeactivateDeviceToken(
      encodeURIComponent(tokenToDeactivate),
    );
  } catch {
    // Best-effort cleanup before logout
  }
}

registerPostLoginHook(async () => {
  await requestAndRegisterPushToken(false);
});

registerPreLogoutHook(async () => {
  await deactivateCurrentPushToken();
});
