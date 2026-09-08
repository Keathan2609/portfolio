"use client";

import dynamic from "next/dynamic";
import type { ReactNode } from "react";
import { useQuality } from "@/lib/performance/QualityProvider";
import { cn } from "@/lib/utils/cn";
import styles from "./webgl-view.module.css";

/**
 * Loaded on demand, never on first paint.
 *
 * `ssr: false` alone was not enough: this module is reached from Stage, so a
 * static drei import here put three.js in the initial client chunk for every
 * visitor — including the ones on the NONE tier who never get a canvas at
 * all. The drei element now lives in its own leaf module and arrives only
 * when a view actually renders.
 */
const ViewPortal = dynamic(
  () => import("./ViewPortal").then((m) => m.ViewPortal),
  { ssr: false, loading: () => null },
);

/**
 * A WebGL region tracked to a DOM element.
 *
 * Renders an unstyled div into the document; drei's View measures it and
 * scissors that rectangle of the shared canvas, then tunnels `children` into
 * the persistent canvas's <View.Port />. Each view gets its own camera and
 * lighting while sharing one renderer.
 *
 * Interaction is OFF by default, in line with the canvas being decorative.
 * Pass `interactive` only for a specific experience that needs pointers —
 * the hero object — never blanket-enabled.
 *
 * This component renders nothing when the quality tier excludes WebGL, so
 * callers never need to guard it themselves.
 */

interface WebGLViewProps {
  children: ReactNode;
  /** Opt in to pointer events for this region only. */
  interactive?: boolean;
  /**
   * `cover`    — fills its positioned parent. For a scene that belongs to one
   *              section, which now means the hero object and nothing else.
   * `viewport` — holds the whole screen regardless of where its host element
   *              sits. For the persistent environment, which belongs to the
   *              journey rather than to any single stage.
   *
   * A third mode, `sticky`, was removed with the per-stage discipline scenes
   * it existed for. It held one viewport while a taller section scrolled past,
   * which is the right answer for a scene that comes and goes with its
   * section — and the wrong question once the atmosphere stopped being
   * per-section at all.
   */
  mode?: "cover" | "viewport";
  className?: string;
}

export function WebGLView({
  children,
  interactive = false,
  mode = "cover",
  className,
}: WebGLViewProps) {
  const { webgl } = useQuality();

  if (!webgl) return null;

  return (
    <ViewPortal
      className={cn(
        styles.view,
        styles[mode],
        interactive ? styles.interactive : styles.inert,
        className,
      )}
    >
      {children}
    </ViewPortal>
  );
}
