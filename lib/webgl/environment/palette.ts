import * as THREE from "three";
import { disciplines } from "@/lib/data/disciplines";

/**
 * COLOUR AS ENVIRONMENT
 * =====================
 *
 * A discipline accent is a UI colour: it names a section, tints a rule, marks
 * an index. That is what `discipline.accentHex` is for, and the DOM keeps
 * using it exactly as before.
 *
 * The environment needs something else. A world does not have "a colour" — it
 * has a depth the light falls off into, a light source with a hue of its own,
 * and a floor that catches the residue. Those three read as atmosphere. One
 * flat colour read as a coloured panel behind the text, which is precisely
 * what the previous pass looked like and precisely what was asked to change.
 *
 * So each state carries a small palette rather than a swatch:
 *
 *   deep    what the frame fills with where nothing is lit. Never pure black —
 *           pure black has no hue to transition, so a crossing between two
 *           black worlds is invisible no matter what else moves.
 *   light   the key. The one saturated value in the state, and the only place
 *           the discipline's identity is stated at full strength.
 *   floor   the low bounce. Sits under the light, keeps the bottom of the
 *           frame from cutting to nothing.
 *   lift    how bright this world runs overall. Not every discipline should
 *           be equally present — see the per-state notes.
 *
 * WHY THESE VALUES AND NOT BRIGHTER ONES. The canvas composites UNDER the
 * text, so every bit of light the environment adds is added to the background
 * of the small text tokens as well. --c-text-faint was the binding constraint:
 * at its previous #7c7c88 it measured 4.80:1 on the bare ground, which leaves
 * roughly 0.0035 of relative luminance before it drops under AA — not enough
 * to put a lit room behind. It has since been raised to #90909c for exactly
 * this reason (see the note in lib/styles/tokens.css), and the values here are
 * set against the headroom that buys, not against the old margin.
 *
 * Depth therefore comes from RANGE, not from brightness: deep values stay
 * near the existing ground, and the presence comes from a small, off-axis,
 * genuinely bright key. Mean frame luminance is the number kept low; peak
 * luminance is the number allowed to rise. That is also simply how a lit
 * space looks, so the constraint and the art direction agree.
 */

export interface EnvironmentState {
  /** Journey-order index. Matches `disciplines`. */
  index: number;
  deep: THREE.Color;
  light: THREE.Color;
  floor: THREE.Color;
  /**
   * The second hue. What the unlit far side of the frame tends toward.
   *
   * A world lit by one colour against a ground of the same colour is
   * monochrome, and monochrome reads as a filter over a black page rather
   * than as a lit space. Every real interior has at least two hues in it —
   * the key, and whatever the shadows pick up from everything the key is not
   * hitting. This is that second hue, and adding it is the single largest
   * reason the frames now have colour RANGE rather than a colour.
   *
   * Kept adjacent to the key, never complementary: opposite hues would make
   * the set read as the rainbow the brief rules out.
   */
  shadow: THREE.Color;
  /** Overall environmental brightness, ~0.6 → 1.15. */
  lift: number;
  /** How thick the atmosphere reads. Higher = softer, foggier, less depth. */
  fog: number;
  /** Where the key sits in the frame, in UV. Kept off-centre, always. */
  keyX: number;
  keyY: number;
  /** Radius of the key's falloff. Small = a source, large = a wash. */
  keyRadius: number;
  /**
   * How still this world is, 0 (drifting) → 1 (almost frozen).
   *
   * Rhythm, not decoration. Every state previously drifted at the same rate,
   * which averages out to "everything always moves slightly" — the texture of
   * a screensaver. Letting two of the five states go nearly still is what
   * gives the ones that do move something to move against.
   */
  calm: number;
}

/**
 * Authored per discipline, in journey order. The accent is deliberately NOT
 * reused as the light in every case: #4f7cff at full strength is a UI blue,
 * and a room lit by it looks like a screen. The light values below are the
 * same hues taken to where they behave like illumination.
 */
