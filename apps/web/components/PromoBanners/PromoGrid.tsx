"use client";

import React from "react";
import Image from "next/image";
import { ArrowRight, Sparkles } from "lucide-react";
import { motion } from "motion/react";
import { PROMO_BANNERS } from "../../data/mock-catalog";

export function PromoGrid() {
  return (
    <section id="promo" className="py-10 bg-white border-b border-slate-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {PROMO_BANNERS.map((banner, idx) => {
            const isNavy = banner.theme === "navy";
            const isOrange = banner.theme === "orange";

            return (
              <motion.div
                key={banner.id}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-30px" }}
                transition={{ duration: 0.5, delay: idx * 0.1, ease: [0.25, 1, 0.5, 1] }}
                whileHover={{ y: -6, transition: { duration: 0.25 } }}
                className={`rounded-3xl p-6 sm:p-7 relative overflow-hidden shadow-lg hover:shadow-2xl flex flex-col justify-between min-h-[220px] group ${
                  isNavy
                    ? "bg-gradient-to-br from-[#0F172A] via-[#1E293B] to-[#0A1120] text-white"
                    : isOrange
                    ? "bg-gradient-to-br from-orange-600 via-orange-500 to-amber-600 text-white"
                    : "bg-gradient-to-br from-sky-100 via-blue-50 to-indigo-100 text-slate-900 border border-blue-200/60"
                }`}
              >
                {/* Background decorative subtle circles */}
                <div className="absolute top-0 right-0 w-44 h-44 rounded-full bg-white/10 blur-2xl pointer-events-none group-hover:scale-125 transition-transform duration-700" />

                {/* Content & Copy */}
                <div className="relative z-10 max-w-[65%]">
                  <div
                    className={`inline-flex items-center space-x-1 text-[10px] font-black uppercase tracking-wider px-2.5 py-0.5 rounded-full mb-2 ${
                      isNavy
                        ? "bg-blue-500/20 text-blue-300 border border-blue-400/30"
                        : isOrange
                        ? "bg-white/20 text-white border border-white/30"
                        : "bg-blue-600 text-white shadow-xs"
                    }`}
                  >
                    <Sparkles className="w-2.5 h-2.5" />
                    <span>{banner.tag}</span>
                  </div>

                  <h3 className="text-xl sm:text-2xl font-black tracking-tight leading-tight uppercase">
                    {banner.title}
                  </h3>
                  <p
                    className={`text-xs mt-1.5 line-clamp-2 leading-relaxed ${
                      isNavy ? "text-slate-300" : isOrange ? "text-orange-100" : "text-slate-600"
                    }`}
                  >
                    {banner.subtitle}
                  </p>

                  <div className="pt-4">
                    <motion.a
                      href="#featured"
                      whileHover={{ scale: 1.04 }}
                      whileTap={{ scale: 0.96 }}
                      className={`inline-flex items-center space-x-1.5 text-xs font-bold px-4 py-2 rounded-xl transition-all shadow-xs cursor-pointer ${
                        isNavy
                          ? "bg-white text-slate-900 hover:bg-slate-100"
                          : isOrange
                          ? "bg-white text-orange-700 hover:bg-orange-50"
                          : "bg-blue-700 text-white hover:bg-blue-800"
                      }`}
                    >
                      <span>{banner.ctaText}</span>
                      <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
                    </motion.a>
                  </div>
                </div>

                {/* Promotional Gear Image */}
                <div className="absolute -right-4 -bottom-4 w-36 sm:w-44 h-36 sm:h-44 rounded-2xl overflow-hidden group-hover:scale-110 transition-transform duration-500 ease-out">
                  <Image
                    src={banner.image}
                    alt={banner.title}
                    fill
                    className="object-cover object-center rounded-2xl drop-shadow-xl"
                    sizes="(max-width: 768px) 150px, 200px"
                  />
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
