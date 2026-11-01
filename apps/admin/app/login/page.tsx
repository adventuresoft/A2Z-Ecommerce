'use client';

import React, { Suspense, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
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
    } catch (err: unknown) {
      setErrorMsg(err instanceof Error ? err.message : 'Invalid email or password.');
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
    <div className="login-box animate-stagger-1" style={{ maxWidth: '440px', width: '100%' }}>
      <div className="card card-3d border-0">
        <div className="card-header text-center py-4 border-bottom-0">
          <Link href="/" className="text-decoration-none d-inline-flex flex-column align-items-center gap-2">
            <div
              className="bg-white rounded-4 d-inline-flex align-items-center justify-content-center p-2 shadow-sm border"
              style={{
                width: '110px',
                height: '92px',
                boxShadow: '0 8px 20px -4px rgba(15, 23, 42, 0.12), inset 0 1px 0 rgba(255, 255, 255, 1)',
              }}
            >
              <Image
                src="/Logo.png"
                alt="A to Z E-Commerce"
                width={94}
                height={78}
                className="img-fluid object-fit-contain"
                priority
              />
            </div>
            <h3 className="mb-0 fw-bold text-body mt-1" style={{ fontSize: '1.25rem' }}>
              A to Z <span className="fw-semibold text-primary">Admin Console</span>
            </h3>
          </Link>
          <p className="login-box-msg text-secondary mt-1 mb-0 small">
            Sign in to start your administrative management session
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
              <label className="form-label small fw-semibold text-body">Email Address</label>
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
                <span className="input-group-text text-secondary bg-transparent border-start-0">
                  <i className="bi bi-envelope"></i>
                </span>
              </div>
            </div>

            <div className="mb-3">
              <div className="d-flex justify-content-between align-items-center mb-1">
                <label className="form-label small fw-semibold text-body mb-0">Password</label>
                <Link href="/forgot-password" className="small text-decoration-none text-primary fw-medium">
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
                  className="btn btn-outline-secondary border-start-0"
                  onClick={() => setShowPassword(!showPassword)}
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  <i className={`bi ${showPassword ? 'bi-eye-slash' : 'bi-eye'}`}></i>
                </button>
              </div>
            </div>

            <div className="d-grid mt-4">
              <button
                type="submit"
                className="btn btn-primary d-flex align-items-center justify-content-center py-2-5 fw-semibold"
                disabled={isSubmitting}
              >
                {isSubmitting ? (
                  <>
                    <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                    Authenticating...
                  </>
                ) : (
                  <>
                    <i className="bi bi-box-arrow-in-right me-2"></i>
                    Sign In to Console
                  </>
                )}
              </button>
            </div>
          </form>

          <hr className="my-4 text-secondary opacity-25" />

          {/* Demo Credentials Quick-Fill Pill Bar */}
          <div>
            <div className="small fw-bold text-secondary text-uppercase mb-2 text-center" style={{ fontSize: '0.7rem', letterSpacing: '0.06em' }}>
              1-Click Role Sandboxes
            </div>
            <div className="d-flex flex-column gap-2">
              <button
                type="button"
                className="btn tile-3d btn-sm text-start d-flex justify-content-between align-items-center py-2 px-3 text-body"
                onClick={() => handleQuickFill('superadmin@az-ecommerce.local')}
              >
                <span className="fw-medium">
                  <i className="bi bi-shield-lock-fill text-primary me-2"></i> Super Admin
                </span>
                <span className="badge bg-primary-subtle text-primary border border-primary-subtle">All Actions</span>
              </button>

              <button
                type="button"
                className="btn tile-3d btn-sm text-start d-flex justify-content-between align-items-center py-2 px-3 text-body"
                onClick={() => handleQuickFill('admin@az-ecommerce.local')}
              >
                <span className="fw-medium">
                  <i className="bi bi-person-fill-gear text-warning me-2"></i> Admin
                </span>
                <span className="badge bg-warning-subtle text-warning-emphasis border border-warning-subtle">No Delete</span>
              </button>

              <button
                type="button"
                className="btn tile-3d btn-sm text-start d-flex justify-content-between align-items-center py-2 px-3 text-body"
                onClick={() => handleQuickFill('shopmanager@az-ecommerce.local')}
              >
                <span className="fw-medium">
                  <i className="bi bi-shop text-success me-2"></i> Shop Manager
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
