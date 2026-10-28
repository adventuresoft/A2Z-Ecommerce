'use client';

import React, { useState, Suspense, useEffect } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import {
  Eye,
  EyeOff,
  Lock,
  Mail,
  ArrowRight,
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  Sparkles,
  KeyRound,
} from 'lucide-react';
import { StorefrontShell } from '../../components/Shell/StorefrontShell';
import { useAuth } from '../../context/AuthContext';

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectParam = searchParams.get('redirect') || '/account';

  const { login, isAuthenticated } = useAuth();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (isAuthenticated) {
      router.push(redirectParam);
    }
  }, [isAuthenticated, redirectParam, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!email || !password) {
      setError('Please provide both email address and password.');
      return;
    }

    try {
      setIsSubmitting(true);
      await login({ email, password });
      router.push(redirectParam);
    } catch (err: any) {
      setError(err.message || 'Invalid email or password. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleQuickFill = async (demoEmail: string, demoPass: string, autoSubmit = false) => {
    setEmail(demoEmail);
    setPassword(demoPass);
    setError(null);

    if (autoSubmit) {
      try {
        setIsSubmitting(true);
        await login({ email: demoEmail, password: demoPass });
        router.push(redirectParam);
      } catch (err: any) {
        setError(err.message || 'Invalid email or password. Please try again.');
      } finally {
        setIsSubmitting(false);
      }
    }
  };

  return (
    <div className="max-w-md w-full mx-auto my-12 px-4 sm:px-0">
      <div className="bg-white rounded-2xl shadow-xl shadow-slate-200/60 border border-slate-100 p-8">
        <div className="text-center mb-8">
          <Link
            href="/"
            className="inline-flex items-center gap-3 group mb-4 p-1 focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-blue-600 rounded-2xl"
          >
            <div className="relative w-12 h-12 rounded-2xl overflow-hidden bg-white p-1 border border-slate-200 shadow-2xs group-hover:scale-105 transition-transform">
              <Image
                src="/brand/Logo.png"
                alt="A to Z Ecommerce Logo"
                width={48}
                height={48}
                priority
                className="object-contain w-full h-full"
              />
            </div>
            <div className="flex flex-col text-left">
              <div className="flex items-center">
                <span className="text-2xl font-black tracking-tight text-slate-900 leading-none">
                  A<span className="text-blue-700">to</span>Z
                </span>
                <span className="ml-1.5 text-[10px] font-black uppercase tracking-wider text-orange-600 bg-orange-50 px-1.5 py-0.5 rounded-md border border-orange-200">
                  Ecommerce
                </span>
              </div>
              <span className="text-[10px] font-bold text-slate-400 tracking-wider uppercase mt-1">
                Trusted Shopping, Always
              </span>
            </div>
          </Link>

          <h1 className="text-2xl font-black text-slate-900 tracking-tight text-balance">
            Welcome Back
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1.5">
            Sign in to access your orders, saved addresses, and profile
          </p>
        </div>

        {error && (
          <div className="mb-6 p-4 rounded-xl bg-red-50 border border-red-200 text-red-700 text-sm flex items-start gap-3">
            <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5 text-red-600" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label htmlFor="login-email" className="block text-xs font-semibold uppercase tracking-wider text-slate-600 mb-2">
              Email Address
            </label>
            <div className="relative">
              <Mail className="w-5 h-5 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" aria-hidden="true" />
              <input
                id="login-email"
                name="email"
                type="email"
                autoComplete="email"
                spellCheck={false}
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="name@example.com"
                className="w-full pl-11 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 placeholder:text-slate-400 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-600 focus:bg-white text-sm transition-all"
              />
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-2">
              <label htmlFor="login-password" className="block text-xs font-semibold uppercase tracking-wider text-slate-600">
                Password
              </label>
            </div>
            <div className="relative">
              <Lock className="w-5 h-5 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" aria-hidden="true" />
              <input
                id="login-password"
                name="password"
                type={showPassword ? 'text' : 'password'}
                autoComplete="current-password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full pl-11 pr-11 py-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 placeholder:text-slate-400 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-600 focus:bg-white text-sm transition-all"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors p-1.5 rounded-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600"
                aria-label={showPassword ? 'Hide password' : 'Show password'}
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
            disabled={isSubmitting}
            className="w-full py-3.5 px-4 bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white font-medium rounded-xl shadow-lg shadow-blue-500/25 transition-all flex items-center justify-center gap-2 text-sm disabled:opacity-70 disabled:cursor-not-allowed cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600 focus-visible:ring-offset-2"
          >
            {isSubmitting ? (
              <span className="inline-block w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" aria-hidden="true" />
            ) : (
              <>
                Sign In
                <ArrowRight className="w-4 h-4" aria-hidden="true" />
              </>
            )}
          </button>
        </form>

        <div className="mt-8 pt-6 border-t border-slate-100 text-center">
          <p className="text-sm text-slate-600">
            Don't have an account?{' '}
            <Link
              href={`/register${redirectParam ? `?redirect=${encodeURIComponent(redirectParam)}` : ''}`}
              className="font-semibold text-blue-600 hover:text-blue-700 underline underline-offset-4"
            >
              Create Account
            </Link>
          </p>
        </div>

        {/* Quick Demo Credentials */}
        <div className="mt-6 p-4 rounded-2xl bg-gradient-to-br from-blue-50/70 via-slate-50 to-indigo-50/50 border border-blue-200/70 shadow-2xs">
          <div className="flex items-center justify-between mb-2.5">
            <div className="flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-blue-600" aria-hidden="true" />
              <p className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                Demo Credentials
              </p>
            </div>
            <span className="text-[10px] font-extrabold bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full">
              Verified Testing
            </span>
          </div>

          <div className="p-3 bg-white rounded-xl border border-slate-200/90 shadow-2xs">
            <div className="flex items-center justify-between gap-2">
              <div className="min-w-0">
                <div className="flex items-center gap-1.5">
                  <span className="text-xs font-bold text-slate-900">Demo Customer</span>
                  <span className="text-[9px] font-black uppercase tracking-wider text-emerald-700 bg-emerald-50 px-1.5 py-0.2 rounded border border-emerald-200">
                    Active
                  </span>
                </div>
                <div className="text-[11px] font-mono text-slate-600 truncate mt-0.5">
                  customer@az-ecommerce.local
                </div>
                <div className="text-[10px] font-mono text-slate-400">
                  Password: <span className="font-semibold text-slate-700">Customer123!</span>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row gap-1.5 shrink-0">
                <button
                  type="button"
                  onClick={() => handleQuickFill('customer@az-ecommerce.local', 'Customer123!', false)}
                  className="px-2.5 py-1.5 text-[11px] font-bold text-slate-700 hover:text-blue-700 bg-slate-100 hover:bg-blue-50 border border-slate-200 rounded-lg transition-colors cursor-pointer select-none focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-blue-600"
                  title="Fill input fields"
                >
                  Fill
                </button>
                <button
                  type="button"
                  disabled={isSubmitting}
                  onClick={() => handleQuickFill('customer@az-ecommerce.local', 'Customer123!', true)}
                  className="px-3 py-1.5 text-[11px] font-bold text-white bg-blue-600 hover:bg-blue-700 active:bg-blue-800 rounded-lg shadow-xs transition-colors cursor-pointer select-none flex items-center gap-1 disabled:opacity-60 focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-blue-600"
                  title="Fill and Sign In instantly"
                >
                  <KeyRound className="w-3 h-3" aria-hidden="true" />
                  <span>Auto Sign In</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <StorefrontShell>
      <div className="min-h-[70vh] flex items-center justify-center py-8">
        <Suspense
          fallback={
            <div className="p-8 text-center text-slate-500">
              <span className="inline-block w-6 h-6 border-2 border-blue-600/30 border-t-blue-600 rounded-full animate-spin mb-2" />
              <p className="text-sm">Loading sign in...</p>
            </div>
          }
        >
          <LoginForm />
        </Suspense>
      </div>
    </StorefrontShell>
  );
}
