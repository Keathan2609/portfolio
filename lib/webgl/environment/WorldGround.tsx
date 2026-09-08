"use client";

import { forwardRef, useEffect, useImperativeHandle, useMemo, useRef } from "react";
import * as THREE from "three";
import { FOG } from "./shaders";

/**
 * THE GROUND
 * ==========
 *
 * One plane. The largest single improvement available to this environment,
 * and by some distance the cheapest.
 *
 * WHAT WAS MISSING. The world had mass but no reference. Solid forms floated
 * with nothing under them, nothing behind them and no plane relating them to
 * each other, so the eye had no way to answer "where am I standing" — and a
 * space you cannot locate yourself in is not a space, it is a collection of
 * objects. Adding more objects would not have fixed it; every extra box would
 * have floated too.
 *
 * FOUR THINGS FROM ONE MESH:
 *
 *   GROUND       there is something underneath the camera.
 *   HORIZON      not drawn. It EMERGES, at exactly the distance where the
 *                floor's fog term reaches the deep colour of the atmosphere
 *                and the two become the same value. That is how a real
 *                horizon forms, and it means the horizon line automatically
 *                agrees with the fog, the palette and the discipline state
 *                without being authored anywhere.
 *   CONVERGENCE  the floor pattern recedes to a vanishing point, which is the
 *                strongest perspective cue available and the thing that makes
 *                a frame read as deep rather than as flat.
 *   SCALE        a grid of known cell size tells you how big everything
 *                standing on it is. Architecture without a floor has no size.
 *
 * THE PATTERN MORPHS WITH THE JOURNEY, on the same from/to/blend the rest of
 * the world uses, so the ground is not a constant backdrop under five
 * different worlds — it is part of each of them.
 *
 * Deliberately NOT a skybox, a gradient backdrop, or a horizon line drawn as
 * geometry. The environment stays abstract; the horizon is a consequence of
 * atmosphere, not a picture of one.
 */

const PATTERNS = /* glsl */ `
/* Antialiased grid lines.

   The derivative-based width is what keeps a floor grid from turning into
   moire the moment it recedes: the line is drawn one PIXEL wide regardless of
   how compressed the cell has become in screen space, so the pattern stays
   crisp into the distance instead of aliasing into noise. Doing this with a
   fixed world-space width instead is the single most common way a ground grid
   ends up looking like a cheap tech demo. */
float gridLine(vec2 p, float cell, float weight) {
  vec2 g = abs(fract(p / cell - 0.5) - 0.5) / fwidth(p / cell);
  float line = min(g.x, g.y);
  return 1.0 - min(line / weight, 1.0);
}

/** Lines running along Z only — a directional floor. */
float railLine(vec2 p, float cell, float weight) {
  float g = abs(fract(p.x / cell - 0.5) - 0.5) / fwidth(p.x / cell);
  return 1.0 - min(g / weight, 1.0);
}

// 01 SOFTWARE — a measured structural grid. Regular, fine, unbroken: the
// floor of an engineered system, and the clearest statement of scale in the
// set because every cell is identical and countable.
float floorSoftware(vec2 p, float t) {
  return gridLine(p, 4.0, 1.6) * 0.55 + gridLine(p, 20.0, 2.2) * 0.5;
}

// 02 XR — the chamber base. The fine grid drops away and the floor becomes a
// few enormous platform cells with wide seams, so the ground reads as built
// slabs rather than as graph paper and the volume above it feels larger by
// comparison.
float floorXR(vec2 p, float t) {
  float seams = gridLine(p, 26.0, 3.4) * 0.85;
  // A faint secondary reading inside each platform, so the slabs are not flat.
  float inner = gridLine(p, 26.0 / 3.0, 1.2) * 0.14;
  return seams + inner;
}

// 03 CREATIVE — interrupted. Most of the floor is simply absent; what remains
// are occasional long seams. A gallery floor is defined by how little is on
// it, and the sparseness here is what stops this world reading as engineered.
float floorCreative(vec2 p, float t) {
  float cell = 30.0;
  vec2 id = floor(p / cell);
  float keep = step(0.55, fract(sin(dot(id, vec2(12.9898, 78.233))) * 43758.5453));
  return gridLine(p, cell, 2.6) * keep * 0.7;
}

// 04 DATA SCIENCE — the floor carries the routes. Lines run along the travel
// axis only, so the ground itself is directional and the architecture standing
// on it is visibly following the same trajectories. This is the change that
// stops Data reading as objects in fog: the paths are in the FLOOR, which
// anchors them.
float floorData(vec2 p, float t) {
  float rails = railLine(p, 3.2, 1.5) * 0.5;
  float trunk = railLine(p, 16.0, 2.6) * 0.55;
  // Slow travel along the rails: the only floor in the set that moves, and it
  // moves along the direction the world is organised by.
  float pulse = railLine(vec2(p.x, p.y + t * 1.6), 16.0, 2.0)
              * smoothstep(60.0, 0.0, abs(p.y)) * 0.3;
  return rails + trunk + pulse;
}

// 05 CYBERSECURITY — segmented zones. A coarse grid of heavy boundaries with
// a fine grid inside each cell: territory divided and monitored. Tighter and
// more emphatic than Software's open measure.
float floorSecurity(vec2 p, float t) {
  float zones = gridLine(p, 22.0, 4.0) * 0.9;
  float inner = gridLine(p, 5.5, 1.2) * 0.2;
  return zones + inner;
}

float floorAt(float i, vec2 p, float t) {
  if (i < 0.5) return floorSoftware(p, t);
  if (i < 1.5) return floorXR(p, t);
  if (i < 2.5) return floorCreative(p, t);
  if (i < 3.5) return floorData(p, t);
  return floorSecurity(p, t);
}

// The opening and closing state: Software's measure, thinned right down, so
// the ground is present from the first section without asserting anything.
float floorNeutral(vec2 p, float t) {
  return gridLine(p, 20.0, 2.0) * 0.34;
}

float floorState(float i, vec2 p, float t) {
  return i < -0.5 ? floorNeutral(p, t) : floorAt(i, p, t);
}
`;

