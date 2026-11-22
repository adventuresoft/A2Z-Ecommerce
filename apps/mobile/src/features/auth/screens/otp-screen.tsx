import React, { useEffect, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { Appbar, Button, HelperText, Text, TextInput } from 'react-native-paper';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { ApiError, authControllerSendOtp, authControllerVerifyOtp } from '@repo/api-client';
import { azColors, spacing } from '@/shared/theme';
import { otpVerifySchema } from '../schemas';

export function OtpScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const { phone = '', purpose = 'SIGNUP', redirect = '' } = useLocalSearchParams<{
    phone: string;
    purpose?: 'SIGNUP' | 'RESET_PASSWORD';
    redirect?: string;
  }>();

  const [code, setCode] = useState('');
  const [countdown, setCountdown] = useState(60);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (countdown <= 0) return;
    const id = setInterval(() => setCountdown((c) => Math.max(0, c - 1)), 1000);
    return () => clearInterval(id);
  }, [countdown]);

  const handleVerify = async () => {
    const parsed = otpVerifySchema.safeParse({ code });
    if (!parsed.success) {
      setError(parsed.error.issues[0]?.message || 'Invalid OTP');
      return;
    }
    setError(null);
    setSubmitting(true);
    try {
      const res = await authControllerVerifyOtp({
        phone,
        code,
        purpose: purpose === 'RESET_PASSWORD' ? 'RESET_PASSWORD' : 'SIGNUP',
      });
      if (res.status !== 200) return;
      if (purpose === 'RESET_PASSWORD') {
        router.replace({
          pathname: '/(auth)/forgot-password' as never,
          params: { resetToken: res.data.token, redirect },
        } as never);
      } else {
        router.replace({
          pathname: '/(auth)/register' as never,
          params: { signupToken: res.data.token, phone, redirect },
        } as never);
      }
    } catch (err) {
      setError(err instanceof ApiError ? err.message : t('app.errorSubtitle'));
    } finally {
      setSubmitting(false);
    }
  };

  const handleResend = async () => {
    if (countdown > 0) return;
    setError(null);
    try {
      await authControllerSendOtp({
        phone,
        purpose: purpose === 'RESET_PASSWORD' ? 'RESET_PASSWORD' : 'SIGNUP',
      });
      setCountdown(60);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : t('app.errorSubtitle'));
    }
  };

  return (
    <View style={styles.container}>
      <Appbar.Header style={styles.header}>
        <Appbar.BackAction onPress={() => router.back()} />
        <Appbar.Content title={t('auth.verifyOtpTitle')} />
      </Appbar.Header>

      <View style={styles.body}>
        <Text variant="headlineSmall" style={styles.title}>
          {t('auth.verifyOtpTitle')}
        </Text>
        <Text variant="bodyMedium" style={styles.subtitle}>
          {t('auth.verifyOtpSubtitle', { phone })}
        </Text>

        <TextInput
          testID="auth.otpInput"
          mode="outlined"
          label="4-Digit OTP"
          keyboardType="number-pad"
          maxLength={4}
          value={code}
          onChangeText={(text) => setCode(text.replace(/[^\d]/g, ''))}
          style={styles.input}
        />

        {error ? (
          <HelperText type="error" visible>
            {error}
          </HelperText>
        ) : null}

        <Button
          testID="auth.verifyOtpButton"
          mode="contained"
          loading={submitting}
          disabled={submitting || code.length !== 4}
          onPress={handleVerify}
          style={styles.cta}
          contentStyle={styles.ctaContent}
        >
          {t('auth.continue')}
        </Button>

        <Button
          mode="text"
          disabled={countdown > 0}
          onPress={handleResend}
          style={styles.resend}
        >
          {countdown > 0
            ? t('auth.resendIn', { seconds: countdown })
            : t('auth.resendCode')}
        </Button>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: azColors.page },
  header: { backgroundColor: azColors.surface },
  body: { padding: spacing.lg },
  title: { color: azColors.navy, fontWeight: '700' },
  subtitle: { color: azColors.muted, marginTop: spacing.xs, lineHeight: 22 },
  input: { marginTop: spacing.lg, fontSize: 20, letterSpacing: 8 },
  cta: { marginTop: spacing.md, borderRadius: 12 },
  ctaContent: { minHeight: 48 },
  resend: { marginTop: spacing.sm },
});
