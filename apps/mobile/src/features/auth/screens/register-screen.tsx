import React, { useState } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { Appbar, Button, HelperText, Text, TextInput } from 'react-native-paper';
import { Controller, useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { ApiError, authControllerPhoneRegister } from '@repo/api-client';
import { azColors, spacing } from '@/shared/theme';
import { getOrCreateDeviceId } from '@/shared/storage/secure-store';
import { completeAuthSession } from '../auth-service';
import { phoneRegisterSchema } from '../schemas';

export function RegisterScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const { signupToken = '', phone = '', redirect = '' } = useLocalSearchParams<{
    signupToken: string;
    phone?: string;
    redirect?: string;
  }>();

  const [serverError, setServerError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const form = useForm({
    resolver: zodResolver(phoneRegisterSchema),
    defaultValues: { name: '', email: '', password: '' },
  });

  const handleSubmit = form.handleSubmit(async (values) => {
    setServerError(null);
    setSubmitting(true);
    try {
      const deviceId = await getOrCreateDeviceId();
      const res = await authControllerPhoneRegister({
        signupToken,
        name: values.name,
        email: values.email || undefined,
        password: values.password,
        deviceId,
      });
      await completeAuthSession({
        accessToken: res.data.accessToken,
        refreshToken: res.data.refreshToken,
        user: res.data.user,
      });
      router.replace((redirect && redirect.startsWith('/') ? redirect : '/(tabs)') as never);
    } catch (err) {
      setServerError(err instanceof ApiError ? err.message : t('app.errorSubtitle'));
    } finally {
      setSubmitting(false);
    }
  });

  return (
    <View style={styles.container}>
      <Appbar.Header style={styles.header}>
        <Appbar.BackAction onPress={() => router.back()} />
        <Appbar.Content title={t('auth.register')} />
      </Appbar.Header>

      <ScrollView contentContainerStyle={styles.body} keyboardShouldPersistTaps="handled">
        <Text variant="titleMedium" style={styles.phoneTag}>
          Verified mobile: {phone}
        </Text>

        <Controller
          control={form.control}
          name="name"
          render={({ field: { onChange, onBlur, value } }) => (
            <TextInput
              testID="auth.registerNameInput"
              mode="outlined"
              label={t('auth.nameLabel')}
              value={value}
              onBlur={onBlur}
              onChangeText={onChange}
              error={Boolean(form.formState.errors.name)}
            />
          )}
        />
        <HelperText type="error" visible={Boolean(form.formState.errors.name)}>
          {form.formState.errors.name?.message}
        </HelperText>

        <Controller
          control={form.control}
          name="email"
          render={({ field: { onChange, onBlur, value } }) => (
            <TextInput
              testID="auth.registerEmailInput"
              mode="outlined"
              label={`${t('auth.emailLabel')} (Optional)`}
              keyboardType="email-address"
              autoCapitalize="none"
              value={value}
              onBlur={onBlur}
              onChangeText={onChange}
              error={Boolean(form.formState.errors.email)}
            />
          )}
        />
        <HelperText type="error" visible={Boolean(form.formState.errors.email)}>
          {form.formState.errors.email?.message}
        </HelperText>

        <Controller
          control={form.control}
          name="password"
          render={({ field: { onChange, onBlur, value } }) => (
            <TextInput
              testID="auth.registerPasswordInput"
              mode="outlined"
              label={t('auth.passwordLabel')}
              secureTextEntry
              value={value}
              onBlur={onBlur}
              onChangeText={onChange}
              error={Boolean(form.formState.errors.password)}
            />
          )}
        />
        <HelperText type="error" visible={Boolean(form.formState.errors.password)}>
          {form.formState.errors.password?.message}
        </HelperText>

        {serverError ? (
          <HelperText type="error" visible>
            {serverError}
          </HelperText>
        ) : null}

        <Button
          testID="auth.registerSubmitButton"
          mode="contained"
          loading={submitting}
          disabled={submitting}
          onPress={() => void handleSubmit()}
          style={styles.cta}
          contentStyle={styles.ctaContent}
        >
          {t('auth.register')}
        </Button>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: azColors.page },
  header: { backgroundColor: azColors.surface },
  body: { padding: spacing.lg, gap: spacing.xxs },
  phoneTag: { color: azColors.primary, fontWeight: '600', marginBottom: spacing.md },
  cta: { marginTop: spacing.md, borderRadius: 12 },
  ctaContent: { minHeight: 48 },
});
