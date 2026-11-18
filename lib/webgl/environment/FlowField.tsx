"use client";

import { forwardRef, useEffect, useImperativeHandle, useMemo, useRef } from "react";
import * as THREE from "three";
import { VALUE_FBM, DITHER_8 } from "./shaders";

/**
 * THE BACKGROUND
 * ==============
 *
 * One thing. That is the entire specification, and it is a deliberate
 * reversal.
 *
 * WHAT THIS REPLACES. The environment was six stacked systems — a screen-space
 * atmosphere, a ground plane, an instanced architectural mass, a structural
 * lattice, a point field and a near-camera drift — plus a media layer of six
 * to nine textured planes on top. Every one of them was individually
 * defensible and the sum read as layers of stuff rather than as a place.
 *
 * The three reference sites supplied all do the opposite, and all do the same
 * thing as each other:
 *
 *   Orvae        one continuous 3D world — architecture, clouds, sky — that
 *                the camera travels through.
 *   5Lab         one light field carrying two soft translucent orbs that
 *                blend where they overlap.
 *   MemoryQuest  one object sitting in one large animated coloured glow.
 *
 * Different subjects, identical structure: a SINGLE cohesive animated thing
 * filling the frame. Not a composition of parts.
 *
 * So this is one fullscreen shader. One draw call, one program, no geometry
 * in the scene behind it and nothing layered on top. It is closest to 5Lab of
 * the three, because that is the reference whose language survives having a
 * portfolio's worth of text sitting on it — Orvae's world and MemoryQuest's
 * object both assume the subject IS the content, and here the content is the
 * writing.
 *
 * HOW IT MOVES. Domain-warped fbm: noise whose input coordinates are
 * themselves displaced by noise. That is what makes the motion read as a fluid
 * turning over rather than as a texture sliding past — the field folds into
 * itself, so there is no travel direction to spot and no tile to notice. Two
 * warp passes at the top tier, one lower down.
 *
 * The colour is the discipline palette and nothing else. The brief was "I like
 * the colours" — so `uDeep`, `uLight` and `uShadow` arrive from exactly the
 * same resolved state the old atmosphere used, and the crossings between
 * worlds are unchanged.
 */

const vertexShader = /* glsl */ `
varying vec2 vUv;

void main() {
  vUv = uv;
  /* Straight to clip space — this is a fullscreen pass, not geometry, so no
     view or projection matrix is involved and the camera cannot move it. */
  gl_Position = vec4(position.xy, 0.0, 1.0);
}
`;

