"use client";

import { useEffect, useMemo, useRef } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import { PerspectiveCamera } from "@react-three/drei";
import * as THREE from "three";
import { useQuality } from "@/lib/performance/QualityProvider";
import { readJourneyState } from "@/lib/webgl/journey-state";
import { pointerState, trackPointer } from "@/lib/webgl/pointer-state";
import { normalisedVelocity } from "@/lib/scroll/scroll-state";
import {
  ENVIRONMENT_STATES,
  NEUTRAL,
  type EnvironmentState,
} from "@/lib/webgl/environment/palette";
import {
  NEUTRAL_CAMERA,
  sampleCameraPath,
  sampleCameraLens,
  type CameraState,
} from "@/lib/webgl/environment/states";
import { resolvedEnvironment } from "@/lib/webgl/environment/resolved-state";
import { FlowField, type FlowFieldHandle } from "@/lib/webgl/environment/FlowField";

/**
 * THE JOURNEY ENVIRONMENT
 * =======================
 *
 * One world, five states, alive for the whole page.
 *
 * ARCHITECTURE — WHY THIS IS THE ONLY WEBGL VIEW LEFT
 *
 * The site previously ran ten WebGL views: a persistent environment, five
 * discipline scenes and four transition scenes, each mounting when its
 * section came into range and unmounting when it left. That structure is
 * what produced the reading the brief describes — black, an effect, black,
 * another effect — and it could not have produced anything else, for three
 * reasons that no amount of tuning the individual scenes would have fixed:
 *
 *   1. Every scene raised its own opacity from zero and returned to zero at
 *      both ends of its span, because a scene that does not is left frozen on
 *      screen when its stage goes inactive. Nine consecutive stages each
 *      swelling from nothing and collapsing back to nothing IS a sequence of
 *      separate blocks. That is not a bug in the envelope; it is what
 *      per-stage scenes structurally are.
 *
 *   2. Each scene owned its own camera. Crossing a boundary meant cutting
 *      between two cameras with different positions and fields of view, which
 *      is a cut however slowly the opacities cross-fade.
 *
 *   3. The budget was spread across ten views that were never on screen
 *      together, so no single one could afford real depth. Measured, the
 *      whole thing rendered at 99.7% near-black with a luminance standard
 *      deviation of 5.96 — the flat CSS ground, pixel for pixel.
 *
 * So the per-stage views are gone and this is the whole environment. It never
 * unmounts, it owns the only camera, and the disciplines are states it
 * interpolates between rather than scenes it swaps. A transition is not a
 * thing that plays; it is this world partway between two arrangements of
 * itself. The DOM transition bands remain exactly as they were — their
 * typography is content — but they no longer carry a scene, because there is
 * nothing left for a separate scene to do.
 *
 * FOUR LAYERS, FRONT TO BACK
 *
 *   NearDrift          on the lens. Large, faint, worked in view space.
 *   PointField         midground texture. Five arrangements of one field.
 *   DepthStructures    the large forms. Where scale and silhouette come from.
 *   AtmosphereField    the air. Where colour and light live. One draw call.
 *
 * Everything in every layer falls off on the SAME fog curve, which is the
 * mechanical reason four independent systems read as one space.
 *
 * WHAT IT RESPONDS TO
 *   scroll position   which state, how far across, and how present (journey-state)
 *   scroll velocity   a small swell that settles — the world has mass
 *   pointer           a lean, carried mostly by the near field
 *   skills filter     a lean toward the discipline being read about
 *   quality tier      layer counts, shader octaves, and whether ambient runs
 *   reduced motion    camera travel and ambient drift stop; composition stays
 *
 * WHAT IT IS NOT: it carries no content, no text, no information. Remove it
 * and the site loses depth, not meaning.
 */

/** Frame-rate independent easing toward a target. */
function ease(current: number, target: number, rate: number, dt: number) {
  return current + (target - current) * (1 - Math.exp(-rate * dt));
}

/**
 * Budgets per tier.
 *
 * These genuinely change the workload rather than scaling one number: the
 * atmosphere's octave count is baked into its shader source and is by far the
 * most expensive single thing here, because it runs per fragment across the
 * whole viewport. Dropping it from four to two roughly halves the fill cost
 * on its own.
 */
