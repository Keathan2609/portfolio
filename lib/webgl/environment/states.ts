import * as THREE from "three";

/**
 * CAMERA AND FIELD STATES
 * =======================
 *
 * The camera is the other half of the art direction. Colour says what a world
 * is made of; the camera says where the visitor is standing in it — and the
 * five disciplines are meant to be five places, not five wallpapers.
 *
 * Everything here is a target. Nothing snaps: the controller eases toward
 * whichever state the scroll position implies, so the camera is always in
 * motion between two authored positions and never lands on a hard cut. That
 * is what makes the crossings read as the room changing rather than as a
 * scene change.
 *
 * MOTION SICKNESS is the constraint that shaped these numbers. There is no
 * roll except a fraction of a degree, no dolly longer than 7 units across a
 * whole discipline, and the field of view moves gradually rather than
 * punching. Under reduced motion the controller collapses to the midpoint of
 * the set and stops travelling entirely — see JourneyEnvironment.
 */

export interface CameraState {
  /** Camera position. */
  x: number;
  y: number;
  z: number;
  /** Look-at target. Moving this rather than rotating keeps the horizon sane. */
  tx: number;
  ty: number;
  tz: number;
  /** Vertical field of view, degrees. The strongest depth control here. */
  fov: number;
  /** Radians. Kept tiny — a visible roll reads as a broken page, not as art. */
  roll: number;
}

export interface FieldState {
  /** Point size multiplier for the midground field. */
  size: number;
  /** How present the point field is in this state, 0 → 1. */
  points: number;
  /** How present the large structural layer is, 0 → 1. */
  structure: number;
  /** How present the near-camera drift is, 0 → 1. */
  near: number;
}

/**
 * Per discipline, in journey order.
 *
 * SOFTWARE   Square-on and slightly long-lens (38°), so the lattice reads as
 *            elevation rather than perspective. The most "orthographic"
 *            feeling in the set without actually being orthographic, which
 *            would flatten the fog and cost the depth entirely.
 *
 * XR         The widest lens and the closest position: the camera is INSIDE
 *            the shells rather than looking at them, and the wide fov is what
 *            produces the peripheral spread that makes a frame feel like a
 *            room. This is the one state that dollies meaningfully.
 *
 * CREATIVE   The longest lens (34°) and the furthest back. Compression is the
 *            point — it stacks the planes into a composition and removes the
 *            perspective cues, so the state reads editorial and deliberately
 *            flatter than the two either side of it.
 *
 * DATA       Raised and looking down a long axis, so trajectories run away
 *            from the viewer instead of across them. The largest gap between
 *            camera and target in the set: that distance IS the depth.
 *
 * CYBER      Tight, level, close, analytical. Pulled back in from XR's
 *            openness on purpose — the journey should end in something
 *            controlled rather than something expansive.
 */
/* THE DOLLY WAS FLATTENED. THE LENS DOES THE WORK.

   These Z values used to run 10.2 → 4.6 → 11.4 → 9.0 → 7.4: a 6.8-unit
   zigzag, in and straight back out again, twice. Fed through a Catmull-Rom
   spline that produces very high curvature at the knots, and curvature is
   what the second derivative measures — camera Z carried four times the jerk
   of camera Y after normalising for range, concentrated in three spikes that
   landed exactly at state boundaries.

   The fix was not more damping. It was noticing that the dolly was never
   carrying the art direction in the first place: the field of view is, and
   that is untouched — 38° for Software's composure, 64° for XR's enclosure,
   34° for Creative's compression. XR still reads as stepping inside the
   chamber because the LENS opens, not because the camera lunges 5.6 units
   forward and then retreats 6.8.

   Halving the swing keeps every authored relationship — XR nearest, Creative
   furthest — and removes the whiplash. Fewer, better camera changes. */
export const CAMERA_STATES: CameraState[] = [
  { x: 0, y: 0, z: 9.8, tx: 0, ty: 0, tz: -7, fov: 38, roll: 0 },
  { x: 0, y: 0.45, z: 6.4, tx: 0, ty: -0.2, tz: -12, fov: 64, roll: 0.012 },
  { x: 0, y: 0.1, z: 10.6, tx: 0, ty: 0.1, tz: -3.4, fov: 34, roll: -0.008 },
  { x: 0, y: 3.3, z: 9.2, tx: 0, ty: -2.6, tz: -15, fov: 47, roll: 0.006 },
  { x: 0, y: 0, z: 8.0, tx: 0, ty: 0, tz: -6, fov: 40, roll: 0 },
];

/**
 * Where the camera rests outside the discipline arc.
 *
 * Deliberately between Software's composure and XR's openness: the opening
 * and the close should feel like the same place seen calmly, and the first
 * crossing into Software should be a settling rather than an arrival.
 */
export const NEUTRAL_CAMERA: CameraState = {
  x: 0,
  y: 0.1,
  z: 9.4,
  tx: 0,
  ty: 0,
  tz: -8,
  fov: 46,
  roll: 0,
};

/**
 * Which layers carry each world.
 *
 * The restraint the brief asks for is mostly enforced here rather than in the
 * shaders: no state runs all three layers at full. Software is structural and
 * sparse on particles; XR is volume and near-field with the structure pulled
 * back to shells; Creative is almost entirely structure with the point field
 * nearly silent, because a composition full of drifting dots is not a
 * composition; Data is the opposite; Cyber sits in between and stays quiet.
 */
