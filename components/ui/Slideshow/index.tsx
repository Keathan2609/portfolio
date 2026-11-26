"use client";

import { useCallback, useEffect, useId, useRef, useState } from "react";
import type { MediaAsset } from "@/lib/data/types";
import { Media } from "@/components/ui/Media";
import { gsap } from "@/lib/animation/register";
import { DURATION, EASE } from "@/lib/animation/easings";
import { useReducedMotion } from "@/lib/animation/MotionProvider";
import { cn } from "@/lib/utils/cn";
import styles from "./slideshow.module.css";

/**
 * The project slideshow.
 *
 * WHY SCROLL-SNAP RATHER THAN A TRANSFORM TRACK
 *
 * The track is a real horizontally scrolling element with CSS scroll-snap,
 * and the current slide is DERIVED from its scroll position rather than
 * held in state and imposed on it. That ordering is the whole design:
 *
 *   - swipe, trackpad and shift-wheel work because they are native scroll,
 *     with the platform's own momentum and rubber-banding. A transform
 *     track has to reimplement all of it and never quite matches.
 *   - the buttons and dots are not a second source of truth. They call
 *     scrollTo and then say nothing; the scroll handler notices and updates
 *     the index. So the index cannot disagree with what is on screen, which
 *     is the failure every index-driven carousel eventually has.
 *   - with JavaScript broken the slides are still all there, still
 *     scrollable, still readable. Nothing is hidden behind a transform.
 *
 * ONE VIDEO AT A TIME comes out of this for free. `Media` starts a clip only
 * while it is in view and pauses it otherwise, and one slide fills the
 * track, so the slides either side are off-viewport and already paused. No
 * extra coordination, and it stays true if the slide count changes.
 *
 * A single asset renders as a plain figure: no arrows, no dots, no
 * thumbnails, no counter. Controls for a carousel of one are furniture.
 */

interface SlideshowProps {
  assets: MediaAsset[];
  /** Names the carousel for assistive tech, e.g. the project title. */
  label: string;
  /** Aspect ratio for the frame. Each asset's own `ratio` still wins. */
  ratio?: string;
  sizes?: string;
  priority?: boolean;
  placeholderLabel?: string;
  className?: string;
}

