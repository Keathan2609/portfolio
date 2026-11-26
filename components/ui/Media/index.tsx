"use client";

import { useEffect, useRef } from "react";
import Image from "next/image";
import type { MediaAsset } from "@/lib/data/types";
import { useQuality } from "@/lib/performance/QualityProvider";
import { useReducedMotion } from "@/lib/animation/MotionProvider";
import { prefersLightPayload } from "@/lib/performance/quality";
import { useInView } from "@/lib/hooks/useInView";
import { cn } from "@/lib/utils/cn";
import styles from "./media.module.css";

/**
 * The media system.
 *
 * One component handles every visual slot on the site, so replacing
 * placeholder assets with final generated imagery is a data edit — set
 * `src`, drop `pending` — and nothing in any section changes.
 *
 * Behaviour it guarantees:
 *  - Images go through next/image, so AVIF/WebP, responsive `sizes` and
 *    lazy loading are automatic.
 *  - Video never autoplays off-screen; it starts only when in view and
 *    pauses when the tab is hidden.
 *
 * THE VIDEO CONTRACT, in one place so a clip can be dropped into the data
 * later without anyone re-deriving it. A `kind: "video"` asset is always
 * muted, looped, `playsInline`, and carries a poster — and the poster is what
 * ships instead of the clip whenever ANY of the following is true:
 *
 *    reduced motion   the visitor asked for less movement, and a looping
 *                     clip is movement they did not ask for. Checked
 *                     explicitly rather than relying on the tier cap, so the
 *                     guarantee survives someone re-tuning the tiers.
 *    LOW / NONE tier   the device cannot afford a decode alongside WebGL.
 *    Save-Data / 2G    the connection asked for fewer bytes.
 *    off-screen        nothing decodes until it is in view.
 *    hidden tab        playback pauses.
 *
 * The frame reserves its aspect ratio in every one of those cases, so
 * swapping between poster and clip can never move the page.
 *  - A missing asset renders a composed placeholder rather than a broken
 *    frame — deliberately marked, never passed off as real work.
 */

interface MediaProps {
  asset: MediaAsset;
  /** Passed to next/image. Always give a real value for above-fold media. */
  sizes?: string;
  /** Aspect ratio as a CSS value, e.g. "16 / 9". */
  ratio?: string;
  priority?: boolean;
  className?: string;
  /** Shown inside the placeholder frame so the slot is self-describing. */
  placeholderLabel?: string;
  /**
   * This instance is genuinely decorative: render with an empty alt and do
   * NOT warn about it.
   *
   * The warning below exists because a placeholder's `alt: ""` would
   * otherwise survive into a real image. That is the right default, but it
   * cannot see the case where the same asset is deliberately presented
   * twice — a slideshow thumbnail beside the slide it jumps to. The
   * thumbnail's button already carries "Go to slide 3"; describing the
   * picture again would announce the same image twice and make the control
   * harder to use, not easier. Set this only when something else in the DOM
   * already names the image.
   */
  decorative?: boolean;
}

export function Media({
  asset,
  sizes = "(max-width: 48rem) 100vw, 50vw",
  ratio = "16 / 10",
  priority = false,
  className,
  placeholderLabel = "Visual pending",
  decorative = false,
}: MediaProps) {
  const { video: tierAllowsVideo } = useQuality();
  const reduced = useReducedMotion();
  const { ref, inView } = useInView<HTMLDivElement>({ rootMargin: "15% 0px" });
  const videoRef = useRef<HTMLVideoElement>(null);

  // Resolved once, here, so the render below and the effect that drives
  // playback can never disagree about whether this asset is a clip or a still.
  const videoAllowed =
    tierAllowsVideo && !reduced && !prefersLightPayload();

  // Play only while visible, and never while the tab is in the background.
  useEffect(() => {
    const node = videoRef.current;
    if (!node) return;

    if (inView && videoAllowed && document.visibilityState === "visible") {
      void node.play().catch(() => {
        /* Autoplay refused — the poster frame is the fallback. */
      });
    } else {
      node.pause();
    }

    const onVisibility = () => {
      if (document.visibilityState === "hidden") node.pause();
      else if (inView && videoAllowed) void node.play().catch(() => {});
    };

    document.addEventListener("visibilitychange", onVisibility);
    return () => document.removeEventListener("visibilitychange", onVisibility);
  }, [inView, videoAllowed]);

  const style = { aspectRatio: asset.ratio ?? ratio } as React.CSSProperties;

  /**
   * Every placeholder in the data layer carries `alt: ""`, which is right
   * while it renders the pending frame. The moment a real `src` is dropped
   * in — the documented workflow — that empty alt would ship a meaningful
   * image as decorative. Fail loudly in development instead.
   */
  if (
    process.env.NODE_ENV !== "production" &&
    asset.src &&
    asset.kind !== "model" &&
    !asset.alt &&
    !decorative
  ) {
    console.warn(
      `[Media] "${asset.src}" has a src but an empty alt. Describe it in ` +
        `lib/data, or keep the empty string only if it is genuinely decorative.`,
    );
  }

  // A 3D visual whose scene has not been registered yet renders the same
  // composed frame as a pending asset rather than a broken canvas. The data
  // shape is ready; the loader arrives with the first real model.
  if (asset.kind === "model") {
    return (
      <div
        ref={ref}
        className={cn(styles.frame, styles.placeholder, className)}
        style={style}
      >
        <span className={styles.grid} aria-hidden="true" />
        <span className={styles.placeholderLabel}>3D visual pending</span>
      </div>
    );
  }

  if (asset.pending || !asset.src) {
    return (
      <div
        ref={ref}
        className={cn(styles.frame, styles.placeholder, className)}
        style={style}
      >
        <span className={styles.grid} aria-hidden="true" />
        <span className={styles.placeholderLabel}>{placeholderLabel}</span>
      </div>
    );
  }

  if (asset.kind === "video") {
    // No <source> at all when video is withheld: the element then renders its
    // poster and downloads nothing. Removing the source is the mechanism —
    // `preload` alone would still fetch metadata.
    const src = !videoAllowed ? undefined : (asset.srcLow ?? asset.src);

    return (
      <div ref={ref} className={cn(styles.frame, className)} style={style}>
        <video
          ref={videoRef}
          className={styles.media}
          poster={asset.poster}
          muted
          loop
          playsInline
          preload="metadata"
          aria-label={asset.alt || undefined}
          aria-hidden={asset.alt ? undefined : true}
        >
          {src && <source src={src} />}
        </video>
      </div>
    );
  }

  return (
    <div ref={ref} className={cn(styles.frame, className)} style={style}>
      <Image
        className={styles.media}
        src={asset.src}
        alt={decorative ? "" : asset.alt}
        fill
        sizes={sizes}
        quality={82}
        priority={priority}
        loading={priority ? undefined : "lazy"}
      />
    </div>
  );
}
