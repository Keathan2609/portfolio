/**
 * PRESENCE ENVELOPE
 *
 * How strongly a scene is present across its own stage span.
 *
 * WHAT USED TO BE HERE, AND WHY IT IS NOT
 *
 * This module carried three curves: `worldPresence` and `transitionPresence`
 * for the five discipline scenes and four transition scenes, and
 * `heroPresence` for the hero object. The first two are gone with the scenes
 * that used them.
 *
 * They existed to solve a problem the trapezoid shape could only ever
 * mitigate. Every per-stage scene has to reach exactly 0 at both ends of its
 * span, because `useSceneFrame` stops calling a scene once its stage goes
 * inactive and whatever value was written last is the value that stays —
 * ending above zero leaves a scene frozen on screen forever. So the trapezoid
 * held presence at full through the middle and relied on adjacent stages
 * overlapping by a viewport to hand off, which is genuinely better than the
 * bell curve it replaced. But nine consecutive stages each rising from
 * nothing and collapsing back to nothing is still, structurally, a sequence of
 * separate blocks — and that is what the site read as.
 *
 * The environment does not have the problem, because it never goes inactive.
 * It is one persistent world whose state is interpolated from scroll position,
 * so there is no envelope to shape and no handoff to arrange. See
 * lib/webgl/scenes/JourneyEnvironment.tsx.
 *
 * The hero keeps its curve. It is a signature object rather than an
 * environment: it genuinely does arrive, hold, and hand over.
 */

function clamp01(v: number): number {
  return v < 0 ? 0 : v > 1 ? 1 : v;
}

/** Smoothstep — no discontinuity in the first derivative at either end. */
function smooth(t: number): number {
  const c = clamp01(t);
  return c * c * (3 - 2 * c);
}

/**
 * The hero, which has no predecessor to inherit from.
 *
 * Starts at full — it is what the page opens on — and releases across the
 * back half as the intro takes over. A rise here would mean the first thing
 * a visitor sees is an empty frame.
 */
export function heroPresence(progress: number): number {
  return smooth(clamp01((1 - progress) / 0.45));
}
