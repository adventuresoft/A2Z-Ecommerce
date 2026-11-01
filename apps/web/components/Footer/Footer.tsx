"use client";

import React from "react";
import Image from "next/image";
import Link from "next/link";
import { Phone, Mail, MapPin, ShieldCheck, Clock } from "lucide-react";

export function Footer() {
  return (
    <footer className="bg-[#070D19] bg-tech-grid text-slate-400 pt-14 pb-8 border-t border-slate-800/90">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-8 lg:gap-10 pb-12 border-b border-slate-800/80">
          {/* Brand Info & Contact */}
          <div className="lg:col-span-2 space-y-4">
            <div className="flex items-center gap-3">
              <div className="relative h-11 w-11 rounded-xl bg-white p-1 shrink-0 overflow-hidden shadow-md flex items-center justify-center">
                <Image
                  src="/brand/Logo.png"
                  alt="A to Z Ecommerce Logo"
                  width={44}
                  height={44}
                  className="object-contain w-full h-full"
                />
              </div>
              <div className="flex flex-col">
                <span className="text-xl font-black text-white tracking-tight leading-none">
                  A to Z <span className="text-blue-400">Ecommerce</span>
                </span>
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mt-1">
                  Precision Tech &amp; Lifestyle Store
                </span>
              </div>
            </div>

            <p className="text-xs text-slate-400 max-w-sm leading-relaxed">
              Bangladesh&apos;s trusted destination for 100% genuine electronics, computer hardware, BTRC-approved smartphones, and workspace essentials.
            </p>

            <div className="bg-white/4 border border-white/8 rounded-2xl p-4 space-y-2.5 text-xs max-w-sm">
              <div className="flex items-center gap-2.5 text-slate-300">
                <Phone className="w-3.5 h-3.5 text-blue-400 shrink-0" aria-hidden="true" />
                <span>
                  Helpline: <strong className="text-white tabular-nums">09678-123456</strong>
                </span>
              </div>
              <div className="flex items-center gap-2.5 text-slate-300">
                <Clock className="w-3.5 h-3.5 text-amber-400 shrink-0" aria-hidden="true" />
                <span>Hours: 10:00 AM – 08:00 PM (7 Days)</span>
              </div>
              <div className="flex items-center gap-2.5 text-slate-300">
                <Mail className="w-3.5 h-3.5 text-orange-400 shrink-0" aria-hidden="true" />
                <span>support@az-ecommerce.com</span>
              </div>
              <div className="flex items-center gap-2.5 text-slate-300">
                <MapPin className="w-3.5 h-3.5 text-emerald-400 shrink-0" aria-hidden="true" />
                <span>Gulshan-1, Dhaka 1212, Bangladesh</span>
              </div>
            </div>
          </div>

          {/* Customer Service */}
          <div>
            <h3 className="text-xs font-black text-white uppercase tracking-wider mb-4">
              Customer Service
            </h3>
            <ul className="space-y-2.5 text-xs">
              <li>
                <Link
                  href="/faq"
                  className="hover:text-white transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-400 rounded px-0.5"
                >
                  Help Center &amp; FAQ
                </Link>
              </li>
              <li>
                <Link
                  href="/returns"
                  className="hover:text-white transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-400 rounded px-0.5"
                >
                  Returns &amp; Replacement
                </Link>
              </li>
              <li>
                <Link
                  href="/shipping"
                  className="hover:text-white transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-400 rounded px-0.5"
                >
                  Shipping &amp; Delivery Rates
                </Link>
              </li>
              <li>
                <Link
                  href="/account/orders"
                  className="hover:text-white transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-400 rounded px-0.5"
                >
                  Track Your Order
                </Link>
              </li>
              <li>
                <Link
                  href="/warranty"
                  className="hover:text-white transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-400 rounded px-0.5"
                >
                  Warranty &amp; Service Centers
                </Link>
              </li>
            </ul>
          </div>

          {/* About AZ */}
          <div>
            <h3 className="text-xs font-black text-white uppercase tracking-wider mb-4">
              About AZ
            </h3>
            <ul className="space-y-2.5 text-xs">
              <li>
                <Link
                  href="/about"
                  className="hover:text-white transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-400 rounded px-0.5"
                >
                  About Us
                </Link>
              </li>
              <li>
                <Link
                  href="/#brands"
                  className="hover:text-white transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-400 rounded px-0.5"
                >
                  Official Brand Partners
                </Link>
              </li>
              <li>
                <Link
                  href="/corporate"
                  className="hover:text-white transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-400 rounded px-0.5"
                >
                  Corporate &amp; Bulk Sales
                </Link>
              </li>
              <li>
                <Link
                  href="/careers"
                  className="hover:text-white transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-400 rounded px-0.5"
                >
                  Career Opportunities
                </Link>
              </li>
              <li>
                <Link
                  href="/terms"
                  className="hover:text-white transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-400 rounded px-0.5"
                >
                  Terms &amp; Privacy Policy
                </Link>
              </li>
            </ul>
          </div>

          {/* Payment Methods */}
          <div>
            <h3 className="text-xs font-black text-white uppercase tracking-wider mb-4">
              Verified Settlements
            </h3>
            <p className="text-[11px] text-slate-400 mb-3.5 leading-relaxed">
              Instant PayStation checkout, cards, mobile wallets, and Cash on Delivery across 64 districts.
            </p>
            <div className="flex flex-wrap gap-1.5 text-xs">
              {["PayStation", "bKash", "Nagad", "Visa", "Mastercard", "Cash on Delivery"].map(
                (channel) => (
                  <span
                    key={channel}
                    className="bg-white/6 text-slate-200 px-2.5 py-1 rounded-lg font-bold border border-white/10 text-[11px]"
                  >
                    {channel}
                  </span>
                )
              )}
            </div>

            <div className="mt-4 inline-flex items-center gap-2 text-emerald-400 text-xs font-semibold bg-emerald-500/10 border border-emerald-400/20 px-3 py-1.5 rounded-xl">
              <ShieldCheck className="w-4 h-4 shrink-0" aria-hidden="true" />
              <span>SSL 256-Bit Protected</span>
            </div>
          </div>
        </div>

        {/* Bottom Legal & Copyright */}
        <div className="pt-8 flex flex-col sm:flex-row items-center justify-between text-xs text-slate-500 gap-4">
          <p>
            © <span className="tabular-nums">2026</span> A to Z Ecommerce Inc. All rights reserved.
          </p>
          <div className="flex items-center gap-5">
            <Link
              href="/privacy"
              className="hover:text-slate-300 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-400 rounded px-0.5"
            >
              Privacy Policy
            </Link>
            <Link
              href="/terms"
              className="hover:text-slate-300 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-400 rounded px-0.5"
            >
              Terms of Service
            </Link>
            <Link
              href="/security"
              className="hover:text-slate-300 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-400 rounded px-0.5"
            >
              Security
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