const vertexShader = /* glsl */ `
${FOG}

varying vec3 vWorld;
varying float vFog;

void main() {
  vWorld = position;
  vec4 mv = modelViewMatrix * vec4(position, 1.0);
  vFog = fogAmount(-mv.z);
  gl_Position = projectionMatrix * mv;
}
`;

const fragmentShader = /* glsl */ `
${PATTERNS}

uniform vec3  uDeep;
uniform vec3  uLight;
uniform vec3  uGraphite;
uniform float uFrom;
uniform float uTo;
uniform float uBlend;
uniform float uTime;
uniform float uPresence;
uniform vec2  uKeyWorld;

varying vec3 vWorld;
varying float vFog;

void main() {
  // The plane is built in XY and laid flat by its rotation, so its own local
  // coordinates are the ground plane's axes.
  vec2 p = vWorld.xy;

  float pattern = mix(
    floorState(uFrom, p, uTime),
    floorState(uTo,   p, uTime),
    uBlend
  );

  /* A pool of light on the floor beneath the key.

     Without it the ground is evenly lit to the horizon, which reads as a
     printed pattern rather than as a surface under a light. The falloff is
     what tells you the floor is being lit from somewhere specific — the same
     somewhere the architecture and the atmosphere are lit from. */
  float d = length(p - uKeyWorld);
  float pool = exp(-(d * d) / 2600.0);

  vec3 base = uGraphite * (0.16 + pool * 0.5);
  base += uLight * pattern * (0.1 + pool * 0.42);

  /* AERIAL PERSPECTIVE — and the horizon.

     The floor converges on the atmosphere's own deep colour with distance.
     Where that mix completes, floor and air are the same value and the
     boundary between them stops existing: that IS the horizon, and it needs
     no geometry, no gradient and no authored line. It also moves correctly on
     its own whenever the palette or the fog changes. */
  vec3 color = mix(base, uDeep, vFog);

  // Presence fades the FLOOR PATTERN, never the ground itself. The surface
  // stays, so the visitor never loses the sense of standing on something —
  // only how much the floor has to say quietens down.
  color = mix(mix(uGraphite * 0.16, uDeep, vFog), color, uPresence);

  gl_FragColor = vec4(color, 1.0);
}
`;

export interface WorldGroundHandle {
  material: THREE.ShaderMaterial | null;
}

/** How far below the camera path the floor sits. */
export const GROUND_Y = -7.2;

export const WorldGround = forwardRef<WorldGroundHandle, { segments: number }>(
  function WorldGround({ segments }, ref) {
    const materialRef = useRef<THREE.ShaderMaterial>(null);

    const geometry = useMemo(() => {
      // Large enough that its edge is always past the fog's far plane, so the
      // visitor can never see the floor end. Segmented only enough to avoid
      // depth interpolation artefacts across a very large plane.
      const g = new THREE.PlaneGeometry(900, 900, segments, segments);
      return g;
    }, [segments]);

    const material = useMemo(
      () =>
        new THREE.ShaderMaterial({
          vertexShader,
          fragmentShader,
          transparent: false,
          depthWrite: true,
          depthTest: true,
          side: THREE.DoubleSide,
          uniforms: {
            uDeep: { value: new THREE.Color() },
            uLight: { value: new THREE.Color() },
            uGraphite: { value: new THREE.Color("#1b2130") },
            uFrom: { value: -1 },
            uTo: { value: 0 },
            uBlend: { value: 0 },
            uTime: { value: 0 },
            uPresence: { value: 1 },
            uKeyWorld: { value: new THREE.Vector2() },
            // A longer fog range than the architecture uses: the floor has to
            // reach further before it dissolves, or the horizon lands too
            // close and the world feels small.
            uFogNear: { value: 14 },
            uFogFar: { value: 150 },
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
      // Drawn first of the opaque layers. Everything standing on it depth-tests
      // against it, which is what makes the architecture read as resting on the
      // floor rather than intersecting a backdrop.
      <mesh
        rotation={[-Math.PI / 2, 0, 0]}
        position={[0, GROUND_Y, -60]}
        frustumCulled={false}
        renderOrder={-70}
      >
        <primitive object={geometry} attach="geometry" />
        <primitive object={material} attach="material" ref={materialRef} />
      </mesh>
    );
  },
);
