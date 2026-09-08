"use client";

import { useEffect, useMemo } from "react";
import { ReactLenis, useLenis } from "lenis/react";
import type { LenisOptions } from "lenis";
import { gsap, ScrollTrigger } from "@/lib/animation/register";
import { runFrame } from "@/lib/animation/frame";
import { useReducedMotion } from "@/lib/animation/MotionProvider";
import { scrollState } from "./scroll-state";

/**
 * THE SINGLE ANIMATION CLOCK
 * ==========================
 *
 * Lenis, GSAP and R3F each want to own a requestAnimationFrame loop. Left
 * independent they drift by up to a frame, which reads as jitter on anything
 * WebGL tracks to a DOM element. So exactly one RAF exists — GSAP's ticker —
 * and everything else subscribes to it, in this order:
 *
 *   gsap.ticker
 *     |
 *     +-> lenis.raf(t)               animate the real window.scrollY
 *     |     |
 *     |     +-> lenis 'scroll' event (fires synchronously inside raf)
 *     |           |
 *     |           +-> scrollState    module singleton, read by useFrame
 *     |           +-> ScrollTrigger.update()
 *     |
 *     +-> runFrame(t, dt)            frame bus -> R3F advance()
 *
 * Because the scroll position is fully resolved before runFrame executes,
 * the WebGL layer renders against exactly the scroll value the DOM is laid
 * out with. That is the whole trick.
 */

/**
  * Extracted so the reduced-motion variant can restore the exact value.
  *
  * 0.1 rather than the original 0.085: the lower value read as weighty at
  * the top of a section but turned into noticeable drag over a 27,000px
  * document, where every flick carried a long tail. This keeps the weight
  * and drops the float.
  */
const BASE_LERP = 0.1;

const BASE_OPTIONS: LenisOptions = {
  // We drive the loop ourselves — this MUST be false.
  autoRaf: false,
  // A low lerp gives the weighty, controlled, premium feel; higher values
  // feel twitchy and lower values feel laggy rather than heavy.
  lerp: BASE_LERP,
  smoothWheel: true,
  wheelMultiplier: 1,
  // Native touch scrolling is left alone on purpose. syncTouch feels wrong
  // on iOS and fights the platform's own rubber-banding.
  syncTouch: false,
  touchMultiplier: 1.6,
  orientation: "vertical",
  gestureOrientation: "vertical",
  // Let Lenis own in-page hash links so anchors animate rather than jump.
  anchors: true,
  overscroll: true,
};

/**
 * Drives the clock.
 *
 * This lives as a CHILD of <ReactLenis> rather than inside ScrollProvider
 * itself, and that placement is load-bearing: ReactLenis creates its Lenis
 * instance in an effect and publishes it via a state update, so a parent
 * reading the ref on mount would find it undefined and the clock would never
 * start. Consuming it through useLenis() means this effect re-runs the
 * moment the instance exists — and again whenever it is recreated.
 */
function Clock() {
  const lenis = useLenis();

  useEffect(() => {
    if (!lenis) return;

    const handleScroll = () => {
      scrollState.scroll = lenis.scroll;
      scrollState.velocity = lenis.velocity;
      scrollState.progress = lenis.progress;
      scrollState.direction = lenis.direction;
      scrollState.limit = lenis.limit;
      scrollState.isScrolling = Boolean(lenis.isScrolling);
      ScrollTrigger.update();
    };

    lenis.on("scroll", handleScroll);

    let last = 0;
    const tick = (time: number) => {
      // GSAP's ticker reports seconds; Lenis wants milliseconds.
      const timeMs = time * 1000;
      const deltaMs = last ? timeMs - last : 1000 / 60;
      last = timeMs;

      lenis.raf(timeMs);
      runFrame(timeMs, deltaMs);
    };

    gsap.ticker.add(tick);
    // Required. Without this GSAP clamps large deltas after a tab blur and
    // Lenis and ScrollTrigger silently desynchronise on return.
    gsap.ticker.lagSmoothing(0);

    // ScrollTrigger.normalizeScroll() is deliberately NOT enabled — it takes
    // over the scroll position and fights Lenis for it.

    // The instance may have just been recreated (motion preference changed),
    // which resets scroll metrics that triggers were measured against.
    ScrollTrigger.refresh();

    /**
     * Development-only debug bridge.
     *
     * The whole experience hangs off one hand-wired clock, so being able to
     * inspect it — or step it frame by frame — is worth the four lines.
     * Stripped from production builds by the NODE_ENV check.
     */
    if (process.env.NODE_ENV !== "production") {
      (window as unknown as Record<string, unknown>).__knp = {
        lenis,
        gsap,
        ScrollTrigger,
        scrollState,
        /** Advance the clock manually, in seconds. */
        tick,
      };
    }

    return () => {
      lenis.off("scroll", handleScroll);
      gsap.ticker.remove(tick);
      gsap.ticker.lagSmoothing(500, 33);
    };
  }, [lenis]);

  /**
   * Measurement staleness is the most common ScrollTrigger failure: fonts
   * and media land after triggers are created and silently shift every
   * start/end. Refresh once the web fonts have actually swapped in.
   */
  useEffect(() => {
    let cancelled = false;
    document.fonts?.ready.then(() => {
      if (!cancelled) ScrollTrigger.refresh();
    });

    // Marks the DOM as hydrated. Until this lands, [data-animate] elements
    // are forced visible by CSS so a failed init can never hide content.
    document.documentElement.classList.add("js-ready");

    return () => {
      cancelled = true;
    };
  }, []);

  return null;
}

export function ScrollProvider({ children }: { children: React.ReactNode }) {
  const reducedMotion = useReducedMotion();

  /**
   * Reduced motion is applied by handing ReactLenis different options rather
   * than by mutating the live instance. ReactLenis diffs options by value and
   * rebuilds only the Lenis instance — children are passed straight through,
   * so the whole tree below is NOT torn down when the visitor flips the
   * in-page motion toggle.
   */
  const options = useMemo<LenisOptions>(
    () => ({
      ...BASE_OPTIONS,
      smoothWheel: !reducedMotion,
      lerp: reducedMotion ? 1 : BASE_LERP,
    }),
    [reducedMotion],
  );

  return (
    <ReactLenis root options={options}>
      <Clock />
      {children}
    </ReactLenis>
  );
}
