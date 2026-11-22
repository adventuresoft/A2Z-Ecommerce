import React, { useState } from 'react';
import { FlatList, StyleSheet, View } from 'react-native';
import { Appbar, Button, Chip, FAB, IconButton, Surface, Text } from 'react-native-paper';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import {
  accountAddressesControllerDeleteAddress,
  accountAddressesControllerSetDefaultShipping,
  useAccountAddressesControllerListAddresses,
  type UserAddressResponseDto,
} from '@repo/api-client';
import { azColors, radius, spacing } from '@/shared/theme';
import { EmptyState } from '@/shared/components/empty-state';
import { AddressFormModal } from '@/features/checkout/components/address-form-modal';

export function AddressesScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const addressesQuery = useAccountAddressesControllerListAddresses();
  const addresses =
    addressesQuery.data?.status === 200 ? addressesQuery.data.data : [];

  const [modalVisible, setModalVisible] = useState(false);
  const [editing, setEditing] = useState<UserAddressResponseDto | null>(null);

  const handleDelete = async (id: string) => {
    await accountAddressesControllerDeleteAddress(id);
    void addressesQuery.refetch();
  };

  const handleSetDefault = async (id: string) => {
    await accountAddressesControllerSetDefaultShipping(id);
    void addressesQuery.refetch();
  };

  return (
    <View style={styles.screen} testID="addresses.screen">
      <Appbar.Header style={styles.header}>
        <Appbar.BackAction onPress={() => router.back()} />
        <Appbar.Content title={t('account.addresses')} />
      </Appbar.Header>

      {addresses.length === 0 && !addressesQuery.isLoading ? (
        <EmptyState
          icon="map-marker-outline"
          title="No saved addresses"
          subtitle="Add a delivery address for faster Bangladesh checkout."
          ctaLabel={t('checkout.addAddress')}
          onCtaPress={() => {
            setEditing(null);
            setModalVisible(true);
          }}
        />
      ) : (
        <FlatList
          data={addresses}
          keyExtractor={(item) => item.id}
          refreshing={addressesQuery.isRefetching}
          onRefresh={() => void addressesQuery.refetch()}
          contentContainerStyle={styles.list}
          renderItem={({ item }) => (
            <Surface style={styles.card} elevation={1}>
              <View style={styles.topRow}>
                <View style={styles.badges}>
                  <Chip compact>{typeof item.label === 'string' ? item.label : 'Address'}</Chip>
                  {item.isDefaultShipping ? (
                    <Chip compact style={styles.defaultChip}>
                      Default
                    </Chip>
                  ) : null}
                </View>
                <View style={styles.iconActions}>
                  <IconButton
                    icon="pencil-outline"
                    size={20}
                    onPress={() => {
                      setEditing(item);
                      setModalVisible(true);
                    }}
                  />
                  <IconButton
                    icon="trash-can-outline"
                    iconColor={azColors.danger}
                    size={20}
                    onPress={() => void handleDelete(item.id)}
                  />
                </View>
              </View>
              <Text variant="titleSmall" style={styles.name}>
                {item.recipientName} • {item.phone}
              </Text>
              <Text variant="bodySmall" style={styles.line}>
                {item.streetAddress}
              </Text>
              <Text variant="bodySmall" style={styles.line}>
                {[
                  typeof item.thana === 'string' ? item.thana : null,
                  item.city,
                  typeof item.state === 'string' ? item.state : null,
                  item.postalCode,
                ]
                  .filter(Boolean)
                  .join(', ')}
              </Text>
              {!item.isDefaultShipping ? (
                <Button
                  compact
                  mode="text"
                  style={styles.defaultBtn}
                  onPress={() => void handleSetDefault(item.id)}
                >
                  Set as default shipping
                </Button>
              ) : null}
            </Surface>
          )}
        />
      )}

      <FAB
        testID="addresses.addFab"
        icon="plus"
        style={styles.fab}
        color="#FFFFFF"
        onPress={() => {
          setEditing(null);
          setModalVisible(true);
        }}
      />

      <AddressFormModal
        visible={modalVisible}
        editingAddress={editing}
        onDismiss={() => setModalVisible(false)}
        onSaved={() => void addressesQuery.refetch()}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: azColors.page },
  header: { backgroundColor: azColors.surface },
  list: { padding: spacing.md, gap: spacing.sm, paddingBottom: 96 },
  card: {
    backgroundColor: azColors.surface,
    borderRadius: radius.md,
    padding: spacing.md,
    gap: 4,
  },
  topRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  badges: { flexDirection: 'row', gap: spacing.xs },
  defaultChip: { backgroundColor: azColors.primarySoft },
  iconActions: { flexDirection: 'row' },
  name: { color: azColors.navy, fontWeight: '700' },
  line: { color: azColors.muted },
  defaultBtn: { alignSelf: 'flex-start', marginTop: 4 },
  fab: {
    position: 'absolute',
    right: spacing.md,
    bottom: spacing.lg,
    backgroundColor: azColors.primary,
  },
});
