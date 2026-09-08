"use client";

import { useEffect, useState } from "react";

/**
 * Tracks which journey stage currently occupies the viewport.
 *
 * Uses IntersectionObserver rather than a ScrollTrigger per stage: this is
 * one of the few things that genuinely needs to cause a React render (the
 * navigation's aria-current), and an observer with a mid-viewport band is
 * both cheaper and less prone to drifting when the document height changes.
 */
export function useActiveStage(stageIds: string[]): string | null {
  const [active, setActive] = useState<string | null>(stageIds[0] ?? null);

  useEffect(() => {
    if (typeof IntersectionObserver === "undefined") return;

    const elements = stageIds
      .map((id) => document.getElementById(id))
      .filter((el): el is HTMLElement => el !== null);

    if (elements.length === 0) return;

    // A narrow band across the middle of the viewport. Whichever stage
    // crosses it is "current" — avoids two stages both claiming the title
    // during a long transition.
    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((e) => e.isIntersecting)
          .sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0];
        if (visible) setActive(visible.target.id);
      },
      { rootMargin: "-45% 0px -45% 0px", threshold: 0 },
    );

    elements.forEach((el) => observer.observe(el));
    return () => observer.disconnect();
  }, [stageIds]);

  return active;
}
