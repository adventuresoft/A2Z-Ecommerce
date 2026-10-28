"use client";

import React, { useState, useEffect, useRef } from "react";
import Image from "next/image";
import Link from "next/link";
import { ChevronLeft, ChevronRight, ArrowRight, ShieldCheck, Award, Truck, Lock, Pause, Play } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import gsap from "gsap";
import { HERO_SLIDES, HeroSlide } from "../../data/mock-catalog";
import { PublicHeroBannerItem } from "../../lib/curated";

interface HeroSliderProps {
  banners?: PublicHeroBannerItem[];
}

export function HeroSlider({ banners }: HeroSliderProps = {}) {
  const slides: HeroSlide[] =
    banners && banners.length > 0
      ? banners.map((b, idx) => ({
          id: b.id || `banner-${idx}`,
          tagline: b.badgeText || "Special Offer",
          title: b.title,
          subtitle:
            b.subtitle ||
            "Discover our premium selection with official warranty and fast delivery.",
          primaryCtaText: "Shop Now",
          primaryCtaLink: b.linkUrl || "/shop",
          secondaryCtaText: "Explore More",
          secondaryCtaLink: "/shop",
          badgeText: b.badgeText || "Featured Collection",
          image: b.imageUrl || "/placeholder.png",
          bgColor: "from-slate-900 via-blue-950 to-slate-900",
        }))
      : HERO_SLIDES;

  const [currentSlide, setCurrentSlide] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const heroRef = useRef<HTMLDivElement>(null);
  const floatBadgeRef = useRef<HTMLDivElement>(null);
  const floatImageRef = useRef<HTMLDivElement>(null);

  // Auto-play interval
  useEffect(() => {
    if (isPaused || slides.length <= 1) return;
    const timer = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % slides.length);
    }, 6000);
    return () => clearInterval(timer);
  }, [isPaused, slides.length]);

  // GSAP subtle floating timeline for ambient depth
  useEffect(() => {
    const ctx = gsap.context(() => {
      // Floating animation on badge
      if (floatBadgeRef.current) {
        gsap.to(floatBadgeRef.current, {
          y: -6,
          duration: 2.4,
          repeat: -1,
          yoyo: true,
          ease: "sine.inOut",
        });
      }
      // Floating ambient on hero image container
      if (floatImageRef.current) {
        gsap.to(floatImageRef.current, {
          y: -8,
          duration: 3.5,
          repeat: -1,
          yoyo: true,
          ease: "sine.inOut",
        });
      }
    }, heroRef);

    return () => ctx.revert();
  }, [currentSlide]);

  const slide: HeroSlide = slides[currentSlide] ?? slides[0]!;

  return (
    <section
      ref={heroRef}
      aria-label="Featured promotions"
      className="relative bg-gradient-to-b from-slate-100 to-slate-200/60 pt-4 pb-8 overflow-hidden"
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="relative rounded-3xl bg-gradient-to-br from-slate-900 via-blue-950 to-slate-900 shadow-2xl overflow-hidden border border-slate-800 text-white min-h-[470px] flex items-center">
          {/* Background Ambient Glows with GSAP parallax feel */}
          <div className="absolute top-0 right-1/4 w-96 h-96 bg-blue-600/20 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute bottom-0 right-10 w-80 h-80 bg-orange-500/15 rounded-full blur-3xl pointer-events-none" />

          {/* Slide Content Grid */}
          <div className="relative z-10 grid grid-cols-1 lg:grid-cols-12 gap-8 items-center p-6 sm:p-10 lg:p-14 w-full">
            {/* Left Column: Headlines & CTA */}
            <div className="lg:col-span-7 flex flex-col justify-center space-y-5">
              <AnimatePresence mode="wait">
                <motion.div
                  key={slide.id}
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -15 }}
                  transition={{ duration: 0.4, ease: "easeOut" }}
                  className="space-y-4"
                >
                  {/* Tagline Badge */}
                  <div
                    ref={floatBadgeRef}
                    className="inline-flex items-center space-x-2 bg-blue-500/15 border border-blue-400/30 text-blue-300 px-3.5 py-1 rounded-full text-xs font-bold tracking-wide w-fit shadow-xs"
                  >
                    <span>{slide.badgeText}</span>
                  </div>

                  {/* Main Headline */}
                  <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black tracking-tight text-white leading-tight">
                    {slide.title}
                  </h1>

                  {/* Subtitle */}
                  <p className="text-slate-300 text-sm sm:text-base max-w-xl font-normal leading-relaxed">
                    {slide.subtitle}
                  </p>
                </motion.div>
              </AnimatePresence>

              {/* CTA Buttons with Motion interactions */}
              <div className="flex flex-wrap items-center gap-3 pt-2">
                <Link
                  href={slide.primaryCtaLink}
                  className="bg-blue-600 hover:bg-blue-700 text-white font-bold text-sm px-6 py-3.5 rounded-xl shadow-lg shadow-blue-600/30 hover:shadow-blue-600/50 flex items-center space-x-2 cursor-pointer transition-all hover:scale-[1.02] active:scale-[0.98] focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-blue-400 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-900"
                >
                  <span>{slide.primaryCtaText}</span>
                  <ArrowRight className="w-4 h-4" aria-hidden="true" />
                </Link>

                <Link
                  href={slide.secondaryCtaLink}
                  className="bg-white/10 hover:bg-white/20 text-white border border-white/20 font-bold text-sm px-6 py-3.5 rounded-xl backdrop-blur-xs transition-all hover:scale-[1.02] active:scale-[0.98] cursor-pointer focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-white/50 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-900"
                >
                  {slide.secondaryCtaText}
                </Link>
              </div>

              {/* Inline Trust Badges */}
              <div className="pt-4 grid grid-cols-2 sm:grid-cols-4 gap-3 border-t border-slate-800/80">
                <div className="flex items-center space-x-2">
                  <Award className="w-4 h-4 text-orange-400 shrink-0" aria-hidden="true" />
                  <div className="flex flex-col">
                    <span className="text-[11px] font-bold text-white">100% Authentic</span>
                    <span className="text-[10px] text-slate-400">Genuine Products</span>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <ShieldCheck className="w-4 h-4 text-blue-400 shrink-0" aria-hidden="true" />
                  <div className="flex flex-col">
                    <span className="text-[11px] font-bold text-white">Official Warranty</span>
                    <span className="text-[10px] text-slate-400">Brand Warranty</span>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <Truck className="w-4 h-4 text-emerald-400 shrink-0" aria-hidden="true" />
                  <div className="flex flex-col">
                    <span className="text-[11px] font-bold text-white">Fast Delivery</span>
                    <span className="text-[10px] text-slate-400">Across Bangladesh</span>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <Lock className="w-4 h-4 text-amber-400 shrink-0" aria-hidden="true" />
                  <div className="flex flex-col">
                    <span className="text-[11px] font-bold text-white">Secure Payment</span>
                    <span className="text-[10px] text-slate-400">100% Protected</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Right Column: Hero Image Showcase with GSAP float & Motion enter */}
            <div className="lg:col-span-5 flex justify-center items-center relative">
              <AnimatePresence mode="wait">
                <motion.div
                  key={slide.id}
                  ref={floatImageRef}
                  initial={{ opacity: 0, scale: 0.94 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.94 }}
                  transition={{ duration: 0.45, ease: "easeOut" }}
                  className="relative w-full max-w-md h-72 sm:h-80 rounded-2xl overflow-hidden border border-white/10 shadow-2xl group"
                >
                  <Image
                    src={slide.image}
                    alt={slide.title}
                    fill
                    priority
                    className="object-cover object-center group-hover:scale-105 transition-transform duration-700"
                    sizes="(max-width: 768px) 100vw, 500px"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-slate-950/70 via-transparent to-transparent pointer-events-none" />
                  <div className="absolute bottom-4 left-4 right-4 bg-slate-900/80 backdrop-blur-md px-4 py-2.5 rounded-xl border border-white/10 flex items-center justify-between text-xs">
                    <span className="font-semibold text-white">Featured High-Tech Collection</span>
                    <span className="text-orange-400 font-bold">Limited Deals</span>
                  </div>
                </motion.div>
              </AnimatePresence>
            </div>
          </div>

          {/* Slide Arrow Navigation with spring animations */}
          <button
            type="button"
            onClick={() => setCurrentSlide((prev) => (prev - 1 + slides.length) % slides.length)}
            className="absolute left-3 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-slate-800/60 hover:bg-slate-700 text-white flex items-center justify-center backdrop-blur-xs transition-colors z-20 cursor-pointer focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-blue-400"
            aria-label="Previous Slide"
          >
            <ChevronLeft className="w-5 h-5" aria-hidden="true" />
          </button>
          <button
            type="button"
            onClick={() => setCurrentSlide((prev) => (prev + 1) % slides.length)}
            className="absolute right-3 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-slate-800/60 hover:bg-slate-700 text-white flex items-center justify-center backdrop-blur-xs transition-colors z-20 cursor-pointer focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-blue-400"
            aria-label="Next Slide"
          >
            <ChevronRight className="w-5 h-5" aria-hidden="true" />
          </button>

          {/* Pagination Dots & Autoplay Toggle */}
          <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex items-center space-x-3 z-20 bg-slate-900/60 backdrop-blur-sm px-3 py-1.5 rounded-full border border-white/10">
            <div className="flex items-center space-x-1.5">
              {slides.map((_, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => setCurrentSlide(idx)}
                  className={`transition-all rounded-full cursor-pointer focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-blue-400 ${
                    currentSlide === idx
                      ? "w-7 h-2 bg-blue-500 shadow-xs shadow-blue-400"
                      : "w-2 h-2 bg-slate-500 hover:bg-slate-400"
                  }`}
                  aria-label={`Go to slide ${idx + 1}`}
                />
              ))}
            </div>
            <button
              type="button"
              onClick={() => setIsPaused((prev) => !prev)}
              aria-label={isPaused ? "Resume autoplay" : "Pause autoplay"}
              className="text-slate-400 hover:text-white transition-colors focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-blue-400 rounded-full p-0.5"
            >
              {isPaused ? <Play className="w-3 h-3" aria-hidden="true" /> : <Pause className="w-3 h-3" aria-hidden="true" />}
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}
