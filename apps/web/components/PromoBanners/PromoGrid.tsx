"use client";

import React from "react";
import Image from "next/image";
import Link from "next/link";
import { ArrowRight, Sparkles } from "lucide-react";
import { motion, useReducedMotion } from "motion/react";
import { Tilt3DCard } from "../UI/Tilt3DCard";
import { PROMO_BANNERS } from "../../data/mock-catalog";

export function PromoGrid() {
  const prefersReducedMotion = useReducedMotion();

  return (
    <section id="promo" className="py-12 bg-white border-b border-slate-200/80">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {PROMO_BANNERS.map((banner, idx) => {
            const isNavy = banner.theme === "navy";
            const isOrange = banner.theme === "orange";

            return (
              <motion.div
                key={banner.id}
                initial={prefersReducedMotion ? false : { opacity: 0, y: 18 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-30px" }}
                transition={{ duration: 0.45, delay: idx * 0.08, ease: [0.22, 1, 0.36, 1] }}
              >
                <Tilt3DCard maxTilt={6} scale={1.015}>
                  <div
                    className={`rounded-3xl p-6 sm:p-7 relative overflow-hidden flex flex-col justify-between min-h-[235px] group ${
                      isNavy
                        ? "surface-3d-dark bg-tech-grid text-white"
                        : isOrange
                        ? "bg-gradient-to-br from-orange-600 via-orange-500 to-amber-600 text-white shadow-xl border border-orange-400/40"
                        : "surface-3d bg-tech-grid-light text-slate-900"
                    }`}
                  >
                    <div
                      aria-hidden="true"
                      className="absolute -top-10 -right-10 w-44 h-44 rounded-full bg-white/15 blur-2xl pointer-events-none group-hover:scale-125 transition-transform duration-700"
                    />

                    {/* Copy & CTA */}
                    <div className="relative z-10 max-w-[64%]">
                      <div
                        className={`inline-flex items-center gap-1 text-[10px] font-black uppercase tracking-wider px-2.5 py-1 rounded-full mb-2.5 ${
                          isNavy
                            ? "bg-blue-500/20 text-blue-300 border border-blue-400/30"
                            : isOrange
                            ? "bg-white/20 text-white border border-white/30"
                            : "bg-blue-700 text-white"
                        }`}
                      >
                        <Sparkles className="w-2.5 h-2.5" aria-hidden="true" />
                        <span>{banner.tag}</span>
                      </div>

                      <h3 className="text-xl sm:text-2xl font-black tracking-tight leading-tight">
                        {banner.title}
                      </h3>
                      <p
                        className={`text-xs mt-1.5 line-clamp-2 leading-relaxed ${
                          isNavy
                            ? "text-slate-300"
                            : isOrange
                            ? "text-orange-50"
                            : "text-slate-600"
                        }`}
                      >
                        {banner.subtitle}
                      </p>

                      <div className="pt-5">
                        <Link
                          href="/shop"
                          className={`inline-flex items-center gap-1.5 text-xs font-black px-4 py-2.5 rounded-xl transition-[transform,background-color,box-shadow] duration-200 hover:-translate-y-0.5 shadow-sm cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 ${
                            isNavy
                              ? "bg-white text-slate-900 hover:bg-slate-100 focus-visible:ring-blue-400 focus-visible:ring-offset-slate-900"
                              : isOrange
                              ? "bg-white text-orange-700 hover:bg-orange-50 focus-visible:ring-white focus-visible:ring-offset-orange-600"
                              : "bg-blue-700 text-white hover:bg-blue-800 focus-visible:ring-blue-600"
                          }`}
                        >
                          <span>{banner.ctaText}</span>
                          <ArrowRight
                            className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform"
                            aria-hidden="true"
                          />
                        </Link>
                      </div>
                    </div>

                    {/* Floating 3D Promotional Image */}
                    <div className="absolute -right-3 -bottom-3 w-36 sm:w-44 h-36 sm:h-44 rounded-2xl overflow-hidden group-hover:scale-108 group-hover:-translate-y-1 transition-transform duration-500 ease-out">
                      <Image
                        src={banner.image}
                        alt={banner.title}
                        fill
                        className="object-cover object-center rounded-2xl drop-shadow-2xl"
                        sizes="(max-width: 768px) 150px, 190px"
                      />
                    </div>
                  </div>
                </Tilt3DCard>
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