function budgets(density: number, coarse: boolean) {
  /* THE BUDGET MOVED FROM EFFECTS TO ARCHITECTURE.
  
     Point counts are roughly a third of what they were and the solid mass
     layer took the difference. That reallocation is the point of this pass:
     four thousand additive sprites cost real fill rate and bought texture,
     while forty opaque boxes cost almost nothing and buy a place. Per unit of
     budget, architecture is by far the better purchase. */
  /* THE BUDGET MOVED AGAIN — THIS TIME FROM ARCHITECTURE TO MEDIA.

     The previous pass moved spend from particles to architecture, and it was
     right at the time: forty opaque boxes bought a place where four thousand
     sprites bought only texture. But the visual direction has resolved, and
     the answer is no longer "an architectural world" — it is real work,
     presented. Measured against that target, the mass layer was not supplying
     depth so much as competing for the frame: the XR chapter read as large
     type over floating boxes, which is precisely the anti-pattern the brief
     names.

     So the counts here are roughly 40% of what they were. The layer still
     does the job it is now for — occlusion, silhouette and something for the
     fog to describe behind the media planes — and it has stopped being the
     subject. The reclaimed budget goes to textures, which is where the
     subject actually lives now. */
  if (density <= 0.3) {
    return { mass: 10, points: 300, structures: 14, near: 5, octaves: 2, groundSegments: 1 };
  }
  if (density <= 0.65 || coarse) {
    return { mass: 20, points: 480, structures: 24, near: 6, octaves: 3, groundSegments: 2 };
  }
  return { mass: 36, points: 900, structures: 42, near: 8, octaves: 4, groundSegments: 4 };
}

