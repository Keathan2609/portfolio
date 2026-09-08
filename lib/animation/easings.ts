/**
 * Named motion vocabulary.
 *
 * Components reference these rather than inventing eases and durations, so
 * the whole site shares one sense of weight. Mirrors the CSS custom
 * properties in lib/styles/tokens.css — keep the two in step.
 */

export const EASE = {
  /** House curve: fast commit, long settle. */
  out: "expo.out",
  outSoft: "power3.out",
  inOut: "power4.inOut",
  /** For scrubbed timelines — linear, because scroll provides the easing. */
  none: "none",
} as const;

export const DURATION = {
  instant: 0.12,
  fast: 0.24,
  base: 0.44,
  slow: 0.8,
  slower: 1.2,
  cinematic: 2,
} as const;

export const STAGGER = {
  tight: 0.03,
  line: 0.07,
  block: 0.12,
} as const;

/** Scrub value used for every scroll-linked timeline. Numeric, never `true` —
 *  the ~1s catch-up is what makes scrubbed motion feel expensive. */
export const SCRUB = 1;
