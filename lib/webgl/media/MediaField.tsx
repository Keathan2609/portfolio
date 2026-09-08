"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import * as THREE from "three";
import { useQuality } from "@/lib/performance/QualityProvider";
import { useReducedMotion } from "@/lib/animation/MotionProvider";
import { prefersLightPayload } from "@/lib/performance/quality";
import { resolvedEnvironment } from "@/lib/webgl/environment/resolved-state";
import { MediaPlane, type MediaPlaneHandle } from "./MediaPlane";
import { compositionByIndex, itemAllowed } from "./compositions";
import { configureTextureCache } from "./texture-cache";

/**
 * THE MEDIA FIELD
 * ===============
 *
 * The layer that turned this from a procedural backdrop into a composition.
 *
 * It mounts the discipline compositions that are near the current journey
 * position, and drives every plane in them from ONE frame callback. Planes do
 * not animate themselves and do not read scroll; they are written to.
 *
 * WHAT DECIDES WHAT IS MOUNTED. Only compositions within one state of the
 * damped position exist in the scene graph — at most two, and exactly two only
 * while a crossing is in progress. Everything else is unmounted, which
 * releases its textures. This is the entire texture budget strategy: the
 * resident set is never "all 39 encoded assets", it is the couple of
 * compositions the visitor can currently see. Mounting is React state and
 * changes a handful of times across a 23,000px scroll, so it costs nothing
 * that matters.
 *
 * PRESENCE, NOT VISIBILITY. Each composition has a presence value that peaks
 * at 1 when its state is centred and falls to 0 a full state away. Presence
 * drives the reveal wipe, the opacity and whether video plays. Because it is
 * derived from the same damped scalar the camera and the colour are, a
 * composition assembles as its world arrives and disassembles as the next one
 * takes over — the recomposition the brief asks for is this curve, applied per
 * plane with a stagger.
 *
 * The planes are added to the environment's own group, so they inherit the
 * camera choreography, the fog and the discipline colour with no extra work.
 * A media plane is IN the world, not on top of it.
 */

/** Frame-rate independent easing toward a target. */
function ease(current: number, target: number, rate: number, dt: number) {
  return current + (target - current) * (1 - Math.exp(-rate * dt));
}

function clamp01(v: number) {
  return v < 0 ? 0 : v > 1 ? 1 : v;
}

function smooth(t: number) {
  const c = clamp01(t);
  return c * c * (3 - 2 * c);
}

/** How far from a state's centre a composition still has any presence. */
const PRESENCE_SPAN = 1.0;
/**
 * Mount radius, and the number that decides the whole texture budget.
 *
 * MEASURED AND CORRECTED. This was 1.18 — chosen so a composition mounts
 * slightly before it has any presence, which is right — but 1.18 > 1.0 means
 * that standing at the exact centre of a state, BOTH neighbours are also
 * within range. Audited at XR centred (position 0.996) that put three
 * compositions in the scene graph at once and eight media textures resident,
 * roughly 32 MB of VRAM to render a chapter that shows four planes.
 *
 * At 0.86 a state centre mounts only itself, and a crossing — where the
 * position sits near x.5 and both neighbours are 0.5 away — still mounts
 * exactly the two it is between. That is the intended "at most two", and it
 * cuts the resident set by roughly a third with no visual change, because the
 * compositions that were being paid for had zero presence anyway.
 */
const MOUNT_SPAN = 0.86;

