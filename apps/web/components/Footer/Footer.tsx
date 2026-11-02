"use client";

import React from "react";
import Image from "next/image";
import Link from "next/link";
import { Phone, Mail, MapPin, Clock } from "lucide-react";

export function Footer() {
  return (
    <footer className="bg-[#0B1120] text-slate-400 pt-14 pb-8 border-t border-slate-800/80">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Main Footer Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-12 gap-8 lg:gap-10 pb-12 border-b border-slate-800/80">
          {/* 1. Brand Identity & Contact Info (4 cols) */}
          <div className="sm:col-span-2 lg:col-span-4 space-y-4">
            <Link
              href="/"
              className="inline-flex items-center gap-3 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-400 rounded-xl"
            >
              <div className="relative h-11 w-11 rounded-xl bg-white p-1 shrink-0 overflow-hidden shadow-sm flex items-center justify-center">
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
                <span className="text-[10px] font-semibold text-slate-400 tracking-wide mt-1">
                  Precision Tech &amp; Lifestyle Store
                </span>
              </div>
            </Link>

            <p className="text-xs sm:text-[13px] text-slate-400 max-w-sm leading-relaxed">
              Bangladesh&apos;s trusted destination for 100% genuine electronics, computer hardware, official smartphones, and everyday workspace essentials.
            </p>

            <div className="pt-1 space-y-2.5 text-xs sm:text-[13px]">
              <div className="flex items-center gap-2.5 text-slate-300">
                <span className="w-7 h-7 rounded-lg bg-slate-800/90 border border-slate-700/70 flex items-center justify-center shrink-0">
                  <Phone className="w-3.5 h-3.5 text-blue-400" aria-hidden="true" />
                </span>
                <span>
                  Helpline:{" "}
                  <a
                    href="tel:09678123456"
                    className="text-white font-bold tabular-nums hover:text-blue-400 transition-colors"
                  >
                    09678-123456
                  </a>
                </span>
              </div>

              <div className="flex items-center gap-2.5 text-slate-300">
                <span className="w-7 h-7 rounded-lg bg-slate-800/90 border border-slate-700/70 flex items-center justify-center shrink-0">
                  <Clock className="w-3.5 h-3.5 text-amber-400" aria-hidden="true" />
                </span>
                <span>10:00 AM – 08:00 PM (7 Days a Week)</span>
              </div>

              <div className="flex items-center gap-2.5 text-slate-300">
                <span className="w-7 h-7 rounded-lg bg-slate-800/90 border border-slate-700/70 flex items-center justify-center shrink-0">
                  <Mail className="w-3.5 h-3.5 text-sky-400" aria-hidden="true" />
                </span>
                <a
                  href="mailto:support@az-ecommerce.com"
                  className="hover:text-white transition-colors"
                >
                  support@az-ecommerce.com
                </a>
              </div>

              <div className="flex items-center gap-2.5 text-slate-300">
                <span className="w-7 h-7 rounded-lg bg-slate-800/90 border border-slate-700/70 flex items-center justify-center shrink-0">
                  <MapPin className="w-3.5 h-3.5 text-emerald-400" aria-hidden="true" />
                </span>
                <span>Gulshan-1, Dhaka 1212, Bangladesh</span>
              </div>
            </div>
          </div>

          {/* 2. Customer Service (2 cols) */}
          <div className="lg:col-span-2">
            <h3 className="text-xs font-bold text-white uppercase tracking-wider mb-4">
              Customer Service
            </h3>
            <ul className="space-y-2.5 text-xs sm:text-[13px]">
              <li>
                <Link
                  href="/faq"
                  className="hover:text-white transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-400 rounded py-0.5 inline-block"
                >
                  Help Center &amp; FAQ
                </Link>
              </li>
              <li>
                <Link
                  href="/returns"
                  className="hover:text-white transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-400 rounded py-0.5 inline-block"
                >
                  Returns &amp; Replacement
                </Link>
              </li>
              <li>
                <Link
                  href="/shipping"
                  className="hover:text-white transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-400 rounded py-0.5 inline-block"
                >
                  Shipping &amp; Delivery
                </Link>
              </li>
              <li>
                <Link
                  href="/account/orders"
                  className="hover:text-white transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-400 rounded py-0.5 inline-block"
                >
                  Track Your Order
                </Link>
              </li>
              <li>
                <Link
                  href="/warranty"
                  className="hover:text-white transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-400 rounded py-0.5 inline-block"
                >
                  Warranty &amp; Support
                </Link>
              </li>
            </ul>
          </div>

          {/* 3. About AZ (2 cols) */}
          <div className="lg:col-span-2">
            <h3 className="text-xs font-bold text-white uppercase tracking-wider mb-4">
              About AZ
            </h3>
            <ul className="space-y-2.5 text-xs sm:text-[13px]">
              <li>
                <Link
                  href="/about"
                  className="hover:text-white transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-400 rounded py-0.5 inline-block"
                >
                  About Us
                </Link>
              </li>
              <li>
                <Link
                  href="/#brands"
                  className="hover:text-white transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-400 rounded py-0.5 inline-block"
                >
                  Official Brand Partners
                </Link>
              </li>
              <li>
                <Link
                  href="/corporate"
                  className="hover:text-white transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-400 rounded py-0.5 inline-block"
                >
                  Corporate &amp; Bulk Sales
                </Link>
              </li>
              <li>
                <Link
                  href="/careers"
                  className="hover:text-white transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-400 rounded py-0.5 inline-block"
                >
                  Career Opportunities
                </Link>
              </li>
              <li>
                <Link
                  href="/terms"
                  className="hover:text-white transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-400 rounded py-0.5 inline-block"
                >
                  Terms &amp; Privacy Policy
                </Link>
              </li>
            </ul>
          </div>

          {/* 4. Supported Payment Methods (4 cols) */}
          <div className="sm:col-span-2 lg:col-span-4">
            <h3 className="text-xs font-bold text-white uppercase tracking-wider mb-3">
              We Accept
            </h3>
            <p className="text-xs sm:text-[13px] text-slate-400 mb-4 leading-relaxed">
              Convenient and secure online payments via cards, mobile banking, internet banking, and nationwide delivery.
            </p>

            <div className="bg-white rounded-2xl p-2.5 sm:p-3 shadow-sm border border-slate-200/20">
              <Image
                src="/payment.png"
                alt="Supported Payment Methods"
                width={640}
                height={180}
                className="w-full h-auto object-contain rounded-lg"
              />
            </div>
          </div>
        </div>

        {/* Bottom Legal & Copyright */}
        <div className="pt-7 flex flex-col sm:flex-row items-center justify-between text-xs text-slate-500 gap-4">
          <p className="text-center sm:text-left">
            © <span className="tabular-nums">2026</span> A to Z Ecommerce Inc. All rights reserved.
          </p>
          <div className="flex flex-wrap items-center justify-center gap-5">
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
