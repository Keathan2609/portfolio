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

void main() {
  // Two octaves: a slow swell, and a finer ripple that catches the rim light.
  float slow = snoise(normal * 1.15 + uTime * 0.09);
  float fine = snoise(normal * 3.4 - uTime * 0.16) * 0.35;
  float displace = (slow + fine) * uAmplitude;

  vec3 displaced = position + normal * displace;

  vec4 mv = modelViewMatrix * vec4(displaced, 1.0);
  vNormal = normalize(normalMatrix * normal);
  vView = normalize(-mv.xyz);
  vDisplace = displace;
  vUp = position.y / RADIUS;

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
  vec3 color = mix(uCore, uAccent, rim);
  color += uAccent * smoothstep(0.05, 0.28, vDisplace) * 0.18;

  /* MUCH QUIETER THAN AUTHORED, because what it sits on has changed.
     These values were set when this object had a view to itself, which drei
     cleared to flat black before drawing — a near-white rim at 0.9 alpha is
     restrained against black. It now composites over lit, moving smoke, and
     at those values it read as chrome: it burned through the statement
     lines and the discipline index behind it. The body still carries the
     form; the rim just stopped shouting. */
  float alpha = (0.05 + rim * 0.34) * uOpacity;

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
 * Scale, and ONLY scale. An attempt to widen this by stretching one axis
 * and churning the noise harder did cover the name, and destroyed the form
 * doing it — the shape is the thing worth keeping, so it is scaled up whole
 * and nothing else about it changed.
 *
 * The authored framing was 0.69, from a 1.05 sphere through a 38-degree
 * lens 4.4 units back, sized for a view of its own centred on the screen.
 * Pinned behind the name that reached down through the headline and the
 * discipline index, which is why an earlier pass cut it to 0.50. The
 * underside dissolve is what buys the room back: it fades the lower half
 * before it ever arrives at the small type, so the mass can be larger than
 * the thing that first forced it smaller.
 */
const FRAME_FILL = 0.66;

/** A little wider than the type, so the name sits inside the mass. */
const WIDTH_MARGIN = 1.0;

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
      uAmplitude: { value: 0.16 },
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

      /* SIZED AGAINST WHICHEVER EDGE IS NEARER, not always the height.
       *
       * A perspective fov describes the VERTICAL field, so sizing to it
       * alone is only safe while the viewport is landscape. On a portrait
       * phone the width is less than half the height, and a mass set to two
       * thirds of the half-height came out nearly half again wider than the
       * screen: both its sides fell outside the frame and all that was left
       * on screen was a corner of it. Which is the same failure as making
       * it too big on desktop — a shape stops being a shape the moment its
       * silhouette leaves the frame.
       *
       * Taking the limiting half-dimension means FRAME_FILL reads the same
       * on any aspect: the fraction of the SHORTER axis the mass spans. */
      const aspect = Math.max(size.width, 1) / Math.max(size.height, 1);
      const limiting = halfFrame * Math.min(1, aspect);
      const distance = RADIUS / Math.max(FRAME_FILL * limiting, 0.0001);

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

      /* STRETCHED TO THE NAME, and stretched is ALL that happens here.
       *
       * A round mass cannot span the name at any size: the name is most of
       * the viewport across and a tenth of it down, so a circle wide enough
       * is about twice the viewport tall, and at that size both its sides
       * leave the frame and it stops reading as a shape at all. The only
       * way to cover the type is a form wider than it is tall.
       *
       * An earlier attempt at this bundled the stretch together with a
       * churnier noise field, resampled normals and no rotation, and the
       * result destroyed the form. So this touches one number and nothing
       * else: the field, the amplitude, the yaw and the shading are exactly
       * what they were. Only X is scaled — Y carries the underside
       * dissolve, which is keyed to unscaled object space.
       *
       * Derived from the measured name, clamped so it can never be narrower
       * than the sphere it started as nor smeared across the page by a
       * freak measurement. */
      const radiusPx = FRAME_FILL * (Math.min(size.width, size.height) / 2);
      const wantHalfW =
        ((heroAnchor.widthFrac * Math.max(size.width, 1)) / 2) * WIDTH_MARGIN;
      const stretch = Math.min(Math.max(wantHalfW / radiusPx, 1), 2.6);
      group.scale.set(stretch, 1, 1);
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

    if (core.current) {
      core.current.rotation.x = target.current.x;
      core.current.rotation.y = target.current.y + time * 0.1;
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
