"use client";

import React from "react";
import { Smartphone, ArrowRight, Tag, CheckCircle2 } from "lucide-react";
import { motion } from "motion/react";
import { ProductCard } from "../UI/ProductCard";
import { SMARTPHONE_DEALS, Product } from "../../data/mock-catalog";

interface SmartphoneDealsSectionProps {
  onAddToCart: (product: Product) => void;
  onToggleWishlist?: (productId: string) => void;
  wishlistIds?: Set<string>;
}

export function SmartphoneDealsSection({
  onAddToCart,
  onToggleWishlist,
  wishlistIds = new Set(),
}: SmartphoneDealsSectionProps) {
  return (
    <section id="smartphone-deals" className="py-12 bg-white border-b border-slate-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-3 mb-6">
          <div>
            <div className="inline-flex items-center space-x-1.5 text-xs font-bold text-blue-700 uppercase tracking-wider mb-1">
              <Smartphone className="w-3.5 h-3.5" />
              <span>Category Deals Spotlight</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
              Best Deals on Official Smartphones!
            </h2>
            <p className="text-xs sm:text-sm text-slate-500 mt-1">
              100% Genuine with Official BTRC Registration, Authorized Brand Warranty &amp; Extra Savings
            </p>
          </div>

          <a
            href="#"
            className="text-xs sm:text-sm font-bold text-blue-700 hover:text-blue-800 flex items-center space-x-1 group self-start sm:self-auto"
          >
            <span>View All Smartphones</span>
            <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
          </a>
        </div>

        {/* Layout: Spotlight Campaign Card + Deals Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-stretch">
          {/* Left Spotlight Banner */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true, margin: "-30px" }}
            transition={{ duration: 0.45, ease: "easeOut" }}
            className="lg:col-span-4 rounded-2xl bg-gradient-to-br from-slate-900 via-blue-950 to-slate-900 p-6 sm:p-7 text-white flex flex-col justify-between relative overflow-hidden shadow-lg border border-slate-800 group"
          >
            <div className="absolute top-0 right-0 w-56 h-56 bg-blue-500/15 rounded-full blur-3xl pointer-events-none group-hover:scale-125 transition-transform duration-700" />
            <div className="absolute bottom-0 left-0 w-44 h-44 bg-orange-500/15 rounded-full blur-2xl pointer-events-none" />

            <div className="relative z-10 space-y-4">
              <span className="inline-flex items-center space-x-1.5 bg-blue-500/20 border border-blue-400/30 text-blue-300 px-3 py-1 rounded-full text-xs font-bold">
                <Tag className="w-3.5 h-3.5 text-orange-400" />
                <span>Save Up To ৳15,000</span>
              </span>

              <h3 className="text-2xl sm:text-3xl font-black tracking-tight leading-snug">
                Official Flagship Deals &amp; Cashback
              </h3>

              <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
                Enjoy hassle-free warranty claim, 0% EMI facilities, and genuine accessories with every flagship smartphone purchase.
              </p>

              <div className="space-y-2.5 pt-2 text-xs text-slate-200">
                <div className="flex items-center space-x-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span>BTRC Approved &amp; IMEI Verified</span>
                </div>
                <div className="flex items-center space-x-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span>Official 1-Year Brand Replacement</span>
                </div>
                <div className="flex items-center space-x-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span>0% EMI up to 12 Months Available</span>
                </div>
              </div>
            </div>

            <div className="relative z-10 pt-6">
              <motion.a
                href="#"
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs py-3.5 px-5 rounded-xl shadow-md shadow-blue-600/30 flex items-center justify-center space-x-2 transition-all cursor-pointer"
              >
                <span>Browse All Phone Deals</span>
                <ArrowRight className="w-4 h-4" />
              </motion.a>
            </div>
          </motion.div>

          {/* Right Product Deals Grid with unified ProductCard */}
          <div className="lg:col-span-8 grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 gap-3.5 sm:gap-4">
            {SMARTPHONE_DEALS.slice(0, 5).map((phone, idx) => (
              <ProductCard
                key={phone.id}
                product={phone}
                index={idx}
                onAddToCart={onAddToCart}
                onToggleWishlist={onToggleWishlist}
                isWishlisted={wishlistIds.has(phone.id)}
                variant="compact"
              />
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
