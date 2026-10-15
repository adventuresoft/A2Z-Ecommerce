'use client';

import React, { Suspense, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';

function LoginForm() {
  const { login } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const returnUrl = searchParams.get('returnUrl') || '/';

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    if (!email || !password) {
      setErrorMsg('Please enter both email and password.');
      return;
    }

    setIsSubmitting(true);
    try {
      await login({ email, password });
      router.push(returnUrl);
    } catch (err: any) {
      setErrorMsg(err.message || 'Invalid email or password.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleQuickFill = (demoEmail: string) => {
    setEmail(demoEmail);
    setPassword('Password123!');
    setErrorMsg(null);
  };

  return (
    <div className="login-box" style={{ maxWidth: '420px', width: '100%' }}>
      <div className="card card-outline card-primary shadow-sm border-0">
        <div className="card-header text-center py-4 bg-white border-bottom-0">
          <Link href="/" className="text-decoration-none">
            <h3 className="mb-0 fw-bold text-dark">
              <span className="text-primary me-2">
                <i className="bi bi-cart4"></i>
              </span>
              A2Z <span className="fw-normal text-secondary">Admin</span>
            </h3>
          </Link>
          <p className="login-box-msg text-muted mt-2 mb-0 small">
            Sign in to start your management session
          </p>
        </div>

        <div className="card-body p-4 pt-2">
          {errorMsg && (
            <div className="alert alert-danger py-2 px-3 small d-flex align-items-center mb-3" role="alert">
              <i className="bi bi-exclamation-triangle-fill me-2 flex-shrink-0"></i>
              <div>{errorMsg}</div>
            </div>
          )}

          <form onSubmit={handleSubmit} noValidate>
            <div className="mb-3">
              <label className="form-label small fw-semibold text-secondary">Email Address</label>
              <div className="input-group">
                <input
                  type="email"
                  className="form-control"
                  placeholder="name@az-ecommerce.local"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  disabled={isSubmitting}
                  required
                />
                <span className="input-group-text text-muted bg-white border-start-0">
                  <i className="bi bi-envelope"></i>
                </span>
              </div>
            </div>

            <div className="mb-3">
              <div className="d-flex justify-content-between align-items-center mb-1">
                <label className="form-label small fw-semibold text-secondary mb-0">Password</label>
                <Link href="/forgot-password" className="small text-decoration-none text-primary">
                  Forgot password?
                </Link>
              </div>
              <div className="input-group">
                <input
                  type={showPassword ? 'text' : 'password'}
                  className="form-control"
                  placeholder="Enter your password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  disabled={isSubmitting}
                  required
                />
                <button
                  type="button"
                  className="btn btn-outline-secondary bg-white border-start-0"
                  onClick={() => setShowPassword(!showPassword)}
                  tabIndex={-1}
                >
                  <i className={`bi ${showPassword ? 'bi-eye-slash' : 'bi-eye'}`}></i>
                </button>
              </div>
            </div>

            <div className="d-grid mt-4">
              <button
                type="submit"
                className="btn btn-primary d-flex align-items-center justify-content-center py-2 fw-semibold"
                disabled={isSubmitting}
              >
                {isSubmitting ? (
                  <>
                    <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                    Signing In...
                  </>
                ) : (
                  <>
                    <i className="bi bi-box-arrow-in-right me-2"></i>
                    Sign In
                  </>
                )}
              </button>
            </div>
          </form>

          <hr className="my-4 text-muted opacity-25" />

          {/* Demo Credentials Quick-Fill Pill Bar */}
          <div>
            <div className="small fw-semibold text-muted text-uppercase mb-2 text-center" style={{ fontSize: '0.75rem', letterSpacing: '0.05em' }}>
              Quick Demo Logins
            </div>
            <div className="d-flex flex-column gap-2">
              <button
                type="button"
                className="btn btn-outline-primary btn-sm text-start d-flex justify-content-between align-items-center"
                onClick={() => handleQuickFill('superadmin@az-ecommerce.local')}
              >
                <span>
                  <i className="bi bi-shield-lock-fill me-1"></i> Super Admin
                </span>
                <span className="badge bg-primary-subtle text-primary border border-primary-subtle">All Actions</span>
              </button>

              <button
                type="button"
                className="btn btn-outline-secondary btn-sm text-start d-flex justify-content-between align-items-center"
                onClick={() => handleQuickFill('admin@az-ecommerce.local')}
              >
                <span>
                  <i className="bi bi-person-fill-gear me-1"></i> Admin
                </span>
                <span className="badge bg-warning-subtle text-warning-emphasis border border-warning-subtle">No Delete</span>
              </button>

              <button
                type="button"
                className="btn btn-outline-success btn-sm text-start d-flex justify-content-between align-items-center"
                onClick={() => handleQuickFill('shopmanager@az-ecommerce.local')}
              >
                <span>
                  <i className="bi bi-shop me-1"></i> Shop Manager
                </span>
                <span className="badge bg-success-subtle text-success border border-success-subtle">Catalog Only</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense
      fallback={
        <div className="d-flex justify-content-center align-items-center" style={{ minHeight: '300px' }}>
          <div className="spinner-border text-primary" role="status">
            <span className="visually-hidden">Loading login...</span>
          </div>
        </div>
      }
    >
      <LoginForm />
    </Suspense>
  );
}
