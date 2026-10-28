"use client";

import React, { useState, useEffect } from "react";
import { ArrowUp } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { useSmoothScroll } from "../SmoothScroll/SmoothScrollProvider";

export function ScrollToTopButton() {
  const [isVisible, setIsVisible] = useState(false);
  const { scrollTo } = useSmoothScroll();

  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > 350) {
        setIsVisible(true);
      } else {
        setIsVisible(false);
      }
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const handleClick = () => {
    scrollTo(0, { duration: 1.2 });
  };

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.button
          type="button"
          onClick={handleClick}
          initial={{ opacity: 0, scale: 0.6, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.6, y: 20 }}
          whileHover={{ scale: 1.1, y: -3 }}
          whileTap={{ scale: 0.92 }}
          transition={{ type: "spring", stiffness: 350, damping: 22 }}
          className="fixed bottom-24 lg:bottom-8 right-5 sm:right-8 z-40 w-12 h-12 rounded-2xl bg-gradient-to-tr from-blue-700 via-blue-600 to-indigo-600 text-white flex items-center justify-center shadow-xl shadow-blue-600/30 border border-white/20 backdrop-blur-xs cursor-pointer group focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-400 focus-visible:ring-offset-2"
          aria-label="Scroll to top"
          title="Back to top"
        >
          {/* Subtle pulse ring on hover */}
          <span className="absolute inset-0 rounded-2xl bg-blue-400/20 group-hover:scale-125 group-hover:opacity-0 transition-all duration-500 pointer-events-none" />

          {/* Upward arrow icon with micro bounce on hover */}
          <ArrowUp className="w-5 h-5 group-hover:-translate-y-1 transition-transform duration-200" aria-hidden="true" />
        </motion.button>
      )}
    </AnimatePresence>
  );
}
