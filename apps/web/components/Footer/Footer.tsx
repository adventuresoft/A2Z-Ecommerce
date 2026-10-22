"use client";

import React from "react";
import Image from "next/image";
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
                <Phone className="w-3.5 h-3.5 text-blue-400 shrink-0" />
                <span>Helpline: <strong className="text-white">09678-123456</strong></span>
              </div>
              <div className="flex items-center space-x-2.5 text-slate-300">
                <Clock className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                <span>Working Hours: 10:00 AM - 08:00 PM (Everyday)</span>
              </div>
              <div className="flex items-center space-x-2.5 text-slate-300">
                <Mail className="w-3.5 h-3.5 text-orange-400 shrink-0" />
                <span>support@az-ecommerce.com</span>
              </div>
              <div className="flex items-center space-x-2.5 text-slate-300">
                <MapPin className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
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
              <li><a href="#" className="hover:text-white transition-colors">Help Center &amp; FAQ</a></li>
              <li><a href="#" className="hover:text-white transition-colors">Returns &amp; Replacement</a></li>
              <li><a href="#" className="hover:text-white transition-colors">Shipping &amp; Delivery Rates</a></li>
              <li><a href="#" className="hover:text-white transition-colors">Track Your Order</a></li>
              <li><a href="#" className="hover:text-white transition-colors">Warranty &amp; Service Centers</a></li>
            </ul>
          </div>

          {/* About AZ */}
          <div>
            <h3 className="text-xs font-black text-white uppercase tracking-wider mb-4">
              About AZ
            </h3>
            <ul className="space-y-2.5 text-xs">
              <li><a href="#" className="hover:text-white transition-colors">About Us</a></li>
              <li><a href="#" className="hover:text-white transition-colors">Official Brand Partners</a></li>
              <li><a href="#" className="hover:text-white transition-colors">Corporate &amp; Bulk Sales</a></li>
              <li><a href="#" className="hover:text-white transition-colors">Career Opportunities</a></li>
              <li><a href="#" className="hover:text-white transition-colors">Terms &amp; Privacy Policy</a></li>
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
              <ShieldCheck className="w-4 h-4 shrink-0" />
              <span>SSL 256-bit Secure Checkout</span>
            </div>
          </div>
        </div>

        {/* Bottom Legal & Copyright */}
        <div className="pt-8 flex flex-col sm:flex-row items-center justify-between text-xs text-slate-500 gap-4">
          <p>© 2026 A to Z Ecommerce Inc. All rights reserved.</p>
          <div className="flex items-center space-x-5">
            <a href="#" className="hover:text-slate-300 transition-colors">Privacy Policy</a>
            <a href="#" className="hover:text-slate-300 transition-colors">Terms of Service</a>
            <a href="#" className="hover:text-slate-300 transition-colors">Security</a>
          </div>
        </div>
      </div>
    </footer>
  );
}
