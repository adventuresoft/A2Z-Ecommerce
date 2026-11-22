import React, { useState } from 'react';
import { Linking, Platform, StyleSheet, View } from 'react-native';
import { Button, Dialog, Portal, Text } from 'react-native-paper';
import Constants from 'expo-constants';
import { useTranslation } from 'react-i18next';
import { useSettingsControllerGetPublicSettingsExplicit } from '@repo/api-client';
import { compareSemVer } from '../utils/bd-phone';
import { STALE_TIMES } from '../api/query-client';
import { azColors, spacing } from '../theme';

const PLAY_STORE_URL = 'https://play.google.com/store/apps/details?id=com.atozecommerce.app';
const APP_STORE_URL = 'https://apps.apple.com/app/id0000000000';

export function VersionGateDialog() {
  const { t } = useTranslation();
  const [softDismissed, setSoftDismissed] = useState(false);

  const currentVersion = Constants.expoConfig?.version || '1.0.0';
  const { data } = useSettingsControllerGetPublicSettingsExplicit({
    query: { staleTime: STALE_TIMES.TAXONOMY_AND_SETTINGS },
  });

  const payload = data?.data as Record<string, unknown> | undefined;
  const minSupported =
    typeof payload?.['mobile.min_supported_version'] === 'string'
      ? payload['mobile.min_supported_version']
      : null;
  const latestVersion =
    typeof payload?.['mobile.latest_version'] === 'string'
      ? payload['mobile.latest_version']
      : null;

  const isForceUpdate =
    minSupported != null && compareSemVer(currentVersion, minSupported) < 0;
  const isSoftUpdate =
    !isForceUpdate &&
    !softDismissed &&
    latestVersion != null &&
    compareSemVer(currentVersion, latestVersion) < 0;

  const openStore = () => {
    const url = Platform.OS === 'ios' ? APP_STORE_URL : PLAY_STORE_URL;
    void Linking.openURL(url);
  };

  if (isForceUpdate && minSupported) {
    return (
      <Portal>
        <Dialog visible dismissable={false} testID="global.forceUpdateDialog">
          <Dialog.Title>{t('update.forceTitle')}</Dialog.Title>
          <Dialog.Content>
            <Text variant="bodyMedium">
              {t('update.forceBody', { version: minSupported })}
            </Text>
          </Dialog.Content>
          <Dialog.Actions>
            <Button mode="contained" onPress={openStore}>
              {t('update.updateNow')}
            </Button>
          </Dialog.Actions>
        </Dialog>
      </Portal>
    );
  }

  if (isSoftUpdate && latestVersion) {
    return (
      <View style={styles.softBanner} testID="global.softUpdateBanner">
        <Text style={styles.softText}>
          {t('update.softBanner', { version: latestVersion })}
        </Text>
        <View style={styles.softActions}>
          <Button compact mode="text" textColor={azColors.primary} onPress={openStore}>
            {t('update.updateNow')}
          </Button>
          <Button
            compact
            mode="text"
            textColor={azColors.muted}
            onPress={() => setSoftDismissed(true)}
          >
            {t('app.cancel')}
          </Button>
        </View>
      </View>
    );
  }

  return null;
}

const styles = StyleSheet.create({
  softBanner: {
    backgroundColor: azColors.primarySoft,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderBottomWidth: 1,
    borderBottomColor: azColors.border,
  },
  softText: {
    color: azColors.navy,
    fontSize: 13,
    fontWeight: '600',
    flex: 1,
  },
  softActions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
});
