"use client";

import dynamic from "next/dynamic";
import { WebGLView } from "./WebGLView";

/**
 * Mount point for the persistent journey environment.
 *
 * Rendered once, in the shell, ahead of everything else. Two consequences,
 * both deliberate:
 *
 *  1. It never unmounts. Unlike a discipline scene, which comes and goes with
 *     its section, this is on screen from the opening to the footer. That is
 *     the entire point — the continuity the site was missing came from the
 *     gaps between mounted scenes, not from the scenes themselves.
 *
 *  2. Being first in the DOM puts it first in paint order among the z-index:0
 *     views, so every discipline and transition scene composites ON TOP of
 *     it. The environment is the ground; they are the events that happen on
 *     it.
 *
 * `viewport` mode holds the whole screen rather than tracking a section box,
 * because this belongs to the journey rather than to any one stage.
 *
 * Loaded on demand for the same reason as every other scene: three.js stays
 * out of the initial chunk, and a visitor on the NONE tier — no WebGL,
 * Save-Data, a slow connection — never downloads it. WebGLView already
 * returns null on that tier, so the DOM-only experience is untouched.
 */
const JourneyEnvironment = dynamic(
  () => import("./scenes/JourneyEnvironment").then((m) => m.JourneyEnvironment),
  { ssr: false, loading: () => null },
);

export function EnvironmentLayer() {
  return (
    <WebGLView mode="viewport">
      <JourneyEnvironment />
    </WebGLView>
  );
}
