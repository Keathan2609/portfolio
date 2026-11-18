/**
 * Where the hero's name is, so the background can gather around it.
 *
 * Same pattern, and the same reason, as scroll-state.ts and stage-progress.ts:
 * the environment reads this every frame inside useFrame, so it is a plain
 * mutable singleton rather than React state. A hook here would re-render the
 * whole canvas once a frame.
 *
 * WHY DOCUMENT SPACE AND NOT A RECT PER FRAME. The obvious implementation is
 * `getBoundingClientRect()` inside the frame loop, and it is wrong twice over:
 * it is a layout read on the hot path, and this page drives scrolling through
 * Lenis, which writes a transform every frame — so the read would land after a
 * style write and force a synchronous reflow on most frames.
 *
 * The name's position in the DOCUMENT only changes when the layout does. So it
 * is measured on mount and on resize, and its position in the VIEWPORT is
 * derived each frame by subtracting the scroll offset the environment already
 * has. No layout read, no allocation, and correct at every scroll position —
 * which a fixed uv anchor is not, because a full-height hero scrolls the name
 * through the frame rather than holding it still.
 */

export interface HeroAnchor {
  /** Centre of the name in document space, in pixels from the document top. */
  docY: number;
  /** Centre of the name as a fraction of viewport width. */
  x: number;
  /** Half-width of the cloud, in viewport fractions. */
  radiusX: number;
  /** Half-height of the cloud ABOVE the name, in viewport fractions. */
  radiusY: number;
  /**
   * Half-height of the GLYPHS themselves, in viewport fractions.
   *
   * Distinct from radiusY, and needed because the cloud has to thin out
   * across the band the letters occupy. White display type on a brightening
   * field loses its edges: measured at 2.31:1 before that term existed,
   * under the 3:1 WCAG floor for large text.
   */
  textHalf: number;
  /** False until a real element has been measured. */
  measured: boolean;
}

export const heroAnchor: HeroAnchor = {
  docY: 0,
  x: 0.5,
  radiusX: 0.5,
  radiusY: 0.24,
  textHalf: 0.06,
  measured: false,
};

const clamp = (v: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, v));

/**
 * Measure the name. Safe to call on every resize; cheap, and never called
 * from inside the frame loop.
 *
 * The radii are derived from the type rather than fixed, so the cloud stays
 * in proportion to the name at every breakpoint instead of swamping it on a
 * phone and getting lost on a wide display. The clamps are there because the
 * name wraps to two lines on narrow viewports, which triples its height and
 * would otherwise triple the cloud with it.
 */
export function measureHeroAnchor(el: HTMLElement | null): void {
  if (!el) return;

  const rect = el.getBoundingClientRect();
  const vw = Math.max(window.innerWidth, 1);
  const vh = Math.max(window.innerHeight, 1);

  // `scrollY` rather than Lenis's smoothed value: this is a one-off layout
  // measurement, so it wants the real position, not the animated one.
  heroAnchor.docY = rect.top + window.scrollY + rect.height / 2;
  heroAnchor.x = (rect.left + rect.width / 2) / vw;
  heroAnchor.radiusX = clamp((rect.width / vw) * 0.72, 0.30, 0.64);
  heroAnchor.radiusY = clamp((rect.height / vh) * 2.3, 0.17, 0.30);
  heroAnchor.textHalf = clamp(rect.height / vh / 2, 0.03, 0.14);
  heroAnchor.measured = true;
}
