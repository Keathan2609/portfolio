/**
 * Scroll state as a plain mutable module singleton.
 *
 * Deliberately NOT React state. WebGL reads this every frame inside
 * useFrame; routing it through a hook would trigger a React render per
 * frame, which is the single most expensive mistake available in an R3F
 * scene. Components that genuinely need to re-render on scroll should use
 * a ScrollTrigger callback instead.
 */
export interface ScrollState {
  /** Smoothed scroll position in pixels — Lenis's animated value. */
  scroll: number;
  /** Pixels per frame; signed. Useful for velocity-driven shader uniforms. */
  velocity: number;
  /** 0–1 through the whole document. */
  progress: number;
  /** 1 down, -1 up, 0 at rest. */
  direction: 1 | -1 | 0;
  /** Maximum scrollable distance in pixels. */
  limit: number;
  /** Whether the document is currently being scrolled. */
  isScrolling: boolean;
}

export const scrollState: ScrollState = {
  scroll: 0,
  velocity: 0,
  progress: 0,
  direction: 0,
  limit: 0,
  isScrolling: false,
};

/** Normalised velocity, clamped — safe to feed straight into a uniform. */
export function normalisedVelocity(max = 60): number {
  return Math.max(-1, Math.min(1, scrollState.velocity / max));
}
