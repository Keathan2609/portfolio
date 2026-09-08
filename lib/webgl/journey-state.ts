import { journey } from "@/lib/data/journey";
import { disciplines } from "@/lib/data/disciplines";
import { getStageProgress } from "@/lib/scroll/stage-progress";
import { readSkillsFocus } from "@/lib/webgl/environment/skills-focus";

/**
 * THE ENVIRONMENT'S STATE, DERIVED FROM SCROLL
 * ============================================
 *
 * The environment is one system with five states, not five scenes. At any
 * scroll position it needs to know which state it is in, how far it has
 * travelled toward the next, and how much of itself to be. Everything else —
 * geometry, colour, density, camera, lighting — follows from that.
 *
 * Derived from the SAME stage progress the DOM sections publish, so the
 * environment and the content in front of it can never disagree about where
 * the visitor is. Nothing here subscribes, renders, or allocates: it is a
 * pure read of module state, called once per frame from inside useFrame.
 *
 * Sequence, from lib/data/journey.ts — never hardcoded, so reordering the
 * disciplines reorders the environment with them:
 *
 *   world 0 ─band─ world 1 ─band─ world 2 ─band─ world 3 ─band─ world 4
 *
 * Inside a world the state is that world. Inside a band the state crosses
 * from the world behind to the world ahead. That is the whole model, and the
 * band is not a separate place — it is the same field partway between two
 * arrangements of itself.
 */

export interface JourneyState {
  /**
   * WHERE ON THE JOURNEY, AS ONE CONTINUOUS NUMBER.
   *
   * -1 is the neutral opening state, 0 is Software, 4 is Cybersecurity, and
   * every value in between is a real position part-way across a crossing.
   *
   * THIS REPLACED A DISCRETE (from, to, blend) TRIPLE, and the change is the
   * whole of this pass. The old contract pinned `blend` to 0 whenever the
   * visitor was inside a world and swept it 0 → 1 only inside a band. The
   * values were continuous across the boundary, so it looked correct — but
   * the DERIVATIVE was not: the world morphed at speed all the way through a
   * band and then stopped dead the instant the next world's trigger took
   * over. Motion that goes from moving to frozen in one frame reads as
   * stepped no matter how smooth the easing curve either side of it is, and
   * no amount of tuning the ease function could ever have fixed it, because
   * the easing was being applied to the wrong quantity.
   *
   * One scalar has no such seam. The controller damps it and derives
   * from/to/blend from its floor and fraction, so state changes are not
   * events at all — there is nothing left to switch.
   */
  position: number;
  /**
   * How present the environment is, 0 → 1.
   *
   * Never reaches zero while the canvas exists. The environment holds a floor
   * through the opening, hero and intro so those sections have depth behind
   * them rather than flat black, rises through the discipline arc where the
   * work is, and settles back for the close.
   */
  intensity: number;
  /**
   * 0 → 1, how far into the discipline arc the visitor is.
   *
   * Drives structural complexity specifically, as distinct from `intensity`
   * which drives brightness. The two are separate because the closing
   * sections should stay lit but stop being busy — "arrival", not "another
   * effect". Collapsing them into one number is what previously made the
   * ending feel like a fade rather than a landing.
   */
  arc: number;
  /**
   * 0 → 1. How much the visitor has asked, by scrolling, to be somewhere
   * quiet. 1 through the closing informational sections.
   */
  quiet: number;
  /**
   * Which discipline the Skills Arsenal is currently filtered to, or -1.
   *
   * The skills list stays ordinary accessible DOM; this only lets the world
   * behind it lean toward the state being read about. Nothing in the section
   * depends on it.
   */
  focus: number;
}

const worldIds = disciplines.map((d) => d.slug);

/** Band stage id → the world indices it crosses between. */
const bands: Array<{ id: string; from: number; to: number }> = (() => {
  const out: Array<{ id: string; from: number; to: number }> = [];
  const ordered = journey.filter(
    (s) => s.kind === "discipline" || s.kind === "transition",
  );

  for (let i = 0; i < ordered.length; i += 1) {
    const stage = ordered[i];
    if (stage.kind !== "transition") continue;

    const before = ordered[i - 1];
    const after = ordered[i + 1];
    if (!before || !after) continue;

    const from = worldIds.indexOf(before.id);
    const to = worldIds.indexOf(after.id);
    if (from < 0 || to < 0) continue;

    out.push({ id: stage.id, from, to });
  }

  return out;
})();

/**
 * The approach to the arc, in order.
 *
 * The environment does not sit at a flat floor and then snap to Software when
 * the first world's trigger fires — it leans toward Software across the
 * intro, so the first discipline is arrived at rather than switched to. The
 * neutral state (index -1) is the thing being left.
 */
const APPROACH = ["opening", "hero", "intro"];

/** The close. Complexity drains across these; brightness mostly holds. */
const DEPARTURE = ["skills", "cv", "building", "beyond", "hire"];

/** Ambient floor: what the environment holds where no world is active. */
const FLOOR = 0.52;

function clamp01(v: number): number {
  return v < 0 ? 0 : v > 1 ? 1 : v;
}

function smooth(t: number): number {
  const c = clamp01(t);
  return c * c * (3 - 2 * c);
}

/**
 * Held between reads so the environment never snaps.
 *
 * Stage triggers do not tile the page perfectly — there are scroll positions
 * where no world and no band is active. Returning a default there would reset
 * the environment to state 0 and flash the whole field back to the first
 * discipline. Instead the last known state persists and only the scalars move.
 */
