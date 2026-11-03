"use client";

import { useState, useEffect } from "react";
import { useReducedMotion as useMotionReducedMotion } from "motion/react";

/**
 * SSR-safe wrapper around motion/react's `useReducedMotion`.
 *
 * `useReducedMotion()` from motion/react returns `null` on the server (SSR),
 * but resolves synchronously to `true` on client hydration if the user's
 * operating system or browser has reduced motion enabled. This mismatch
 * causes React hydration errors due to differing inline styles (`opacity`,
 * `transform`) and interactive attributes (`tabIndex`).
 *
 * This hook guarantees that during SSR and the initial client hydration render
 * it returns `false`, then updates to the user's actual preference after mount.
 */
export function useSafeReducedMotion(): boolean {
  const prefersReduced = useMotionReducedMotion();
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  return isMounted ? Boolean(prefersReduced) : false;
}

export { useSafeReducedMotion as useReducedMotion };

