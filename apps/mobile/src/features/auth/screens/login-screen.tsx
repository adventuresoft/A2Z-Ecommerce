import React, { useState } from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, StyleSheet, View } from 'react-native';
import { Appbar, Button, HelperText, SegmentedButtons, Text, TextInput } from 'react-native-paper';
import { Controller, useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import {
  ApiError,
  authControllerCheckPhone,
  authControllerLogin,
  authControllerPhoneLogin,
  authControllerSendOtp,
} from '@repo/api-client';
import { azColors, spacing } from '@/shared/theme';
import { normalizeBdPhone } from '@/shared/utils/bd-phone';
import { getOrCreateDeviceId } from '@/shared/storage/secure-store';
import { completeAuthSession } from '../auth-service';
import { emailLoginSchema, phoneStepSchema } from '../schemas';

export function LoginScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const { redirect } = useLocalSearchParams<{ redirect?: string }>();

  const [mode, setMode] = useState<'phone' | 'email'>('phone');
  const [phoneStep, setPhoneStep] = useState<'check' | 'password'>('check');
  const [checkedPhone, setCheckedPhone] = useState('');
  const [matchedName, setMatchedName] = useState<string | undefined>();
  const [phonePassword, setPhonePassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const phoneForm = useForm({
    resolver: zodResolver(phoneStepSchema),
    defaultValues: { phone: '' },
  });

  const emailForm = useForm({
    resolver: zodResolver(emailLoginSchema),
    defaultValues: { email: '', password: '' },
  });

  const finishNavigation = () => {
    if (redirect && redirect.startsWith('/')) {
      router.replace(redirect as never);
    } else {
      router.replace('/(tabs)' as never);
    }
  };

  const handleCheckPhone = phoneForm.handleSubmit(async ({ phone }) => {
    setServerError(null);
    setSubmitting(true);
    try {
      const normalized = normalizeBdPhone(phone);
      const checkRes = await authControllerCheckPhone({ phone: normalized });
      setCheckedPhone(normalized);
      if (checkRes.data.exists) {
        setMatchedName(checkRes.data.name);
        setPhoneStep('password');
      } else {
        await authControllerSendOtp({ phone: normalized, purpose: 'SIGNUP' });
        router.push({
          pathname: '/(auth)/otp' as never,
          params: { phone: normalized, purpose: 'SIGNUP', redirect: redirect ?? '' },
        } as never);
      }
    } catch (err) {
      setServerError(err instanceof ApiError ? err.message : t('app.errorSubtitle'));
    } finally {
      setSubmitting(false);
    }
  });

  const handlePhonePasswordLogin = async () => {
    if (phonePassword.length < 6) {
      setServerError('Password must be at least 6 characters');
      return;
    }
    setServerError(null);
    setSubmitting(true);
    try {
      const deviceId = await getOrCreateDeviceId();
      const res = await authControllerPhoneLogin({
        phone: checkedPhone,
        password: phonePassword,
        deviceId,
      });
      if (res.status === 200) {
        await completeAuthSession({
          accessToken: res.data.accessToken,
          refreshToken: res.data.refreshToken,
          user: res.data.user,
        });
        finishNavigation();
      }
    } catch (err) {
      setServerError(err instanceof ApiError ? err.message : t('app.errorSubtitle'));
    } finally {
      setSubmitting(false);
    }
  };

  const handleEmailLogin = emailForm.handleSubmit(async ({ email, password }) => {
    setServerError(null);
    setSubmitting(true);
    try {
      const deviceId = await getOrCreateDeviceId();
      const res = await authControllerLogin({ email, password, deviceId });
      if (res.status === 200) {
        await completeAuthSession({
          accessToken: res.data.accessToken,
          refreshToken: res.data.refreshToken,
          user: res.data.user,
        });
        finishNavigation();
      }
    } catch (err) {
      setServerError(err instanceof ApiError ? err.message : t('app.errorSubtitle'));
    } finally {
      setSubmitting(false);
    }
  });

  const handleForgotPassword = async () => {
    if (!checkedPhone) return;
    setServerError(null);
    setSubmitting(true);
    try {
      await authControllerSendOtp({ phone: checkedPhone, purpose: 'RESET_PASSWORD' });
      router.push({
        pathname: '/(auth)/otp' as never,
        params: { phone: checkedPhone, purpose: 'RESET_PASSWORD', redirect: redirect ?? '' },
      } as never);
    } catch (err) {
      setServerError(err instanceof ApiError ? err.message : t('app.errorSubtitle'));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.flex}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <Appbar.Header style={styles.header}>
        <Appbar.BackAction onPress={() => router.back()} accessibilityLabel="Back" />
        <Appbar.Content title={t('auth.login')} />
      </Appbar.Header>

      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        <Text variant="headlineSmall" style={styles.title}>
          {t('auth.welcome')}
        </Text>
        <Text variant="bodyMedium" style={styles.subtitle}>
          {t('auth.subtitle')}
        </Text>

        <SegmentedButtons
          value={mode}
          onValueChange={(val) => {
            setMode(val as 'phone' | 'email');
            setServerError(null);
          }}
          buttons={[
            { value: 'phone', label: t('auth.phoneLabel'), testID: 'auth.modePhone' },
            { value: 'email', label: t('auth.emailLabel'), testID: 'auth.modeEmail' },
          ]}
          style={styles.segmented}
        />

        {mode === 'phone' ? (
          phoneStep === 'check' ? (
            <View style={styles.form}>
              <Controller
                control={phoneForm.control}
                name="phone"
                render={({ field: { onChange, onBlur, value } }) => (
                  <TextInput
                    testID="auth.phoneInput"
                    mode="outlined"
                    label={t('auth.phoneLabel')}
                    placeholder={t('auth.phonePlaceholder')}
                    keyboardType="phone-pad"
                    value={value}
                    onBlur={onBlur}
                    onChangeText={onChange}
                    left={<TextInput.Affix text="+88 " />}
                    error={Boolean(phoneForm.formState.errors.phone)}
                  />
                )}
              />
              <HelperText type="error" visible={Boolean(phoneForm.formState.errors.phone)}>
                {phoneForm.formState.errors.phone?.message}
              </HelperText>

              {serverError ? (
                <HelperText type="error" visible>
                  {serverError}
                </HelperText>
              ) : null}

              <Button
                testID="auth.phoneContinueButton"
                mode="contained"
                loading={submitting}
                disabled={submitting}
                onPress={() => void handleCheckPhone()}
                style={styles.cta}
                contentStyle={styles.ctaContent}
              >
                {t('auth.continue')}
              </Button>
            </View>
          ) : (
            <View style={styles.form}>
              <Text variant="titleMedium" style={styles.greeting}>
                {matchedName ? `Welcome back, ${matchedName}` : checkedPhone}
              </Text>
              <TextInput
                testID="auth.phonePasswordInput"
                mode="outlined"
                label={t('auth.passwordLabel')}
                secureTextEntry={!showPassword}
                value={phonePassword}
                onChangeText={setPhonePassword}
                right={
                  <TextInput.Icon
                    icon={showPassword ? 'eye-off' : 'eye'}
                    onPress={() => setShowPassword((prev) => !prev)}
                  />
                }
              />
              {serverError ? (
                <HelperText type="error" visible>
                  {serverError}
                </HelperText>
              ) : null}
              <Button
                testID="auth.phoneLoginButton"
                mode="contained"
                loading={submitting}
                disabled={submitting}
                onPress={handlePhonePasswordLogin}
                style={styles.cta}
                contentStyle={styles.ctaContent}
              >
                {t('auth.login')}
              </Button>
              <View style={styles.rowActions}>
                <Button mode="text" onPress={() => setPhoneStep('check')}>
                  Change Number
                </Button>
                <Button mode="text" onPress={handleForgotPassword}>
                  {t('auth.forgotPassword')}
                </Button>
              </View>
            </View>
          )
        ) : (
          <View style={styles.form}>
            <Controller
              control={emailForm.control}
              name="email"
              render={({ field: { onChange, onBlur, value } }) => (
                <TextInput
                  testID="auth.emailInput"
                  mode="outlined"
                  label={t('auth.emailLabel')}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  value={value}
                  onBlur={onBlur}
                  onChangeText={onChange}
                  error={Boolean(emailForm.formState.errors.email)}
                />
              )}
            />
            <HelperText type="error" visible={Boolean(emailForm.formState.errors.email)}>
              {emailForm.formState.errors.email?.message}
            </HelperText>

            <Controller
              control={emailForm.control}
              name="password"
              render={({ field: { onChange, onBlur, value } }) => (
                <TextInput
                  testID="auth.emailPasswordInput"
                  mode="outlined"
                  label={t('auth.passwordLabel')}
                  secureTextEntry={!showPassword}
                  value={value}
                  onBlur={onBlur}
                  onChangeText={onChange}
                  right={
                    <TextInput.Icon
                      icon={showPassword ? 'eye-off' : 'eye'}
                      onPress={() => setShowPassword((prev) => !prev)}
                    />
                  }
                  error={Boolean(emailForm.formState.errors.password)}
                />
              )}
            />
            <HelperText type="error" visible={Boolean(emailForm.formState.errors.password)}>
              {emailForm.formState.errors.password?.message}
            </HelperText>

            {serverError ? (
              <HelperText type="error" visible>
                {serverError}
              </HelperText>
            ) : null}

            <Button
              testID="auth.emailLoginButton"
              mode="contained"
              loading={submitting}
              disabled={submitting}
              onPress={() => void handleEmailLogin()}
              style={styles.cta}
              contentStyle={styles.ctaContent}
            >
              {t('auth.login')}
            </Button>
          </View>
        )}
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: azColors.page },
  header: { backgroundColor: azColors.surface },
  content: { padding: spacing.lg },
  title: { color: azColors.navy, fontWeight: '700', lineHeight: 32 },
  subtitle: { color: azColors.muted, marginTop: spacing.xs, lineHeight: 22 },
  segmented: { marginTop: spacing.lg, marginBottom: spacing.lg },
  form: { gap: spacing.xs },
  greeting: { color: azColors.navy, fontWeight: '600', marginBottom: spacing.xs },
  cta: { marginTop: spacing.sm, borderRadius: 12 },
  ctaContent: { minHeight: 48 },
  rowActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: spacing.xs,
  },
});
