"use client";

import { useEffect, useRef } from "react";
import { usePathname } from "next/navigation";
import { useLenis } from "lenis/react";
import { ScrollTrigger } from "@/lib/animation/register";
import { takeReturn } from "@/lib/scroll/return-anchor";

/**
 * SCROLL, ACROSS A ROUTE CHANGE.
 *
 * Mounted once in the shell, beside the canvas and the header, because it
 * has to outlive every page the way they do.
 *
 * Lenis is created by ScrollProvider at the root and never torn down, so it
 * carries its scroll position from one route to the next. That is what makes
 * the canvas continuous, and it is also what makes this component necessary:
 * without it, opening a project from halfway down the homepage opens the
 * project page halfway down as well, because as far as Lenis is concerned
 * nothing happened.
 *
 * Three things have to happen on every navigation, in this order:
 *
 *   1. ScrollTrigger.refresh(). The new document is a different height, and
 *      every trigger on it was created against measurements taken before it
 *      existed. The homepage's pinned horizontal rail is the one that shows
 *      this most clearly: its `end` is a function of its own track width,
 *      and it must be re-measured before anything is scrolled.
 *
 *   2. Position. Either the top, or the anchor recorded on the way out.
 *
 *   3. Both with `immediate: true`. An animated scroll on arrival is not a
 *      transition, it is the page visibly travelling to where it should
 *      have started, and it fights the entrance fade.
 *
 * Deliberately NOT doing anything about Next's own scroll restoration: it
 * writes window.scrollY, Lenis overwrites it on the next tick from the
 * values set here, and the last write wins. Trying to suppress it as well
 * would be a second mechanism for the same job.
 */
export function RouteScroll() {
  const pathname = usePathname();
  const lenis = useLenis();
  // The first pathname a tab sees is its initial load. Honouring an anchor
  // there would hijack someone who typed the homepage URL deliberately.
  const isFirstPath = useRef(true);

  useEffect(() => {
    if (!lenis) return;

    if (isFirstPath.current) {
      isFirstPath.current = false;
      return;
    }

    /* THE ANCHOR IS READ ONCE, AND APPLIED SEVERAL TIMES.
       `takeReturn` clears as it reads, so it cannot be called inside the
       re-apply below without the second call finding nothing. */
    const anchor = pathname === "/" ? takeReturn() : null;

    /* FOLLOW THE TARGET UNTIL IT STOPS MOVING.
     *
     * This component lives in the shell, ABOVE the page in the tree, so its
     * effect runs BEFORE the effects of the sections being mounted. On the
     * way back to the homepage that ordering defeats any single scroll: the
     * discipline rails create their pinned ScrollTriggers in their own
     * effects, and `pinSpacing` then inserts a spacer that pushes
     * everything below it further down the document. Scroll first and the
     * spacers appear afterwards, leaving you short by exactly the height of
     * the pins above the target — measured here as 2014px against a target
     * that ends up at 3356px, the rail's own 1342px spacer.
     *
     * Waiting a fixed number of frames does not fix it either, and neither
     * does re-applying on ScrollTrigger's `refresh` event: both are races
     * against work whose timing depends on how many images decoded this
     * frame. So instead of guessing when the layout is settled, this
     * measures. Each frame it recomputes where the target now is and pins
     * the scroll there; when that number stops changing the layout has
     * settled and the loop stops.
     *
     * Every write is `immediate`, so this is not an animation the visitor
     * can see — it is the same position being re-asserted against a
     * document that is still growing underneath it.
     */
    const targetY = () => {
      const el = anchor ? document.getElementById(anchor.section) : null;
      if (!el) return 0;
      return el.getBoundingClientRect().top + lenis.scroll;
    };

    let raf = 0;
    let lastY = Number.NaN;
    let lastHeight = Number.NaN;
    let stableFrames = 0;
    const started = performance.now();
    // Enough to cover fonts and the pins; short enough that a visitor who
    // immediately scrolls is not fought with for long.
    const deadline = started + 1200;

    const step = () => {
      const y = Math.round(targetY());
      const height = document.documentElement.scrollHeight;

      lenis.scrollTo(y, { immediate: true, force: true });

      /* BOTH, not just the target position.
         Watching the target alone stops too early, and stops at exactly
         the wrong moment: once the scroll lands, `rect.top + scroll`
         returns the same number every frame and the loop reads as settled
         — while the pin spacers that will move the target have not been
         inserted yet. The document height is the signal that the layout
         itself is still changing. The minimum duration covers the case
         where both happen to be briefly stable before the pins arrive. */
      stableFrames = y === lastY && height === lastHeight ? stableFrames + 1 : 0;
      lastY = y;
      lastHeight = height;

      const settled = stableFrames >= 3 && performance.now() - started > 350;
      if (settled || performance.now() > deadline) {
        raf = 0;
        return;
      }
      raf = requestAnimationFrame(step);
    };

    // One refresh up front so any trigger that already exists is measured
    // against the new document rather than the one it was created on.
    ScrollTrigger.refresh();
    raf = requestAnimationFrame(step);

    return () => {
      if (raf) cancelAnimationFrame(raf);
    };
  }, [pathname, lenis]);

  return null;
}
