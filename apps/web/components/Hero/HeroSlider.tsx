"use client";

import React, { useState, useEffect, useRef } from "react";
import Image from "next/image";
import Link from "next/link";
import {
  ChevronLeft,
  ChevronRight,
  ArrowRight,
  ShieldCheck,
  Award,
  Truck,
  Lock,
  Pause,
  Play,
  Sparkles,
} from "lucide-react";
import { motion, AnimatePresence, useReducedMotion } from "motion/react";
import gsap from "gsap";
import { Tilt3DCard } from "../UI/Tilt3DCard";
import { HERO_SLIDES, HeroSlide } from "../../data/mock-catalog";
import { PublicHeroBannerItem } from "../../lib/curated";

interface HeroSliderProps {
  banners?: PublicHeroBannerItem[];
}

export function HeroSlider({ banners }: HeroSliderProps = {}) {
  const prefersReducedMotion = useReducedMotion();

  const slides: HeroSlide[] =
    banners && banners.length > 0
      ? banners.map((b, idx) => ({
          id: b.id || `banner-${idx}`,
          tagline: b.badgeText || "Special Offer",
          title: b.title,
          subtitle:
            b.subtitle ||
            "Discover our premium selection with official warranty and fast delivery.",
          primaryCtaText: "Shop Collection",
          primaryCtaLink: b.linkUrl || "/shop",
          secondaryCtaText: "Explore Deals",
          secondaryCtaLink: "/flash-sale",
          badgeText: b.badgeText || "Featured Collection",
          image: b.imageUrl || "/placeholder.png",
          bgColor: "from-slate-950 via-blue-950 to-slate-900",
        }))
      : HERO_SLIDES;

  const [currentSlide, setCurrentSlide] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const heroRef = useRef<HTMLDivElement>(null);
  const floatBadgeRef = useRef<HTMLDivElement>(null);
  const floatStageRef = useRef<HTMLDivElement>(null);

  // Auto-play interval
  useEffect(() => {
    if (isPaused || slides.length <= 1 || prefersReducedMotion) return;
    const timer = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % slides.length);
    }, 6000);
    return () => clearInterval(timer);
  }, [isPaused, slides.length, prefersReducedMotion]);

  // GSAP subtle floating timeline for ambient 3D depth (disabled if reduced motion)
  useEffect(() => {
    if (prefersReducedMotion) return;
    if (
      typeof window !== "undefined" &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches
    ) {
      return;
    }

    const ctx = gsap.context(() => {
      if (floatBadgeRef.current) {
        gsap.to(floatBadgeRef.current, {
          y: -5,
          duration: 2.4,
          repeat: -1,
          yoyo: true,
          ease: "sine.inOut",
        });
      }
      if (floatStageRef.current) {
        gsap.to(floatStageRef.current, {
          y: -7,
          duration: 3.4,
          repeat: -1,
          yoyo: true,
          ease: "sine.inOut",
        });
      }
    }, heroRef);

    return () => ctx.revert();
  }, [currentSlide, prefersReducedMotion]);

  const slide: HeroSlide = slides[currentSlide] ?? slides[0]!;

  return (
    <section
      ref={heroRef}
      aria-label="Featured promotions"
      className="relative bg-gradient-to-b from-slate-100 via-slate-100/70 to-[#F8FAFC] pt-4 pb-8 overflow-hidden"
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
      onFocusCapture={() => setIsPaused(true)}
      onBlurCapture={() => setIsPaused(false)}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="relative rounded-3xl surface-3d-dark bg-tech-grid overflow-hidden text-white min-h-[460px] lg:min-h-[485px] flex items-center">
          {/* Ambient 3D Spatial Lighting */}
          <div
            aria-hidden="true"
            className="absolute -top-16 right-1/4 w-96 h-96 bg-blue-600/25 rounded-full blur-3xl pointer-events-none"
          />
          <div
            aria-hidden="true"
            className="absolute -bottom-16 right-8 w-80 h-80 bg-orange-500/15 rounded-full blur-3xl pointer-events-none"
          />
          <div
            aria-hidden="true"
            className="absolute top-1/2 left-10 -translate-y-1/2 w-64 h-64 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none"
          />

          {/* Slide Content Grid */}
          <div className="relative z-10 grid grid-cols-1 lg:grid-cols-12 gap-8 items-center px-6 py-8 sm:px-12 sm:py-10 lg:px-16 lg:py-12 w-full">
            {/* Left Column: Headlines & CTA */}
            <div className="lg:col-span-7 flex flex-col justify-center space-y-5">
              <AnimatePresence mode="wait">
                <motion.div
                  key={slide.id}
                  initial={prefersReducedMotion ? false : { opacity: 0, y: 14 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={prefersReducedMotion ? { opacity: 0 } : { opacity: 0, y: -14 }}
                  transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
                  className="space-y-4"
                >
                  {/* Floating 3D Eyebrow Pill */}
                  <div
                    ref={floatBadgeRef}
                    className="inline-flex items-center gap-2 bg-blue-500/15 border border-blue-400/35 text-blue-200 px-3.5 py-1.5 rounded-full text-xs font-extrabold tracking-wide w-fit shadow-sm"
                  >
                    <Sparkles className="w-3.5 h-3.5 text-orange-400" aria-hidden="true" />
                    <span>{slide.badgeText}</span>
                  </div>

                  {/* Main Display Headline */}
                  <h1 className="text-3xl sm:text-4xl lg:text-[2.85rem] font-black tracking-tight text-white leading-[1.1] text-balance">
                    {slide.title}
                  </h1>

                  {/* Subtitle */}
                  <p className="text-slate-300 text-sm sm:text-base max-w-xl leading-relaxed">
                    {slide.subtitle}
                  </p>
                </motion.div>
              </AnimatePresence>

              {/* CTA Buttons */}
              <div className="flex flex-wrap items-center gap-3 pt-1">
                <Link
                  href={slide.primaryCtaLink}
                  className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-black text-sm px-6 py-3.5 rounded-2xl shadow-lg shadow-blue-600/30 hover:shadow-blue-500/40 flex items-center gap-2 cursor-pointer transition-[transform,box-shadow,background-color] duration-200 hover:-translate-y-0.5 active:translate-y-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-400 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-900"
                >
                  <span>{slide.primaryCtaText}</span>
                  <ArrowRight className="w-4 h-4" aria-hidden="true" />
                </Link>

                <Link
                  href={slide.secondaryCtaLink}
                  className="bg-white/10 hover:bg-white/18 text-white border border-white/20 font-bold text-sm px-6 py-3.5 rounded-2xl backdrop-blur-md transition-[transform,background-color,border-color] duration-200 hover:-translate-y-0.5 active:translate-y-0 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/60 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-900"
                >
                  {slide.secondaryCtaText}
                </Link>
              </div>

              {/* 4-Pillar Spatial Telemetry Strip */}
              <div className="pt-5 grid grid-cols-2 sm:grid-cols-4 gap-3 border-t border-white/10">
                <div className="flex items-center gap-2.5 bg-white/5 border border-white/8 rounded-xl px-3 py-2">
                  <Award className="w-4 h-4 text-orange-400 shrink-0" aria-hidden="true" />
                  <div className="flex flex-col min-w-0">
                    <span className="text-[11px] font-extrabold text-white truncate">
                      100% Authentic
                    </span>
                    <span className="text-[10px] text-slate-400 truncate">Factory Sealed</span>
                  </div>
                </div>
                <div className="flex items-center gap-2.5 bg-white/5 border border-white/8 rounded-xl px-3 py-2">
                  <ShieldCheck className="w-4 h-4 text-blue-400 shrink-0" aria-hidden="true" />
                  <div className="flex flex-col min-w-0">
                    <span className="text-[11px] font-extrabold text-white truncate">
                      Brand Warranty
                    </span>
                    <span className="text-[10px] text-slate-400 truncate">Official Claim</span>
                  </div>
                </div>
                <div className="flex items-center gap-2.5 bg-white/5 border border-white/8 rounded-xl px-3 py-2">
                  <Truck className="w-4 h-4 text-emerald-400 shrink-0" aria-hidden="true" />
                  <div className="flex flex-col min-w-0">
                    <span className="text-[11px] font-extrabold text-white truncate">
                      64 Districts
                    </span>
                    <span className="text-[10px] text-slate-400 truncate">Express Courier</span>
                  </div>
                </div>
                <div className="flex items-center gap-2.5 bg-white/5 border border-white/8 rounded-xl px-3 py-2">
                  <Lock className="w-4 h-4 text-amber-400 shrink-0" aria-hidden="true" />
                  <div className="flex flex-col min-w-0">
                    <span className="text-[11px] font-extrabold text-white truncate">
                      0% EMI &amp; COD
                    </span>
                    <span className="text-[10px] text-slate-400 truncate">SSL Protected</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Right Column: Interactive 3D Spatial Product Stage */}
            <div className="lg:col-span-5 flex justify-center items-center relative">
              <div ref={floatStageRef} className="w-full max-w-md">
                <Tilt3DCard maxTilt={8} scale={1.02} glare={true}>
                  <AnimatePresence mode="wait">
                    <motion.div
                      key={slide.id}
                      initial={prefersReducedMotion ? false : { opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={prefersReducedMotion ? { opacity: 0 } : { opacity: 0, scale: 0.95 }}
                      transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
                      className="relative w-full h-72 sm:h-80 rounded-3xl overflow-hidden border border-white/15 bg-slate-900/80 shadow-[0_25px_60px_-15px_rgba(0,0,0,0.65)] group"
                    >
                      <Image
                        src={slide.image}
                        alt={slide.title}
                        fill
                        priority
                        className="object-cover object-center group-hover:scale-105 transition-transform duration-700"
                        sizes="(max-width: 768px) 100vw, 480px"
                      />
                      <div
                        aria-hidden="true"
                        className="absolute inset-0 bg-gradient-to-t from-slate-950/85 via-slate-950/15 to-transparent pointer-events-none"
                      />

                      {/* Top Floating Verification Pill */}
                      <div className="absolute top-3.5 left-3.5 bg-slate-950/75 backdrop-blur-md px-3 py-1 rounded-full border border-white/15 flex items-center gap-1.5 text-[11px] font-bold text-emerald-300">
                        <span
                          className="w-2 h-2 rounded-full bg-emerald-400"
                          aria-hidden="true"
                        />
                        <span>Authorized Flagship Stock</span>
                      </div>

                      {/* Bottom Floating 3D Telemetry Bar */}
                      <div className="absolute bottom-3.5 left-3.5 right-3.5 bg-slate-950/80 backdrop-blur-md px-4 py-3 rounded-2xl border border-white/15 flex items-center justify-between text-xs shadow-lg">
                        <div>
                          <span className="font-extrabold text-white block">
                            Precision Tech Showcase
                          </span>
                          <span className="text-[10px] text-slate-400">
                            Slide{" "}
                            <span className="tabular-nums font-bold text-slate-200">
                              0{currentSlide + 1} / 0{slides.length}
                            </span>
                          </span>
                        </div>
                        <span className="text-orange-300 bg-orange-500/15 border border-orange-400/30 px-2.5 py-1 rounded-lg font-black text-[11px]">
                          Hot Offer
                        </span>
                      </div>
                    </motion.div>
                  </AnimatePresence>
                </Tilt3DCard>
              </div>
            </div>
          </div>

          {/* Slide Arrow Navigation */}
          {slides.length > 1 && (
            <>
              <button
                type="button"
                onClick={() =>
                  setCurrentSlide((prev) => (prev - 1 + slides.length) % slides.length)
                }
                className="hidden sm:flex absolute left-3 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-slate-900/70 hover:bg-blue-600 border border-white/15 text-white items-center justify-center backdrop-blur-md transition-colors z-20 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-400"
                aria-label="Previous slide"
              >
                <ChevronLeft className="w-5 h-5" aria-hidden="true" />
              </button>
              <button
                type="button"
                onClick={() => setCurrentSlide((prev) => (prev + 1) % slides.length)}
                className="hidden sm:flex absolute right-3 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-slate-900/70 hover:bg-blue-600 border border-white/15 text-white items-center justify-center backdrop-blur-md transition-colors z-20 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-400"
                aria-label="Next slide"
              >
                <ChevronRight className="w-5 h-5" aria-hidden="true" />
              </button>
            </>
          )}

          {/* Pagination Dots & Autoplay Toggle */}
          {slides.length > 1 && (
            <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex items-center gap-3 z-20 bg-slate-950/75 backdrop-blur-md px-3.5 py-1.5 rounded-full border border-white/15">
              <div className="flex items-center gap-1.5">
                {slides.map((_, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => setCurrentSlide(idx)}
                    className={`h-2 rounded-full cursor-pointer transition-[width,background-color] duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-400 ${
                      currentSlide === idx
                        ? "w-7 bg-blue-500"
                        : "w-2 bg-slate-500 hover:bg-slate-300"
                    }`}
                    aria-label={`Go to slide ${idx + 1}`}
                    aria-current={currentSlide === idx ? "true" : undefined}
                  />
                ))}
              </div>
              <button
                type="button"
                onClick={() => setIsPaused((prev) => !prev)}
                aria-label={isPaused ? "Resume slide autoplay" : "Pause slide autoplay"}
                className="text-slate-400 hover:text-white transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-400 rounded-full p-0.5"
              >
                {isPaused ? (
                  <Play className="w-3 h-3" aria-hidden="true" />
                ) : (
                  <Pause className="w-3 h-3" aria-hidden="true" />
                )}
              </button>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
