"use client";

import { forwardRef, useEffect, useImperativeHandle, useMemo, useRef } from "react";
import * as THREE from "three";
import { VALUE_FBM, DITHER_8 } from "./shaders";

/**
 * THE ATMOSPHERE
 * ==============
 *
 * The layer the whole brief turns on.
 *
 * Measured before this existed, the XR section rendered at 99.7% near-black
 * with a mean colour of exactly rgb(10,10,12) — the CSS ground token, pixel
 * for pixel. Every scene in the site was drawing at alphas between 0.08 and
 * 0.16 additively onto near-black, which lands under the perceptual floor. So
 * the page was not "a WebGL background that needed art direction"; there was
 * effectively nothing on screen to direct. This is the layer that puts
 * something there, and it costs one draw call.
 *
 * It is a screen-space pass, not geometry: a clip-space quad with depth
 * testing off, drawn before everything. It never moves with the camera and
 * never needs to, because it is not IN the space — it is the air the space
 * is seen through.
 *
 * WHAT IT PUTS ON SCREEN, in order of how much it matters:
 *
 *   1. A key light, off-centre by construction, with a gaussian falloff and
 *      fbm modulating its body so it reads as light through atmosphere rather
 *      than as a radial gradient. This is the discipline's colour, and it is
 *      the only place in the environment that colour is stated at strength.
 *   2. A ground bounce rising from the bottom of the frame, so the composition
 *      has a floor and does not simply run out.
 *   3. A vignette, which is what turns a lit rectangle into a lit space.
 *   4. A suppression through the middle band, where the type lives.
 *
 * ON THAT LAST POINT — it is not only a readability guarantee, though it is
 * that. The site's small text tokens (--c-text-faint at 4.80:1 on the ground)
 * have almost no contrast headroom, and the canvas composites UNDER them, so
 * an even lift of the frame lifts their background with it and fails AA. The
 * suppression keeps the atmosphere's energy in the corners and the periphery,
 * which is also simply the better composition: the light frames the words
 * instead of sitting behind them.
 */

const vertexShader = /* glsl */ `
varying vec2 vUv;

void main() {
  vUv = uv;
  // Straight to clip space. No view or projection matrix is involved, so the
  // pass is unaffected by the camera states travelling underneath it.
  gl_Position = vec4(position.xy, 0.0, 1.0);
}
`;

