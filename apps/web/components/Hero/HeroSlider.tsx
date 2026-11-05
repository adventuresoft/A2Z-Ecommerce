"use client";

import React, { useState, useEffect, useCallback, useMemo } from "react";
import Image from "next/image";
import Link from "next/link";
import {
  ChevronLeft,
  ChevronRight,
  ArrowRight,
  ShieldCheck,
  Truck,
  AudioLines,
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { useSafeReducedMotion } from "../../lib/useSafeReducedMotion";
import { HERO_SLIDES, HeroSlide } from "../../data/mock-catalog";
import { PublicHeroBannerItem } from "../../lib/curated";

export interface HeroSideBanner {
  id: string;
  title: string;
  subtitle: string;
  imageUrl: string;
  linkUrl: string;
  variant?: "dark" | "light";
}

export const FREELANCER_HERO_SLIDE: HeroSlide = {
  id: "hero-freelancers",
  tagline: "VERIFIED LOCAL TALENT & SERVICES",
  title: "Hire Top Verified Freelancers & Professionals",
  subtitle:
    "Direct contact with certified local technicians, electricians, web developers, and creative experts across Bangladesh. 100% NID verified with zero platform commission.",
  primaryCtaText: "Hire a Professional",
  primaryCtaLink: "/hire",
  secondaryCtaText: "Join as Freelancer",
  secondaryCtaLink: "/freelancer/onboarding",
  badgeText: "VERIFIED TALENT",
  image:
    "https://images.unsplash.com/photo-1522071820081-009f0129c71c?auto=format&fit=crop&w=1200&q=85",
  bgColor: "from-slate-950 via-slate-900 to-slate-950",
};

const DEFAULT_SIDE_BANNERS: HeroSideBanner[] = [
  {
    id: "side-banner-flash-sale",
    title: "Mega Flash Deals\nUp to 60% Off",
    subtitle: "Limited time savings on trending electronics & gear.",
    imageUrl:
      "https://images.unsplash.com/photo-1607082348824-0a96f2a4b9da?auto=format&fit=crop&w=900&q=85",
    linkUrl: "/flash-sale",
    variant: "dark",
  },
  {
    id: "side-banner-freelance-finder",
    title: "Need Expert Help?\nFind Local Pros",
    subtitle: "Connect with certified technicians, electricians & developers.",
    imageUrl:
      "https://images.unsplash.com/photo-1581578731548-c64695cc6952?auto=format&fit=crop&w=900&q=85",
    linkUrl: "/hire",
    variant: "light",
  },
];

interface HeroSliderProps {
  banners?: PublicHeroBannerItem[];
  sideBanners?: HeroSideBanner[];
}

export function HeroSlider({
  banners,
  sideBanners = DEFAULT_SIDE_BANNERS,
}: HeroSliderProps = {}) {
  const prefersReducedMotion = useSafeReducedMotion();

  const baseSlides: HeroSlide[] =
    banners && banners.length > 0
      ? banners.map((b, idx) => ({
          id: b.id || `banner-${idx}`,
          tagline: b.badgeText || "IMMERSIVE TECH EXPERIENCE",
          title: b.title,
          subtitle:
            b.subtitle ||
            "Experience studio-grade acoustic clarity, precision performance, and all-day reliability with our curated flagship selection.",
          primaryCtaText: "Explore Now",
          primaryCtaLink: b.linkUrl || "/shop",
          secondaryCtaText: "Top Rated",
          secondaryCtaLink: "/flash-sale",
          badgeText: b.badgeText || "STUDIO GRADE",
          image: b.imageUrl || "/placeholder.png",
          bgColor: "from-slate-950 via-slate-900 to-slate-950",
        }))
      : HERO_SLIDES;

  // Insert Freelancer Marketplace slide into the slider rotation
  const slides: HeroSlide[] = useMemo(() => {
    const hasFreelancer = baseSlides.some(
      (s) => s.id === "hero-freelancers" || s.primaryCtaLink === "/hire",
    );
    if (hasFreelancer) return baseSlides;
    return [baseSlides[0]!, FREELANCER_HERO_SLIDE, ...baseSlides.slice(1)].filter(
      Boolean,
    ) as HeroSlide[];
  }, [baseSlides]);

  const [currentSlide, setCurrentSlide] = useState(0);
  const [isPaused, setIsPaused] = useState(false);

  const handleNext = useCallback(() => {
    setCurrentSlide((prev) => (prev + 1) % slides.length);
  }, [slides.length]);

  const handlePrev = useCallback(() => {
    setCurrentSlide((prev) => (prev - 1 + slides.length) % slides.length);
  }, [slides.length]);

  // Auto-play interval
  useEffect(() => {
    if (isPaused || slides.length <= 1 || prefersReducedMotion) return;
    const timer = setInterval(handleNext, 6000);
    return () => clearInterval(timer);
  }, [isPaused, slides.length, prefersReducedMotion, handleNext]);

  const slide: HeroSlide = slides[currentSlide] ?? slides[0]!;
  const rightBanners = sideBanners.slice(0, 2);

  // Strip leading emoji from badgeText so we can render our crisp SVG icon
  const cleanBadgeText = slide.badgeText
    ? slide.badgeText.replace(/^[^\w\d\s]+\s*/, "").toUpperCase()
    : "FEATURED DEAL";

  const isFreelancerSlide = slide.primaryCtaLink === "/hire";

  return (
    <section
      aria-label="Featured promotions"
      className="relative bg-[#F4F6F9] pt-3.5 pb-6 sm:pt-5 sm:pb-8 overflow-hidden"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 sm:gap-5 items-stretch">
          {/* Left Column (8 cols): Obsidian Studio Hero Slider */}
          <div
            className="lg:col-span-8 min-h-[360px] sm:min-h-[400px] lg:h-[435px]"
            onMouseEnter={() => setIsPaused(true)}
            onMouseLeave={() => setIsPaused(false)}
            onFocusCapture={() => setIsPaused(true)}
            onBlurCapture={() => setIsPaused(false)}
          >
            <div className="relative w-full h-full rounded-[22px] overflow-hidden bg-[#0E1117] text-white select-none shadow-[0_24px_48px_-12px_rgba(15,23,42,0.28),0_4px_16px_-2px_rgba(15,23,42,0.12)] flex flex-col justify-between">
              <AnimatePresence mode="wait">
                <motion.div
                  key={slide.id}
                  initial={prefersReducedMotion ? false : { opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
                  className="absolute inset-0 w-full h-full"
                >
                  {/* Right-Biased Studio Product Showcase Image */}
                  <div className="absolute inset-0 sm:left-[24%] w-full sm:w-[76%] h-full">
                    <Image
                      src={slide.image}
                      alt={slide.title}
                      fill
                      priority
                      className="object-cover object-center"
                      sizes="(max-width: 1024px) 100vw, 68vw"
                    />
                  </div>

                  {/* Multi-Stop Obsidian Studio Vignette Scrim */}
                  <div
                    aria-hidden="true"
                    className="absolute inset-0 bg-gradient-to-r from-[#0E1117] via-[#0E1117]/95 via-45% to-[#0E1117]/20 sm:via-[#0E1117]/88 sm:via-48% sm:to-transparent pointer-events-none"
                  />
                  <div
                    aria-hidden="true"
                    className="absolute inset-0 bg-gradient-to-t from-[#0E1117] via-[#0E1117]/35 to-[#0E1117]/30 sm:from-[#0E1117]/85 sm:via-transparent sm:to-[#0E1117]/25 pointer-events-none"
                  />
                </motion.div>
              </AnimatePresence>

              {/* Top-Right Pill */}
              <div className="relative z-20 flex justify-end px-5 pt-4 sm:px-7 sm:pt-5 pointer-events-none">
                <div className="inline-flex items-center gap-2 bg-[#161B22]/90 backdrop-blur-md border border-white/10 px-3 py-1 rounded-full text-[10px] sm:text-[11px] font-semibold tracking-tight shadow-md">
                  <span
                    className="w-2 h-2 rounded-full bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.9)]"
                    aria-hidden="true"
                  />
                  <span className="text-slate-100">
                    {isFreelancerSlide ? "Freelancer Network" : "Official Store"}
                  </span>
                  <span className="text-slate-500">•</span>
                  <span className="text-emerald-400 font-bold">
                    {isFreelancerSlide ? "Verified Pros" : "Ready Stock"}
                  </span>
                </div>
              </div>

              {/* Main Left-Aligned Editorial Content */}
              <div className="relative z-20 px-6 sm:px-9 lg:px-11 my-auto py-2 max-w-lg">
                <AnimatePresence mode="wait">
                  <motion.div
                    key={slide.id}
                    initial={prefersReducedMotion ? false : { opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={prefersReducedMotion ? { opacity: 0 } : { opacity: 0, y: -8 }}
                    transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
                    className="flex flex-col items-start space-y-2.5 sm:space-y-3"
                  >
                    {/* Dual Eyebrow Badges */}
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="inline-flex items-center gap-1.5 bg-amber-500/12 border border-amber-400/35 text-amber-300 px-2.5 py-0.5 rounded-md text-[10px] font-bold tracking-wider uppercase">
                        <AudioLines className="w-3 h-3 text-amber-400 shrink-0" aria-hidden="true" />
                        <span>{cleanBadgeText}</span>
                      </span>

                      {slide.tagline && (
                        <span className="inline-flex items-center bg-slate-800/75 border border-slate-700/80 text-slate-300 px-2.5 py-0.5 rounded-md text-[10px] font-bold tracking-wider uppercase backdrop-blur-sm">
                          {slide.tagline}
                        </span>
                      )}
                    </div>

                    {/* Headline */}
                    <h1 className="text-base sm:text-lg lg:text-[22px] font-extrabold tracking-tight text-white leading-snug text-balance max-w-sm">
                      {slide.title}
                    </h1>

                    {/* Editorial Subtitle */}
                    <p className="text-slate-300/85 text-[11px] sm:text-xs max-w-[360px] leading-relaxed line-clamp-2 font-normal">
                      {slide.subtitle}
                    </p>

                    {/* Inline Trust Highlights with Vertical Divider */}
                    {isFreelancerSlide ? (
                      <div className="flex flex-wrap items-center gap-2.5 sm:gap-3.5 pt-0.5 text-[10px] sm:text-[11px] font-semibold text-slate-200">
                        <div className="inline-flex items-center gap-1.5">
                          <span className="w-4 h-4 sm:w-5 sm:h-5 rounded-full bg-emerald-500/15 border border-emerald-400/30 flex items-center justify-center text-emerald-400 shrink-0">
                            <ShieldCheck className="w-2.5 h-2.5 sm:w-3 sm:h-3" aria-hidden="true" />
                          </span>
                          <span>100% NID Verified</span>
                        </div>

                        <span className="h-3 w-px bg-white/15" aria-hidden="true" />

                        <div className="inline-flex items-center gap-1.5">
                          <span className="w-4 h-4 sm:w-5 sm:h-5 rounded-full bg-sky-500/15 border border-sky-400/30 flex items-center justify-center text-sky-400 shrink-0">
                            <Truck className="w-2.5 h-2.5 sm:w-3 sm:h-3" aria-hidden="true" />
                          </span>
                          <span>Direct Hire • 0% Commission</span>
                        </div>
                      </div>
                    ) : (
                      <div className="flex flex-wrap items-center gap-2.5 sm:gap-3.5 pt-0.5 text-[10px] sm:text-[11px] font-semibold text-slate-200">
                        <div className="inline-flex items-center gap-1.5">
                          <span className="w-4 h-4 sm:w-5 sm:h-5 rounded-full bg-sky-500/15 border border-sky-400/30 flex items-center justify-center text-sky-400 shrink-0">
                            <ShieldCheck className="w-2.5 h-2.5 sm:w-3 sm:h-3" aria-hidden="true" />
                          </span>
                          <span>100% Official Warranty</span>
                        </div>

                        <span className="h-3 w-px bg-white/15" aria-hidden="true" />

                        <div className="inline-flex items-center gap-1.5">
                          <span className="w-4 h-4 sm:w-5 sm:h-5 rounded-full bg-emerald-500/15 border border-emerald-400/30 flex items-center justify-center text-emerald-400 shrink-0">
                            <Truck className="w-2.5 h-2.5 sm:w-3 sm:h-3" aria-hidden="true" />
                          </span>
                          <span>Fast Express Delivery</span>
                        </div>
                      </div>
                    )}

                    {/* CTA Buttons */}
                    <div className="flex flex-wrap items-center gap-2.5 pt-1">
                      <Link
                        href={slide.primaryCtaLink}
                        className="bg-[#0B46B5] hover:bg-[#1254D1] text-white font-bold text-xs px-4 sm:px-5 py-2 sm:py-2.5 rounded-xl shadow-[0_8px_24px_-4px_rgba(29,78,216,0.75),inset_0_1px_0_rgba(255,255,255,0.25)] hover:shadow-[0_10px_28px_-4px_rgba(37,99,235,0.9)] flex items-center gap-1.5 cursor-pointer transition-all duration-200 hover:-translate-y-0.5 active:translate-y-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-400"
                      >
                        <span>{slide.primaryCtaText}</span>
                        <ArrowRight className="w-3.5 h-3.5" aria-hidden="true" />
                      </Link>

                      {slide.secondaryCtaText && (
                        <Link
                          href={slide.secondaryCtaLink}
                          className="bg-[#161B22]/80 hover:bg-white/10 text-white border border-white/20 font-semibold text-xs px-4 sm:px-5 py-2 sm:py-2.5 rounded-xl backdrop-blur-md transition-all duration-200 hover:-translate-y-0.5 active:translate-y-0 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/60"
                        >
                          {slide.secondaryCtaText}
                        </Link>
                      )}
                    </div>
                  </motion.div>
                </AnimatePresence>
              </div>

              {/* Bottom Tactile Control Cluster: [<] [• — • •] [>] */}
              {slides.length > 1 && (
                <div className="relative z-20 px-6 pb-4 sm:px-9 sm:pb-5 lg:px-11 flex items-center gap-2.5">
                  {/* Prev Button */}
                  <button
                    type="button"
                    onClick={handlePrev}
                    className="w-8 h-8 sm:w-9 sm:h-9 rounded-full bg-gradient-to-b from-slate-800/95 to-slate-950/95 hover:from-slate-700 hover:to-slate-900 border border-white/15 text-slate-200 hover:text-white shadow-[0_6px_14px_rgba(0,0,0,0.6),inset_0_1px_1px_rgba(255,255,255,0.25),inset_0_-2px_4px_rgba(0,0,0,0.5)] hover:shadow-[0_8px_18px_rgba(37,99,235,0.35),inset_0_1px_1px_rgba(255,255,255,0.35)] flex items-center justify-center transition-all duration-200 hover:-translate-y-0.5 active:translate-y-0 active:scale-95 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-400"
                    aria-label="Previous slide"
                  >
                    <ChevronLeft className="w-4 h-4 stroke-[2.2] drop-shadow-[0_1px_2px_rgba(0,0,0,0.8)]" aria-hidden="true" />
                  </button>

                  {/* Recessed Capsule Pagination */}
                  <div className="flex items-center gap-2 px-3.5 py-2 rounded-full bg-gradient-to-b from-slate-950/90 to-slate-900/90 border border-white/12 backdrop-blur-md shadow-[0_6px_16px_rgba(0,0,0,0.55),inset_0_2px_4px_rgba(0,0,0,0.7),inset_0_-1px_0_rgba(255,255,255,0.12)]">
                    {slides.map((_, idx) => (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => setCurrentSlide(idx)}
                        className={`h-2 rounded-full cursor-pointer transition-all duration-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-400 ${
                          currentSlide === idx
                            ? "w-7 bg-blue-500 shadow-[0_0_10px_rgba(59,130,246,0.9),inset_0_1px_1px_rgba(255,255,255,0.4)]"
                            : "w-2 bg-slate-600/70 hover:bg-slate-400/80 shadow-[inset_0_1px_2px_rgba(0,0,0,0.8)]"
                        }`}
                        aria-label={`Go to slide ${idx + 1}`}
                      />
                    ))}
                  </div>

                  {/* Next Button */}
                  <button
                    type="button"
                    onClick={handleNext}
                    className="w-8 h-8 sm:w-9 sm:h-9 rounded-full bg-gradient-to-b from-slate-800/95 to-slate-950/95 hover:from-slate-700 hover:to-slate-900 border border-white/15 text-slate-200 hover:text-white shadow-[0_6px_14px_rgba(0,0,0,0.6),inset_0_1px_1px_rgba(255,255,255,0.25),inset_0_-2px_4px_rgba(0,0,0,0.5)] hover:shadow-[0_8px_18px_rgba(37,99,235,0.35),inset_0_1px_1px_rgba(255,255,255,0.35)] flex items-center justify-center transition-all duration-200 hover:-translate-y-0.5 active:translate-y-0 active:scale-95 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-400"
                    aria-label="Next slide"
                  >
                    <ChevronRight className="w-4 h-4 stroke-[2.2] drop-shadow-[0_1px_2px_rgba(0,0,0,0.8)]" aria-hidden="true" />
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Right Column (4 cols): 2 Stacked Editorial Bento Cards */}
          <div className="lg:col-span-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-1 lg:grid-rows-2 gap-4 sm:gap-5 lg:h-[435px]">
            {rightBanners.map((banner, index) => {
              const isLightCard =
                banner.variant === "light" || (banner.variant === undefined && index === 1);

              return (
                <div
                  key={banner.id}
                  className="w-full h-[185px] sm:h-[200px] lg:h-full rounded-[22px]"
                >
                  {isLightCard ? (
                    /* Bottom Card: Light Silver Studio Freelance Finder Card */
                    <Link
                      href={banner.linkUrl}
                      className="group relative w-full h-full rounded-[22px] overflow-hidden bg-gradient-to-br from-[#F1F3F6] via-[#E9ECF0] to-[#DFE3E8] shadow-[0_18px_36px_-12px_rgba(15,23,42,0.14),0_4px_12px_-2px_rgba(15,23,42,0.06)] hover:shadow-[0_22px_44px_-12px_rgba(15,23,42,0.22)] transition-all duration-300 flex items-center justify-between p-5 sm:p-6 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600"
                    >
                      {/* Left Copy */}
                      <div className="relative z-20 max-w-[56%] flex flex-col justify-center space-y-1.5">
                        <h2 className="text-sm sm:text-base font-extrabold text-slate-900 leading-snug tracking-tight whitespace-pre-line">
                          {banner.title}
                        </h2>
                        <p className="text-[11px] sm:text-xs text-slate-600 leading-relaxed line-clamp-2 font-medium">
                          {banner.subtitle}
                        </p>
                      </div>

                      {/* Right Product Cutout Image */}
                      <div className="absolute right-0 top-0 bottom-0 w-[52%] h-full overflow-hidden pointer-events-none">
                        <Image
                          src={banner.imageUrl}
                          alt={banner.title}
                          fill
                          className="object-cover object-center group-hover:scale-105 transition-transform duration-700 ease-out"
                          sizes="(max-width: 1024px) 50vw, 20vw"
                        />
                        <div
                          aria-hidden="true"
                          className="absolute inset-y-0 left-0 w-12 bg-gradient-to-r from-[#ECEEF2] to-transparent"
                        />
                      </div>
                    </Link>
                  ) : (
                    /* Top Card: Dark Immersive Flash Sale Card */
                    <Link
                      href={banner.linkUrl}
                      className="group relative w-full h-full rounded-[22px] overflow-hidden bg-[#0E1117] text-white shadow-[0_18px_36px_-12px_rgba(15,23,42,0.28),0_4px_12px_-2px_rgba(15,23,42,0.12)] hover:shadow-[0_22px_44px_-12px_rgba(15,23,42,0.38)] transition-all duration-300 flex flex-col justify-end p-5 sm:p-6 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600"
                    >
                      <Image
                        src={banner.imageUrl}
                        alt={banner.title}
                        fill
                        className="object-cover object-center group-hover:scale-105 transition-transform duration-700 ease-out"
                        sizes="(max-width: 1024px) 100vw, 32vw"
                      />

                      <div
                        aria-hidden="true"
                        className="absolute inset-0 bg-gradient-to-t from-[#090C10]/95 via-[#090C10]/55 to-transparent pointer-events-none"
                      />

                      <div className="relative z-20 space-y-1">
                        <h2 className="text-sm sm:text-base font-extrabold text-white leading-snug tracking-tight whitespace-pre-line drop-shadow-sm">
                          {banner.title}
                        </h2>
                        <p className="text-[11px] sm:text-xs text-slate-300/90 leading-relaxed line-clamp-1 font-medium">
                          {banner.subtitle}
                        </p>
                      </div>
                    </Link>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
}
