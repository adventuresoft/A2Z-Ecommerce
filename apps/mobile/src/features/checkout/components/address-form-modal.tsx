import React, { useEffect, useState } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import {
  Button,
  Chip,
  Divider,
  HelperText,
  Modal,
  Portal,
  Switch,
  Text,
  TextInput,
} from 'react-native-paper';
import { useTranslation } from 'react-i18next';
import {
  accountAddressesControllerCreateAddress,
  accountAddressesControllerUpdateAddress,
  ApiError,
  useLocationsControllerGetDistricts,
  useLocationsControllerGetDivisions,
  useLocationsControllerGetPostOffices,
  useLocationsControllerGetThanas,
  type UserAddressResponseDto,
} from '@repo/api-client';
import { STALE_TIMES } from '@/shared/api/query-client';
import { azColors, radius, spacing } from '@/shared/theme';
import { isValidBdPhone, normalizeBdPhone } from '@/shared/utils/bd-phone';

interface AddressFormModalProps {
  visible: boolean;
  editingAddress?: UserAddressResponseDto | null;
  onDismiss: () => void;
  onSaved: (address: UserAddressResponseDto) => void;
}

function asStr(val: unknown): string {
  return typeof val === 'string' ? val : '';
}

function asNum(val: unknown): number | undefined {
  if (typeof val === 'number' && Number.isFinite(val)) return val;
  if (typeof val === 'string' && val.trim() !== '') {
    const n = Number(val);
    return Number.isFinite(n) ? n : undefined;
  }
  return undefined;
}