export function JourneyEnvironment() {
  const camera = useRef<THREE.PerspectiveCamera>(null);
  const field = useRef<FlowFieldHandle>(null);

  const { density, animateAmbient } = useQuality();
  const { size } = useThree();

  // A coarse pointer means a phone or tablet: fewer forms, and no cursor
  // response at all — a touch "move" is a drag, and letting it steer the
  // world makes the environment lurch whenever someone scrolls with a thumb.
  const coarse = useMemo(
    () =>
      typeof window !== "undefined" &&
      window.matchMedia("(pointer: coarse)").matches,
    [],
  );

  const budget = useMemo(() => budgets(density, coarse), [density, coarse]);

  useEffect(() => trackPointer(), []);

  /**
   * Development-only state bridge.
   *
   * The environment is driven entirely by derived scroll state, which means a
   * wrong world behind a section is not something that can be read off the
   * source — the question is always "what did readJourneyState actually
   * return at this scroll position". Publishing the resolved state makes that
   * answerable directly instead of by inference. Mirrors the __knp convention
   * in ScrollProvider; stripped from production by the NODE_ENV check.
   */
  const debug = useRef<Record<string, number> | null>(null);
  useEffect(() => {
    if (process.env.NODE_ENV === "production") return;
    const w = window as unknown as Record<string, unknown>;
    debug.current = {};
    w.__knpEnv = debug.current;
    return () => {
      delete w.__knpEnv;
    };
  }, []);

  /**
   * Scratch objects, allocated once and rewritten every frame.
   *
   * A ref rather than a memo, and that distinction is enforced rather than
   * stylistic: values returned from useMemo are treated as frozen under the
   * React Compiler, and every one of these is mutated inside useFrame — the
   * colours are written by `copy`, the camera vectors are written in place by
   * `sampleCameraPath`. A ref is the sanctioned container for mutable
   * per-frame state, and it carries the same "allocate once" guarantee.
   */
  const scratchRef = useRef(
    ((): {
      cameraState: CameraState;
      deep: THREE.Color;
      light: THREE.Color;
      floor: THREE.Color;
      shadow: THREE.Color;
      hsl: { h: number; s: number; l: number };
      pathPos: THREE.Vector3;
      pathTarget: THREE.Vector3;
      camPos: THREE.Vector3;
      camAim: THREE.Vector3;
      lightDir: THREE.Vector3;
      target: THREE.Vector3;
    } => ({
      cameraState: { ...NEUTRAL_CAMERA } as CameraState,
      deep: new THREE.Color(),
      light: new THREE.Color(),
      floor: new THREE.Color(),
      hsl: { h: 0, s: 0, l: 0 },
      shadow: new THREE.Color(),
      pathPos: new THREE.Vector3(),
      pathTarget: new THREE.Vector3(),
      camPos: new THREE.Vector3(NEUTRAL_CAMERA.x, NEUTRAL_CAMERA.y, NEUTRAL_CAMERA.z),
      camAim: new THREE.Vector3(NEUTRAL_CAMERA.tx, NEUTRAL_CAMERA.ty, NEUTRAL_CAMERA.tz),
      lightDir: new THREE.Vector3(0, 0, 1),
      target: new THREE.Vector3(),
    }))(),
  );

  /**
   * Smoothed values held across frames.
   *
   * Everything the environment reacts to is eased toward its target rather
   * than applied raw. Scroll velocity in particular is spiky — read directly
   * it makes the field jitter on every wheel notch. This is what makes the
   * response read as mass rather than as twitch.
   *
   * `blend` and `stateFrom`/`stateTo` are smoothed as well, which is what
   * covers the seams where stage triggers do not tile the page perfectly.
   */
  const s = useRef({
    intensity: 0,
    arc: 0,
    quiet: 0,
    velocity: 0,
    px: 0,
    py: 0,
    clock: 0,
    focusLean: 0,
    surge: 0,
    /** The damped journey position. The single source of world state. */
    position: -1,
    /** Ambient clock RATE, damped so pacing changes never step. */
    rate: 1,
  });

  const stateOf = (index: number): EnvironmentState =>
    index < 0 ? NEUTRAL : (ENVIRONMENT_STATES[index] ?? NEUTRAL);


  useFrame((_, delta) => {
    const mat = field.current?.material;
    if (!mat) return;

    const dt = Math.min(delta, 1 / 20);
    const journey = readJourneyState();
    const v = s.current;
    const scratch = scratchRef.current;

    // Ambient time advances only when the tier and the visitor allow it. Held
    // at its last value otherwise, so every layer resolves to a still
    // composition without needing a second code path.
    //
    // The RATE is not constant, and that is the whole of the motion rhythm.
    // Every state previously drifted at the same speed, which averages out to
    // "everything always moves slightly" — the texture of a screensaver, and
    // the reason nothing on the page ever felt like it was holding still or
    // building toward anything. The clock is still monotonic, so nothing can
    // jump; only how fast the world breathes changes. Set below, once the
    // state and the crossing are known.
    let clockRate = 1;

    v.intensity = ease(v.intensity, journey.intensity, 2.2, dt);
    v.arc = ease(v.arc, journey.arc, 2.0, dt);
    v.quiet = ease(v.quiet, journey.quiet, 1.6, dt);
    /* Scroll velocity is the spikiest input in the system and the one most
       easily transmitted straight into the picture.

       Measured across a continuous scroll of the whole arc, camera Z carried
       eight times the jerk of camera Y — and the only difference between the
       two channels is that Z takes a velocity term. The raw signal reverses
       sign on every wheel notch, so anything reading it directly inherits
       that chatter no matter how smooth the rest of the pipeline is.

       Damped far harder than before (1.7 against 3.2). The world now responds
       to the FACT of movement rather than to its instantaneous value, which
       is the difference between a world with mass and a world wired to a
       wheel encoder. */
    v.velocity = ease(
      v.velocity,
      animateAmbient ? normalisedVelocity(90) : 0,
      1.7,
      dt,
    );

    const engaged = pointerState.engaged && !coarse;
    v.px = ease(v.px, engaged ? pointerState.x : 0, 2.0, dt);
    v.py = ease(v.py, engaged ? pointerState.y : 0, 2.0, dt);

    /* ---------------------------------------------------------------------
       Which two states, and how far across.

       The skills filter leans the world toward whichever discipline is being
       read about. It is applied as a nudge on top of the scroll-derived
       state, never as an override: the section still sits where it sits in
       the journey, and the environment only tilts. Nothing in the Skills
       Arsenal depends on this — see skills-focus.ts.
       --------------------------------------------------------------------- */
    /* ONE DAMPED SCALAR DRIVES THE ENTIRE WORLD.

       `journey.position` is where the scroll says the visitor is. `v.position`
       is where the world has actually got to. Damping the gap between them is
       what turns scroll from a slider into an intent:

         - fast scrolling pulls the target far ahead; the world follows at its
           own pace and keeps moving briefly after the wheel stops, which is
           what "mass" feels like.
         - a stopped scroll lets the gap close and the world SETTLE, which is
           the arrival the pacing model needs and which a directly-mapped
           world can never do — it just stops.
         - jitter in the scroll value is absorbed rather than transmitted.

       The rate is deliberately modest. Faster and the world is a slider
       again; slower and it feels disconnected from the input. */
    const focusTarget =
      journey.focus >= 0 ? journey.focus : journey.position;
    v.focusLean = ease(v.focusLean, journey.focus >= 0 ? 0.55 : 0, 1.4, dt);

    const target =
      journey.position + (focusTarget - journey.position) * v.focusLean;

    v.position = ease(v.position, target, 2.6, dt);

    /* from / to / blend are now DERIVED, not chosen.

       Because they come from the floor and fraction of a continuous value,
       there is no moment at which a state "switches" — the pair simply rolls
       over as the fraction wraps, and the blend it hands the shaders is
       exactly as continuous as the scalar it came from. */
    const lastState = ENVIRONMENT_STATES.length - 1;
    const clamped = Math.max(-1, Math.min(lastState, v.position));
    const from = Math.max(-1, Math.min(lastState, Math.floor(clamped)));
    const to = Math.min(lastState, from + 1);
    const blend = Math.max(0, Math.min(1, clamped - from));

    const a = stateOf(from);
    const b = stateOf(to);

    /* ---------------------------------------------------------------------
       Colour. Blended on the CPU — three lerps a frame — so the shaders each
       take one set of colours rather than two plus a mix factor.
       --------------------------------------------------------------------- */
    scratch.deep.copy(a.deep).lerp(b.deep, blend);
    scratch.light.copy(a.light).lerp(b.light, blend);
    scratch.floor.copy(a.floor).lerp(b.floor, blend);
    scratch.shadow.copy(a.shadow).lerp(b.shadow, blend);

    /* A straight channel-wise lerp between two saturated hues travels through
       whatever sits between them in RGB, and between XR's violet and
       Creative's orange that is a muddy maroon nobody chose — the "rainbow
       transition" failure, arrived at from the other direction.

       Two real lights crossing do not do this: one dims while the other
       rises, and the midpoint is less saturated than either end, not a third
       hue. Pulling saturation out at the middle of the crossing reproduces
       that, and it costs one HSL round-trip on one colour per frame. */
    const cross = 1 - Math.abs(blend * 2 - 1);

    /* MOTION RHYTHM.

       Two things set the pace: how still the state itself is, and whether a
       crossing is happening. Creative and Cybersecurity are authored almost
       frozen (calm 0.85 / 0.8), XR drifts freely (0.2). Crossings then push
       the rate well above any state's resting speed and settle back out.

       The effect is that the disciplines READ as holds and the transitions
       read as events, which is the pacing the brief asks for and the one
       thing continuous uniform drift can never produce. */
    const calm = a.calm + (b.calm - a.calm) * blend;
    // Damped as well. An ambient clock whose RATE jumps produces a visible
    // velocity step in every drifting thing at once — the same discontinuity
    // the position scalar was introduced to remove, arriving by another door.
    v.rate = ease(v.rate, (1 - calm * 0.72) * (1 + cross * 1.6), 1.8, dt);
    clockRate = v.rate;
    if (animateAmbient) v.clock += dt * clockRate;

    // Eased so the surge arrives and leaves with weight rather than tracking
    // the crossing curve exactly.
    v.surge = ease(v.surge, animateAmbient ? cross : 0, 2.6, dt);

    if (cross > 0.001) {
      scratch.light.getHSL(scratch.hsl);
      scratch.light.setHSL(
        scratch.hsl.h,
        // Measured at 0.55 the midpoint went fully neutral and the crossing
        // lost both identities at once, which reads as a dip rather than as a
        // change. Enough to kill the muddy intermediate, not enough to grey out.
        scratch.hsl.s * (1 - cross * 0.22),
        scratch.hsl.l * (1 + cross * 0.1),
      );
    }

    // A crossing is the most consequential thing that happens on the page, and
    // it was landing as the DARKEST frame in the journey — the two states are
    // each only half present, so everything keyed to them halves too. A small
    // lift through the middle pays that back without turning the band into a
    // flare.
    const lift = (a.lift + (b.lift - a.lift) * blend) * (1 + cross * 0.34);
    const keyX = a.keyX + (b.keyX - a.keyX) * blend;
    const keyY = a.keyY + (b.keyY - a.keyY) * blend;
    const keyR = a.keyRadius + (b.keyRadius - a.keyRadius) * blend;

    /* ---------------------------------------------------------------------
       THE BACKGROUND. One material, one write.

       This replaced six separate uniform blocks — atmosphere, structures,
       point field, near drift, solid mass and ground — each of which had to be
       kept in agreement with the others about colour, fog and presence. There
       is one surface now, so there is nothing left to keep in agreement.
       --------------------------------------------------------------------- */
    const u = mat.uniforms;
    u.uDeep.value.copy(scratch.deep);
    u.uLight.value.copy(scratch.light);
    u.uShadow.value.copy(scratch.shadow);
    u.uFloor.value.copy(scratch.floor);
    u.uKey.value.set(keyX, keyY);
    u.uKeyRadius.value = keyR;
    u.uLift.value = lift;
    u.uTime.value = v.clock;
    u.uAspect.value = size.width / Math.max(size.height, 1);
    u.uVelocity.value = v.velocity;
    u.uSurge.value = v.surge;
    u.uPointer.value.set(v.px, v.py);
    /* Holds a high floor even where the journey is quiet: this layer IS the
       background, and letting it fall away returns the page to flat black. */
    u.uIntensity.value = 0.66 + v.intensity * 0.34;

    /* ---------------------------------------------------------------------
       Camera.

       Under reduced motion the camera is pinned to the neutral state and
       never travels. The discipline COLOUR states, the composition and the
       transitions all still run — the brief is explicit that reduced motion
       should still feel designed, and that a hidden canvas is not the answer.
       What goes is travel, not design.
       --------------------------------------------------------------------- */
    const cam = camera.current;
    if (cam) {
      const lean = animateAmbient ? 1 : 0;

      /* The camera rides a spline through the authored states rather than
         interpolating between them — see sampleCameraPath. `journeyPos` runs
         -1 (neutral) through 4 (Cybersecurity) and is the same number the
         colour and layer blends are derived from, so the camera can never
         disagree with the world it is looking at. */
      const journeyPos = from + (to - from) * blend;

      if (animateAmbient) {
        sampleCameraPath(journeyPos, scratch.pathPos, scratch.pathTarget);
      } else {
        // Reduced motion: pinned to the neutral rest, no travel at all. The
        // colour states, composition and transitions all still run — what
        // goes is movement, not design.
        scratch.pathPos.set(NEUTRAL_CAMERA.x, NEUTRAL_CAMERA.y, NEUTRAL_CAMERA.z);
        scratch.pathTarget.set(NEUTRAL_CAMERA.tx, NEUTRAL_CAMERA.ty, NEUTRAL_CAMERA.tz);
      }

      const lens = sampleCameraLens(from, to, animateAmbient ? blend : 0);
      let fov = animateAmbient ? lens.fov : NEUTRAL_CAMERA.fov;
      let roll = lens.roll;

      /**
       * Camera travel is damped on a phone rather than removed.
       *
       * The same world-space dolly reads far more strongly through a narrow
       * viewport, and a hand-held screen makes large camera moves feel like
       * the page is sliding rather than like a space opening. Damping keeps
       * the five states distinguishable — they still differ in field of view,
       * which is most of what separates them — while cutting the travel that
       * causes the problem.
       */
      if (coarse) {
        scratch.pathPos.z =
          NEUTRAL_CAMERA.z + (scratch.pathPos.z - NEUTRAL_CAMERA.z) * 0.55;
        scratch.pathPos.y =
          NEUTRAL_CAMERA.y + (scratch.pathPos.y - NEUTRAL_CAMERA.y) * 0.5;
        fov = NEUTRAL_CAMERA.fov + (fov - NEUTRAL_CAMERA.fov) * 0.7;
        roll *= 0.4;
      }

      /* SECOND-ORDER CAMERA SMOOTHING.

         The world position is already damped, so the point sampled off the
         spline is smooth. Damping the camera AGAIN toward that point adds a
         second pole to the response, and the difference is the whole
         character of the move: a single damp tracks its target exactly and
         reads as mechanical interpolation, while two produce a slight,
         constantly-shifting lag — the camera is always fractionally behind
         where the world has got to, and catching up.

         That lag is what a real camera operator's hand does, and it is why
         this reads as gliding rather than as being driven. The rates are
         deliberately unequal: the aim point follows FASTER than the body, so
         the camera looks toward where it is going before it finishes
         arriving, which is the difference between leading a move and being
         dragged through one. */
      const followBody = animateAmbient ? 4.2 : 12;
      const followAim = animateAmbient ? 6.5 : 12;

      scratch.pathPos.set(
        scratch.pathPos.x + v.px * 0.42 * lean,
        scratch.pathPos.y + v.py * 0.3 * lean,
        // Scroll velocity pulls the camera back a little and lets it settle,
        // so moving fast through the page opens the space out.
        scratch.pathPos.z + v.velocity * 0.4 * lean,
      );
      scratch.pathTarget.set(
        scratch.pathTarget.x + v.px * 0.2 * lean,
        scratch.pathTarget.y + v.py * 0.15 * lean,
        scratch.pathTarget.z,
      );

      scratch.camPos.lerp(scratch.pathPos, 1 - Math.exp(-followBody * dt));
      scratch.camAim.lerp(scratch.pathTarget, 1 - Math.exp(-followAim * dt));

      cam.position.copy(scratch.camPos);
      cam.lookAt(scratch.camAim);
      cam.rotation.z = roll * lean;

      if (Math.abs(cam.fov - fov) > 0.01) {
        cam.fov = fov;
        cam.updateProjectionMatrix();
      }
    }

    /* Development-only state bridge. Lost when the six layer-uniform blocks
       were removed — it sat between them — and restored here because the
       environment is driven entirely by derived scroll state, so "what did
       readJourneyState actually return at this position" is not answerable
       from the source. Stripped from production by the NODE_ENV check. */
    if (process.env.NODE_ENV !== "production" && debug.current) {
      const d = debug.current;
      d.from = from;
      d.to = to;
      d.blend = blend;
      d.position = v.position;
      d.targetPosition = journey.position;
      d.camZ = cam ? cam.position.z : 0;
      d.camY = cam ? cam.position.y : 0;
      d.rate = v.rate;
      d.intensity = journey.intensity;
      d.arc = journey.arc;
      d.quiet = journey.quiet;
      d.focus = journey.focus;
    }

    /* ---------------------------------------------------------------------
       PUBLISH THE RESOLVED STATE.

       Written last, once everything above has settled, so the media layer
       reads the same damped position, the same crossing-corrected colours and
       the same smoothed pointer the atmosphere and the camera just used.
       There is one integrator and this is its output — see
       lib/webgl/environment/resolved-state.ts for why the media layer must
       not run a second one.
       --------------------------------------------------------------------- */
    const rs = resolvedEnvironment;
    rs.position = v.position;
    rs.from = from;
    rs.to = to;
    rs.blend = blend;
    rs.cross = cross;
    rs.intensity = v.intensity;
    rs.arc = v.arc;
    rs.quiet = v.quiet;
    rs.pointerX = v.px;
    rs.pointerY = v.py;
    rs.time = v.clock;
    rs.velocity = v.velocity;
    rs.deep.copy(scratch.deep);
    rs.light.copy(scratch.light);
    rs.ambient = animateAmbient;

  });

  return (
    <group>
      <PerspectiveCamera
        ref={camera}
        makeDefault
        position={[NEUTRAL_CAMERA.x, NEUTRAL_CAMERA.y, NEUTRAL_CAMERA.z]}
        fov={NEUTRAL_CAMERA.fov}
        near={0.1}
        far={140}
      />

      {/*
        THE WHOLE BACKGROUND. One fullscreen shader.

        Six layers and a media field used to live here. They are gone: the
        references this was rebuilt against are each a single cohesive animated
        surface, and a stack of parts cannot be made to read as one no matter
        how carefully the parts agree with each other.
      */}
      <FlowField ref={field} octaves={budget.octaves} />
    </group>
  );
}
