import React, { useState } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import {
  Appbar,
  Avatar,
  Button,
  Dialog,
  Divider,
  List,
  Portal,
  SegmentedButtons,
  Snackbar,
  Surface,
  Text,
  TextInput,
} from 'react-native-paper';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import {
  accountControllerDeleteAccount,
  ApiError,
  useNotificationsUserControllerGetUnreadCount,
} from '@repo/api-client';
import { usePreferencesStore } from '@/shared/stores/preferences-store';
import { azColors, radius, spacing } from '@/shared/theme';
import { useAuthStore } from '@/features/auth/auth-store';
import { clearLocalAuthState, logoutCurrentDevice } from '@/features/auth/auth-service';
import { requestAndRegisterPushToken } from '@/features/notifications/push-service';

export function AccountScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const user = useAuthStore((s) => s.user);
  const locale = usePreferencesStore((s) => s.locale);
  const setLocale = usePreferencesStore((s) => s.setLocale);

  const unreadQuery = useNotificationsUserControllerGetUnreadCount({
    query: { enabled: isAuthenticated },
  });
  const unreadCount = unreadQuery.data?.data?.unreadCount ?? 0;

  const [deleteVisible, setDeleteVisible] = useState(false);
  const [deletePassword, setDeletePassword] = useState('');
  const [busy, setBusy] = useState(false);
  const [snackMsg, setSnackMsg] = useState<string | null>(null);

  const initials = (user?.name ?? 'AZ')
    .split(' ')
    .map((part) => part[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();

  const handleLogout = async () => {
    setBusy(true);
    try {
      await logoutCurrentDevice();
      setSnackMsg('Signed out from this device.');
    } finally {
      setBusy(false);
    }
  };

  const handleDeleteAccount = async () => {
    if (!deletePassword.trim()) {
      setSnackMsg('Please enter your password to confirm account deletion.');
      return;
    }
    setBusy(true);
    try {
      const res = await accountControllerDeleteAccount({ password: deletePassword });
      if (res.status === 200) {
        await clearLocalAuthState();
        setDeleteVisible(false);
        setDeletePassword('');
        setSnackMsg('Your account has been permanently deactivated.');
      }
    } catch (err) {
      setSnackMsg(err instanceof ApiError ? err.message : t('app.errorSubtitle'));
    } finally {
      setBusy(false);
    }
  };

  return (
    <View style={styles.screen} testID="account.screen">
      <Appbar.Header style={styles.header}>
        <Appbar.Content title={t('account.title')} />
      </Appbar.Header>

      <ScrollView contentContainerStyle={styles.scroll}>
        {/* Profile / Guest Header Card */}
        {isAuthenticated && user ? (
          <Surface style={styles.profileCard} elevation={1}>
            <Avatar.Text size={54} label={initials} style={styles.avatar} />
            <View style={styles.profileInfo}>
              <Text variant="titleMedium" style={styles.boldNavy}>
                {user.name}
              </Text>
              <Text variant="bodySmall" style={styles.muted}>
                {typeof user.phone === 'string' && user.phone
                  ? user.phone
                  : typeof user.email === 'string'
                    ? user.email
                    : 'Customer'}
              </Text>
            </View>
          </Surface>
        ) : (
          <Surface style={styles.guestCard} elevation={1}>
            <Text variant="titleMedium" style={styles.boldNavy}>
              {t('auth.welcome')}
            </Text>
            <Text variant="bodySmall" style={styles.muted}>
              {t('account.signInPrompt')}
            </Text>
            <Button
              testID="account.signInButton"
              mode="contained"
              onPress={() => router.push('/(auth)/login' as never)}
              contentStyle={styles.ctaContent}
              style={styles.ctaBtn}
            >
              {t('auth.login')}
            </Button>
          </Surface>
        )}

        {/* Customer Menu */}
        <Surface style={styles.menuCard} elevation={1}>
          {isAuthenticated ? (
            <>
              <List.Item
                testID="account.ordersItem"
                title={t('account.myOrders')}
                left={(props) => <List.Icon {...props} icon="package-variant" color={azColors.primary} />}
                right={(props) => <List.Icon {...props} icon="chevron-right" />}
                onPress={() => router.push('/orders' as never)}
              />
              <Divider />
              <List.Item
                testID="account.addressesItem"
                title={t('account.addresses')}
                left={(props) => <List.Icon {...props} icon="map-marker-outline" color={azColors.primary} />}
                right={(props) => <List.Icon {...props} icon="chevron-right" />}
                onPress={() => router.push('/addresses' as never)}
              />
              <Divider />
              <List.Item
                testID="account.notificationsItem"
                title={t('account.notifications')}
                description={unreadCount > 0 ? `${unreadCount} unread` : undefined}
                left={(props) => <List.Icon {...props} icon="bell-outline" color={azColors.primary} />}
                right={(props) => <List.Icon {...props} icon="chevron-right" />}
                onPress={() => router.push('/notifications' as never)}
              />
              <Divider />
              <List.Item
                title="Enable Push Alerts"
                description="Get instant order & delivery status notifications"
                left={(props) => <List.Icon {...props} icon="bell-ring-outline" color={azColors.accent} />}
                onPress={() =>
                  void requestAndRegisterPushToken(true).then((tok) =>
                    setSnackMsg(
                      tok ? 'Push alerts enabled!' : 'Permission denied or unavailable on simulator.',
                    ),
                  )
                }
              />
              <Divider />
            </>
          ) : null}

          <List.Item
            testID="account.trackItem"
            title={t('account.trackOrder')}
            left={(props) => <List.Icon {...props} icon="truck-fast-outline" color={azColors.primary} />}
            right={(props) => <List.Icon {...props} icon="chevron-right" />}
            onPress={() => router.push('/track/lookup' as never)}
          />
        </Surface>

        {/* Language Toggle */}
        <Surface style={styles.langCard} elevation={1}>
          <Text variant="titleSmall" style={styles.boldNavy}>
            {t('account.language')}
          </Text>
          <SegmentedButtons
            value={locale}
            onValueChange={(val) => setLocale(val === 'bn' ? 'bn' : 'en')}
            buttons={[
              { value: 'en', label: 'English' },
              { value: 'bn', label: 'বাংলা' },
            ]}
          />
        </Surface>

        {/* Auth Danger & Logout */}
        {isAuthenticated ? (
          <View style={styles.footerActions}>
            <Button
              testID="account.logoutButton"
              mode="outlined"
              icon="logout"
              loading={busy}
              disabled={busy}
              onPress={() => void handleLogout()}
              contentStyle={styles.ctaContent}
              style={styles.ctaBtn}
            >
              {t('account.logout')}
            </Button>
            <Button
              testID="account.deleteButton"
              mode="text"
              textColor={azColors.danger}
              disabled={busy}
              onPress={() => setDeleteVisible(true)}
            >
              {t('account.deleteAccount')}
            </Button>
          </View>
        ) : null}
      </ScrollView>

      {/* Delete Account Dialog */}
      <Portal>
        <Dialog visible={deleteVisible} onDismiss={() => setDeleteVisible(false)}>
          <Dialog.Title>{t('account.deleteConfirmTitle')}</Dialog.Title>
          <Dialog.Content style={styles.dialogContent}>
            <Text variant="bodySmall" style={styles.muted}>
              {t('account.deleteConfirmBody')}
            </Text>
            <TextInput
              testID="account.deletePasswordInput"
              mode="outlined"
              label={t('auth.passwordLabel')}
              secureTextEntry
              value={deletePassword}
              onChangeText={setDeletePassword}
            />
          </Dialog.Content>
          <Dialog.Actions>
            <Button onPress={() => setDeleteVisible(false)}>{t('app.cancel')}</Button>
            <Button
              testID="account.confirmDeleteButton"
              textColor={azColors.danger}
              loading={busy}
              onPress={() => void handleDeleteAccount()}
            >
              {t('account.deleteAccount')}
            </Button>
          </Dialog.Actions>
        </Dialog>
      </Portal>

      <Snackbar visible={Boolean(snackMsg)} onDismiss={() => setSnackMsg(null)} duration={2600}>
        {snackMsg}
      </Snackbar>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: azColors.page },
  header: { backgroundColor: azColors.surface },
  scroll: { padding: spacing.md, gap: spacing.md, paddingBottom: 40 },
  profileCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: azColors.surface,
    borderRadius: radius.lg,
    padding: spacing.md,
    gap: spacing.md,
  },
  avatar: { backgroundColor: azColors.primary },
  profileInfo: { flex: 1, gap: 2 },
  guestCard: {
    backgroundColor: azColors.surface,
    borderRadius: radius.lg,
    padding: spacing.lg,
    gap: spacing.sm,
  },
  boldNavy: { color: azColors.navy, fontWeight: '700' },
  muted: { color: azColors.muted },
  menuCard: {
    backgroundColor: azColors.surface,
    borderRadius: radius.lg,
    overflow: 'hidden',
  },
  langCard: {
    backgroundColor: azColors.surface,
    borderRadius: radius.lg,
    padding: spacing.md,
    gap: spacing.sm,
  },
  footerActions: { gap: spacing.xs },
  ctaBtn: { borderRadius: radius.md },
  ctaContent: { minHeight: 48 },
  dialogContent: { gap: spacing.sm },
});
