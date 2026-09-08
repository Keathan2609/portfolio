"use client";

import dynamic from "next/dynamic";
import type { ReactNode } from "react";

/**
 * Scene registry.
 *
 * The single place that maps content to visuals, so section components never
 * import a scene directly.
 *
 * WHAT USED TO BE HERE. This file previously registered ten scenes: five
 * discipline worlds and four transition bands, each mounted behind its own
 * section, plus the hero. They are gone, and their absence is the change the
 * environment rebuild turns on rather than a side effect of it.
 *
 * A per-stage scene has to raise its own opacity from zero and return to zero
 * at both ends of its span — a scene that does not is left frozen on screen
 * when its stage goes inactive. Nine consecutive stages each swelling from
 * nothing and collapsing back to nothing is, structurally, a sequence of
 * separate blocks with black between them. That was the thing the site read
 * as, and no amount of improving the individual scenes could have changed it.
 * Each one also owned its own camera, so every boundary was a cut between two
 * different fields of view however slowly the opacities crossed.
 *
 * All of it now lives in one persistent environment that never unmounts and
 * owns the only camera — see lib/webgl/scenes/JourneyEnvironment.tsx. The
 * disciplines are states it interpolates between; a transition is that world
 * partway between two arrangements of itself. The DOM transition bands are
 * untouched, because their typography is content.
 *
 * The hero object is the one scene that survives as a scene. It is a
 * signature object rather than an environment, it is the only view that
 * accepts pointer input, and the brief is explicit that the hero is approved
 * as it stands.
 */
const HeroObject = dynamic(
  () => import("./HeroObject").then((m) => m.HeroObject),
  // `loading: () => null` matters: this renders inside the three.js
  // reconciler, which cannot mount a DOM fallback.
  { ssr: false, loading: () => null },
);

/** The hero's signature object — the one scene that accepts pointer input. */
export function sceneForHero(): ReactNode {
  return <HeroObject />;
}