let lastPosition = -1;
let lastArc = 0;

/**
 * Written into and returned by every call, never reallocated.
 *
 * Read once per frame from inside useFrame. Returning a fresh object would
 * put 60 short-lived allocations a second on the hot path for no reason, and
 * the rest of the frame path here — scroll-state, stage-progress — is
 * deliberately allocation-free for the same reason. Callers must treat the
 * result as valid only until their next call.
 */
const shared: JourneyState = {
  position: -1,
  intensity: 0,
  arc: 0,
  quiet: 0,
  focus: -1,
};

/**
 * Of the stages currently active, which one is the visitor most inside.
 *
 * ADJACENT STAGES OVERLAP BY A FULL VIEWPORT — every trigger spans
 * `top bottom` to `bottom top`, which is deliberate and is what gives scenes
 * somewhere to enter from and leave to. The consequence is that two, and at a
 * boundary three, stages report `active` at once.
 *
 * Taking the first active match in journey order is therefore wrong, and
 * wrong in a way that is invisible until the environment is actually visible:
 * standing in the middle of Data Science, the Creative stage above is still
 * active and still earlier in the array, so the world rendered Creative's
 * warm field behind Data Science's teal headings for the entire section.
 *
 * `centered` is 0 at the exact middle of a stage's span and ±1 at its ends,
 * so the smallest absolute value is the stage the viewport is most inside.
 * That is the one the environment should be showing.
 */
function mostCentred(ids: readonly string[]): number {
  let best = -1;
  let bestDistance = Infinity;

  for (let i = 0; i < ids.length; i += 1) {
    const stage = getStageProgress(ids[i]);
    if (!stage.active) continue;

    const distance = Math.abs(stage.centered);
    if (distance < bestDistance) {
      bestDistance = distance;
      best = i;
    }
  }

  return best;
}

const bandIds = bands.map((b) => b.id);

export function readJourneyState(): JourneyState {
  shared.focus = readSkillsFocus();

  /* Worlds and bands are resolved TOGETHER rather than bands-then-worlds.
     A band is not a higher priority than a world; it is simply another stage,
     and the right one to show is whichever the viewport is most inside. */
  const bandIndex = mostCentred(bandIds);
  const worldIndex = mostCentred(worldIds);

  const bandDistance =
    bandIndex < 0 ? Infinity : Math.abs(getStageProgress(bandIds[bandIndex]).centered);
  const worldDistance =
    worldIndex < 0 ? Infinity : Math.abs(getStageProgress(worldIds[worldIndex]).centered);

  if (bandIndex >= 0 && bandDistance <= worldDistance) {
    const band = bands[bandIndex];
    const stage = getStageProgress(band.id);

    /* A band occupies the span between two integers. Eased so the crossing
       accelerates out of one world and settles into the next rather than
       travelling at a constant rate through the middle — but note this is now
       shaping a TARGET the controller chases, not the value itself, so even a
       hard step here would come out smooth. */
    lastPosition = band.from + smooth(stage.progress) * (band.to - band.from);
    lastArc = 1;

    shared.position = lastPosition;
    shared.intensity = 1;
    shared.arc = 1;
    shared.quiet = 0;
    return shared;
  }

  if (worldIndex >= 0) {
    lastPosition = worldIndex;
    lastArc = 1;

    shared.position = worldIndex;
    shared.intensity = 1;
    shared.arc = 1;
    shared.quiet = 0;
    return shared;
  }

  /* Approaching the arc: lean from neutral toward the first discipline. */
  const approachIndex = mostCentred(APPROACH);
  if (approachIndex >= 0) {
    const stage = getStageProgress(APPROACH[approachIndex]);
    // How far through the approach as a whole, not through this section, so
    // the lean accumulates across all three rather than resetting at each.
    const through = (approachIndex + stage.progress) / APPROACH.length;

    // Only ever partway: the crossing completes when the first world's own
    // trigger takes over, so the intro hands off mid-move instead of arriving
    // early and sitting still.
    lastPosition = -1 + smooth(through) * 0.72;
    lastArc = through * 0.5;

    shared.position = lastPosition;
    shared.intensity = FLOOR + smooth(through) * (1 - FLOOR);
    shared.arc = lastArc;
    shared.quiet = 0;
    return shared;
  }

  /* Leaving the arc. The last position is held — the world does not revert to
     neutral, because the visitor has been through it and the close should
     feel like the same place at rest. Complexity drains; light mostly stays. */
  const departureIndex = mostCentred(DEPARTURE);
  if (departureIndex >= 0) {
    const stage = getStageProgress(DEPARTURE[departureIndex]);
    const through = (departureIndex + stage.progress) / DEPARTURE.length;
    const settle = smooth(through);

    shared.position = lastPosition;
    shared.intensity = 1 - settle * 0.36;
    shared.arc = lastArc * (1 - settle * 0.82);
    shared.quiet = settle;
    return shared;
  }

  /* Outside everything — briefly, between triggers. Hold. */
  shared.position = lastPosition;
  shared.intensity = FLOOR;
  shared.arc = lastArc;
  shared.quiet = 0;
  return shared;
}

/** Test seam: lets a fresh page load start from the neutral state. */
export function resetJourneyState(): void {
  lastPosition = -1;
  lastArc = 0;
}