function buildFragment(octaves: number) {
  // Baked as a preprocessor define, not a uniform: the warp triples the noise
  // cost of a full-viewport pass, and a branch a uniform controls is still
  // compiled and still costs register pressure on the tiers that skip it.
  const warp = octaves >= 3 ? 1 : 0;
  return /* glsl */ `
#define WARP ${warp}
${VALUE_FBM}
${DITHER_8}

uniform vec3  uDeep;
uniform vec3  uLight;
uniform vec3  uShadow;
uniform vec3  uFloor;
uniform vec2  uKey;
uniform float uKeyRadius;
uniform float uLift;
uniform float uFog;
uniform float uIntensity;
uniform float uTime;
uniform float uAspect;
uniform float uVelocity;
uniform float uSurge;
uniform vec2  uPointer;

varying vec2 vUv;

const int OCTAVES = ${octaves};

void main() {
  vec2 uv = vUv;

  // Aspect-corrected and centred, so the key is round on every viewport
  // instead of stretching into an ellipse on wide screens.
  vec2 p = vec2((uv.x - 0.5) * uAspect, uv.y - 0.5);
  vec2 key = vec2((uKey.x - 0.5) * uAspect, uKey.y - 0.5);

  // The pointer moves the light, not the geometry. A light that leans is a
  // far cheaper and far more convincing "the space noticed you" than any
  // amount of moving objects, and it cannot break a composition.
  key += uPointer * 0.06;

  // Atmospheric density. Drifts slowly on its own and smears along the scroll
  // axis when the visitor is moving, which is what stops fast scrolling from
  // feeling like it is sliding a static image past the viewport.
  vec2 flow = uv * 2.4;
  flow.y -= uTime * 0.011 + uVelocity * 0.06;
  flow.x += uTime * 0.006;

#if WARP
  /* DOMAIN WARPING — fbm whose input is itself displaced by fbm.

     Plain fbm gives a cloud that fades in and out in place: the density
     changes but nothing ever appears to MOVE THROUGH anything. Feeding the
     sample point through a second noise field makes the structure fold and
     shear as it drifts, which is what air actually does and what separates
     an atmosphere from a texture.

     The warp fields are sampled at two octaves regardless of the tier — they
     only need to be smooth, not detailed, and the detail belongs in the final
     sample. Skipped entirely on the low tier, where OCTAVES is already 2 and
     tripling the noise cost would not be paid back. */
  vec2 q = vec2(fbm(flow, 2), fbm(flow + vec2(5.2, 1.3), 2));
  float n = fbm(flow + 2.4 * q, OCTAVES);
#else
  float n = fbm(flow, OCTAVES);
#endif

  // The key. Gaussian rather than smoothstep: smoothstep has a hard outer
  // edge that reads as a circle drawn on the frame, and a gaussian simply
  // runs out.
  float d = length(p - key);
  float r = max(uKeyRadius, 0.05);
  float lit = exp(-(d * d) / (r * r));

  // fbm breaks the falloff up so the light has body. Clamped to a floor so
  // the noise modulates the key rather than punching holes in it.
  lit *= 0.58 + 0.42 * n;

  // A second, far wider and far dimmer pass. This is what keeps the corners
  // of the frame from being dead — the thing that made every previous
  // section read as "an effect, then black".
  float wash = exp(-(d * d) / (r * r * 7.0)) * (0.4 + 0.6 * n);

  // Ground bounce. Sits low, tinted rather than lit.
  float ground = smoothstep(0.62, -0.08, uv.y);

  // A real light source desaturates toward its core — only its falloff shows
  // the hue at full strength. Skipping that is what made the first pass read
  // as magenta and cobalt rather than as violet and steel: additive stacking
  // of a saturated colour drives one channel to clip while the other two are
  // still climbing, and the result is a hue nobody chose.
  vec3 keyColor = mix(uLight, vec3(1.0), lit * 0.42);

  /* THE SECOND HUE.

     How far this pixel is from the key, on a much broader falloff than the
     key itself. Near the source the ground stays deep; the further away it
     gets the more it picks up the shadow hue, so the frame carries a gradient
     between two related hues rather than one hue at two brightnesses.

     This is the single change that most moves the result toward the F+
     reference: what reads as "the atmosphere changed" is almost never one
     colour getting brighter, it is the RELATIONSHIP between a key and the
     colour of everything the key is not reaching. Warped noise breaks the
     boundary up so it never reads as a second gradient laid over the first. */
  float reach = exp(-(d * d) / (r * r * 4.5));
  float away = clamp((1.0 - reach) * (0.72 + 0.28 * n), 0.0, 1.0);

  vec3 col = mix(uDeep, uShadow, away * 0.8);
  col = mix(col, uFloor, ground * 0.42);
  col += keyColor * lit * uLift * 0.155;
  col += uLight * wash * uLift * 0.05;

  // Density variation across the whole frame. Very low contrast — it should
  // register as the air not being uniform, never as visible noise.
  col += uLight * (n - 0.5) * 0.022 * uLift * uFog;

  // A crossing pushes a little more light through the air. Tied to the
  // transition rather than running continuously, so it reads as an event.
  col += uLight * uSurge * lit * 0.06;

  // Vignette. The single largest contributor to the frame reading as a space
  // rather than as a filled rectangle.
  float vig = smoothstep(1.45, 0.3, length(p));
  col *= 0.34 + 0.66 * vig;

  // The type band. See the note at the top of this file. Measured rather than
  // guessed: at 0.26 the muted and faint text tokens dropped below 4.5:1
  // against their own backdrop, which is a real accessibility regression and
  // not a matter of taste.
  float band = exp(-pow((uv.y - 0.5) / 0.5, 2.0));
  col *= 1.0 - band * 0.42;

  col *= uIntensity;

  // Applied last, at ±1/255. A gradient this shallow across a viewport this
  // large bands severely on 8-bit output, and the banding is more visible
  // than the gradient it ruins.
  col += dither8(gl_FragCoord.xy);

  // Opaque: this pass IS the ground. Leaving it transparent would composite
  // it over the CSS background colour and halve everything above.
  gl_FragColor = vec4(max(col, 0.0), 1.0);
}
`;
}

export interface AtmosphereHandle {
  material: THREE.ShaderMaterial | null;
}

/**
 * `octaves` is baked into the shader source rather than passed as a uniform:
 * a dynamic loop bound cannot be unrolled, and this runs per fragment across
 * the entire viewport. Two octaves against four is a real difference on a
 * mid-tier GPU and an enormous one on a phone.
 */
export const AtmosphereField = forwardRef<AtmosphereHandle, { octaves: number }>(
  function AtmosphereField({ octaves }, ref) {
    const materialRef = useRef<THREE.ShaderMaterial>(null);

    const material = useMemo(
      () =>
        new THREE.ShaderMaterial({
          vertexShader,
          fragmentShader: buildFragment(octaves),
          depthTest: false,
          depthWrite: false,
          uniforms: {
            uDeep: { value: new THREE.Color() },
            uLight: { value: new THREE.Color() },
            uShadow: { value: new THREE.Color() },
            uFloor: { value: new THREE.Color() },
            uKey: { value: new THREE.Vector2(0.5, 0.5) },
            uKeyRadius: { value: 0.7 },
            uLift: { value: 1 },
            uFog: { value: 0.6 },
            uIntensity: { value: 0 },
            uTime: { value: 0 },
            uAspect: { value: 1.777 },
            uVelocity: { value: 0 },
            uSurge: { value: 0 },
            uPointer: { value: new THREE.Vector2() },
          },
        }),
      [octaves],
    );

    useImperativeHandle(ref, () => ({ get material() { return materialRef.current; } }), []);

    useEffect(() => () => material.dispose(), [material]);

    return (
      // renderOrder puts this first regardless of scene-graph order, and
      // depthTest:false keeps it from occluding anything drawn after.
      <mesh frustumCulled={false} renderOrder={-100}>
        <planeGeometry args={[2, 2]} />
        <primitive object={material} attach="material" ref={materialRef} />
      </mesh>
    );
  },
);
