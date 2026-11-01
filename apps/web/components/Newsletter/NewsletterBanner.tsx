"use client";

import React, { useState } from "react";
import { Mail, CheckCircle2, Sparkles } from "lucide-react";
import { Tilt3DCard } from "../UI/Tilt3DCard";

export function NewsletterBanner() {
  const [email, setEmail] = useState("");
  const [subscribed, setSubscribed] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (email.trim()) {
      setSubscribed(true);
      setEmail("");
      setTimeout(() => setSubscribed(false), 5000);
    }
  };

  return (
    <section className="py-12 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <Tilt3DCard maxTilt={3} scale={1.005}>
          <div className="rounded-3xl surface-3d-dark bg-tech-grid p-7 sm:p-11 text-white relative overflow-hidden">
            <div
              aria-hidden="true"
              className="absolute -top-20 -right-16 w-80 h-80 bg-blue-600/20 rounded-full blur-3xl pointer-events-none"
            />
            <div
              aria-hidden="true"
              className="absolute -bottom-24 left-12 w-72 h-72 bg-orange-500/15 rounded-full blur-3xl pointer-events-none"
            />

            <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
              <div className="max-w-xl space-y-2">
                <div className="inline-flex items-center gap-1.5 text-[11px] font-black text-orange-300 bg-orange-500/15 border border-orange-400/30 px-3 py-1 rounded-full uppercase tracking-wider">
                  <Sparkles className="w-3.5 h-3.5" aria-hidden="true" />
                  <span>AZ Insider Dispatch</span>
                </div>
                <h2 className="text-2xl sm:text-3xl font-black tracking-tight text-white leading-tight">
                  Unlock Early Flash Drops &amp; ৳500 Welcome Voucher
                </h2>
                <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
                  Join verified tech enthusiasts receiving private restock alerts, BTRC launch schedules, and member-only coupon codes.
                </p>
              </div>

              <div className="w-full lg:max-w-md">
                {subscribed ? (
                  <div
                    role="status"
                    aria-live="polite"
                    className="bg-emerald-500/20 border border-emerald-400/40 text-emerald-200 px-5 py-3.5 rounded-2xl flex items-center gap-2.5"
                  >
                    <CheckCircle2
                      className="w-5 h-5 text-emerald-400 shrink-0"
                      aria-hidden="true"
                    />
                    <span className="text-xs sm:text-sm font-semibold">
                      Subscribed! Check your inbox for your ৳500 welcome voucher code.
                    </span>
                  </div>
                ) : (
                  <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row gap-2.5">
                    <label htmlFor="newsletter-email-input" className="sr-only">
                      Email address
                    </label>
                    <div className="relative flex-1">
                      <Mail
                        className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none"
                        aria-hidden="true"
                      />
                      <input
                        id="newsletter-email-input"
                        type="email"
                        name="email"
                        required
                        autoComplete="email"
                        spellCheck={false}
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="Enter your email address…"
                        className="w-full pl-10 pr-4 py-3.5 rounded-2xl bg-white text-slate-900 placeholder-slate-400 text-xs sm:text-sm font-medium focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-400 shadow-xs"
                      />
                    </div>
                    <button
                      type="submit"
                      className="bg-orange-500 hover:bg-orange-600 text-white font-black text-xs sm:text-sm px-6 py-3.5 rounded-2xl shadow-lg shadow-orange-500/30 transition-[background-color,transform] hover:-translate-y-0.5 cursor-pointer whitespace-nowrap focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-400 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-900"
                    >
                      Claim Voucher
                    </button>
                  </form>
                )}
              </div>
            </div>
          </div>
        </Tilt3DCard>
      </div>
    </section>
  );
}
