"use client";

import dynamic from "next/dynamic";
import type { RefObject } from "react";
import { useQuality } from "@/lib/performance/QualityProvider";

/**
 * Mount gate for the persistent canvas.
 *
 * three.js is ~600 KB minified. Loading it dynamically keeps it out of the
 * initial chunk entirely, so the DOM site — which is the whole site as far
 * as content is concerned — paints without waiting on WebGL.
 *
 * The canvas is not requested at all when the quality tier is "none", which
 * covers: no WebGL support, Save-Data, very slow connections, and any future
 * reason to serve the pure-DOM experience.
 */
const GlobalCanvas = dynamic(() => import("./GlobalCanvas"), {
  ssr: false,
  loading: () => null,
});

export function CanvasRoot({
  eventSource,
}: {
  eventSource: RefObject<HTMLElement | null>;
}) {
  const { webgl, detecting } = useQuality();

  // Detection runs client-side; render nothing until it has an answer so we
  // never mount a canvas we're about to throw away.
  if (detecting || !webgl) return null;

  return <GlobalCanvas eventSource={eventSource} />;
}