const AUTHORED: Array<Omit<EnvironmentState, "index">> = [
  /* 01 SOFTWARE ENGINEERING — engineered structure.
     Graphite that has been lit from one side by a cold source. The deep is
     the coolest neutral in the set; the key is tight and high, so the lattice
     reads as architecture catching a single hard light rather than glowing. */
  {
    deep: new THREE.Color("#070910"),
    light: new THREE.Color("#5b84ff"),
    floor: new THREE.Color("#0d1220"),
    // Cold cyan-steel under an electric blue key: the range an engineered
    // interior actually has, rather than one blue at two brightnesses.
    shadow: new THREE.Color("#0d2b38"),
    lift: 0.92,
    fog: 0.52,
    keyX: 0.72,
    keyY: 0.74,
    keyRadius: 0.62,
    calm: 0.72,
  },

  /* 02 XR DEVELOPMENT — entering space.
     The strongest state, and deliberately so: this is the discipline the
     brief singles out. Ultraviolet deep rather than neutral, a wide soft key
     that fills volume instead of picking out a surface, and the highest lift
     in the set. The frame should feel like it has air in it. */
  {
    deep: new THREE.Color("#0a0716"),
    light: new THREE.Color("#a86bff"),
    floor: new THREE.Color("#160e2a"),
    // Violet key falling off into deep indigo. The widest hue spread of the
    // five, because this is the state that has to read as having air in it.
    shadow: new THREE.Color("#151845"),
    lift: 1.15,
    fog: 0.78,
    keyX: 0.38,
    keyY: 0.56,
    keyRadius: 0.95,
    calm: 0.2,
  },

  /* 03 CREATIVE — composition becoming physical.
     The flattest and most controlled. A warm ground, but restrained: the
     brief asks for a controlled colour field, not an orange section. Small
     tight key, low fog, so the state reads graphic and edge-lit — closer to
     a printed spread under a lamp than to a volume. */
  {
    deep: new THREE.Color("#100a09"),
    light: new THREE.Color("#ff7a48"),
    floor: new THREE.Color("#1a0f0a"),
    // Warm key against a plum shadow — the editorial pairing, and the reason
    // this state can stay warm without reading as an orange section.
    shadow: new THREE.Color("#2b1230"),
    lift: 0.88,
    fog: 0.34,
    keyX: 0.24,
    keyY: 0.7,
    keyRadius: 0.5,
    calm: 0.85,
  },

  /* 04 DATA SCIENCE — information becoming pattern.
     Deep navy with a spectral cool key. The longest depth in the set, so the
     fog is high and the key sits low and far, giving the trajectories
     something to recede into. */
  {
    deep: new THREE.Color("#050e18"),
    light: new THREE.Color("#2fd4c0"),
    floor: new THREE.Color("#071a24"),
    // Teal signal over deep navy. The brief names both; this is where the
    // navy actually lives, rather than only in the near-black ground.
    shadow: new THREE.Color("#0b1c46"),
    // Measured the brightest of the five: a cyan key is close to the peak of
    // the luminance curve, so the same lift buys far more measured brightness
    // here than it does for the violet or the steel. Pulled back so the set
    // reads evenly lit rather than with one state shouting.
    lift: 0.95,
    fog: 0.72,
    keyX: 0.62,
    keyY: 0.3,
    keyRadius: 0.84,
    calm: 0.35,
  },

  /* 05 CYBERSECURITY — systems under observation.
     The most restrained. Cold steel, near-neutral deep, low lift and a tight
     key: the frame should feel controlled and slightly airless, which is the
     honest reading of "currently developing" and of surveillance both. The
     red anomaly is NOT in this palette — it is applied by the scan, at one
     node at a time, so it stays an event rather than a colour scheme. */
  {
    deep: new THREE.Color("#06090d"),
    light: new THREE.Color("#7aa6cc"),
    floor: new THREE.Color("#0a1016"),
    // The narrowest spread in the set. Steel against graphite, almost but not
    // quite neutral — an airless room, which is the point.
    shadow: new THREE.Color("#12181c"),
    lift: 0.8,
    fog: 0.44,
    keyX: 0.5,
    keyY: 0.86,
    keyRadius: 0.56,
    calm: 0.8,
  },
];

/**
 * The restrained red the security state is allowed, and the only warm value
 * in that world. Used at one displaced node at a time and nowhere else, so it
 * reads as an anomaly being noticed rather than as an alert state.
 */
export const ANOMALY = new THREE.Color("#c4483a");

export const ENVIRONMENT_STATES: EnvironmentState[] = AUTHORED.map(
  (state, index) => ({ ...state, index }),
);

/**
 * The state the journey rests at outside the discipline arc — the opening,
 * hero, intro and the closing sections.
 *
 * Not a sixth discipline: it is the first state with its colour drained and
 * its light pulled back, so arriving at Software Engineering feels like the
 * world resolving rather than like a different world starting. The site opens
 * on the same air it later fills.
 */
export const NEUTRAL: EnvironmentState = {
  index: -1,
  deep: new THREE.Color("#07080b"),
  light: new THREE.Color("#8e9bbf"),
  floor: new THREE.Color("#0b0d13"),
  shadow: new THREE.Color("#131a2a"),
  lift: 0.72,
  fog: 0.6,
  keyX: 0.66,
  keyY: 0.62,
  keyRadius: 0.8,
  calm: 0.6,
};

/** Sanity: the environment states and the content data must stay in step. */
if (
  process.env.NODE_ENV !== "production" &&
  ENVIRONMENT_STATES.length !== disciplines.length
) {
  console.warn(
    `[environment] ${ENVIRONMENT_STATES.length} palette states for ` +
      `${disciplines.length} disciplines — these must correspond by index.`,
  );
}
