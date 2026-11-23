import React, { useState } from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, StyleSheet, View } from 'react-native';
import { Appbar, Button, Divider, HelperText, Surface, Text, TextInput } from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
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
import { azColors, radius, spacing } from '@/shared/theme';
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

  const extractRetryAfter = (err: unknown): number | null => {
    if (err instanceof ApiError && err.status === 429 && err.data && typeof err.data === 'object') {
      const retry = (err.data as Record<string, unknown>).retryAfterSeconds;
      if (typeof retry === 'number' && retry > 0) return retry;
    }
    return null;
  };

  const navigateToOtp = (
    phone: string,
    purpose: 'SIGNUP' | 'RESET_PASSWORD',
    resendInSeconds = 60,
    devOtp?: string,
  ) => {
    router.push({
      pathname: '/(auth)/otp' as never,
      params: {
        phone,
        purpose,
        redirect: redirect ?? '',
        resendInSeconds: String(resendInSeconds),
        ...(devOtp ? { devOtp } : {}),
      },
    } as never);
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
        try {
          const otpRes = await authControllerSendOtp({ phone: normalized, purpose: 'SIGNUP' });
          const otpData = otpRes.status === 200 ? otpRes.data : undefined;
          navigateToOtp(
            normalized,
            'SIGNUP',
            otpData?.resendInSeconds ?? 60,
            otpData?.devOtp,
          );
        } catch (otpErr) {
          const retryAfter = extractRetryAfter(otpErr);
          if (retryAfter) {
            navigateToOtp(normalized, 'SIGNUP', retryAfter);
          } else {
            throw otpErr;
          }
        }
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
      try {
        const otpRes = await authControllerSendOtp({
          phone: checkedPhone,
          purpose: 'RESET_PASSWORD',
        });
        const otpData = otpRes.status === 200 ? otpRes.data : undefined;
        navigateToOtp(
          checkedPhone,
          'RESET_PASSWORD',
          otpData?.resendInSeconds ?? 60,
          otpData?.devOtp,
        );
      } catch (otpErr) {
        const retryAfter = extractRetryAfter(otpErr);
        if (retryAfter) {
          navigateToOtp(checkedPhone, 'RESET_PASSWORD', retryAfter);
        } else {
          throw otpErr;
        }
      }
    } catch (err) {
      setServerError(err instanceof ApiError ? err.message : t('app.errorSubtitle'));
    } finally {
      setSubmitting(false);
    }
  };

  const handleBack = () => {
    if (router.canGoBack()) {
      router.back();
    } else {
      router.replace('/(tabs)' as never);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.flex}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <Appbar.Header style={styles.header}>
        <Appbar.BackAction onPress={handleBack} accessibilityLabel="Back" />
        <Appbar.Content title={t('auth.signUpOrLogin')} />
      </Appbar.Header>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
      >
        {/* Web UnifiedAuthCard-inspired centered single-surface white card */}
        <Surface style={styles.card} elevation={2}>
          {/* Centered Brand Logo Header */}
          <View style={styles.brandHeader}>
            <View style={styles.logoBadge}>
              <MaterialCommunityIcons name="shopping-outline" size={22} color={azColors.primary} />
            </View>
            <Text style={styles.brandName}>
              A<Text style={styles.brandAccent}>to</Text>Z
            </Text>
          </View>

          <Text variant="titleLarge" style={styles.title}>
            {mode === 'phone'
              ? phoneStep === 'check'
                ? t('auth.signUpOrLogin')
                : matchedName
                  ? `Welcome back, ${matchedName}`
                  : t('auth.login')
              : t('auth.useEmail')}
          </Text>
          <Text variant="bodySmall" style={styles.subtitle}>
            {mode === 'phone'
              ? phoneStep === 'check'
                ? t('auth.subtitle')
                : `Enter password for +88 ${checkedPhone}`
              : 'Sign in with your registered email and password'}
          </Text>

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
                      autoComplete="tel"
                      maxLength={13}
                      value={value}
                      onBlur={onBlur}
                      onChangeText={(text) => {
                        onChange(text.replace(/[^\d]/g, ''));
                        if (serverError) setServerError(null);
                      }}
                      left={<TextInput.Affix text="+88 " />}
                      outlineStyle={styles.inputOutline}
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
                  buttonColor="#FF5A00"
                  textColor="#FFFFFF"
                  loading={submitting}
                  disabled={submitting}
                  onPress={() => void handleCheckPhone()}
                  style={styles.cta}
                  contentStyle={styles.ctaContent}
                  labelStyle={styles.ctaLabel}
                >
                  {t('auth.signUpOrLogin')}
                </Button>
              </View>
            ) : (
              <View style={styles.form}>
                <TextInput
                  testID="auth.phonePasswordInput"
                  mode="outlined"
                  label={t('auth.passwordLabel')}
                  secureTextEntry={!showPassword}
                  value={phonePassword}
                  onChangeText={(text) => {
                    setPhonePassword(text);
                    if (serverError) setServerError(null);
                  }}
                  outlineStyle={styles.inputOutline}
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
                  buttonColor="#FF5A00"
                  textColor="#FFFFFF"
                  loading={submitting}
                  disabled={submitting}
                  onPress={handlePhonePasswordLogin}
                  style={styles.cta}
                  contentStyle={styles.ctaContent}
                  labelStyle={styles.ctaLabel}
                >
                  {t('auth.login')}
                </Button>
                <View style={styles.rowActions}>
                  <Button
                    mode="text"
                    compact
                    onPress={() => {
                      setPhoneStep('check');
                      setPhonePassword('');
                      setServerError(null);
                    }}
                  >
                    {t('auth.changeNumber')}
                  </Button>
                  <Button mode="text" compact onPress={handleForgotPassword}>
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
                    onChangeText={(text) => {
                      onChange(text);
                      if (serverError) setServerError(null);
                    }}
                    outlineStyle={styles.inputOutline}
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
                    onChangeText={(text) => {
                      onChange(text);
                      if (serverError) setServerError(null);
                    }}
                    outlineStyle={styles.inputOutline}
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
                buttonColor="#FF5A00"
                textColor="#FFFFFF"
                loading={submitting}
                disabled={submitting}
                onPress={() => void handleEmailLogin()}
                style={styles.cta}
                contentStyle={styles.ctaContent}
                labelStyle={styles.ctaLabel}
              >
                {t('auth.login')}
              </Button>
            </View>
          )}

          {/* Clean Web-style divider & mode switch */}
          <View style={styles.dividerRow}>
            <Divider style={styles.dividerLine} />
            <Text style={styles.dividerText}>OR</Text>
            <Divider style={styles.dividerLine} />
          </View>

          <Button
            testID={mode === 'phone' ? 'auth.modeEmail' : 'auth.modePhone'}
            mode="outlined"
            icon={mode === 'phone' ? 'email-outline' : 'cellphone'}
            onPress={() => {
              setMode((prev) => (prev === 'phone' ? 'email' : 'phone'));
              setPhoneStep('check');
              setServerError(null);
            }}
            style={styles.switchBtn}
            contentStyle={styles.switchBtnContent}
          >
            {mode === 'phone' ? t('auth.useEmail') : t('auth.usePhone')}
          </Button>
        </Surface>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: '#F4F6F9' },
  header: { backgroundColor: azColors.surface },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    padding: spacing.lg,
  },
  card: {
    backgroundColor: azColors.surface,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: azColors.border,
    padding: spacing.lg,
  },
  brandHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    marginBottom: spacing.md,
  },
  logoBadge: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: azColors.primarySoft,
    borderWidth: 1,
    borderColor: '#DBEAFE',
    alignItems: 'center',
    justifyContent: 'center',
  },
  brandName: {
    fontSize: 22,
    fontWeight: '900',
    color: azColors.navy,
    letterSpacing: -0.5,
  },
  brandAccent: {
    color: azColors.primary,
  },
  title: {
    color: azColors.navy,
    fontWeight: '800',
    textAlign: 'center',
  },
  subtitle: {
    color: azColors.muted,
    textAlign: 'center',
    marginTop: spacing.xxs,
    marginBottom: spacing.lg,
    lineHeight: 19,
  },
  form: { gap: spacing.xxs },
  inputOutline: { borderRadius: radius.md },
  cta: { marginTop: spacing.xs, borderRadius: radius.md },
  ctaContent: { minHeight: 48 },
  ctaLabel: { fontWeight: '700', fontSize: 15 },
  rowActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: spacing.xs,
  },
  dividerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginVertical: spacing.md,
  },
  dividerLine: { flex: 1 },
  dividerText: {
    fontSize: 11,
    fontWeight: '700',
    color: azColors.muted,
  },
  switchBtn: {
    borderRadius: radius.md,
    borderColor: azColors.border,
  },
  switchBtnContent: {
    minHeight: 44,
  },
});
