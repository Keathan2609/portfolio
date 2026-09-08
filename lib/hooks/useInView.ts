"use client";

import { useEffect, useRef, useState } from "react";

interface Options {
  /** Distance outside the viewport that still counts as "in". */
  rootMargin?: string;
  threshold?: number;
  /** Stop observing after the first entry — for one-shot reveals. */
  once?: boolean;
}

/**
 * Viewport observation for gating work.
 *
 * The important use is performance: a discipline world's useFrame should
 * early-return when its section is off-screen. With five worlds on one
 * canvas, ticking all of them at all times is five times the GPU work for
 * one visible result.
 */
export function useInView<T extends HTMLElement = HTMLDivElement>({
  rootMargin = "20% 0px",
  threshold = 0,
  once = false,
}: Options = {}) {
  const ref = useRef<T>(null);
  // Without IntersectionObserver, assume visible rather than hiding content
  // behind a capability check. Resolved in the initialiser rather than an
  // effect so there is no cascading render on mount.
  const [inView, setInView] = useState(
    () => typeof IntersectionObserver === "undefined",
  );

  useEffect(() => {
    const el = ref.current;
    if (!el || typeof IntersectionObserver === "undefined") return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        setInView(entry.isIntersecting);
        if (entry.isIntersecting && once) observer.disconnect();
      },
      { rootMargin, threshold },
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, [rootMargin, threshold, once]);

  return { ref, inView };
}