export const FIELD_STATES: FieldState[] = [
  { size: 1.0, points: 0.62, structure: 1.0, near: 0.35 },
  { size: 1.25, points: 0.85, structure: 0.72, near: 1.0 },
  { size: 0.7, points: 0.24, structure: 0.95, near: 0.5 },
  { size: 1.15, points: 0.82, structure: 0.78, near: 0.4 },
  { size: 0.95, points: 0.78, structure: 0.8, near: 0.3 },
];

export const NEUTRAL_FIELD: FieldState = {
  size: 0.9,
  points: 0.5,
  structure: 0.5,
  near: 0.45,
};

/** Linear interpolation, used everywhere below. */
function mix(a: number, b: number, t: number): number {
  return a + (b - a) * t;
}

/**
 * Blend two camera states into `out`.
 *
 * Writes into a caller-owned object rather than returning a new one: this runs
 * once per frame, and the rest of the frame path in this project is
 * deliberately allocation-free for the same reason.
 */
export function blendCamera(
  out: CameraState,
  a: CameraState,
  b: CameraState,
  t: number,
): CameraState {
  out.x = mix(a.x, b.x, t);
  out.y = mix(a.y, b.y, t);
  out.z = mix(a.z, b.z, t);
  out.tx = mix(a.tx, b.tx, t);
  out.ty = mix(a.ty, b.ty, t);
  out.tz = mix(a.tz, b.tz, t);
  out.fov = mix(a.fov, b.fov, t);
  out.roll = mix(a.roll, b.roll, t);
  return out;
}

export function blendField(
  out: FieldState,
  a: FieldState,
  b: FieldState,
  t: number,
): FieldState {
  out.size = mix(a.size, b.size, t);
  out.points = mix(a.points, b.points, t);
  out.structure = mix(a.structure, b.structure, t);
  out.near = mix(a.near, b.near, t);
  return out;
}

export function copyCamera(out: CameraState, from: CameraState): CameraState {
  return blendCamera(out, from, from, 0);
}

/* -------------------------------------------------------------------------
   THE CAMERA PATH
   ------------------------------------------------------------------------- */

/**
 * The five camera states, plus the neutral rest at each end, as one curve.
 *
 * WHY A CURVE AND NOT A LERP. Interpolating between waypoints means the
 * camera travels in straight segments and changes direction at every state —
 * and because the states are reached at the centre of each discipline, the
 * direction change lands exactly where the visitor is most settled. The
 * result reads as five separate camera moves rather than one journey, which
 * is the same "sequence of blocks" failure the scenes had, transposed onto
 * the camera.
 *
 * A Catmull-Rom spline through the same authored positions passes through
 * every one of them but arrives and leaves along a continuous tangent. The
 * authored art direction is unchanged — Software still sits square-on at
 * z=10.2, XR is still inside the shells at z=4.6 — but the travel between
 * them curves, so the camera is always already moving in the direction it
 * will need next. That is what makes it read as choreography.
 *
 * `centripetal` parameterisation specifically: the default `catmullrom`
 * setting overshoots badly when consecutive points are unevenly spaced, and
 * these are — XR sits 5.6 units nearer than Software and 6.8 nearer than
 * Creative. Overshoot on a camera path means the camera briefly travels
 * somewhere nobody authored, which at these distances puts it inside the
 * geometry.
 */
function pathFrom(pick: (s: CameraState) => [number, number, number]) {
  const points = [
    NEUTRAL_CAMERA,
    ...CAMERA_STATES,
    NEUTRAL_CAMERA,
  ].map((s) => new THREE.Vector3(...pick(s)));
  return new THREE.CatmullRomCurve3(points, false, "centripetal", 0.5);
}

const POSITION_PATH = pathFrom((s) => [s.x, s.y, s.z]);
const TARGET_PATH = pathFrom((s) => [s.tx, s.ty, s.tz]);

/** Total spans on the path: neutral → 5 states → neutral. */
const SPANS = CAMERA_STATES.length + 1;

/**
 * Where on the path a given journey position sits.
 *
 * `journeyPos` runs -1 (neutral, before the arc) through 4 (the last
 * discipline), which is exactly `from + (to - from) * blend` as the
 * controller already computes it.
 */
export function pathParameter(journeyPos: number): number {
  const u = (journeyPos + 1) / SPANS;
  return u < 0 ? 0 : u > 1 ? 1 : u;
}

/** Samples both paths into caller-owned vectors. Allocation-free. */
export function sampleCameraPath(
  journeyPos: number,
  outPosition: THREE.Vector3,
  outTarget: THREE.Vector3,
): void {
  const u = pathParameter(journeyPos);
  POSITION_PATH.getPoint(u, outPosition);
  TARGET_PATH.getPoint(u, outTarget);
}

/**
 * Field of view and roll stay LINEAR between states rather than following the
 * spline. A curved fov overshoots into focal lengths nobody authored, and on
 * a wide lens that is instantly visible as a lens breathing artefact — the
 * one camera move that reads as a bug rather than as direction.
 */
export function sampleCameraLens(
  from: number,
  to: number,
  blend: number,
): { fov: number; roll: number } {
  const a = from < 0 ? NEUTRAL_CAMERA : (CAMERA_STATES[from] ?? NEUTRAL_CAMERA);
  const b = to < 0 ? NEUTRAL_CAMERA : (CAMERA_STATES[to] ?? NEUTRAL_CAMERA);
  return {
    fov: mix(a.fov, b.fov, blend),
    roll: mix(a.roll, b.roll, blend),
  };
}
