import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  TextInput as RNTextInput,
  View,
} from 'react-native';
import { Appbar, Button, Chip, HelperText, Surface, Text, TextInput } from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { ApiError, authControllerSendOtp, authControllerVerifyOtp } from '@repo/api-client';
import { azColors, radius, spacing } from '@/shared/theme';
import { isValidBdPhone, normalizeBdPhone } from '@/shared/utils/bd-phone';
import { otpVerifySchema, phoneStepSchema } from '../schemas';

function unwrapParam(value: string | string[] | undefined): string {
  if (Array.isArray(value)) return value[0] ?? '';
  return value ?? '';
}

function extractRetryAfterSeconds(err: unknown): number | null {
  if (err instanceof ApiError && err.status === 429 && err.data && typeof err.data === 'object') {
    const retry = (err.data as Record<string, unknown>).retryAfterSeconds;
    if (typeof retry === 'number' && retry > 0) return retry;
  }
  return null;
}

function formatDisplayPhone(localPhone: string): string {
  const normalized = normalizeBdPhone(localPhone);
  if (normalized.length === 11) {
    return `+88 ${normalized.slice(0, 5)}-${normalized.slice(5)}`;
  }
  return normalized ? `+88 ${normalized}` : '';
}

export function OtpScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const rawParams = useLocalSearchParams<{
    phone?: string | string[];
    purpose?: string | string[];
    redirect?: string | string[];
    resendInSeconds?: string | string[];
    devOtp?: string | string[];
  }>();

  const initialPhoneParam = useMemo(
    () => normalizeBdPhone(unwrapParam(rawParams.phone)),
    [rawParams.phone],
  );
  const purpose: 'SIGNUP' | 'RESET_PASSWORD' =
    unwrapParam(rawParams.purpose) === 'RESET_PASSWORD' ? 'RESET_PASSWORD' : 'SIGNUP';
  const redirect = unwrapParam(rawParams.redirect);
  const initialResend = Math.max(0, Number.parseInt(unwrapParam(rawParams.resendInSeconds), 10) || 60);
  const initialDevOtp = __DEV__ ? unwrapParam(rawParams.devOtp) || null : null;

  const hasValidInitialPhone = isValidBdPhone(initialPhoneParam);

  const [step, setStep] = useState<'phone' | 'verify'>(hasValidInitialPhone ? 'verify' : 'phone');
  const [phoneInput, setPhoneInput] = useState(hasValidInitialPhone ? initialPhoneParam : '');
  const [activePhone, setActivePhone] = useState(hasValidInitialPhone ? initialPhoneParam : '');
  const [digits, setDigits] = useState<[string, string, string, string]>(['', '', '', '']);
  const [countdown, setCountdown] = useState(hasValidInitialPhone ? initialResend : 0);
  const [devFallbackOtp, setDevFallbackOtp] = useState<string | null>(initialDevOtp);
  const [infoMessage, setInfoMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const boxRefs = [
    useRef<React.ComponentRef<typeof RNTextInput>>(null),
    useRef<React.ComponentRef<typeof RNTextInput>>(null),
    useRef<React.ComponentRef<typeof RNTextInput>>(null),
    useRef<React.ComponentRef<typeof RNTextInput>>(null),
  ];

  const code = digits.join('');

  // Print fallback OTP to Metro console ONLY in dev when SMS delivery failed & backend returned devOtp
  useEffect(() => {
    if (__DEV__ && devFallbackOtp && activePhone) {
      console.info(`[DEV OTP FALLBACK] Phone: ${activePhone} | OTP: ${devFallbackOtp}`);
    }
  }, [devFallbackOtp, activePhone]);

  useEffect(() => {
    if (countdown <= 0) return;
    const id = setInterval(() => setCountdown((c) => Math.max(0, c - 1)), 1000);
    return () => clearInterval(id);
  }, [countdown]);

  const fillOtpString = (rawCode: string) => {
    const clean = rawCode.replace(/[^\d]/g, '').slice(0, 4);
    const next: [string, string, string, string] = [
      clean[0] ?? '',
      clean[1] ?? '',
      clean[2] ?? '',
      clean[3] ?? '',
    ];
    setDigits(next);
    if (error) setError(null);
    const focusIdx = Math.min(clean.length, 3);
    boxRefs[focusIdx]?.current?.focus();
  };

  const handleDigitChange = (index: number, value: string) => {
    const clean = value.replace(/[^\d]/g, '');
    if (clean.length > 1) {
      // Handle full 4-digit paste or SMS autofill
      fillOtpString(clean);
      return;
    }
    const next: [string, string, string, string] = [...digits] as [string, string, string, string];
    next[index] = clean;
    setDigits(next);
    if (error) setError(null);
    if (clean && index < 3) {
      boxRefs[index + 1]?.current?.focus();
    }
  };

  const handleDigitKeyPress = (index: number, key: string) => {
    if (key === 'Backspace' && !digits[index] && index > 0) {
      const next: [string, string, string, string] = [...digits] as [string, string, string, string];
      next[index - 1] = '';
      setDigits(next);
      boxRefs[index - 1]?.current?.focus();
    }
  };

  const handleSendOtpForPhone = async () => {
    const parsed = phoneStepSchema.safeParse({ phone: phoneInput });
    if (!parsed.success) {
      setError(parsed.error.issues[0]?.message || 'Enter a valid 11-digit BD mobile number');
      return;
    }

    const normalized = normalizeBdPhone(phoneInput);
    setError(null);
    setInfoMessage(null);
    setSubmitting(true);

    try {
      const res = await authControllerSendOtp({ phone: normalized, purpose });
      const otpData = res.status === 200 ? res.data : undefined;
      setActivePhone(normalized);
      setPhoneInput(normalized);
      setDigits(['', '', '', '']);
      setCountdown(otpData?.resendInSeconds ?? 60);
      setDevFallbackOtp(__DEV__ && otpData?.devOtp ? otpData.devOtp : null);
      setInfoMessage(t('auth.otpSentBanner', { phone: formatDisplayPhone(normalized) }));
      setStep('verify');
    } catch (err) {
      const retryAfter = extractRetryAfterSeconds(err);
      if (retryAfter) {
        setActivePhone(normalized);
        setPhoneInput(normalized);
        setCountdown(retryAfter);
        setStep('verify');
        setError(err instanceof ApiError ? err.message : null);
      } else {
        setError(err instanceof ApiError ? err.message : t('app.errorSubtitle'));
      }
    } finally {
      setSubmitting(false);
    }
  };

  const handleVerify = async () => {
    if (!isValidBdPhone(activePhone)) {
      setStep('phone');
      setError('Please enter your mobile number first.');
      return;
    }

    const parsed = otpVerifySchema.safeParse({ code });
    if (!parsed.success) {
      setError(parsed.error.issues[0]?.message || 'Enter the 4-digit OTP code');
      return;
    }

    setError(null);
    setSubmitting(true);
    try {
      const res = await authControllerVerifyOtp({
        phone: activePhone,
        code,
        purpose,
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
          params: { signupToken: res.data.token, phone: activePhone, redirect },
        } as never);
      }
    } catch (err) {
      setError(err instanceof ApiError ? err.message : t('app.errorSubtitle'));
    } finally {
      setSubmitting(false);
    }
  };

  const handleResend = async () => {
    if (countdown > 0 || submitting || !isValidBdPhone(activePhone)) return;
    setError(null);
    setInfoMessage(null);
    setSubmitting(true);
    try {
      const res = await authControllerSendOtp({
        phone: activePhone,
        purpose,
      });
      const otpData = res.status === 200 ? res.data : undefined;
      setCountdown(otpData?.resendInSeconds ?? 60);
      setDevFallbackOtp(__DEV__ && otpData?.devOtp ? otpData.devOtp : null);
      setInfoMessage(t('auth.otpSentBanner', { phone: formatDisplayPhone(activePhone) }));
    } catch (err) {
      const retryAfter = extractRetryAfterSeconds(err);
      if (retryAfter) {
        setCountdown(retryAfter);
      }
      setError(err instanceof ApiError ? err.message : t('app.errorSubtitle'));
    } finally {
      setSubmitting(false);
    }
  };

  const handleChangeNumber = () => {
    setError(null);
    setInfoMessage(null);
    setDigits(['', '', '', '']);
    setDevFallbackOtp(null);
    setStep('phone');
  };

  const handleBack = () => {
    if (step === 'verify' && !hasValidInitialPhone) {
      handleChangeNumber();
      return;
    }
    if (router.canGoBack()) {
      router.back();
    } else {
      router.replace('/(auth)/login' as never);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <Appbar.Header style={styles.header}>
        <Appbar.BackAction onPress={handleBack} accessibilityLabel="Back" />
        <Appbar.Content
          title={step === 'phone' ? t('auth.enterPhoneTitle') : t('auth.verifyOtpTitle')}
        />
      </Appbar.Header>

      <ScrollView contentContainerStyle={styles.body} keyboardShouldPersistTaps="handled">
        <Surface style={styles.card} elevation={2}>
          <View style={styles.brandHeader}>
            <View style={styles.logoBadge}>
              <MaterialCommunityIcons name="shield-key-outline" size={22} color={azColors.primary} />
            </View>
            <Text style={styles.brandName}>
              A<Text style={styles.brandAccent}>to</Text>Z
            </Text>
          </View>

          {step === 'phone' ? (
            <View style={styles.section}>
              <Text variant="titleLarge" style={styles.title}>
                {t('auth.enterPhoneTitle')}
              </Text>
              <Text variant="bodySmall" style={styles.subtitle}>
                {t('auth.enterPhoneSubtitle')}
              </Text>

              <TextInput
                testID="auth.otpPhoneInput"
                mode="outlined"
                label={t('auth.phoneLabel')}
                placeholder={t('auth.phonePlaceholder')}
                keyboardType="phone-pad"
                autoComplete="tel"
                maxLength={13}
                value={phoneInput}
                onChangeText={(text) => {
                  setPhoneInput(text.replace(/[^\d]/g, ''));
                  if (error) setError(null);
                }}
                left={<TextInput.Affix text="+88 " />}
                outlineStyle={styles.inputOutline}
                error={Boolean(error)}
                style={styles.phoneInput}
              />

              {error ? (
                <HelperText type="error" visible>
                  {error}
                </HelperText>
              ) : null}

              <Button
                testID="auth.sendOtpButton"
                mode="contained"
                buttonColor="#FF5A00"
                textColor="#FFFFFF"
                loading={submitting}
                disabled={submitting || phoneInput.trim().length < 10}
                onPress={() => void handleSendOtpForPhone()}
                style={styles.cta}
                contentStyle={styles.ctaContent}
                labelStyle={styles.ctaLabel}
              >
                {t('auth.sendOtp')}
              </Button>
            </View>
          ) : (
            <View style={styles.section}>
              <Text variant="titleLarge" style={styles.title}>
                {t('auth.verifyOtpTitle')}
              </Text>
              <Text variant="bodySmall" style={styles.subtitle}>
                {t('auth.verifyOtpSubtitle', { phone: formatDisplayPhone(activePhone) })}
              </Text>

              <View style={styles.phoneBadge}>
                <Text variant="titleSmall" style={styles.phoneBadgeText}>
                  {formatDisplayPhone(activePhone)}
                </Text>
                <Button
                  testID="auth.changePhoneButton"
                  mode="text"
                  compact
                  onPress={handleChangeNumber}
                >
                  {t('auth.changeNumber')}
                </Button>
              </View>

              {infoMessage ? (
                <HelperText type="info" visible style={styles.infoText}>
                  {infoMessage}
                </HelperText>
              ) : null}

              {__DEV__ && devFallbackOtp ? (
                <Chip
                  icon="message-text-outline"
                  onPress={() => fillOtpString(devFallbackOtp)}
                  style={styles.devChip}
                >
                  {`SMS Fallback OTP: ${devFallbackOtp} (Tap to fill)`}
                </Chip>
              ) : null}

              {/* Web UnifiedAuthCard-style 4 Separate OTP Digit Boxes */}
              <View style={styles.otpBoxesRow} testID="auth.otpInput">
                {digits.map((digit, idx) => (
                  <RNTextInput
                    key={idx}
                    ref={boxRefs[idx]}
                    testID={`auth.otpDigit.${idx}`}
                    value={digit}
                    onChangeText={(val) => handleDigitChange(idx, val)}
                    onKeyPress={({ nativeEvent }) => handleDigitKeyPress(idx, nativeEvent.key)}
                    keyboardType="number-pad"
                    textContentType={idx === 0 ? 'oneTimeCode' : 'none'}
                    autoComplete={idx === 0 ? 'sms-otp' : 'off'}
                    maxLength={idx === 0 ? 4 : 1}
                    selectTextOnFocus
                    style={[
                      styles.otpBox,
                      digit ? styles.otpBoxFilled : null,
                      error ? styles.otpBoxError : null,
                    ]}
                  />
                ))}
              </View>

              {error ? (
                <HelperText type="error" visible style={styles.centerText}>
                  {error}
                </HelperText>
              ) : null}

              <Button
                testID="auth.verifyOtpButton"
                mode="contained"
                buttonColor="#FF5A00"
                textColor="#FFFFFF"
                loading={submitting}
                disabled={submitting || code.length !== 4}
                onPress={() => void handleVerify()}
                style={styles.cta}
                contentStyle={styles.ctaContent}
                labelStyle={styles.ctaLabel}
              >
                {t('auth.continue')}
              </Button>

              <Button
                testID="auth.resendOtpButton"
                mode="text"
                disabled={countdown > 0 || submitting}
                onPress={() => void handleResend()}
                style={styles.resend}
              >
                {countdown > 0
                  ? t('auth.resendIn', { seconds: countdown })
                  : t('auth.resendCode')}
              </Button>
            </View>
          )}
        </Surface>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F4F6F9' },
  header: { backgroundColor: azColors.surface },
  body: { flexGrow: 1, justifyContent: 'center', padding: spacing.lg },
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
  brandAccent: { color: azColors.primary },
  section: { gap: spacing.xs },
  title: { color: azColors.navy, fontWeight: '800', textAlign: 'center' },
  subtitle: {
    color: azColors.muted,
    textAlign: 'center',
    marginTop: spacing.xxs,
    lineHeight: 19,
  },
  phoneBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#F8FAFC',
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: azColors.border,
    paddingLeft: spacing.md,
    paddingRight: spacing.xs,
    paddingVertical: 2,
    marginTop: spacing.sm,
  },
  phoneBadgeText: { color: azColors.navy, fontWeight: '700' },
  phoneInput: { marginTop: spacing.md },
  inputOutline: { borderRadius: radius.md },
  otpBoxesRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 12,
    marginTop: spacing.md,
    marginBottom: spacing.xs,
  },
  otpBox: {
    width: 56,
    height: 58,
    borderRadius: radius.md,
    borderWidth: 1.5,
    borderColor: azColors.border,
    backgroundColor: '#F8FAFC',
    fontSize: 24,
    fontWeight: '800',
    color: azColors.navy,
    textAlign: 'center',
  },
  otpBoxFilled: {
    borderColor: '#FF5A00',
    backgroundColor: '#FFF7ED',
  },
  otpBoxError: {
    borderColor: azColors.danger,
  },
  infoText: { color: azColors.primary, textAlign: 'center' },
  centerText: { textAlign: 'center' },
  devChip: {
    alignSelf: 'center',
    marginTop: spacing.xs,
    backgroundColor: '#FEF3C7',
  },
  cta: { marginTop: spacing.md, borderRadius: radius.md },
  ctaContent: { minHeight: 48 },
  ctaLabel: { fontWeight: '700', fontSize: 15 },
  resend: { marginTop: spacing.xs },
});