function buildFragment(octaves: number, warpPasses: number) {
  return /* glsl */ `
#define WARPS ${warpPasses}
${VALUE_FBM}
${DITHER_8}

uniform vec3  uDeep;
uniform vec3  uLight;
uniform vec3  uShadow;
uniform vec3  uFloor;
uniform float uLift;
uniform float uIntensity;
uniform float uTime;
uniform float uAspect;
uniform float uVelocity;
uniform float uSurge;
uniform vec2  uPointer;
uniform vec2  uKey;
uniform float uKeyRadius;
/** 0 disables the storm entirely. Held at 0 whenever ambient motion is off. */
uniform float uStorm;

varying vec2 vUv;

const int OCTAVES = ${octaves};

float hash11(float n) { return fract(sin(n * 127.1) * 43758.5453); }

/* Domain warp with an UPWARD bias on the second channel.

   A symmetric warp folds the field in place, which reads as marble. Biasing
   one channel against gravity makes the same noise advect: the forms rise,
   stretch and shear as they go, which is what reads as smoke rather than as
   stone. The bias is small; most of the motion still comes from the fold. */
vec2 warp(vec2 p, float t) {
  vec2 q = vec2(
    fbm(p + vec2(0.0, 0.0) + t * 0.05, OCTAVES),
    fbm(p + vec2(5.2, 1.3) - vec2(0.0, t * 0.11), OCTAVES)
  );
  return p + q * 1.35;
}

/* One soft drifting orb. A smooth radial falloff, never a hard disc: the
   reference forms read as volumes of light, so the falloff is wide and the
   power curve keeps the centre from flattening into a flat blob. */
float orb(vec2 p, vec2 centre, float radius) {
  float d = length(p - centre) / max(radius, 0.0001);
  return pow(1.0 - clamp(d, 0.0, 1.0), 2.4);
}

/* THE STORM.

   Time is cut into strike windows; a hash of the window index decides whether
   that window fires at all, how hard, and where. Most windows are duds, which
   is the point: a flash on a predictable beat reads as a strobe, and lightning
   is only dramatic because you cannot anticipate it.

   The envelope is a near-instant attack with two further flickers on top. That
   flicker is most of what makes a flash read as lightning rather than as a
   fade, because a real flash is several strokes down the same channel. */
float strike(float t, out vec2 origin, out float seed) {
  float window = floor(t * 0.21);
  float phase = fract(t * 0.21);
  seed = window;

  float fires = step(0.52, hash11(window * 1.7));
  float power = 0.55 + hash11(window * 3.1) * 0.45;

  origin = vec2(
    (hash11(window * 5.3) - 0.5) * 1.9,
    0.30 + hash11(window * 7.9) * 0.55
  );

  float a = exp(-phase * 46.0);
  float b = exp(-max(phase - 0.030, 0.0) * 38.0) * 0.80;
  float c = exp(-max(phase - 0.075, 0.0) * 30.0) * 0.50;
  return fires * power * max(a, max(b, c));
}

/* THE CHANNEL ITSELF, not the glow around it.

   This is what the first storm pass was missing. It only brightened the cloud,
   and a brightening cloud reads as the sky getting lighter; the thin hot line
   is the thing that makes it read as lightning.

   Distance to a vertical line whose horizontal position is displaced by noise
   keyed on the strike seed, so the channel kinks and wanders differently on
   every strike instead of dropping a straight rod down the frame. */
float bolt(vec2 p, vec2 origin, float seed) {
  float y = p.y - origin.y;
  float n = fbm(vec2(p.y * 2.4 + seed * 13.7, seed * 5.1), 3) - 0.5;
  float x = p.x - origin.x - n * 1.25;

  /* Only below the origin, and widening slightly as it descends. */
  float below = smoothstep(0.05, -0.35, y);
  float taper = mix(0.012, 0.055, clamp(-y * 0.55, 0.0, 1.0));
  float core = 1.0 - smoothstep(0.0, taper, abs(x));
  return core * below;
}

void main() {
  vec2 uv = vUv;
  /* CALMER THAN THE PREVIOUS PASS. 2.8 put many small features across the
     frame and read as turbulent marble. 1.55 makes the forms large and slow,
     which is what was asked for, and large soft forms are also what lets the
     orbs below read as volumes rather than as another noise layer. */
  vec2 p = (uv - 0.5) * vec2(uAspect, 1.0) * 1.55;

  /* CALM, NOT FROZEN. 0.045 worked out at roughly six minutes per orb cycle
     and 0.01 world units per second of drift: mathematically animated,
     visually a still image. 0.16 fixed that; 0.30 is the asked-for step up
     again - an orb circuit in about 55 seconds and billows that visibly roll.
     The orb paths below scale this same t by 0.19-0.41, so the light sources
     stay slower than the cloud: the smoke moves ACROSS them rather than
     everything sliding in lockstep, which is what keeps it reading as weather
     rather than as a panning texture. */
  float t = uTime * 0.30;

  p += uPointer * 0.05;
  p.y -= uVelocity * 0.035;

  vec2 w = p;
  for (int i = 0; i < 2; i++) {
    if (i >= WARPS) break;
    w = warp(w * 0.92, t + float(i) * 2.3);
  }

  float a = fbm(w * 0.8 + vec2(t * 0.06, -t * 0.40), OCTAVES);
  float b = fbm(w * 1.15 + vec2(3.1, 7.7) - vec2(t * 0.04, t * 0.28), OCTAVES);

  /* Softer windows than the turbulent pass: the point now is billow, not
     contrast. */
  float body = smoothstep(0.30, 0.80, a);
  float hue  = smoothstep(0.34, 0.78, b);

  /* ---- the orbs -------------------------------------------------------
     Three large soft volumes on slow independent paths, blended additively so
     overlaps brighten and shift hue the way the reference translucent forms
     do where they cross. They drift rather than orbit: the paths are lissajous
     figures with incommensurate frequencies, so the arrangement never visibly
     repeats. */
  vec2 o1 = vec2(sin(t * 0.37) * 0.62, cos(t * 0.29) * 0.34 + 0.08);
  vec2 o2 = vec2(cos(t * 0.23) * 0.74 + 0.22, sin(t * 0.41) * 0.30 - 0.12);
  vec2 o3 = vec2(sin(t * 0.19 + 2.1) * 0.52 - 0.30, cos(t * 0.33 + 1.3) * 0.40);

  float orbs =
      orb(p, o1, 0.95) * 0.85
    + orb(p, o2, 1.15) * 0.70
    + orb(p, o3, 0.80) * 0.55;

  /* The smoke modulates the orbs rather than sitting beside them, so the light
     looks like it is INSIDE the cloud. This is the single line that makes the
     two systems read as one material instead of two layers. */
  orbs *= 0.45 + body * 0.85;

  /* ---- colour --------------------------------------------------------- */
  vec3 colour = mix(uDeep, uShadow, hue);
  colour = mix(colour, uLight, pow(body, 1.3) * 0.72);
  colour += uLight * clamp(orbs, 0.0, 1.6) * 0.55;

  /* Where smoke density and hue disagree most is the edge of a billow; a
     little extra key there gives the forms a lit rim. */
  float rim = 1.0 - abs(body - hue);
  colour += uLight * pow(rim, 3.5) * 0.16;

  /* A broad key so the frame has a direction the light comes from. */
  vec2 key = (uKey - 0.5) * vec2(uAspect, 1.0);
  float keyFall = 1.0 - smoothstep(0.0, uKeyRadius * 2.1, length(p - key));
  colour += uLight * pow(keyFall, 2.4) * (0.22 + body * 0.38);

  /* Floor bounce, so the frame has a ground rather than running out. */
  float floorRise = pow(1.0 - clamp(uv.y, 0.0, 1.0), 3.0);
  colour += uFloor * floorRise * 0.35;

  /* ---- the storm ------------------------------------------------------
     The flash lights the cloud from a point INSIDE it: smoke density at each
     fragment gates how much of the strike reaches the eye, so dense billows
     glow and thin areas stay dark. That is why it reads as a cloud being lit
     rather than as a white overlay.

     Deliberately biased to the upper frame and damped on the left, because the
     DOM column lives on the lower left and a 13px token does not survive an
     unannounced highlight behind it. */
  vec2 origin;
  float seed;
  float flash = strike(uTime, origin, seed) * uStorm;
  if (flash > 0.001) {
    /* THE SHEET: the cloud lit from inside. Smoke density at each fragment
       gates how much of the strike reaches the eye, so dense billows glow and
       thin air stays dark - that is why it reads as a cloud being lit rather
       than as a white overlay. Considerably stronger than the first pass,
       which was too polite to notice. */
    float reach = 1.0 - smoothstep(0.0, 2.3, length(p - origin));
    float sheet = flash * reach * (0.45 + body * 1.35);
    sheet *= smoothstep(-0.25, 0.50, uv.y);
    sheet *= mix(0.30, 1.0, smoothstep(0.05, 0.6, uv.x));
    colour += mix(uLight, vec3(1.0), 0.45) * sheet * 1.35;

    /* THE CHANNEL. The one place in the whole frame allowed near white, and
       only for the handful of frames a strike lasts. */
    float channel = bolt(p, origin, seed) * flash;
    channel *= mix(0.25, 1.0, smoothstep(0.08, 0.55, uv.x));
    colour += mix(uLight, vec3(1.0), 0.85) * channel * 2.2;
  }

  /* A crossing between two worlds briefly lifts the whole field. */
  colour *= 1.0 + uSurge * 0.3;

  colour *= uLift;
  colour *= 0.55 + uIntensity * 0.45;

  /* Vignette. What turns a lit rectangle into a lit space. */
  vec2 vc = (uv - 0.5) * 2.0;
  colour *= 1.0 - 0.32 * pow(dot(vc, vc) * 0.5, 1.3);

  /* The type column, applied LAST so nothing above, including a strike, can
     push energy back into the left third where the small text lives. */
  float guard = smoothstep(0.02, 0.62, uv.x);
  colour *= mix(0.62, 1.0, guard);

  colour += dither8(gl_FragCoord.xy);

  gl_FragColor = vec4(colour, 1.0);
}
`;
}