export function MediaField() {
  /* `animateAmbient` is deliberately NOT read here: motion suppression comes
     from `resolvedEnvironment.ambient`, which is the same answer resolved by
     the one integrator, so the media layer cannot disagree with the
     atmosphere about whether the world is moving. */
  const { tier, density, video: tierAllowsVideo } = useQuality();
  const reduced = useReducedMotion();
  const gl = useThree((s) => s.gl);
  const size = useThree((s) => s.size);

  /* Anisotropy is a renderer capability, so the cache is configured once the
     real renderer exists rather than guessed at module load. */
  useEffect(() => {
    configureTextureCache(gl);
  }, [gl]);

  const variant = tier === "low" ? "sm" : "lg";

  /**
   * Viewport adaptation, derived from the real canvas aspect.
   *
   * The compositions are authored against a landscape frame (aspect ≈ 1.6).
   * Below that, horizontal room shrinks in direct proportion — the visible
   * half-width is `halfHeight · aspect` — so offsets have to be compressed or
   * the planes simply leave the frame. Measured at 390x844 (aspect 0.46) the
   * XR chapter rendered no reactor at all.
   *
   * `xScale` tracks the aspect ratio against the authored one, floored at 0.3
   * so a very narrow phone still gets a little lateral offset rather than a
   * dead-centre stack. `yScale` goes slightly ABOVE 1 on portrait, spreading
   * the composition into the height a tall frame actually has. `sizeScale`
   * trims the planes a little, because the same plane at the same world size
   * covers proportionally far more of a narrow frame.
   *
   * Recomputed only when the canvas is resized — this is a memo on size, not
   * per-frame work.
   */
  const adapt = useMemo(() => {
    const aspect = size.width / Math.max(size.height, 1);
    const authored = 1.6;
    if (aspect >= authored) return { xScale: 1, yScale: 1, sizeScale: 1 };
    const ratio = aspect / authored;
    return {
      xScale: Math.max(0.3, ratio),
      yScale: aspect < 1 ? 1.25 : 1.05,
      sizeScale: Math.max(0.62, 0.72 + ratio * 0.28),
    };
  }, [size.width, size.height]);

  /* The same withholding rules the DOM Media component applies, checked here
     rather than inherited, so the guarantee survives someone re-tuning tiers. */
  const allowVideo = tierAllowsVideo && !reduced && !prefersLightPayload();

  /**
   * Which compositions exist right now.
   *
   * React state deliberately — this is mount/unmount, not animation. It
   * changes when the visitor crosses into range of a new discipline, which is
   * a handful of times per journey, and each change releases the textures of
   * whatever left range.
   */
  const [mounted, setMounted] = useState<number[]>([]);
  /**
   * The set useFrame has most recently decided on.
   *
   * Written ONLY inside useFrame, never during render. An earlier version
   * assigned `mountedRef.current = mounted` in the component body to keep the
   * two in sync, which React's own lint rule correctly rejects: a ref write
   * during render is invisible to the reconciler and breaks under concurrent
   * rendering and the React Compiler. Keeping the decision in the ref and
   * treating state purely as its published copy removes the need to sync at
   * all — the ref is the source of truth for "what did I last choose", and
   * state is the source of truth for "what is currently rendered".
   */
  const desired = useRef<number[]>([]);

  /* Handles for every live plane, keyed by composition index. Written by the
     child callback refs below and read inside useFrame. Never a state update. */
  const handles = useRef(new Map<number, Map<string, MediaPlaneHandle>>());

  const registerHandle = useCallback(
    (index: number, id: string, handle: MediaPlaneHandle | null) => {
      let group = handles.current.get(index);
      if (!group) {
        group = new Map();
        handles.current.set(index, group);
      }
      if (handle) group.set(id, handle);
      else group.delete(id);
    },
    [],
  );

  /* Smoothed per-composition presence, held across frames. */
  const presence = useRef(new Map<number, number>());

  /* Scratch colours, allocated once. The rest of this project's frame path is
     allocation-free and this is on the same hot path. */
  const scratch = useRef({
    deep: new THREE.Color(),
    light: new THREE.Color(),
  });

  const items = useMemo(() => {
    const out = new Map<number, ReturnType<typeof buildItems>>();
    for (const key of Object.keys(compositionByIndex)) {
      const index = Number(key);
      out.set(index, buildItems(index, tier, density));
    }
    return out;
  }, [tier, density]);

  useFrame((_, delta) => {
    const env = resolvedEnvironment;
    const dt = Math.min(delta, 1 / 20);

    /* ---- mount set ---------------------------------------------------- */
    const near: number[] = [];
    for (let i = 0; i <= 4; i += 1) {
      if (Math.abs(env.position - i) <= MOUNT_SPAN) near.push(i);
    }
    const current = desired.current;
    if (near.length !== current.length || near.some((v, i) => v !== current[i])) {
      /* The ref is updated first so the comparison stays correct on the
         frames between this decision and React committing it — otherwise the
         same setMounted would fire every frame until the commit lands. */
      desired.current = near;
      setMounted(near);
    }

    /* ---- per-composition presence ------------------------------------- */
    for (const index of near) {
      const distance = Math.abs(env.position - index);
      const target = smooth(1 - clamp01(distance / PRESENCE_SPAN));
      const prev = presence.current.get(index) ?? 0;
      /* Assembly is slower than disassembly. A composition should arrive with
         weight and clear out of the way promptly when the next world is
         taking the frame — equal rates make a crossing feel mushy in the
         middle, because both compositions sit at half presence for as long as
         each takes to move. */
      const rate = target > prev ? 2.1 : 3.4;
      presence.current.set(index, ease(prev, target, rate, dt));
    }

    /* ---- write every plane -------------------------------------------- */
    for (const [index, group] of handles.current) {
      const p = presence.current.get(index) ?? 0;
      const compItems = items.get(index);
      if (!compItems) continue;

      for (const handle of group.values()) {
        const mat = handle.material;
        if (!mat) continue;
        const item = handle.item;
        const u = mat.uniforms;

        /* Staggered reveal. Each plane's window is offset by its order, so a
           composition assembles as a sequence rather than as one block —
           the glass first, then the hero, then the supporting material. */
        const order = item.order ?? 0;
        const stagger = Math.min(order * 0.085, 0.5);
        const local = clamp01((p - stagger) / Math.max(1 - stagger, 0.35));

        /* A plane whose texture has not arrived holds at zero rather than
           wiping onto an empty rectangle. */
        const gate = item.kind === "glass" || handle.loaded() ? 1 : 0;

        u.uReveal.value = local * gate;
        u.uOpacity.value = (item.opacity ?? 1) * local * gate * env.intensity;

        /* Colour comes from the resolved environment, so glass panels and
           tinted support planes are always the hue of the world they are in
           and cross with it rather than after it. */
        u.uDeep.value.copy(env.deep);
        u.uLight.value.copy(env.light);
        u.uTint.value.copy(env.light);

        /* Screen resolution, for the type-column guard. Written per frame
           because the canvas can be resized at any point. */
        u.uResolution.value.set(size.width, size.height);

        u.uTime.value = env.time;
        u.uDrift.value = env.ambient ? (item.drift ?? 0) : 0;
        u.uPointer.value.set(
          env.pointerX * (env.ambient ? 1 : 0),
          env.pointerY * (env.ambient ? 1 : 0),
        );

        /* A crossing lifts the edges of every plane briefly. It is the same
           reasoning the structural layer uses: a transition is the most
           consequential moment on the page and was otherwise the dimmest. */
        u.uEdge.value = (item.edge ?? 0.3) * (1 + env.cross * 0.8);

        /* Video plays only while its composition genuinely holds the frame,
           and pauses the moment it starts giving way. */
        if (item.kind === "video") handle.setPlaying(p > 0.55 && env.ambient);
      }
    }

    void scratch;
  });

  return (
    <group name="media-field">
      {mounted.map((index) => {
        const compItems = items.get(index);
        if (!compItems) return null;
        return (
          <group key={index} name={`composition-${index}`}>
            {compItems.map((item) => (
              <MediaPlane
                key={item.id}
                item={item}
                variant={variant}
                allowVideo={allowVideo}
                adapt={adapt}
                ref={(h) => registerHandle(index, item.id, h)}
              />
            ))}
          </group>
        );
      })}
    </group>
  );
}