export function AddressFormModal({
  visible,
  editingAddress,
  onDismiss,
  onSaved,
}: AddressFormModalProps) {
  const { t } = useTranslation();

  const [label, setLabel] = useState('Home');
  const [recipientName, setRecipientName] = useState('');
  const [phone, setPhone] = useState('');
  const [streetAddress, setStreetAddress] = useState('');
  const [postalCode, setPostalCode] = useState('');
  const [isDefaultShipping, setIsDefaultShipping] = useState(true);

  const [divisionId, setDivisionId] = useState<number | undefined>(undefined);
  const [divisionName, setDivisionName] = useState('');
  const [districtId, setDistrictId] = useState<number | undefined>(undefined);
  const [districtName, setDistrictName] = useState('');
  const [thanaId, setThanaId] = useState<number | undefined>(undefined);
  const [thanaName, setThanaName] = useState('');

  const [saving, setSaving] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    if (!visible) return;
    setErrorMsg(null);
    if (editingAddress) {
      setLabel(asStr(editingAddress.label) || 'Home');
      setRecipientName(editingAddress.recipientName);
      setPhone(editingAddress.phone);
      setStreetAddress(editingAddress.streetAddress);
      setPostalCode(editingAddress.postalCode);
      setIsDefaultShipping(editingAddress.isDefaultShipping);
      setDivisionId(asNum(editingAddress.divisionId));
      setDivisionName(asStr(editingAddress.state));
      setDistrictId(asNum(editingAddress.districtId));
      setDistrictName(editingAddress.city);
      setThanaId(asNum(editingAddress.thanaId));
      setThanaName(asStr(editingAddress.thana));
    } else {
      setLabel('Home');
      setRecipientName('');
      setPhone('');
      setStreetAddress('');
      setPostalCode('');
      setIsDefaultShipping(true);
      setDivisionId(undefined);
      setDivisionName('');
      setDistrictId(undefined);
      setDistrictName('');
      setThanaId(undefined);
      setThanaName('');
    }
  }, [visible, editingAddress]);

  const divisionsQuery = useLocationsControllerGetDivisions({
    query: { enabled: visible, staleTime: STALE_TIMES.LOCATIONS },
  });
  const districtsQuery = useLocationsControllerGetDistricts(
    divisionId ? { divisionId } : undefined,
    {
      query: { enabled: visible && Boolean(divisionId), staleTime: STALE_TIMES.LOCATIONS },
    },
  );
  const thanasQuery = useLocationsControllerGetThanas(
    districtId ? { districtId } : undefined,
    {
      query: { enabled: visible && Boolean(districtId), staleTime: STALE_TIMES.LOCATIONS },
    },
  );
  const postOfficesQuery = useLocationsControllerGetPostOffices(
    thanaId ? { thanaId } : undefined,
    {
      query: { enabled: visible && Boolean(thanaId), staleTime: STALE_TIMES.LOCATIONS },
    },
  );

  const divisions = divisionsQuery.data?.data ?? [];
  const districts = districtsQuery.data?.data ?? [];
  const thanas = thanasQuery.data?.data ?? [];
  const postOffices = postOfficesQuery.data?.data ?? [];

  const handleSave = async () => {
    const cleanPhone = normalizeBdPhone(phone);
    if (!recipientName.trim()) {
      setErrorMsg('Recipient name is required');
      return;
    }
    if (!isValidBdPhone(cleanPhone)) {
      setErrorMsg('Enter a valid 11-digit BD mobile number (01XXXXXXXXX)');
      return;
    }
    if (!streetAddress.trim()) {
      setErrorMsg('Street address is required');
      return;
    }
    if (!districtName.trim()) {
      setErrorMsg('Select a Division and District');
      return;
    }
    if (!postalCode.trim()) {
      setErrorMsg('Postal code is required');
      return;
    }

    setErrorMsg(null);
    setSaving(true);
    try {
      const payload = {
        label: label.trim() || 'Home',
        recipientName: recipientName.trim(),
        phone: cleanPhone,
        streetAddress: streetAddress.trim(),
        city: districtName.trim(),
        state: divisionName.trim() || undefined,
        thana: thanaName.trim() || undefined,
        divisionId,
        districtId,
        thanaId,
        postalCode: postalCode.trim(),
        country: 'Bangladesh',
        isDefaultShipping,
      };

      if (editingAddress) {
        const res = await accountAddressesControllerUpdateAddress(
          editingAddress.id,
          payload,
        );
        if (res.status === 200) {
          onSaved(res.data);
          onDismiss();
        }
      } else {
        const res = await accountAddressesControllerCreateAddress(payload);
        if (res.status === 201) {
          onSaved(res.data);
          onDismiss();
        }
      }
    } catch (err) {
      setErrorMsg(err instanceof ApiError ? err.message : t('app.errorSubtitle'));
    } finally {
      setSaving(false);
    }
  };

  return (
    <Portal>
      <Modal
        visible={visible}
        onDismiss={onDismiss}
        contentContainerStyle={styles.modal}
      >
        <View style={styles.header}>
          <Text variant="titleMedium" style={styles.title}>
            {editingAddress ? 'Edit Address' : t('checkout.addAddress')}
          </Text>
          <Button compact onPress={onDismiss}>
            {t('app.cancel')}
          </Button>
        </View>
        <Divider />

        <ScrollView contentContainerStyle={styles.body} keyboardShouldPersistTaps="handled">
          <View style={styles.chipRow}>
            {['Home', 'Office', 'Other'].map((preset) => (
              <Chip
                key={preset}
                selected={label === preset}
                onPress={() => setLabel(preset)}
              >
                {preset}
              </Chip>
            ))}
          </View>

          <TextInput
            testID="address.recipientNameInput"
            mode="outlined"
            label={t('auth.nameLabel')}
            value={recipientName}
            onChangeText={setRecipientName}
          />
          <TextInput
            testID="address.phoneInput"
            mode="outlined"
            label={t('auth.phoneLabel')}
            placeholder="01XXXXXXXXX"
            keyboardType="phone-pad"
            value={phone}
            onChangeText={setPhone}
          />

          {/* Division Cascade */}
          <Text variant="labelLarge" style={styles.fieldLabel}>
            Division
          </Text>
          <View style={styles.chipRow}>
            {divisions.map((div) => (
              <Chip
                key={div.id}
                testID={`address.division.${div.name}`}
                selected={divisionId === div.id}
                onPress={() => {
                  setDivisionId(div.id);
                  setDivisionName(div.name);
                  setDistrictId(undefined);
                  setDistrictName('');
                  setThanaId(undefined);
                  setThanaName('');
                }}
              >
                {div.name}
              </Chip>
            ))}
          </View>

          {/* District Cascade */}
          {divisionId && districts.length > 0 ? (
            <>
              <Text variant="labelLarge" style={styles.fieldLabel}>
                District
              </Text>
              <View style={styles.chipRow}>
                {districts.slice(0, 20).map((dist) => (
                  <Chip
                    key={dist.id}
                    testID={`address.district.${dist.name}`}
                    selected={districtId === dist.id}
                    onPress={() => {
                      setDistrictId(dist.id);
                      setDistrictName(dist.name);
                      setThanaId(undefined);
                      setThanaName('');
                    }}
                  >
                    {dist.name}
                  </Chip>
                ))}
              </View>
            </>
          ) : null}

          {/* Thana Cascade */}
          {districtId && thanas.length > 0 ? (
            <>
              <Text variant="labelLarge" style={styles.fieldLabel}>
                Thana / Upazila
              </Text>
              <View style={styles.chipRow}>
                {thanas.slice(0, 24).map((th) => (
                  <Chip
                    key={th.id}
                    selected={thanaId === th.id}
                    onPress={() => {
                      setThanaId(th.id);
                      setThanaName(th.name);
                    }}
                  >
                    {th.name}
                  </Chip>
                ))}
              </View>
            </>
          ) : null}

          {/* Post Office Auto-Fill */}
          {thanaId && postOffices.length > 0 ? (
            <>
              <Text variant="labelLarge" style={styles.fieldLabel}>
                Post Office (Auto-fills Postal Code)
              </Text>
              <View style={styles.chipRow}>
                {postOffices.slice(0, 15).map((po) => {
                  const poName = asStr(po.name) || `Post Office #${po.id}`;
                  const poCode = asStr(po.postalCode);
                  return (
                    <Chip
                      key={po.id}
                      selected={Boolean(poCode) && postalCode === poCode}
                      onPress={() => {
                        if (poCode) setPostalCode(poCode);
                      }}
                    >
                      {poCode ? `${poName} (${poCode})` : poName}
                    </Chip>
                  );
                })}
              </View>
            </>
          ) : null}

          {/* Manual City fallback if locations unavailable */}
          {!districtId ? (
            <TextInput
              testID="address.cityInput"
              mode="outlined"
              label="City / District"
              value={districtName}
              onChangeText={setDistrictName}
            />
          ) : null}

          <TextInput
            testID="address.streetInput"
            mode="outlined"
            label="House, Road, Block & Area"
            value={streetAddress}
            onChangeText={setStreetAddress}
            multiline
          />
          <TextInput
            testID="address.postalCodeInput"
            mode="outlined"
            label="Postal Code"
            keyboardType="number-pad"
            value={postalCode}
            onChangeText={setPostalCode}
          />

          <View style={styles.switchRow}>
            <Text variant="bodyMedium" style={styles.switchLabel}>
              Set as default shipping address
            </Text>
            <Switch value={isDefaultShipping} onValueChange={setIsDefaultShipping} />
          </View>

          {errorMsg ? (
            <HelperText type="error" visible>
              {errorMsg}
            </HelperText>
          ) : null}

          <Button
            testID="address.saveButton"
            mode="contained"
            loading={saving}
            disabled={saving}
            onPress={() => void handleSave()}
            contentStyle={styles.saveContent}
            style={styles.saveBtn}
          >
            {t('app.save')}
          </Button>
        </ScrollView>
      </Modal>
    </Portal>
  );
}

const styles = StyleSheet.create({
  modal: {
    backgroundColor: azColors.surface,
    margin: spacing.md,
    borderRadius: radius.lg,
    maxHeight: '88%',
    overflow: 'hidden',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  title: { color: azColors.navy, fontWeight: '700' },
  body: { padding: spacing.md, gap: spacing.sm },
  fieldLabel: { color: azColors.navy, fontWeight: '700', marginTop: 4 },
  chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.xs },
  switchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: spacing.xs,
  },
  switchLabel: { color: azColors.navy },
  saveBtn: { borderRadius: radius.md, marginTop: spacing.xs },
  saveContent: { minHeight: 48 },
});
