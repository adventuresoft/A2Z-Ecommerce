import React, { useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { Appbar, Button, HelperText, TextInput } from 'react-native-paper';
import { Controller, useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { ApiError, authControllerPhoneResetPassword } from '@repo/api-client';
import { azColors, spacing } from '@/shared/theme';
import { getOrCreateDeviceId } from '@/shared/storage/secure-store';
import { completeAuthSession } from '../auth-service';
import { resetPasswordSchema } from '../schemas';

export function ForgotPasswordScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const { resetToken = '', redirect = '' } = useLocalSearchParams<{
    resetToken: string;
    redirect?: string;
  }>();

  const [serverError, setServerError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const form = useForm({
    resolver: zodResolver(resetPasswordSchema),
    defaultValues: { password: '', confirmPassword: '' },
  });

  const handleSubmit = form.handleSubmit(async ({ password }) => {
    setServerError(null);
    setSubmitting(true);
    try {
      const deviceId = await getOrCreateDeviceId();
      const res = await authControllerPhoneResetPassword({
        resetToken,
        password,
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
        <Appbar.Content title={t('auth.resetPassword')} />
      </Appbar.Header>

      <View style={styles.body}>
        <Controller
          control={form.control}
          name="password"
          render={({ field: { onChange, onBlur, value } }) => (
            <TextInput
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

        <Controller
          control={form.control}
          name="confirmPassword"
          render={({ field: { onChange, onBlur, value } }) => (
            <TextInput
              mode="outlined"
              label="Confirm Password"
              secureTextEntry
              value={value}
              onBlur={onBlur}
              onChangeText={onChange}
              error={Boolean(form.formState.errors.confirmPassword)}
            />
          )}
        />
        <HelperText type="error" visible={Boolean(form.formState.errors.confirmPassword)}>
          {form.formState.errors.confirmPassword?.message}
        </HelperText>

        {serverError ? (
          <HelperText type="error" visible>
            {serverError}
          </HelperText>
        ) : null}

        <Button
          mode="contained"
          loading={submitting}
          disabled={submitting}
          onPress={() => void handleSubmit()}
          style={styles.cta}
          contentStyle={styles.ctaContent}
        >
          {t('auth.resetPassword')}
        </Button>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: azColors.page },
  header: { backgroundColor: azColors.surface },
  body: { padding: spacing.lg },
  cta: { marginTop: spacing.md, borderRadius: 12 },
  ctaContent: { minHeight: 48 },
});
