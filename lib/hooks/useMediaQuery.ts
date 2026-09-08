"use client";

import { useSyncExternalStore } from "react";

/**
 * SSR-safe media query hook.
 *
 * useSyncExternalStore is used rather than useEffect + setState so the value
 * is correct on the very first client render, avoiding a flash of the wrong
 * layout on hydration.
 */
export function useMediaQuery(query: string): boolean {
  const subscribe = (onChange: () => void) => {
    const mql = window.matchMedia(query);
    mql.addEventListener("change", onChange);
    return () => mql.removeEventListener("change", onChange);
  };

  return useSyncExternalStore(
    subscribe,
    () => window.matchMedia(query).matches,
    // Server snapshot: assume the desktop, full-motion baseline.
    () => false,
  );
}

/* Breakpoints mirror the CSS layer. Desktop is the primary experience. */
export const useIsMobile = () => useMediaQuery("(max-width: 47.9375rem)");
export const useIsTablet = () =>
  useMediaQuery("(min-width: 48rem) and (max-width: 63.9375rem)");
export const useIsDesktop = () => useMediaQuery("(min-width: 64rem)");

/** True for touch-primary devices — gates hover-only affordances and the cursor. */
export const useIsCoarsePointer = () => useMediaQuery("(pointer: coarse)");

/** Raw OS preference. Prefer `useMotion()` which layers the in-page override. */
export const useSystemReducedMotion = () =>
  useMediaQuery("(prefers-reduced-motion: reduce)");
