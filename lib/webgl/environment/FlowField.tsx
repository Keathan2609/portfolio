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

varying vec2 vUv;

const int OCTAVES = ${octaves};

/* Domain warp. The field's own noise displaces the coordinates the next
   octave is sampled at, which is what turns a scrolling texture into
   something that folds and turns over in place. */
vec2 warp(vec2 p, float t) {
  vec2 q = vec2(
    fbm(p + vec2(0.0, 0.0) + t * 0.08, OCTAVES),
    fbm(p + vec2(5.2, 1.3) - t * 0.06, OCTAVES)
  );
  return p + q * 1.6;
}

void main() {
  /* Aspect-corrected and centred so the field is never stretched into
     ellipses on a wide monitor. */
  vec2 uv = vUv;
  /* SPATIAL SCALE IS THE WHOLE DIFFERENCE BETWEEN A FIELD AND A GRADIENT.
     At the natural (uv - 0.5) range p spans about +/-0.9, which is less than
     ONE period of the noise — so every octave returned a near-constant and the
     frame read as a smooth radial gradient with no structure in it. Scaling to
     ~2.8 puts several features across the viewport, which is what makes the
     fluid legible as something turning over. */
  vec2 p = (uv - 0.5) * vec2(uAspect, 1.0) * 2.8;

  float t = uTime * 0.11;

  /* Pointer and scroll velocity both feed the warp rather than translating
     the whole field. Moving the field would read as a parallax layer; bending
     it reads as the fluid responding. */
  p += uPointer * 0.06;
  p.y -= uVelocity * 0.05;

  vec2 w = p;
  for (int i = 0; i < 2; i++) {
    if (i >= WARPS) break;
    w = warp(w * 0.9, t + float(i) * 2.3);
  }

  /* The body of the field. Two decorrelated samples give a value and a
     gradient-ish second channel to drive the hue mix, so the colour does not
     simply follow brightness. */
  float a = fbm(w * 0.85 + t * 0.12, OCTAVES);
  float b = fbm(w * 1.35 - t * 0.09 + vec2(3.1, 7.7), OCTAVES);

  /* ---- colour ---------------------------------------------------------
     Three stops, all from the discipline palette: the unlit deep, the
     second hue the shadows pick up, and the key. Mixed by the field rather
     than by position, so the same state produces a different frame every
     moment without the palette ever changing. */
  /* Tighter windows than the first pass: fbm clusters hard around its mean,
     so a wide smoothstep returns mid-grey almost everywhere and flattens the
     structure the scale above just bought. */
  float body = smoothstep(0.34, 0.74, a);
  float hue = smoothstep(0.36, 0.72, b);

  /* THREE POLES, not two. The reference that this background is closest to
     (5Lab) gets its character from two differently-hued translucent forms
     overlapping and blending where they meet — the frame is never one colour
     washing out to black. So the shadow hue is given real presence and the
     key is mixed in on its own independent channel, which lets the two cross
     in the middle of the frame instead of stacking. */
  vec3 colour = mix(uDeep, uShadow, hue);
  colour = mix(colour, uLight, pow(body, 1.25) * 0.95);
  /* Where the two channels disagree most, lift toward the key — that
     disagreement band is the "overlap" edge the reference reads as. */
  float overlap = 1.0 - abs(body - hue);
  colour += uLight * pow(overlap, 3.0) * 0.22;

  /* A broad key, placed off-centre by the palette, so the frame has a
     direction the light comes from. Multiplied INTO the field rather than
     added over it, so it reads as the fluid being lit rather than as a
     gradient laid on top. */
  vec2 key = (uKey - 0.5) * vec2(uAspect, 1.0);
  float keyFall = 1.0 - smoothstep(0.0, uKeyRadius * 1.9, length(p - key));
  colour += uLight * pow(keyFall, 2.2) * (0.3 + body * 0.5);

  /* Floor bounce rising from the bottom edge, so the frame has a ground to
     sit on instead of running out. */
  float floorRise = pow(1.0 - clamp(uv.y, 0.0, 1.0), 3.0);
  colour += uFloor * floorRise * 0.4;

  /* A crossing between two worlds briefly lifts the whole field — it is the
     most consequential moment in the journey and was otherwise its dimmest. */
  colour *= 1.0 + uSurge * 0.3;

  colour *= uLift;
  colour *= 0.55 + uIntensity * 0.45;

  /* Vignette. What turns a lit rectangle into a lit space. */
  vec2 vc = (uv - 0.5) * 2.0;
  colour *= 1.0 - 0.32 * pow(dot(vc, vc) * 0.5, 1.3);

  /* The type column. The DOM is left-aligned over this at every breakpoint
     and the small tokens have very little contrast headroom, so the field
     keeps its energy out of the left third rather than relying on the text
     to win. Smooth, never a masked box. */
  float guard = smoothstep(0.02, 0.62, uv.x);
  colour *= mix(0.62, 1.0, guard);

  /* Ordered dither at +/- 1/255. A very shallow gradient across a large dark
     area is exactly the case 8-bit output bands on, and banding across the
     whole viewport is far more visible than the gradient itself. */
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
