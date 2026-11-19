"use client";

import { useEffect, useMemo, useRef } from "react";
import { useThree } from "@react-three/fiber";
import * as THREE from "three";
import { useSceneFrame } from "@/lib/webgl/hooks/useSceneFrame";
import { disposeObject } from "@/lib/webgl/utils/dispose";
import { heroPresence } from "@/lib/webgl/utils/envelope";
import { FRESNEL, SIMPLEX_3D } from "@/lib/webgl/shaders/chunks";
import { damp } from "@/lib/utils/math";
import { heroAnchor } from "@/lib/webgl/hero-anchor";
import { scrollState } from "@/lib/scroll/scroll-state";

/**
 * THE CLOUD BEHIND THE NAME.
 *
 * A sphere pushed around by two octaves of simplex noise and lit only at its
 * rim, so it reads as a soft mass rather than as geometry. It sits behind the
 * hero's name and is the one thing in the hero that is not flat.
 *
 * WHAT WAS REMOVED, AND WHY
 *
 * This carried a second object: an icosahedral wireframe at a larger radius,
 * counter-rotating, described as a structural cage. It is gone at Keathan's
 * request — the cloud was always the subject, and the cage was a grid drawn
 * around it.
 *
 * It also declared `<PerspectiveCamera makeDefault>`. So does the journey
 * environment, and drei's View renders every view with the single global
 * `state.camera` — there is no per-view camera. Two makeDefault declarations
 * is a race, not a configuration, and whichever mounted last silently
 * decided the framing for both. When the environment won, this object was
 * drawn through a camera 9.4 units back aimed 8 units behind the origin,
 * which is nowhere near where anyone was looking.
 *
 * WHY IT RENDERS NOW, after a long time rendering nothing at all.
 *
 * Its material was attached with `<primitive object={material}
 * attach="material" />`, and that attach was not taking. A mesh with no
 * material is skipped by three.js in silence — no warning, no error, and
 * every ref, uniform and opacity still reading back perfectly correct from
 * outside, which is what made this look like a positioning problem for so
 * long. A probe mesh at the identical position with an inline
 * `<meshBasicMaterial>` drew immediately, and that is what finally separated
 * "not positioned" from "not drawn".
 *
 * The material is passed as a prop now, which is the form R3F documents for
 * an instance you constructed yourself.
 */

const RADIUS_GLSL = "1.05";

const vertexShader = /* glsl */ `
#define RADIUS ${RADIUS_GLSL}
${SIMPLEX_3D}

uniform float uTime;
uniform float uAmplitude;

varying vec3 vNormal;
varying vec3 vView;
varying float vDisplace;
/* Normalised height within the object, -1 at the base and 1 at the top.
   The group is camera-aligned, so this is screen-up and can be used to
   decide what the cloud is allowed to cover. */
varying float vUp;

/* THE DISPLACEMENT FIELD, factored out so the normal can resample it.

   SMOKE, NOT A SPINNING BALL. An earlier version translated one noise field
   slowly and rotated the mesh underneath it, which is the recipe for a
   lumpy solid: the silhouette held its shape and simply turned. Smoke does
   the opposite — the volume stays roughly where it is while its internal
   structure boils through it and rises.

   So the mesh barely rotates now, and three octaves are advected through
   the sampling frame instead. Sampling at -y means the forms they carve
   travel UP through the body, each faster than the one below it, so the
   surface churns rather than slides. The horizontal terms are small and
   deliberately not multiples of the vertical ones, so nothing visibly
   repeats. */
float field(vec3 n, float t) {
  float slow = snoise(n * 1.15 + vec3(t * 0.07, -t * 0.52, t * 0.11));
  float mid  = snoise(n * 2.70 + vec3(-t * 0.13, -t * 0.88, t * 0.05)) * 0.46;
  float fine = snoise(n * 5.40 + vec3(t * 0.09, -t * 1.37, -t * 0.17)) * 0.18;
  return (slow + mid + fine) * uAmplitude;
}

vec3 surfaceAt(vec3 n, float t) {
  return n * (RADIUS + field(n, t));
}

void main() {
  float t = uTime * 0.26;

  float displace = field(normal, t);
  vec3 displaced = normal * (RADIUS + displace);

  /* THE NORMAL IS RESAMPLED, NOT INHERITED, and that is the difference
     between smoke and crumpled foil.

     This used to shade with the undisplaced sphere normal, so the light had
     no idea where the surface had actually moved to. Folds caught highlights
     that did not belong to them and the whole mass read as creased sheet
     metal — flat planes with bright edges, exactly what it should not be.

     Two neighbours are evaluated a small step away along the tangent plane,
     pushed through the same field, and the cross product of the resulting
     edges gives the true surface normal. Three field evaluations per vertex
     rather than one, which is cheap here: this is a vertex shader over a
     few thousand points, not a fragment shader over the viewport. */
  vec3 axis = abs(normal.y) < 0.99 ? vec3(0.0, 1.0, 0.0) : vec3(1.0, 0.0, 0.0);
  vec3 t1 = normalize(cross(axis, normal));
  vec3 t2 = cross(normal, t1);

  float e = 0.045;
  vec3 pA = surfaceAt(normalize(normal + t1 * e), t);
  vec3 pB = surfaceAt(normalize(normal + t2 * e), t);

  vec3 n = normalize(cross(pA - displaced, pB - displaced));
  // Keep it pointing out of the body whichever way the cross product fell.
  n *= sign(dot(n, normal));

  vec4 mv = modelViewMatrix * vec4(displaced, 1.0);
  vNormal = normalize(normalMatrix * n);
  vView = normalize(-mv.xyz);
  vDisplace = displace;
  vUp = normal.y;

  gl_Position = projectionMatrix * mv;
}
`;