/**
 * Resolve a composition's item list for the current tier.
 *
 * Thinning rather than shrinking: planes below the tier floor are dropped
 * entirely so the authored focal relationship of what remains is intact. A
 * composition that kept all its planes at lower resolution would be uniformly
 * worse, whereas one that keeps its hero and its glass is simply quieter.
 */
function buildItems(index: number, tier: string, density: number) {
  const composition = compositionByIndex[index];
  if (!composition) return [];
  const allowed = composition.items.filter((item) => itemAllowed(item, tier));

  /* A final cap from density, so a device that degraded at runtime sheds
     planes too rather than only shedding particles.

     THE LOW CAP WAS 2 AND THAT WAS WRONG, for a reason that only showed up
     under QA. Reduced motion caps the tier to "low" (see QualityProvider), so
     a visitor on a fast desktop who simply asked for less movement was being
     given a two-item composition — one glass panel and one image — while the
     procedural layers behind it had also just been demoted. The result was
     emptier than the site had been BEFORE this pass, which is the opposite of
     the requirement: reduced motion has to keep the composition and lose the
     movement, not lose both.

     Four items keeps glass + hero + two supporting planes, which still reads
     as an authored frame. It is affordable because the LOW tier is already
     fetching the `-sm` variants — four 640px textures is roughly 5 MB of
     VRAM, against ~19 MB for the full-size four. Motion is suppressed
     separately and correctly, by `env.ambient` zeroing drift and parallax. */
  const cap = density >= 1 ? allowed.length : density >= 0.6 ? 6 : 4;
  return allowed.slice(0, cap);
}
