'use client';

import React, { useState, useEffect, useRef } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import {
  Phone,
  Mail,
  Lock,
  Eye,
  EyeOff,
  User as UserIcon,
  ArrowLeft,
  AlertCircle,
  Loader2,
  CheckCircle2,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

export type AuthView =
  | 'phone-input' // Screenshot 1: Mobile number entry (Sign Up / Login)
  | 'otp-verify' // Screenshot 2: 4-digit OTP verification
  | 'phone-register' // Screenshot 3: Sign Up form
  | 'email-login' // Screenshot 4: Email & password login
  | 'phone-password' // Screenshot 5 (Screenshot_21): Mobile number & password login
  | 'forgot-password' // Forgot password phone entry
  | 'reset-password'; // Set new password after OTP

interface UnifiedAuthCardProps {
  initialView?: AuthView;
  redirectTo?: string;
  onSuccess?: () => void;
}

export function UnifiedAuthCard({
  initialView = 'phone-input',
  redirectTo = '/',
  onSuccess,
}: UnifiedAuthCardProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const queryRedirect = searchParams.get('redirect');
  const targetRedirect = queryRedirect || redirectTo || '/';

  const {
    login,
    phoneCheck,
    phoneSendOtp,
    phoneVerifyOtp,
    phoneRegister,
    phoneLogin,
    phoneResetPassword,
    isAuthenticated,
  } = useAuth();

  const [view, setView] = useState<AuthView>(initialView);

  // Form states
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [name, setName] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // OTP states
  const [otpDigits, setOtpDigits] = useState(['', '', '', '']);
  const [timerSeconds, setTimerSeconds] = useState(297); // 4:57 countdown
  const [canResend, setCanResend] = useState(false);
  const [signupToken, setSignupToken] = useState<string | null>(null);
  const [resetToken, setResetToken] = useState<string | null>(null);
  const [otpPurpose, setOtpPurpose] = useState<'SIGNUP' | 'RESET_PASSWORD'>('SIGNUP');

  // Feedback states
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [infoMessage, setInfoMessage] = useState<string | null>(null);

  const otpInputRefs = [
    useRef<HTMLInputElement>(null),
    useRef<HTMLInputElement>(null),
    useRef<HTMLInputElement>(null),
    useRef<HTMLInputElement>(null),
  ];

  // If already authenticated, redirect
  useEffect(() => {
    if (isAuthenticated) {
      if (onSuccess) {
        onSuccess();
      } else {
        router.push(targetRedirect);
      }
    }
  }, [isAuthenticated, targetRedirect, onSuccess, router]);

  // Countdown timer for OTP
  useEffect(() => {
    let interval: NodeJS.Timeout | null = null;
    if (view === 'otp-verify' && timerSeconds > 0) {
      interval = setInterval(() => {
        setTimerSeconds((prev) => {
          if (prev <= 1) {
            setCanResend(true);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [view, timerSeconds]);

  const formatTimer = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
  };

  const handleCompleteAuth = () => {
    if (onSuccess) {
      onSuccess();
    } else {
      router.push(targetRedirect);
    }
  };

  // ===================== ACTIONS =====================

  /**
   * Screen 1: User enters phone number and clicks "Sign Up / Login"
   */
  const handlePhoneSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setInfoMessage(null);

    const cleanPhone = phone.replace(/[^\d]/g, '');
    if (!cleanPhone || cleanPhone.length < 10) {
      setError('Please enter a valid 11-digit mobile number (e.g. 017XXXXXXXX)');
      return;
    }

    try {
      setLoading(true);
      const res = await phoneCheck(cleanPhone);
      setPhone(res.phone);

      if (res.exists) {
        // Registered -> Move to Password Screen (Screenshot 5 / Screenshot_21)
        setPassword('');
        setView('phone-password');
      } else {
        // Not registered -> Send OTP and move to OTP screen (Screenshot 2)
        setOtpPurpose('SIGNUP');
        await phoneSendOtp(res.phone, 'SIGNUP');
        setTimerSeconds(297);
        setCanResend(false);
        setOtpDigits(['', '', '', '']);
        setView('otp-verify');
      }
    } catch (err: any) {
      setError(err?.message || 'Unable to verify mobile number. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  /**
   * Handle OTP 4-digit input change with keyboard navigation & paste support
   */
  const handleOtpChange = (index: number, value: string) => {
    const digit = value.replace(/[^\d]/g, '').slice(-1);
    const nextDigits = [...otpDigits];
    nextDigits[index] = digit;
    setOtpDigits(nextDigits);

    if (digit && index < 3) {
      otpInputRefs[index + 1]?.current?.focus();
    }
  };

  const handleOtpKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace' && !otpDigits[index] && index > 0) {
      otpInputRefs[index - 1]?.current?.focus();
    }
  };

  const handleOtpPaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
    e.preventDefault();
    const pasted = e.clipboardData.getData('text').replace(/[^\d]/g, '').slice(0, 4);
    if (pasted) {
      const nextDigits = ['', '', '', ''];
      for (let i = 0; i < pasted.length; i++) {
        nextDigits[i] = pasted[i] || '';
      }
      setOtpDigits(nextDigits);
      const focusIndex = Math.min(pasted.length, 3);
      otpInputRefs[focusIndex]?.current?.focus();
    }
  };

  /**
   * Screen 2: Verify OTP
   */
  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    const code = otpDigits.join('');
    if (code.length !== 4) {
      setError('Please enter all 4 digits of your verification code.');
      return;
    }

    try {
      setLoading(true);
      const res = await phoneVerifyOtp(phone, code, otpPurpose);

      if (otpPurpose === 'RESET_PASSWORD') {
        setResetToken(res.token);
        setPassword('');
        setConfirmPassword('');
        setView('reset-password');
      } else {
        setSignupToken(res.token);
        setPassword('');
        setConfirmPassword('');
        setView('phone-register'); // Move to Screen 3 (Sign Up)
      }
    } catch (err: any) {
      setError(err?.message || 'Invalid verification code. Please check and try again.');
    } finally {
      setLoading(false);
    }
  };

  /**
   * Resend OTP code
   */
  const handleResendOtp = async () => {
    if (!canResend && timerSeconds > 0) return;
    setError(null);
    setInfoMessage(null);
    try {
      setLoading(true);
      await phoneSendOtp(phone, otpPurpose);
      setTimerSeconds(297);
      setCanResend(false);
      setOtpDigits(['', '', '', '']);
      setInfoMessage('A new 4-digit verification code has been sent.');
    } catch (err: any) {
      setError(err?.message || 'Failed to resend verification code.');
    } finally {
      setLoading(false);
    }
  };

  /**
   * Screen 3: Complete Sign Up
   */
  const handleRegisterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!signupToken) {
      setError('Verification session expired. Please verify your mobile number again.');
      setView('phone-input');
      return;
    }

    if (!name.trim()) {
      setError('Please enter your name.');
      return;
    }

    if (!password) {
      setError('Please enter a password.');
      return;
    }

    if (password.length < 6) {
      setError('Password must be at least 6 characters long.');
      return;
    }

    if (password !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    try {
      setLoading(true);
      await phoneRegister({
        signupToken,
        name: name.trim(),
        email: email.trim() || undefined,
        password,
      });

      handleCompleteAuth();
    } catch (err: any) {
      setError(err?.message || 'Account creation failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  /**
   * Screen 4: Email + Password Login
   */
  const handleEmailLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!email.trim() || !password) {
      setError('Please provide both your email and password.');
      return;
    }

    try {
      setLoading(true);
      await login({ email: email.trim(), password });
      handleCompleteAuth();
    } catch (err: any) {
      setError(err?.message || 'Invalid email or password.');
    } finally {
      setLoading(false);
    }
  };

  /**
   * Screen 5: Phone + Password Login (Screenshot_21)
   */
  const handlePhonePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!password) {
      setError('Please enter your password.');
      return;
    }

    try {
      setLoading(true);
      await phoneLogin({ phone, password });
      handleCompleteAuth();
    } catch (err: any) {
      setError(err?.message || 'Incorrect password. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  /**
   * Forgot Password trigger
   */
  const handleForgotPasswordClick = async () => {
    setError(null);
    setInfoMessage(null);
    const cleanPhone = phone.replace(/[^\d]/g, '');
    if (!cleanPhone || cleanPhone.length < 10) {
      setView('phone-input');
      setInfoMessage('Enter your registered mobile number first, then click Forgot Your Password.');
      return;
    }

    try {
      setLoading(true);
      setOtpPurpose('RESET_PASSWORD');
      const res = await phoneSendOtp(cleanPhone, 'RESET_PASSWORD');
      setPhone(res.phone);
      setTimerSeconds(297);
      setCanResend(false);
      setOtpDigits(['', '', '', '']);
      setView('otp-verify');
    } catch (err: any) {
      setError(err?.message || 'Could not send password reset code.');
    } finally {
      setLoading(false);
    }
  };

  /**
   * Reset Password Submit
   */
  const handleResetPasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!resetToken) {
      setError('Reset session expired. Please verify your mobile number again.');
      setView('phone-input');
      return;
    }

    if (!password || password.length < 6) {
      setError('Password must be at least 6 characters long.');
      return;
    }

    if (password !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    try {
      setLoading(true);
      await phoneResetPassword({ resetToken, password });
      handleCompleteAuth();
    } catch (err: any) {
      setError(err?.message || 'Failed to reset password.');
    } finally {
      setLoading(false);
    }
  };

  const handleSocialPlaceholder = (provider: string) => {
    setError(null);
    setInfoMessage(`${provider} sign-in will be available soon. Please use your mobile number or email.`);
  };

  return (
    <div
      style={{ maxWidth: '420px', width: '100%' }}
      className="mx-auto w-full max-w-[420px]"
    >
      {/* Main Card Surface — Uniform Single-Color Surface */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-[0_8px_30px_rgb(15,23,42,0.06)] overflow-hidden">
        {/* Centered Brand Logo Header (Same solid white surface) */}
        <div className="pt-6 pb-2 px-6 flex items-center justify-center">
          <Link
            href="/"
            className="inline-flex items-center gap-2.5 group focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#FF5A00] rounded-xl"
          >
            <div className="relative w-10 h-10 rounded-xl overflow-hidden bg-white p-1 border border-slate-200/80 flex items-center justify-center group-hover:border-slate-300 transition-colors">
              <Image
                src="/brand/Logo.png"
                alt="A to Z Ecommerce Logo"
                width={36}
                height={36}
                priority
                className="object-contain w-full h-full"
              />
            </div>
            <span className="text-xl font-black tracking-tight text-slate-900 leading-none">
              A<span className="text-blue-700">to</span>Z
            </span>
          </Link>
        </div>

        {/* Card Body */}
        <div className="px-6 pb-6 pt-3">
          {/* Error Banner */}
          {error && (
            <div
              role="alert"
              aria-live="polite"
              className="mb-3 p-2.5 bg-red-50/90 border border-red-200 rounded-xl flex items-start gap-2 text-xs font-medium text-red-700"
            >
              <AlertCircle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" aria-hidden="true" />
              <span className="leading-snug">{error}</span>
            </div>
          )}

          {/* Info Banner */}
          {infoMessage && (
            <div
              role="status"
              aria-live="polite"
              className="mb-3 p-2.5 bg-blue-50/90 border border-blue-200 rounded-xl flex items-start gap-2 text-xs font-medium text-blue-700"
            >
              <CheckCircle2 className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" aria-hidden="true" />
              <span className="leading-snug">{infoMessage}</span>
            </div>
          )}

          {/* ========================================================
              SCREEN 1: MOBILE NUMBER LOGIN / SIGN UP (Screenshot 1)
          ======================================================== */}
          {view === 'phone-input' && (
            <div>
              {/* Switch to Email Button */}
              <button
                type="button"
                onClick={() => {
                  setError(null);
                  setInfoMessage(null);
                  setView('email-login');
                }}
                className="w-full h-10 px-4 rounded-xl border border-slate-200/90 hover:border-slate-300 bg-white hover:bg-slate-50/80 text-slate-800 text-xs sm:text-sm font-semibold flex items-center justify-center gap-2 transition-colors cursor-pointer shadow-2xs focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#FF5A00]/40"
              >
                <Mail className="w-4 h-4 text-slate-500" aria-hidden="true" />
                <span>Login with Email</span>
              </button>

              {/* Or Divider */}
              <div className="relative my-3.5">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-slate-200/80" />
                </div>
                <div className="relative flex justify-center text-xs">
                  <span className="bg-white px-3 font-medium text-slate-400">
                    Or
                  </span>
                </div>
              </div>

              {/* Mobile Number Form */}
              <form onSubmit={handlePhoneSubmit} className="space-y-3">
                <div>
                  <label
                    htmlFor="auth-phone-input"
                    className="block text-xs sm:text-sm font-bold text-slate-800 mb-1.5"
                  >
                    Mobile Number
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                      <Phone className="w-4 h-4" aria-hidden="true" />
                    </div>
                    <input
                      id="auth-phone-input"
                      name="tel"
                      type="tel"
                      inputMode="tel"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      placeholder="017XXXXXXXX…"
                      className="w-full h-10.5 pl-10 pr-4 bg-white border border-slate-200 rounded-xl text-slate-900 placeholder-slate-400 text-sm font-medium focus:outline-none focus:border-[#FF5A00] focus:ring-2 focus:ring-orange-500/15 transition-colors"
                      disabled={loading}
                      autoComplete="tel"
                      required
                    />
                  </div>
                </div>

                {/* Primary CTA: Sign Up / Login */}
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full h-10.5 px-4 rounded-xl bg-[#FF5A00] hover:bg-[#E04E00] active:scale-[0.99] text-white font-bold text-sm shadow-sm shadow-orange-500/15 transition-colors flex items-center justify-center gap-2 cursor-pointer disabled:opacity-60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#FF5A00] focus-visible:ring-offset-2"
                >
                  {loading && <Loader2 className="w-4 h-4 animate-spin" aria-hidden="true" />}
                  <span>Sign Up / Login</span>
                </button>
              </form>

              {/* Forgot Password */}
              <div className="text-center my-2.5">
                <button
                  type="button"
                  onClick={handleForgotPasswordClick}
                  className="text-xs font-medium text-slate-500 hover:text-[#FF5A00] transition-colors cursor-pointer rounded px-1 py-0.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#FF5A00]/40"
                >
                  Forgot Your Password?
                </button>
              </div>

              {/* Social Button */}
              <div>
                <button
                  type="button"
                  onClick={() => handleSocialPlaceholder('Google')}
                  className="w-full h-10 flex items-center justify-center gap-2 px-3 bg-white border border-slate-200 hover:border-slate-300 hover:bg-slate-50 rounded-xl text-xs font-bold text-slate-700 transition-colors shadow-2xs cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600/40"
                >
                  <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24" aria-hidden="true">
                    <path
                      fill="#4285F4"
                      d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                    />
                    <path
                      fill="#34A853"
                      d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                    />
                    <path
                      fill="#FBBC05"
                      d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                    />
                    <path
                      fill="#EA4335"
                      d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                    />
                  </svg>
                  <span>Google</span>
                </button>
              </div>
            </div>
          )}

          {/* ========================================================
              SCREEN 2: 4-DIGIT OTP VERIFICATION (Screenshot 2)
          ======================================================== */}
          {view === 'otp-verify' && (
            <div>
              {/* Back Link */}
              <button
                type="button"
                onClick={() => {
                  setError(null);
                  setInfoMessage(null);
                  setView('phone-input');
                }}
                className="text-[#0ea5e9] hover:text-[#0284c7] font-semibold text-xs inline-flex items-center gap-1 mb-3 cursor-pointer transition-colors rounded px-1 py-0.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0ea5e9]/40"
              >
                <ArrowLeft className="w-3.5 h-3.5" aria-hidden="true" />
                <span>Back</span>
              </button>

              {/* Verification Box */}
              <div className="bg-white border border-slate-200/80 rounded-xl p-4 sm:p-5 text-center mb-4">
                <h2 className="text-sm sm:text-base font-extrabold text-slate-900 mb-0.5">
                  Enter 4-Digit Verification Code
                </h2>
                <p className="text-xs font-medium text-slate-500 mb-4">
                  Code sent to{' '}
                  <span className="font-bold text-slate-900 tabular-nums">{phone}</span>
                </p>

                {/* 4 Digit Inputs */}
                <div className="flex justify-center gap-2.5 mb-4">
                  {otpDigits.map((digit, idx) => (
                    <input
                      key={idx}
                      ref={otpInputRefs[idx]}
                      id={`otp-digit-${idx + 1}`}
                      name={`otp-digit-${idx + 1}`}
                      type="text"
                      inputMode="numeric"
                      pattern="[0-9]*"
                      maxLength={1}
                      autoComplete={idx === 0 ? 'one-time-code' : 'off'}
                      aria-label={`Verification digit ${idx + 1} of 4`}
                      value={digit}
                      onChange={(e) => handleOtpChange(idx, e.target.value)}
                      onKeyDown={(e) => handleOtpKeyDown(idx, e)}
                      onPaste={idx === 0 ? handleOtpPaste : undefined}
                      disabled={loading}
                      className="w-12 h-12 text-center text-lg font-extrabold tabular-nums bg-white border border-slate-200/90 rounded-xl text-slate-900 focus:outline-none focus:border-[#FF5A00] focus:ring-2 focus:ring-orange-500/15 transition-colors shadow-2xs"
                    />
                  ))}
                </div>

                {/* Countdown Timer / Resend */}
                <div>
                  {timerSeconds > 0 ? (
                    <p className="text-xs font-medium text-slate-600 tabular-nums">
                      Resend code in{' '}
                      <span className="font-bold text-[#0284c7]">
                        {formatTimer(timerSeconds)}
                      </span>
                    </p>
                  ) : (
                    <button
                      type="button"
                      onClick={handleResendOtp}
                      disabled={loading}
                      className="text-xs font-bold text-[#0ea5e9] hover:text-[#0284c7] hover:underline cursor-pointer rounded px-1 py-0.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0ea5e9]/40"
                    >
                      Resend verification code
                    </button>
                  )}
                </div>
              </div>

              {/* Verify OTP CTA */}
              <button
                type="button"
                onClick={handleVerifyOtp}
                disabled={loading || otpDigits.join('').length !== 4}
                className="w-full h-10.5 px-4 rounded-xl bg-[#FF5A00] hover:bg-[#E04E00] active:scale-[0.99] text-white font-bold text-sm shadow-sm shadow-orange-500/15 transition-colors flex items-center justify-center gap-2 cursor-pointer disabled:opacity-60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#FF5A00] focus-visible:ring-offset-2"
              >
                {loading && <Loader2 className="w-4 h-4 animate-spin" aria-hidden="true" />}
                <span>Verify OTP</span>
              </button>
            </div>
          )}

          {/* ========================================================
              SCREEN 3: SIGN UP FORM (Screenshot 3)
          ======================================================== */}
          {view === 'phone-register' && (
            <div>
              {/* Back Link */}
              <button
                type="button"
                onClick={() => {
                  setError(null);
                  setView('otp-verify');
                }}
                className="text-[#0ea5e9] hover:text-[#0284c7] font-semibold text-xs inline-flex items-center gap-1 mb-3 cursor-pointer transition-colors rounded px-1 py-0.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0ea5e9]/40"
              >
                <ArrowLeft className="w-3.5 h-3.5" aria-hidden="true" />
                <span>Back</span>
              </button>

              <form onSubmit={handleRegisterSubmit} className="space-y-2.5">
                {/* Name */}
                <div>
                  <label
                    htmlFor="signup-name"
                    className="block text-xs font-bold text-slate-800 mb-1"
                  >
                    Name
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                      <UserIcon className="w-3.5 h-3.5" aria-hidden="true" />
                    </div>
                    <input
                      id="signup-name"
                      name="name"
                      type="text"
                      autoComplete="name"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="Enter your name…"
                      className="w-full h-9.5 pl-9 pr-3 bg-white border border-slate-200 rounded-xl text-slate-900 placeholder-slate-400 text-xs font-medium focus:outline-none focus:border-[#FF5A00] focus:ring-2 focus:ring-orange-500/15 transition-colors"
                      required
                    />
                  </div>
                </div>

                {/* Email (Optional) */}
                <div>
                  <label
                    htmlFor="signup-email"
                    className="block text-xs font-bold text-slate-800 mb-1"
                  >
                    Email
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                      <Mail className="w-3.5 h-3.5" aria-hidden="true" />
                    </div>
                    <input
                      id="signup-email"
                      name="email"
                      type="email"
                      autoComplete="email"
                      spellCheck={false}
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="Enter your email…"
                      className="w-full h-9.5 pl-9 pr-3 bg-white border border-slate-200 rounded-xl text-slate-900 placeholder-slate-400 text-xs font-medium focus:outline-none focus:border-[#FF5A00] focus:ring-2 focus:ring-orange-500/15 transition-colors"
                    />
                  </div>
                </div>

                {/* Password */}
                <div>
                  <label
                    htmlFor="signup-password"
                    className="block text-xs font-bold text-slate-800 mb-1"
                  >
                    Password
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                      <Lock className="w-3.5 h-3.5" aria-hidden="true" />
                    </div>
                    <input
                      id="signup-password"
                      name="new-password"
                      type={showPassword ? 'text' : 'password'}
                      autoComplete="new-password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="Enter your password…"
                      className="w-full h-9.5 pl-9 pr-9 bg-white border border-slate-200 rounded-xl text-slate-900 placeholder-slate-400 text-xs font-medium focus:outline-none focus:border-[#FF5A00] focus:ring-2 focus:ring-orange-500/15 transition-colors"
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      aria-label={showPassword ? 'Hide password' : 'Show password'}
                      className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600 cursor-pointer focus-visible:outline-none focus-visible:text-[#FF5A00]"
                    >
                      {showPassword ? (
                        <EyeOff className="w-3.5 h-3.5" aria-hidden="true" />
                      ) : (
                        <Eye className="w-3.5 h-3.5" aria-hidden="true" />
                      )}
                    </button>
                  </div>
                </div>

                {/* Confirm Password */}
                <div className="pb-1">
                  <label
                    htmlFor="signup-confirm-password"
                    className="block text-xs font-bold text-slate-800 mb-1"
                  >
                    Confirm Password
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                      <Lock className="w-3.5 h-3.5" aria-hidden="true" />
                    </div>
                    <input
                      id="signup-confirm-password"
                      name="confirm-password"
                      type={showConfirmPassword ? 'text' : 'password'}
                      autoComplete="new-password"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="Confirm your password…"
                      className="w-full h-9.5 pl-9 pr-9 bg-white border border-slate-200 rounded-xl text-slate-900 placeholder-slate-400 text-xs font-medium focus:outline-none focus:border-[#FF5A00] focus:ring-2 focus:ring-orange-500/15 transition-colors"
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      aria-label={showConfirmPassword ? 'Hide confirm password' : 'Show confirm password'}
                      className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600 cursor-pointer focus-visible:outline-none focus-visible:text-[#FF5A00]"
                    >
                      {showConfirmPassword ? (
                        <EyeOff className="w-3.5 h-3.5" aria-hidden="true" />
                      ) : (
                        <Eye className="w-3.5 h-3.5" aria-hidden="true" />
                      )}
                    </button>
                  </div>
                </div>

                {/* Create Account Button */}
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full h-10 px-4 rounded-xl bg-[#FF5A00] hover:bg-[#E04E00] active:scale-[0.99] text-white font-bold text-sm shadow-sm shadow-orange-500/15 transition-colors flex items-center justify-center gap-2 cursor-pointer disabled:opacity-60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#FF5A00] focus-visible:ring-offset-2"
                >
                  {loading && <Loader2 className="w-4 h-4 animate-spin" aria-hidden="true" />}
                  <span>Create Account</span>
                </button>
              </form>
            </div>
          )}

          {/* ========================================================
              SCREEN 4: EMAIL LOGIN (Screenshot 4)
          ======================================================== */}
          {view === 'email-login' && (
            <div>
              {/* Switch to Phone Number Button */}
              <button
                type="button"
                onClick={() => {
                  setError(null);
                  setInfoMessage(null);
                  setView('phone-input');
                }}
                className="w-full h-10 px-4 rounded-xl border border-slate-200/90 hover:border-slate-300 bg-white hover:bg-slate-50/80 text-slate-800 text-xs sm:text-sm font-semibold flex items-center justify-center gap-2 transition-colors cursor-pointer shadow-2xs focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#FF5A00]/40"
              >
                <Phone className="w-4 h-4 text-slate-500" aria-hidden="true" />
                <span>Login with Phone Number</span>
              </button>

              {/* Or Divider */}
              <div className="relative my-3.5">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-slate-200/80" />
                </div>
                <div className="relative flex justify-center text-xs">
                  <span className="bg-white px-3 font-medium text-slate-400">
                    Or
                  </span>
                </div>
              </div>

              <form onSubmit={handleEmailLoginSubmit} className="space-y-3">
                <div>
                  <label
                    htmlFor="email-login-input"
                    className="block text-xs sm:text-sm font-bold text-slate-800 mb-1"
                  >
                    Email
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                      <Mail className="w-4 h-4" aria-hidden="true" />
                    </div>
                    <input
                      id="email-login-input"
                      name="email"
                      type="email"
                      spellCheck={false}
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="Enter your email…"
                      className="w-full h-10 pl-10 pr-4 bg-white border border-slate-200 rounded-xl text-slate-900 placeholder-slate-400 text-sm font-medium focus:outline-none focus:border-[#FF5A00] focus:ring-2 focus:ring-orange-500/15 transition-colors"
                      autoComplete="email"
                      required
                    />
                  </div>
                </div>

                <div>
                  <label
                    htmlFor="email-password-input"
                    className="block text-xs sm:text-sm font-bold text-slate-800 mb-1"
                  >
                    Password
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                      <Lock className="w-4 h-4" aria-hidden="true" />
                    </div>
                    <input
                      id="email-password-input"
                      name="password"
                      type={showPassword ? 'text' : 'password'}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="Enter your password…"
                      className="w-full h-10 pl-10 pr-10 bg-white border border-slate-200 rounded-xl text-slate-900 placeholder-slate-400 text-sm font-medium focus:outline-none focus:border-[#FF5A00] focus:ring-2 focus:ring-orange-500/15 transition-colors"
                      autoComplete="current-password"
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      aria-label={showPassword ? 'Hide password' : 'Show password'}
                      className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-400 hover:text-slate-600 cursor-pointer focus-visible:outline-none focus-visible:text-[#FF5A00]"
                    >
                      {showPassword ? (
                        <EyeOff className="w-4 h-4" aria-hidden="true" />
                      ) : (
                        <Eye className="w-4 h-4" aria-hidden="true" />
                      )}
                    </button>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full h-10.5 px-4 rounded-xl bg-[#FF5A00] hover:bg-[#E04E00] active:scale-[0.99] text-white font-bold text-sm shadow-sm shadow-orange-500/15 transition-colors flex items-center justify-center gap-2 cursor-pointer disabled:opacity-60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#FF5A00] focus-visible:ring-offset-2"
                >
                  {loading && <Loader2 className="w-4 h-4 animate-spin" aria-hidden="true" />}
                  <span>Login</span>
                </button>
              </form>

              {/* Forgot Password */}
              <div className="text-center my-2.5">
                <button
                  type="button"
                  onClick={() => {
                    setError(null);
                    setView('phone-input');
                    setInfoMessage('Enter your registered mobile number to receive a password reset OTP.');
                  }}
                  className="text-xs font-medium text-slate-500 hover:text-[#FF5A00] transition-colors cursor-pointer rounded px-1 py-0.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#FF5A00]/40"
                >
                  Forgot Your Password?
                </button>
              </div>

              {/* Social Button */}
              <div>
                <button
                  type="button"
                  onClick={() => handleSocialPlaceholder('Google')}
                  className="w-full h-10 flex items-center justify-center gap-2 px-3 bg-white border border-slate-200 hover:border-slate-300 hover:bg-slate-50 rounded-xl text-xs font-bold text-slate-700 transition-colors shadow-2xs cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600/40"
                >
                  <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24" aria-hidden="true">
                    <path
                      fill="#4285F4"
                      d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                    />
                    <path
                      fill="#34A853"
                      d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                    />
                    <path
                      fill="#FBBC05"
                      d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                    />
                    <path
                      fill="#EA4335"
                      d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                    />
                  </svg>
                  <span>Google</span>
                </button>
              </div>
            </div>
          )}

          {/* ========================================================
              SCREEN 5: PHONE PASSWORD LOGIN (Screenshot 5 / Screenshot_21)
          ======================================================== */}
          {view === 'phone-password' && (
            <div>
              {/* Back Link */}
              <button
                type="button"
                onClick={() => {
                  setError(null);
                  setView('phone-input');
                }}
                className="text-[#0ea5e9] hover:text-[#0284c7] font-semibold text-xs inline-flex items-center gap-1 mb-3 cursor-pointer transition-colors rounded px-1 py-0.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0ea5e9]/40"
              >
                <ArrowLeft className="w-3.5 h-3.5" aria-hidden="true" />
                <span>Back</span>
              </button>

              <form onSubmit={handlePhonePasswordSubmit} className="space-y-3">
                <div>
                  <label
                    htmlFor="phone-password-mobile"
                    className="block text-xs sm:text-sm font-bold text-slate-800 mb-1"
                  >
                    Mobile Number
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                      <Phone className="w-4 h-4" aria-hidden="true" />
                    </div>
                    <input
                      id="phone-password-mobile"
                      name="tel"
                      type="tel"
                      inputMode="tel"
                      autoComplete="tel"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      className="w-full h-10 pl-10 pr-4 bg-white border border-slate-200 rounded-xl text-slate-900 text-sm font-semibold tabular-nums focus:outline-none focus:border-[#FF5A00] focus:ring-2 focus:ring-orange-500/15 transition-colors"
                      required
                    />
                  </div>
                </div>

                <div>
                  <label
                    htmlFor="phone-password-input"
                    className="block text-xs sm:text-sm font-bold text-slate-800 mb-1"
                  >
                    Password
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                      <Lock className="w-4 h-4" aria-hidden="true" />
                    </div>
                    <input
                      id="phone-password-input"
                      name="password"
                      type={showPassword ? 'text' : 'password'}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="Enter your password…"
                      className="w-full h-10 pl-10 pr-10 bg-white border border-slate-200 rounded-xl text-slate-900 placeholder-slate-400 text-sm font-medium focus:outline-none focus:border-[#FF5A00] focus:ring-2 focus:ring-orange-500/15 transition-colors"
                      autoComplete="current-password"
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      aria-label={showPassword ? 'Hide password' : 'Show password'}
                      className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-400 hover:text-slate-600 cursor-pointer focus-visible:outline-none focus-visible:text-[#FF5A00]"
                    >
                      {showPassword ? (
                        <EyeOff className="w-4 h-4" aria-hidden="true" />
                      ) : (
                        <Eye className="w-4 h-4" aria-hidden="true" />
                      )}
                    </button>
                  </div>
                </div>

                <div className="flex justify-end">
                  <button
                    type="button"
                    onClick={handleForgotPasswordClick}
                    className="text-xs font-bold text-[#0ea5e9] hover:text-[#0284c7] cursor-pointer transition-colors rounded px-1 py-0.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0ea5e9]/40"
                  >
                    Forgot Your Password?
                  </button>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full h-10.5 px-4 rounded-xl bg-[#FF5A00] hover:bg-[#E04E00] active:scale-[0.99] text-white font-bold text-sm shadow-sm shadow-orange-500/15 transition-colors flex items-center justify-center gap-2 cursor-pointer disabled:opacity-60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#FF5A00] focus-visible:ring-offset-2"
                >
                  {loading && <Loader2 className="w-4 h-4 animate-spin" aria-hidden="true" />}
                  <span>Login</span>
                </button>
              </form>
            </div>
          )}

          {/* ========================================================
              SCREEN 6: RESET PASSWORD
          ======================================================== */}
          {view === 'reset-password' && (
            <div>
              <button
                type="button"
                onClick={() => {
                  setError(null);
                  setView('phone-input');
                }}
                className="text-[#0ea5e9] hover:text-[#0284c7] font-semibold text-xs inline-flex items-center gap-1 mb-3 cursor-pointer transition-colors rounded px-1 py-0.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0ea5e9]/40"
              >
                <ArrowLeft className="w-3.5 h-3.5" aria-hidden="true" />
                <span>Back</span>
              </button>

              <form onSubmit={handleResetPasswordSubmit} className="space-y-3">
                <div>
                  <label
                    htmlFor="reset-new-password"
                    className="block text-xs font-bold text-slate-800 mb-1"
                  >
                    New Password
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                      <Lock className="w-4 h-4" aria-hidden="true" />
                    </div>
                    <input
                      id="reset-new-password"
                      name="new-password"
                      type={showPassword ? 'text' : 'password'}
                      autoComplete="new-password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="Enter new password…"
                      className="w-full h-10 pl-10 pr-10 bg-white border border-slate-200 rounded-xl text-slate-900 placeholder-slate-400 text-sm font-medium focus:outline-none focus:border-[#FF5A00] focus:ring-2 focus:ring-orange-500/15 transition-colors"
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      aria-label={showPassword ? 'Hide new password' : 'Show new password'}
                      className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-400 hover:text-slate-600 cursor-pointer focus-visible:outline-none focus-visible:text-[#FF5A00]"
                    >
                      {showPassword ? (
                        <EyeOff className="w-4 h-4" aria-hidden="true" />
                      ) : (
                        <Eye className="w-4 h-4" aria-hidden="true" />
                      )}
                    </button>
                  </div>
                </div>

                <div>
                  <label
                    htmlFor="reset-confirm-password"
                    className="block text-xs font-bold text-slate-800 mb-1"
                  >
                    Confirm New Password
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                      <Lock className="w-4 h-4" aria-hidden="true" />
                    </div>
                    <input
                      id="reset-confirm-password"
                      name="confirm-new-password"
                      type={showConfirmPassword ? 'text' : 'password'}
                      autoComplete="new-password"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="Confirm new password…"
                      className="w-full h-10 pl-10 pr-10 bg-white border border-slate-200 rounded-xl text-slate-900 placeholder-slate-400 text-sm font-medium focus:outline-none focus:border-[#FF5A00] focus:ring-2 focus:ring-orange-500/15 transition-colors"
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      aria-label={showConfirmPassword ? 'Hide confirm password' : 'Show confirm password'}
                      className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-400 hover:text-slate-600 cursor-pointer focus-visible:outline-none focus-visible:text-[#FF5A00]"
                    >
                      {showConfirmPassword ? (
                        <EyeOff className="w-4 h-4" aria-hidden="true" />
                      ) : (
                        <Eye className="w-4 h-4" aria-hidden="true" />
                      )}
                    </button>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full h-10.5 px-4 rounded-xl bg-[#FF5A00] hover:bg-[#E04E00] active:scale-[0.99] text-white font-bold text-sm shadow-sm shadow-orange-500/15 transition-colors flex items-center justify-center gap-2 cursor-pointer disabled:opacity-60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#FF5A00] focus-visible:ring-offset-2"
                >
                  {loading && <Loader2 className="w-4 h-4 animate-spin" aria-hidden="true" />}
                  <span>Reset & Login</span>
                </button>
              </form>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