export interface FlowFieldHandle {
  readonly material: THREE.ShaderMaterial | null;
}

export const FlowField = forwardRef<FlowFieldHandle, { octaves: number }>(
  function FlowField({ octaves }, ref) {
    const materialRef = useRef<THREE.ShaderMaterial | null>(null);

    /* Warp passes are baked as a preprocessor define rather than driven by a
       uniform: a warp costs a full extra fbm evaluation per fragment across the
       whole viewport, and a branch a uniform controls is still compiled and
       still costs register pressure on the tiers that skip it. */
    const warpPasses = octaves >= 4 ? 2 : 1;

    const material = useMemo(
      () =>
        new THREE.ShaderMaterial({
          vertexShader,
          fragmentShader: buildFragment(octaves, warpPasses),
          depthTest: false,
          depthWrite: false,
          /* Opaque: this is the whole background, so there is nothing behind
             it to blend with and alpha would only cost a blend per fragment. */
          transparent: false,
          toneMapped: false,
          uniforms: {
            uDeep: { value: new THREE.Color("#0a0a0c") },
            uLight: { value: new THREE.Color("#4f7cff") },
            uShadow: { value: new THREE.Color("#131a2a") },
            uFloor: { value: new THREE.Color("#0b0d13") },
            uLift: { value: 1 },
            uIntensity: { value: 0 },
            uTime: { value: 0 },
            uAspect: { value: 1.777 },
            uVelocity: { value: 0 },
            uSurge: { value: 0 },
            uPointer: { value: new THREE.Vector2() },
            uKey: { value: new THREE.Vector2(0.5, 0.5) },
            uKeyRadius: { value: 0.7 },
            uStorm: { value: 1 },
          },
        }),
      [octaves, warpPasses],
    );

    useImperativeHandle(ref, () => ({
      get material() {
        return materialRef.current;
      },
    }), []);

    useEffect(() => () => material.dispose(), [material]);

    return (
      /* renderOrder puts this first regardless of scene-graph order, and
         depthTest:false keeps it from occluding anything drawn after. */
      <mesh frustumCulled={false} renderOrder={-100}>
        <planeGeometry args={[2, 2]} />
        <primitive object={material} attach="material" ref={materialRef} />
      </mesh>
    );
  },
);