const fragmentShader = /* glsl */ `
${FRESNEL}

uniform vec3 uAccent;
uniform vec3 uCore;
uniform float uOpacity;

varying vec3 vNormal;
varying vec3 vView;
varying float vDisplace;
varying float vUp;

void main() {
  float rim = fresnel(vView, vNormal, 2.6);

  // The body stays near-black; the accent lives only in the rim and in the
  // crests of the displacement. Restraint is the point.
  /* Thickness through the volume. A translucent mass is deepest through the
     middle of its silhouette and thinnest at the edge, which is the exact
     inverse of the rim term — carrying both is what stops this reading as a
     lit bubble. */
  float body = 1.0 - rim;

  /* ACROSS THE NAME, THE MASS KEEPS ITS BODY AND LOSES ITS HIGHLIGHT.
   *
   * The two halves of this material do opposite things to legibility. The
   * body is near-black, so where it covers the lit smoke it DARKENS the
   * background and white type gains contrast. The rim is near-white, and a
   * bright wisp drifting behind a letterform takes contrast away — measured
   * at 2.34:1 against a 3:1 floor once the mass was wide enough to cross
   * the whole name.
   *
   * So only the highlight is suppressed there, and only in a band. Because
   * this geometry is a camera-facing sphere, a surface normal's y component
   * IS its vertical offset on screen over the radius, which makes vUp an
   * exact screen-space band without projecting anything. The name occupies
   * roughly the middle quarter of the mass, hence the thresholds.
   *
   * The result is that the smoke still passes over the name — that was the
   * point — it just stops catching the light while it does. */
  float onType = 1.0 - smoothstep(0.20, 0.52, abs(vUp));
  float lit = rim * (1.0 - onType * 0.82);

  vec3 color = mix(uCore, uAccent, lit);
  color += uAccent * smoothstep(0.05, 0.28, vDisplace) * 0.18 * (1.0 - onType * 0.82);

  /* MUCH QUIETER THAN AUTHORED, because what it sits on has changed.
     These values were set when this object had a view to itself, which drei
     cleared to flat black before drawing — a near-white rim at 0.9 alpha is
     restrained against black. It now composites over lit, moving smoke, and
     at those values it read as chrome: it burned through the statement
     lines and the discipline index behind it. The body still carries the
     form; the rim just stopped shouting. */
  /* DENSER, and almost all of the increase is in the body rather than the
     rim. That matters for more than taste: the body is near-black, so
     thickening it DARKENS the lit smoke behind the name and the white type
     gains contrast, while the same increase spent on a near-white rim would
     have cost it. */
  float alpha = (0.07 + body * 0.26 + lit * 0.34) * uOpacity;

  /* THE UNDERSIDE DISSOLVES, for a reason that is equal parts craft and
     accessibility. A mass with a hard lower edge reads as an object; a
     cloud thins out and lets go. And everything small on this screen lives
     below the name — the statement lines, the headline, the discipline
     index — so a bright rim travelling through that band is the one place
     this object can do real damage. Measured before this term, the headline
     sat at 1.60:1 and the index at 2.02:1 against a 4.5 floor. */
  alpha *= mix(0.06, 1.0, smoothstep(-0.95, -0.05, vUp));
  gl_FragColor = vec4(color, alpha);
}
`;

