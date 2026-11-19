/**
 * Where the hero's name is, so the cloud can sit behind it.
 *
 * Same pattern, and the same reason, as scroll-state.ts and stage-progress.ts:
 * the scene reads this every frame inside useFrame, so it is a plain mutable
 * singleton rather than React state. A hook here would re-render the whole
 * canvas once a frame.
 *
 * WHY DOCUMENT SPACE AND NOT A RECT PER FRAME. The obvious implementation is
 * `getBoundingClientRect()` inside the frame loop, and it is wrong twice over:
 * it is a layout read on the hot path, and this page scrolls through Lenis,
 * which writes a transform every frame — so the read would land after a style
 * write and force a synchronous reflow on most frames.
 *
 * The name's position in the DOCUMENT only changes when the layout does. So it
 * is measured on mount and on resize, and its position in the VIEWPORT is
 * derived each frame by subtracting the scroll offset the scene already has.
 * No layout read, no allocation, and correct at every scroll position — which
 * a fixed offset is not, because a full-height hero scrolls the name through
 * the frame rather than holding it still.
 */

export interface HeroAnchor {
  /** Centre of the name in document space, in pixels from the document top. */
  docY: number;
  /** Centre of the name as a fraction of viewport width. */
  x: number;
  /**
   * Width of the name as a fraction of viewport width.
   *
   * The mass stretches to this rather than to a constant, which is what
   * lets the two-line wrap on narrow viewports work without a breakpoint:
   * a narrower name simply asks for less stretch.
   */
  widthFrac: number;
  /** False until a real element has been measured. */
  measured: boolean;
}

export const heroAnchor: HeroAnchor = {
  docY: 0,
  x: 0.5,
  widthFrac: 0.6,
  measured: false,
};

/**
 * Measure the name. Cheap, and never called from inside the frame loop.
 */
export function measureHeroAnchor(el: HTMLElement | null): void {
  if (!el) return;

  const rect = el.getBoundingClientRect();
  const vw = Math.max(window.innerWidth, 1);

  // `scrollY` rather than Lenis's smoothed value: this is a one-off layout
  // measurement, so it wants the real position, not the animated one.
  heroAnchor.docY = rect.top + window.scrollY + rect.height / 2;
  heroAnchor.x = (rect.left + rect.width / 2) / vw;
  heroAnchor.widthFrac = rect.width / vw;
  heroAnchor.measured = true;
}