export function Slideshow({
  assets,
  label,
  ratio = "16 / 9",
  sizes = "(max-width: 72rem) 100vw, 72rem",
  priority = false,
  placeholderLabel = "Visual pending",
  className,
}: SlideshowProps) {
  const track = useRef<HTMLUListElement>(null);
  // Held so a second click interrupts the first move rather than queueing
  // behind it, and so unmounting mid-tween cannot leave snapping disabled.
  const tween = useRef<gsap.core.Tween | null>(null);
  const [index, setIndex] = useState(0);
  const reduced = useReducedMotion();
  const baseId = useId();

  const count = assets.length;
  const many = count > 1;

  /* Derived from scroll, never imposed on it. rAF-coalesced because a
     snap-scroll fires many events per gesture and we only need the one
     that lands. */
  useEffect(() => {
    const node = track.current;
    if (!node || !many) return;

    let frame = 0;
    const measure = () => {
      frame = 0;
      const slides = node.children;
      if (slides.length === 0) return;
      // Nearest slide to the track's left edge, in the track's own
      // coordinate space so padding and gaps cost nothing to account for.
      const left = node.scrollLeft;
      let nearest = 0;
      let best = Infinity;
      for (let i = 0; i < slides.length; i += 1) {
        const el = slides[i] as HTMLElement;
        const d = Math.abs(el.offsetLeft - left);
        if (d < best) {
          best = d;
          nearest = i;
        }
      }
      setIndex(nearest);
    };

    const onScroll = () => {
      if (frame) return;
      frame = requestAnimationFrame(measure);
    };

    measure();
    node.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      node.removeEventListener("scroll", onScroll);
      if (frame) cancelAnimationFrame(frame);
      // Unmounting mid-move must not leave the element with snapping off.
      tween.current?.kill();
      node.style.scrollSnapType = "";
    };
  }, [many, count]);

  /**
   * Move to a slide.
   *
   * WHY THIS IS NOT `scrollTo({ behavior: "smooth" })`.
   *
   * It was, and it silently did nothing. With `scroll-snap-type: x
   * mandatory` Chromium re-snaps the container to its current snap target
   * the moment a programmatic smooth scroll begins, so the scroll is
   * cancelled before it travels: scrollLeft stayed at 0 while the identical
   * call with `behavior: "auto"` moved it correctly. The arrows, dots and
   * thumbnails were all dead on arrival and the counter never left 01.
   *
   * So snapping is switched off for the duration of the move and restored
   * at the end. Gestures — swipe, trackpad, shift-wheel — still snap,
   * because they never go through here.
   *
   * The tween is GSAP rather than a hand-rolled rAF loop for the reason
   * everything else on this site is: there is exactly one clock, and a
   * second one drifting against it is what the whole scroll architecture
   * exists to avoid. It also gets the house easing for free.
   */
  const goTo = useCallback(
    (next: number) => {
      const node = track.current;
      if (!node) return;
      const clamped = Math.max(0, Math.min(next, count - 1));
      const el = node.children[clamped] as HTMLElement | undefined;
      if (!el) return;

      tween.current?.kill();

      if (reduced) {
        node.scrollLeft = el.offsetLeft;
        setIndex(clamped);
        return;
      }

      node.style.scrollSnapType = "none";

      /* A PROXY OBJECT, not the element.
         `gsap.to(node, { scrollLeft })` does nothing: for a DOM element
         GSAP routes unknown property names through CSSPlugin, which sets
         them as styles, and `scrollLeft` is a DOM property with no CSS
         equivalent — so it wrote `style.scrollLeft` and the element never
         moved. Animating a plain object and assigning the value in
         onUpdate is the dependency-free fix; the alternative is pulling in
         ScrollToPlugin for one tween. */
      const pos = { x: node.scrollLeft };
      tween.current = gsap.to(pos, {
        x: el.offsetLeft,
        duration: DURATION.base,
        ease: EASE.out,
        onUpdate: () => {
          node.scrollLeft = pos.x;
        },
        onComplete: () => {
          node.style.scrollSnapType = "";
          tween.current = null;
        },
      });
    },
    [count, reduced],
  );

  const onKeyDown = useCallback(
    (event: React.KeyboardEvent) => {
      if (!many) return;
      if (event.key === "ArrowRight") {
        event.preventDefault();
        goTo(index + 1);
      } else if (event.key === "ArrowLeft") {
        event.preventDefault();
        goTo(index - 1);
      } else if (event.key === "Home") {
        event.preventDefault();
        goTo(0);
      } else if (event.key === "End") {
        event.preventDefault();
        goTo(count - 1);
      }
    },
    [many, index, goTo, count],
  );

  if (count === 0) return null;

  const current = assets[index];

  /* One asset: a figure, not a carousel. */
  if (!many) {
    const only = assets[0];
    return (
      <figure className={cn(styles.solo, className)}>
        <Media
          asset={only}
          ratio={only.ratio ?? ratio}
          sizes={sizes}
          priority={priority}
          placeholderLabel={placeholderLabel}
        />
        {only.caption && (
          <figcaption className={styles.caption}>{only.caption}</figcaption>
        )}
      </figure>
    );
  }

  return (
    <div
      className={cn(styles.root, className)}
      role="group"
      aria-roledescription="carousel"
      aria-label={`${label} — media`}
      onKeyDown={onKeyDown}
    >
      <div className={styles.stage}>
        <ul className={styles.track} ref={track} tabIndex={-1}>
          {assets.map((asset, i) => (
            <li
              key={asset.src || i}
              className={styles.slide}
              role="group"
              aria-roledescription="slide"
              aria-label={`${i + 1} of ${count}`}
              /* Off-screen slides are not hidden from assistive tech: they
                 are real content a screen-reader user may read straight
                 through, and inert slides would make the arrows the only
                 way to reach them. */
            >
              <Media
                asset={asset}
                ratio={asset.ratio ?? ratio}
                sizes={sizes}
                priority={priority && i === 0}
                placeholderLabel={placeholderLabel}
              />
            </li>
          ))}
        </ul>

        <button
          type="button"
          className={cn(styles.arrow, styles.prev)}
          onClick={() => goTo(index - 1)}
          disabled={index === 0}
          aria-label="Previous slide"
        >
          <span aria-hidden="true">←</span>
        </button>

        <button
          type="button"
          className={cn(styles.arrow, styles.next)}
          onClick={() => goTo(index + 1)}
          disabled={index === count - 1}
          aria-label="Next slide"
        >
          <span aria-hidden="true">→</span>
        </button>
      </div>

      <div className={styles.bar}>
        {/* The slide labels already announce "3 of 9"; this is the visible
            echo of that and would otherwise be read twice. */}
        <p className={styles.counter} aria-hidden="true">
          {String(index + 1).padStart(2, "0")}
          <span className={styles.counterSlash}> / </span>
          {String(count).padStart(2, "0")}
        </p>

        <ul className={styles.dots}>
          {assets.map((asset, i) => (
            <li key={asset.src || i}>
              <button
                type="button"
                className={cn(styles.dot, i === index && styles.dotOn)}
                onClick={() => goTo(i)}
                aria-label={`Go to slide ${i + 1}`}
                aria-current={i === index ? "true" : undefined}
              />
            </li>
          ))}
        </ul>
      </div>

      {/* Polite, not assertive: the caption is context for a slide the
          visitor just chose, not an interruption. */}
      <p className={styles.caption} aria-live="polite" id={`${baseId}-caption`}>
        {current?.caption ?? ""}
      </p>

      <ul className={styles.thumbs}>
        {assets.map((asset, i) => (
          <li key={asset.src || i}>
            <button
              type="button"
              className={cn(styles.thumb, i === index && styles.thumbOn)}
              onClick={() => goTo(i)}
              aria-label={`Go to slide ${i + 1}`}
              aria-current={i === index ? "true" : undefined}
            >
              <Media
                asset={
                  asset.kind === "video"
                    ? {
                        kind: "image",
                        src: asset.poster ?? "",
                        alt: asset.alt,
                        ratio: "16 / 9",
                      }
                    : { ...asset, ratio: "16 / 9" }
                }
                ratio="16 / 9"
                sizes="8rem"
                placeholderLabel=""
                /* The button is already named "Go to slide 3"; describing
                   the picture again announces the same image twice. A
                   video shows its poster here — a grid of autoplaying
                   clips is the thing one-video-at-a-time prevents. */
                decorative
              />
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}