/** Geometry radius, before displacement pushes the surface around. */
const RADIUS = 1.05;

/**
 * How much of the visible frame HALF-height the cloud spans.
 *
 * The authored framing was 0.69 — a 1.05 sphere through a 38-degree lens
 * from 4.4 units back. That was sized for a view of its own, centred on the
 * screen. Pinned behind the name it reached down through the headline and
 * the discipline index, so it is smaller here: half the frame half-height,
 * which keeps it around the name and off the small type.
 */
const FRAME_FILL = 0.50;

/** A little wider than the type, so the name sits inside the mass. */
const WIDTH_MARGIN = 1.14;

/** Scratch vectors. Allocating these per frame would be 60 a second. */
const _forward = new THREE.Vector3();
const _up = new THREE.Vector3();
const _right = new THREE.Vector3();

export function HeroObject({ accent = "#f2f2f4" }: { accent?: string }) {
  const anchor = useRef<THREE.Group>(null);
  const core = useRef<THREE.Mesh>(null);
  const target = useRef({ x: 0, y: 0 });

  const { pointer, camera: activeCamera, size } = useThree();

  const uniforms = useMemo(
    () => ({
      uTime: { value: 0 },
      uAmplitude: { value: 0.27 },
      uAccent: { value: new THREE.Color(accent) },
      uCore: { value: new THREE.Color("#0d0d12") },
      uOpacity: { value: 1 },
    }),
    [accent],
  );

  const material = useMemo(
    () =>
      new THREE.ShaderMaterial({
        vertexShader,
        fragmentShader,
        uniforms,
        transparent: true,
        depthWrite: false,
        /* DEPTH IS NEVER CLEARED IN THIS SCENE. The background is a
           fullscreen pass that writes no depth, and the view it renders
           through clears colour only — so whatever sits in the depth buffer
           is stale and arbitrary. There is no meaningful depth here anyway:
           one fullscreen quad and one camera-facing mass, ordered entirely
           by renderOrder. */
        depthTest: false,
        blending: THREE.NormalBlending,
      }),
    [uniforms],
  );

  useEffect(() => {
    const node = anchor.current;
    return () => {
      material.dispose();
      if (node) disposeObject(node);
    };
  }, [material]);

  useSceneFrame("hero", ({ dt, time, progress }) => {
    material.uniforms.uTime.value = time;

    /* RIDE THE ACTIVE CAMERA rather than competing with it. Placed along the
       camera's forward axis at whatever distance makes the cloud span a
       constant fraction of the frame, so the lens changing as the journey
       moves cannot resize it. */
    const cam = activeCamera as THREE.PerspectiveCamera;
    const group = anchor.current;
    if (group && cam) {
      const fov = typeof cam.fov === "number" ? cam.fov : 46;
      const halfFrame = Math.tan((fov * Math.PI) / 360);
      const distance = RADIUS / Math.max(FRAME_FILL * halfFrame, 0.0001);

      _forward.set(0, 0, -1).applyQuaternion(cam.quaternion);
      _up.set(0, 1, 0).applyQuaternion(cam.quaternion);
      _right.set(1, 0, 0).applyQuaternion(cam.quaternion);

      /* BEHIND THE NAME, not in the middle of the screen.
       *
       * The name's viewport position is derived rather than measured: its
       * document position is known (see hero-anchor.ts) and the smoothed
       * scroll offset is already in hand, so subtracting one from the other
       * costs nothing and avoids a layout read on the hot path. Lenis's
       * smoothed value, not window.scrollY — the cloud has to sit with the
       * name as it is PAINTED, and under smooth scrolling those two differ
       * by as much as a third of a screen mid-flick.
       *
       * Centring on the viewport instead put the mass over the statement
       * lines and the discipline index, which is both the wrong place and
       * the wrong thing to cover.
       *
       * This also replaces the old sink. The cloud no longer needs to be
       * pushed out of frame on scroll, because it is pinned to a name that
       * scrolls away on its own. */
      const halfH = distance * halfFrame;
      const halfW = halfH * Math.max(size.width, 1) / Math.max(size.height, 1);

      const nameY = heroAnchor.measured
        ? 1 - (2 * (heroAnchor.docY - scrollState.scroll)) / Math.max(size.height, 1)
        : 0;
      const nameX = heroAnchor.measured ? heroAnchor.x * 2 - 1 : 0;

      group.position
        .copy(cam.position)
        .addScaledVector(_forward, distance)
        .addScaledVector(_right, nameX * halfW)
        .addScaledVector(_up, nameY * halfH);
      group.quaternion.copy(cam.quaternion);

      /* WIDE ENOUGH TO COVER THE NAME.
       *
       * The name is a wide, short block — most of the viewport across and a
       * tenth of it down — so a sphere big enough to cover it horizontally
       * would be several times too tall, and would swallow everything under
       * it. Stretching one axis is the honest fix: the cloud becomes an
       * ellipsoid as wide as the type and no taller than it already was.
       *
       * The scale is derived from the measured name rather than fixed,
       * which is what makes the two-line wrap on narrow viewports work
       * without a breakpoint — a narrower name simply asks for less stretch.
       *
       * Note this stretches the noise with it, and that is wanted: smoke
       * drawn out sideways is still smoke, and the elongation reads as
       * drift across the frame.
       *
       * Clamped at the bottom so it is never narrower than the sphere it
       * started as, and at the top so a freak measurement cannot smear it
       * across the whole page. Only X is touched: Y carries the underside
       * dissolve, which is keyed to unscaled object space. */
      const radiusPx = FRAME_FILL * (Math.max(size.height, 1) / 2);
      const wantHalfW =
        (heroAnchor.widthFrac * Math.max(size.width, 1)) / 2 * WIDTH_MARGIN;
      const scaleX = Math.min(Math.max(wantHalfW / radiusPx, 1), 3.4);
      group.scale.set(scaleX, 1, 1);
    }

    /* Pointer parallax, damped. Small range on purpose — the mass should
       acknowledge the cursor, not chase it.

       The finite guards are not defensive padding. R3F derives `pointer`
       from the view's measured size, which is undefined until that
       measurement lands, so an event arriving in the gap yields NaN. One NaN
       reaches a rotation, three.js propagates it through the matrix, and the
       entire subtree stops rendering while everything still reads correct
       from outside. */
    const px = Number.isFinite(pointer.x) ? pointer.x : 0;
    const py = Number.isFinite(pointer.y) ? pointer.y : 0;
    if (!Number.isFinite(target.current.x)) target.current.x = 0;
    if (!Number.isFinite(target.current.y)) target.current.y = 0;

    target.current.x = damp(target.current.x, py * 0.22, 3, dt);
    target.current.y = damp(target.current.y, px * 0.3, 3, dt);

    /* Pointer lean only. The steady yaw that used to live here is gone: a
       rotating body is the single strongest cue that something is solid,
       and all of the motion now belongs to the noise rising through it. */
    if (core.current) {
      core.current.rotation.x = target.current.x * 0.5;
      core.current.rotation.y = target.current.y * 0.5;
    }

    // Fade as the hero hands over, so it leaves rather than switching off.
    material.uniforms.uOpacity.value = heroPresence(progress);
  });

  return (
    <group ref={anchor}>
      <mesh ref={core} material={material} frustumCulled={false}>
        <icosahedronGeometry args={[RADIUS, 24]} />
      </mesh>
    </group>
  );
}
