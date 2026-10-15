'use client';

import React, { useState } from 'react';
import Link from 'next/link';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;
    setSubmitted(true);
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
            Reset Password Instructions
          </p>
        </div>

        <div className="card-body p-4 pt-2">
          {submitted ? (
            <div>
              <div className="alert alert-info py-3 px-3 small d-flex align-items-start" role="alert">
                <i className="bi bi-info-circle-fill me-2 mt-1 fs-6 flex-shrink-0"></i>
                <div>
                  <strong className="d-block mb-1">Recovery Request Received</strong>
                  Password reset workflow is currently in preview shell mode. Live email delivery will be connected when the SMTP notification service is activated in Phase 9.
                </div>
              </div>
              <div className="d-grid mt-4">
                <Link href="/login" className="btn btn-primary py-2 fw-semibold text-center">
                  <i className="bi bi-arrow-left me-2"></i>
                  Back to Sign In
                </Link>
              </div>
            </div>
          ) : (
            <>
              <p className="text-secondary small mb-3">
                Enter your administrative account email address below. You will receive a secure token to reset your credentials.
              </p>

              <form onSubmit={handleSubmit}>
                <div className="mb-3">
                  <label className="form-label small fw-semibold text-secondary">Email Address</label>
                  <div className="input-group">
                    <input
                      type="email"
                      className="form-control"
                      placeholder="name@az-ecommerce.local"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                    />
                    <span className="input-group-text text-muted bg-white border-start-0">
                      <i className="bi bi-envelope"></i>
                    </span>
                  </div>
                </div>

                <div className="d-grid mt-4">
                  <button
                    type="submit"
                    className="btn btn-primary d-flex align-items-center justify-content-center py-2 fw-semibold"
                  >
                    <i className="bi bi-envelope-check me-2"></i>
                    Request Reset Link
                  </button>
                </div>
              </form>

              <div className="text-center mt-4">
                <Link href="/login" className="small text-decoration-none text-muted">
                  <i className="bi bi-arrow-left me-1"></i> Remembered password? Sign In
                </Link>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
