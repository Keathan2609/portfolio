"use client";

import { forwardRef, useEffect, useImperativeHandle, useMemo, useRef } from "react";
import * as THREE from "three";

/**
 * THE NEAR FIELD
 * ==============
 *
 * A handful of very large, very faint forms between the camera and the world.
 *
 * This is the cheapest depth cue available and the one the site was missing
 * entirely. Foreground and background were the same distance away, so there
 * was nothing to be in front of anything — and a scene with no foreground
 * reads as a picture no matter how much depth the background has. A few soft
 * shapes drifting close to the lens fixes that on their own, because the eye
 * resolves "something is passing in front of me" long before it resolves what.
 *
 * WORKED ENTIRELY IN VIEW SPACE. `aSeed` is not a world position — it is a
 * position relative to the camera, and the model-view matrix is deliberately
 * never applied. The consequence is that this layer stays with the viewer
 * through every camera state, including XR's dolly from z=11.4 to z=4.6,
 * without any of the per-state repositioning it would otherwise need. It is
 * not in the world; it is on the lens.
 *
 * SCALE AND ALPHA ARE THE WHOLE ART DIRECTION HERE. These run at well under
 * 0.01 alpha and at several times the size they intuitively want to be. Both
 * extremes are deliberate: a near sprite that is small enough to have a
 * visible edge is bokeh, and bokeh is the most generic thing a WebGL
 * background can put on screen. Big enough and faint enough, the same sprite
 * stops being an object and becomes a variation in the air. They should be
 * almost subliminal — noticed only as the frame having depth in it.
 */

const vertexShader = /* glsl */ `
uniform float uTime;
uniform vec2  uPointer;
uniform float uVelocity;
uniform float uPresence;

attribute vec3 aSeed;
attribute float aId;

varying vec2  vUv;
varying float vAlpha;

void main() {
  vUv = uv;

  // View-space placement. Negative z is in front of the camera.
  float depth = 1.8 + fract(aId * 3.11) * 5.4;
  vec3 view = vec3(aSeed.x * 10.0, aSeed.y * 6.5, -depth);

  // Slow independent drift on two axes at different rates, so the layer never
  // reads as a single moving sheet.
  view.x += sin(uTime * 0.043 + aId * 6.2831) * 1.5;
  view.y += cos(uTime * 0.037 + aId * 3.1416) * 1.0;

  // Nearest forms lean furthest with the pointer. At this distance a small
  // pointer offset produces a large apparent shift, which is precisely why
  // this layer carries the cursor response and the rest of the world barely
  // does.
  float nearness = 1.0 - clamp((depth - 1.8) / 5.4, 0.0, 1.0);
  view.xy += uPointer * (0.5 + nearness * 1.9);

  // Scroll pushes the near field back and lets it settle, so fast scrolling
  // opens the frame up rather than dragging the foreground with it.
  view.z -= abs(uVelocity) * 1.4;

  // Large and faint rather than small and faint. A soft sprite only stops
  // reading as a disc once it is big enough that its falloff, not its
  // silhouette, is the thing on screen — below roughly a third of the frame
  // the eye resolves an edge and the layer turns into bokeh, which is exactly
  // the generic particle look the brief rules out.
  float size = (2.6 + fract(aId * 7.77) * 3.6) * uPresence;

  // Camera-facing by construction: the quad is offset in view space, so it is
  // always square to the lens without any billboard maths.
  vec4 mv = vec4(view, 1.0);
  mv.xy += position.xy * size;

  // Fades out as it approaches the near plane, so nothing ever pops.
  vAlpha = smoothstep(1.5, 3.0, depth) * uPresence;

  gl_Position = projectionMatrix * mv;
}
`;

const fragmentShader = /* glsl */ `
uniform vec3  uLight;
uniform float uOpacity;

varying vec2  vUv;
varying float vAlpha;

void main() {
  // Radial falloff with no hard edge anywhere in it. These are large enough
  // on screen that any discontinuity would be obvious.
  // A gaussian, not a smoothstep. smoothstep reaches zero at a finite radius
  // and that boundary is visible at this scale; a gaussian simply runs out,
  // which is the difference between a gradient and a circle.
  float d = length(vUv - 0.5) * 2.0;
  float soft = exp(-d * d * 3.2);

  float alpha = soft * vAlpha * uOpacity;
  if (alpha < 0.001) discard;

  gl_FragColor = vec4(uLight, alpha);
}
`;

export interface NearDriftHandle {
  material: THREE.ShaderMaterial | null;
}

export const NearDrift = forwardRef<NearDriftHandle, { count: number }>(
  function NearDrift({ count }, ref) {
    const materialRef = useRef<THREE.ShaderMaterial>(null);

    const geometry = useMemo(() => {
      const base = new THREE.PlaneGeometry(1, 1);
      const geo = new THREE.InstancedBufferGeometry();
      geo.index = base.index;
      geo.attributes.position = base.attributes.position;
      geo.attributes.uv = base.attributes.uv;

      const seed = new Float32Array(count * 3);
      const id = new Float32Array(count);
      let s = 555;
      const rand = () => {
        s = (s * 1103515245 + 12345) % 2147483648;
        return s / 2147483648;
      };
      for (let i = 0; i < count; i += 1) {
        seed[i * 3] = rand() * 2 - 1;
        seed[i * 3 + 1] = rand() * 2 - 1;
        seed[i * 3 + 2] = rand() * 2 - 1;
        id[i] = rand();
      }

      geo.setAttribute("aSeed", new THREE.InstancedBufferAttribute(seed, 3));
      geo.setAttribute("aId", new THREE.InstancedBufferAttribute(id, 1));
      geo.instanceCount = count;
      geo.boundingSphere = new THREE.Sphere(new THREE.Vector3(), 40);

      base.dispose();
      return geo;
    }, [count]);

    const material = useMemo(
      () =>
        new THREE.ShaderMaterial({
          vertexShader,
          fragmentShader,
          transparent: true,
          depthWrite: false,
          depthTest: false,
          blending: THREE.AdditiveBlending,
          uniforms: {
            uTime: { value: 0 },
            uPointer: { value: new THREE.Vector2() },
            uVelocity: { value: 0 },
            uPresence: { value: 1 },
            uOpacity: { value: 0 },
            uLight: { value: new THREE.Color() },
          },
        }),
      [],
    );

    useImperativeHandle(ref, () => ({ get material() { return materialRef.current; } }), []);

    useEffect(
      () => () => {
        geometry.dispose();
        material.dispose();
      },
      [geometry, material],
    );

    return (
      // Drawn last of the environment layers: it is the closest thing to the
      // viewer, and with depthTest off the render order is what places it.
      <mesh frustumCulled={false} renderOrder={-30}>
        <primitive object={geometry} attach="geometry" />
        <primitive object={material} attach="material" ref={materialRef} />
      </mesh>
    );
  },
);
