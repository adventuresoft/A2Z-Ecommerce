"use client";

import React from "react";
import Image from "next/image";
import Link from "next/link";
import { Phone, Mail, MapPin, ShieldCheck, Clock } from "lucide-react";

export function Footer() {
  return (
    <footer className="bg-[#0F172A] text-slate-400 pt-14 pb-8 border-t border-slate-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-8 lg:gap-10 pb-12 border-b border-slate-800/80">
          {/* Brand Info & Contact */}
          <div className="lg:col-span-2 space-y-4">
            <div className="flex items-center space-x-3">
              <div className="relative h-11 w-11 rounded-xl bg-white p-1 shrink-0 overflow-hidden shadow-xs flex items-center justify-center">
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
                  A to Z <span className="text-blue-500">Ecommerce</span>
                </span>
                <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider mt-1">
                  Trusted Shopping, Always
                </span>
              </div>
            </div>

            <p className="text-xs text-slate-400 max-w-sm leading-relaxed">
              Bangladesh&apos;s trusted destination for 100% genuine electronics, computer hardware, smartphones, and workspace essentials.
            </p>

            <div className="space-y-2.5 text-xs pt-1">
              <div className="flex items-center space-x-2.5 text-slate-300">
                <Phone className="w-3.5 h-3.5 text-blue-400 shrink-0" aria-hidden="true" />
                <span>Helpline: <strong className="text-white tabular-nums">09678-123456</strong></span>
              </div>
              <div className="flex items-center space-x-2.5 text-slate-300">
                <Clock className="w-3.5 h-3.5 text-amber-400 shrink-0" aria-hidden="true" />
                <span>Working Hours: 10:00 AM - 08:00 PM (Everyday)</span>
              </div>
              <div className="flex items-center space-x-2.5 text-slate-300">
                <Mail className="w-3.5 h-3.5 text-orange-400 shrink-0" aria-hidden="true" />
                <span>support@az-ecommerce.com</span>
              </div>
              <div className="flex items-center space-x-2.5 text-slate-300">
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
              <li><Link href="/faq" className="hover:text-white transition-colors focus-visible:outline-hidden focus-visible:underline">Help Center &amp; FAQ</Link></li>
              <li><Link href="/returns" className="hover:text-white transition-colors focus-visible:outline-hidden focus-visible:underline">Returns &amp; Replacement</Link></li>
              <li><Link href="/shipping" className="hover:text-white transition-colors focus-visible:outline-hidden focus-visible:underline">Shipping &amp; Delivery Rates</Link></li>
              <li><Link href="/account" className="hover:text-white transition-colors focus-visible:outline-hidden focus-visible:underline">Track Your Order</Link></li>
              <li><Link href="/warranty" className="hover:text-white transition-colors focus-visible:outline-hidden focus-visible:underline">Warranty &amp; Service Centers</Link></li>
            </ul>
          </div>

          {/* About AZ */}
          <div>
            <h3 className="text-xs font-black text-white uppercase tracking-wider mb-4">
              About AZ
            </h3>
            <ul className="space-y-2.5 text-xs">
              <li><Link href="/about" className="hover:text-white transition-colors focus-visible:outline-hidden focus-visible:underline">About Us</Link></li>
              <li><Link href="/#brands" className="hover:text-white transition-colors focus-visible:outline-hidden focus-visible:underline">Official Brand Partners</Link></li>
              <li><Link href="/corporate" className="hover:text-white transition-colors focus-visible:outline-hidden focus-visible:underline">Corporate &amp; Bulk Sales</Link></li>
              <li><Link href="/careers" className="hover:text-white transition-colors focus-visible:outline-hidden focus-visible:underline">Career Opportunities</Link></li>
              <li><Link href="/terms" className="hover:text-white transition-colors focus-visible:outline-hidden focus-visible:underline">Terms &amp; Privacy Policy</Link></li>
            </ul>
          </div>

          {/* Payment Methods */}
          <div>
            <h3 className="text-xs font-black text-white uppercase tracking-wider mb-4">
              Payment Methods
            </h3>
            <p className="text-[11px] text-slate-400 mb-3.5 leading-relaxed">
              We accept credit/debit cards, mobile banking, and Cash on Delivery across Bangladesh.
            </p>
            <div className="flex flex-wrap gap-1.5 text-xs">
              <span className="bg-slate-800/90 text-slate-200 px-2.5 py-1 rounded-lg font-bold border border-slate-700/80 text-[11px]">
                bKash
              </span>
              <span className="bg-slate-800/90 text-slate-200 px-2.5 py-1 rounded-lg font-bold border border-slate-700/80 text-[11px]">
                Nagad
              </span>
              <span className="bg-slate-800/90 text-slate-200 px-2.5 py-1 rounded-lg font-bold border border-slate-700/80 text-[11px]">
                Visa
              </span>
              <span className="bg-slate-800/90 text-slate-200 px-2.5 py-1 rounded-lg font-bold border border-slate-700/80 text-[11px]">
                Mastercard
              </span>
              <span className="bg-slate-800/90 text-slate-200 px-2.5 py-1 rounded-lg font-bold border border-slate-700/80 text-[11px]">
                Cash on Delivery
              </span>
            </div>

            <div className="mt-4 flex items-center space-x-2 text-emerald-400 text-xs">
              <ShieldCheck className="w-4 h-4 shrink-0" aria-hidden="true" />
              <span>SSL 256-bit Secure Checkout</span>
            </div>
          </div>
        </div>

        {/* Bottom Legal & Copyright */}
        <div className="pt-8 flex flex-col sm:flex-row items-center justify-between text-xs text-slate-500 gap-4">
          <p>© <span className="tabular-nums">2026</span> A to Z Ecommerce Inc. All rights reserved.</p>
          <div className="flex items-center space-x-5">
            <Link href="/privacy" className="hover:text-slate-300 transition-colors focus-visible:outline-hidden focus-visible:underline">Privacy Policy</Link>
            <Link href="/terms" className="hover:text-slate-300 transition-colors focus-visible:outline-hidden focus-visible:underline">Terms of Service</Link>
            <Link href="/security" className="hover:text-slate-300 transition-colors focus-visible:outline-hidden focus-visible:underline">Security</Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
