import * as THREE from "three";

/**
 * THE RESOLVED ENVIRONMENT STATE
 * ==============================
 *
 * `journey-state.ts` answers "where does the scroll position say we are".
 * This answers "where has the world actually got to" — the damped, blended,
 * colour-resolved values JourneyEnvironment computes once per frame.
 *
 * WHY THIS EXISTS. The media layer needs exactly the numbers the environment
 * has already worked out: the damped journey position, the from/to/blend
 * triple derived from it, the crossing-corrected colours, the smoothed pointer
 * lean. Recomputing any of that in a second place would mean two damping
 * integrators running at slightly different rates against the same target,
 * and the media would drift out of agreement with the atmosphere behind it —
 * a plane still lit violet while the air had gone orange. There is one
 * integrator, it lives in JourneyEnvironment, and it publishes here.
 *
 * Same contract as scroll-state and stage-progress: a plain mutable module
 * singleton, written once per frame, read inside useFrame, allocation-free,
 * nothing subscribes, zero React renders.
 *
 * ORDERING, AND THE ONE-FRAME LAG. JourneyEnvironment writes this at the end
 * of its useFrame; MediaField reads it at the start of its own. R3F runs frame
 * callbacks in subscription order, and a non-zero `renderPriority` would take
 * over rendering entirely (R3F stops calling gl.render itself the moment any
 * subscriber claims a priority), which is not a trade worth making for
 * ordering. So the media layer may read values one frame old. At 60fps that is
 * 16ms of lag on a parallax lean and a reveal envelope — both already damped
 * far slower than that, and neither is measurable by eye. Nothing here needs
 * frame-exact agreement; it needs to never *diverge*, which it cannot, because
 * there is only one integrator.
 */

export interface ResolvedEnvironment {
  /** Damped journey position: -1 neutral, 0 Software … 4 Cybersecurity. */
  position: number;
  /** Integer state either side of `position`. */
  from: number;
  to: number;
  /** 0 → 1 across the crossing between them. */
  blend: number;
  /** 1 - |blend*2 - 1|: peaks at the middle of a crossing. */
  cross: number;
  /** How present the environment is overall, 0 → 1. */
  intensity: number;
  /** Structural complexity, 0 → 1. Drains through the closing sections. */
  arc: number;
  /** 1 through the quiet informational sections. */
  quiet: number;
  /** Smoothed pointer lean, -1 → 1. Zero on coarse pointers. */
  pointerX: number;
  pointerY: number;
  /** Ambient clock. Frozen when the tier or the visitor forbids motion. */
  time: number;
  /** Damped scroll velocity, -1 → 1. */
  velocity: number;
  /** Resolved deep (unlit) colour for the current blend. */
  deep: THREE.Color;
  /** Resolved key colour — the one saturated value in the state. */
  light: THREE.Color;
  /** Whether ambient motion is permitted at all. */
  ambient: boolean;
}

export const resolvedEnvironment: ResolvedEnvironment = {
  position: -1,
  from: -1,
  to: 0,
  blend: 0,
  cross: 0,
  intensity: 0,
  arc: 0,
  quiet: 0,
  pointerX: 0,
  pointerY: 0,
  time: 0,
  velocity: 0,
  deep: new THREE.Color("#0a0a0c"),
  light: new THREE.Color("#4f7cff"),
  ambient: true,
};
