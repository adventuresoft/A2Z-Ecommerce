"use client";

import React, { useState } from "react";
import { Mail, CheckCircle2 } from "lucide-react";
import { motion } from "motion/react";

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
    <section className="py-10 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="rounded-2xl bg-gradient-to-r from-[#0F172A] via-[#1E293B] to-[#0A1120] p-7 sm:p-10 text-white relative overflow-hidden shadow-xl border border-slate-800">
          {/* Subtle ambient light */}
          <div className="absolute top-0 right-0 w-80 h-80 bg-blue-600/15 rounded-full blur-3xl pointer-events-none" />

          <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
            <div className="max-w-xl">
              <div className="inline-flex items-center space-x-1.5 text-xs font-bold text-orange-400 uppercase tracking-wider mb-1.5">
                <Mail className="w-3.5 h-3.5" aria-hidden="true" />
                <span>Stay Updated</span>
              </div>
              <h2 className="text-2xl sm:text-3xl font-black tracking-tight text-white leading-tight">
                Join the AZ Insider Club
              </h2>
              <p className="text-xs sm:text-sm text-slate-300 mt-1.5 leading-relaxed">
                Subscribe to get early access to flash sales, exclusive discount vouchers, and weekly tech roundups directly in your inbox.
              </p>
            </div>

            {/* Subscribe Form */}
            <div className="w-full lg:max-w-md">
              {subscribed ? (
                <div role="status" aria-live="polite" className="bg-emerald-500/20 border border-emerald-400/40 text-emerald-200 px-5 py-3 rounded-xl flex items-center space-x-2.5">
                  <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" aria-hidden="true" />
                  <span className="text-xs sm:text-sm font-semibold">
                    Thank you! Check your inbox for your ৳500 welcome voucher code.
                  </span>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row gap-2.5">
                  <input
                    type="email"
                    name="email"
                    required
                    autoComplete="email"
                    spellCheck={false}
                    aria-label="Email address"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="Enter your email address…"
                    className="flex-1 px-4 py-3 rounded-xl bg-white text-slate-900 placeholder-slate-400 text-sm focus:outline-hidden focus:ring-2 focus:ring-orange-400 focus-visible:ring-2 focus-visible:ring-orange-400 shadow-xs"
                  />
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    type="submit"
                    className="bg-orange-500 hover:bg-orange-600 text-white font-bold text-xs sm:text-sm px-6 py-3 rounded-xl shadow-md shadow-orange-500/30 transition-colors cursor-pointer whitespace-nowrap focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-orange-400 focus-visible:ring-offset-2"
                  >
                    Subscribe
                  </motion.button>
                </form>
              )}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
