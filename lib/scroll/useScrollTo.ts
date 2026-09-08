"use client";

import { useCallback } from "react";
import { useLenis } from "lenis/react";
import { useReducedMotion } from "@/lib/animation/MotionProvider";

/**
 * Programmatic scrolling that stays honest about motion preference.
 *
 * Used by the navigation rail and the skip link. When motion is reduced the
 * scroll is immediate — an animated 12-second glide to the footer is exactly
 * what a visitor asking for less motion does not want.
 */
export function useScrollTo() {
  const lenis = useLenis();
  const reduced = useReducedMotion();

  return useCallback(
    (target: string | HTMLElement, offset = 0) => {
      if (!lenis) {
        // Lenis not ready (or excluded): fall back to the platform.
        const el =
          typeof target === "string" ? document.querySelector(target) : target;
        el?.scrollIntoView({ behavior: reduced ? "auto" : "smooth" });
        return;
      }

      lenis.scrollTo(target, {
        offset,
        duration: reduced ? 0 : 1.4,
        immediate: reduced,
        lock: true,
      });
    },
    [lenis, reduced],
  );
}

/**
 * Moves focus to a target as well as scrolling to it.
 *
 * Scrolling alone leaves keyboard focus behind, which is the most common
 * accessibility failure in scroll-driven sites: the visitor tabs onward and
 * lands somewhere off-screen with no idea where they are.
 */
export function useScrollToWithFocus() {
  const scrollTo = useScrollTo();

  return useCallback(
    (selector: string) => {
      const el = document.querySelector<HTMLElement>(selector);
      if (!el) return;

      scrollTo(el);

      // Make the landing target programmatically focusable without adding it
      // to the tab order, then hand focus over.
      if (!el.hasAttribute("tabindex")) el.setAttribute("tabindex", "-1");
      el.focus({ preventScroll: true });
    },
    [scrollTo],
  );
}
