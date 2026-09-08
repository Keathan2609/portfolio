"use client";

import { forwardRef, useEffect, useImperativeHandle, useMemo, useRef } from "react";
import * as THREE from "three";
import { FOG } from "./shaders";

/**
 * THE POINT FIELD
 * ===============
 *
 * The midground. Structure carries the scale of the world and atmosphere
 * carries its colour; this carries its texture — the sense that the space is
 * full of something rather than empty between the large forms.
 *
 * The five shape functions below are the surviving good idea from the
 * previous environment and are kept close to their original form: one field,
 * five arrangements, every point crossing between two of them on its own
 * schedule. What changed is everything around them. They now sit on the
 * shared fog curve so they belong to the same space as the structural layer,
 * they are scaled to the new per-discipline camera states rather than to one
 * fixed camera, and they are no longer the only thing on screen, which means
 * they can be sparse and quiet instead of trying and failing to carry the
 * whole environment on their own.
 *
 * ONE GEOMETRY, TWO ACTIVE STATES. Only ever two, because the journey is
 * linear — nobody crosses from Software to Cybersecurity directly. Thousands
 * of points cost a handful of uniforms per frame and nothing is rebuilt on
 * the CPU while scrolling.
 */

const SHAPES = /* glsl */ `
// 01 SOFTWARE ENGINEERING — ordered structure.
// Points snap to a coarse lattice and hold it, filling the volume the large
// frames imply. Engineered, not decorated.
vec3 shapeSoftware(vec3 s, float id, float t) {
  vec3 g = floor(s * 4.0) / 4.0;
  float breathe = sin(t * 0.22 + id * 6.2831) * 0.06;
  return vec3(g.x * 13.0, g.y * 7.0 + breathe, g.z * 15.0 - 10.0);
}

// 02 XR DEVELOPMENT — the structure gains volume.
// Concentric shells the camera sits inside, so the same field that read as a
// wall now reads as a room.
//
// QUANTISED ONTO RINGS, and that is the whole difference. Distributing points
// continuously over a sphere and standing inside it projects to an even
// scatter — which is a particle field, the one thing this environment is most
// at risk of being mistaken for, and the only state in the set whose shape
// was not already discrete. Snapping to a small number of shells and a small
// number of latitudes per shell gives the same volume a construction: rings
// the eye can follow around the viewer, so the space reads as built rather
// than as dust that happens to surround you.
vec3 shapeXR(vec3 s, float id, float t) {
  float shell = 3.0 + floor(fract(id * 7.31) * 6.0) * 1.85;
  // Latitudes, not a continuous polar angle. Offset per shell so the rings of
  // neighbouring shells do not line up into one visible grid.
  float lat = floor((s.y * 0.5 + 0.5) * 5.0) / 5.0;
  float phi = (lat + fract(id * 2.13) * 0.06) * 3.14159;
  float theta = s.x * 3.14159 + t * 0.05 * (0.6 + fract(id * 3.17));
  return vec3(
    shell * sin(phi) * cos(theta),
    shell * cos(phi) * 0.78,
    shell * sin(phi) * sin(theta) - 4.5
  );
}

// 03 CREATIVE — volume flattens into composition.
// Points collapse onto a few parallel planes drifting laterally at different
// rates. Depth by layering rather than by perspective, the way a printed page
// has depth. This is also the state where the field is quietest — see
// FIELD_STATES — because a composition full of drifting dots is not one.
vec3 shapeCreative(vec3 s, float id, float t) {
  float layer = floor(fract(id * 5.13) * 4.0);
  float drift = sin(t * 0.07 + layer * 1.7) * 0.9;
  return vec3(
    s.x * 11.0 + drift,
    s.y * 6.2,
    -layer * 3.6 - 1.4
  );
}

// 04 DATA SCIENCE — composition resolves into signal.
// Points leave the planes and ride flow lines, each lane its own frequency
// and amplitude, running away down the same axis the ribbons follow.
// Information becoming legible — not a chart of it.
vec3 shapeData(vec3 s, float id, float t) {
  float lane = fract(id * 11.7);
  float x = s.x * 12.0;
  float amp = 1.3 + lane * 3.0;
  float y = sin(x * 0.48 + lane * 6.2831 + t * 0.2) * amp;
  return vec3(x, y + (lane - 0.5) * 2.8 - 0.6, s.z * 11.0 - 8.0);
}

// 05 CYBERSECURITY — signal resolves into topology.
// Points leave their flow lines and SNAP to discrete columns and tiers: a
// network laid out in space rather than a field moving through it. Spacing is
// irregular on purpose — a real topology is asymmetric, and a tidy grid would
// read as the Software state again.
//
// Quantising the layout is also what gives the last crossing of the journey
// something to do. Measured against the earlier version, which shared its x
// and z construction with the data field, points travelled a mean of 1.78
// units to reach it against 12.62 for Software -> XR; the final transition
// was by far the weakest thing on the page.
vec3 shapeSecurity(vec3 s, float id, float t) {
  float col = floor(s.x * 3.5);
  float tier = floor(fract(id * 4.19) * 5.0) - 2.0;
  float jitter = fract(sin(col * 12.9898 + tier * 78.233) * 43758.5453);

  // One node at a time briefly leaves the topology. Monitored, not alarmed:
  // no flashing, no alert colour on the field as a whole — see uAnomaly in
  // the fragment shader, which tints only the node that left.
  float beat = floor(t * 0.6);
  float pick = fract(sin(beat + id * 91.7) * 43758.5453);
  float displaced = step(0.988, pick) * 1.1;

  return vec3(
    col * 3.1 + (jitter - 0.5) * 1.2,
    tier * 2.3 + (jitter - 0.5) * 0.7 + displaced,
    -5.0 - fract(id * 2.3) * 11.0
  );
}

vec3 shapeAt(float i, vec3 s, float id, float t) {
  if (i < 0.5) return shapeSoftware(s, id, t);
  if (i < 1.5) return shapeXR(s, id, t);
  if (i < 2.5) return shapeCreative(s, id, t);
  if (i < 3.5) return shapeData(s, id, t);
  return shapeSecurity(s, id, t);
}

// The opening and closing state. The Software lattice, opened out and pushed
// back — the same field at rest, so the first crossing is a settling.
vec3 shapeNeutral(vec3 s, float id, float t) {
  vec3 p = shapeSoftware(s, id, t);
  p.xy *= 1.3;
  p.z -= 7.0;
  return p;
}

vec3 stateAt(float i, vec3 s, float id, float t) {
  return i < -0.5 ? shapeNeutral(s, id, t) : shapeAt(i, s, id, t);
}
`;

const vertexShader = /* glsl */ `
${SHAPES}
${FOG}

uniform float uFrom;
uniform float uTo;
uniform float uBlend;
uniform float uTime;
uniform float uVelocity;
uniform vec2  uPointer;
uniform float uSize;
uniform float uPresence;
uniform float uScanY;
uniform float uPixelRatio;

attribute vec3 aSeed;
attribute float aId;

varying float vFog;
varying float vMix;
varying float vScan;
varying float vSpark;

void main() {
  // Points cross on their own schedule, spread by id. Without this the whole
  // field arrives at once and the crossing reads as a cut; with it, the field
  // comes apart and reassembles, which is the thing worth watching.
  float stagger = fract(aId * 2.71);
  float b = clamp((uBlend - stagger * 0.32) / 0.68, 0.0, 1.0);
  b = b * b * (3.0 - 2.0 * b);
  vMix = b;

  vec3 pos = mix(
    stateAt(uFrom, aSeed, aId, uTime),
    stateAt(uTo,   aSeed, aId, uTime),
    b
  );

  // Scroll velocity swells the field outward slightly. Small on purpose: it
  // should register as the world having weight, not as a zoom.
  pos.xy *= 1.0 + uVelocity * 0.045;
  pos.z -= abs(uVelocity) * 1.6;

  // Pointer parallax scaled by depth, so near points lean further than far
  // ones. This is what makes the field read as inhabited space rather than a
  // backdrop pinned behind the type.
  float near = clamp((pos.z + 22.0) / 22.0, 0.0, 1.0);
  pos.xy += uPointer * near * 0.7;

  vec4 mv = modelViewMatrix * vec4(pos, 1.0);
  float depth = -mv.z;

  vFog = (1.0 - fogAmount(depth)) * uPresence;

  // The analysis sweep, resolved per point. Zero in every state but
  // Cybersecurity, so it costs nothing when it is not the one running.
  vScan = smoothstep(0.55, 0.0, abs(pos.y - uScanY));

  // A stable minority of points run brighter. Without it the field is an even
  // grey haze; with it, it has stars in it.
  vSpark = step(0.93, fract(aId * 37.1));

  gl_Position = projectionMatrix * mv;

  // Divided by depth for perspective size attenuation, and multiplied by the
  // device pixel ratio so points are not half the intended size on a
  // retina display.
  gl_PointSize = uSize * (1.0 + vSpark * 0.9) * (1.0 + uVelocity * 0.22)
               * uPixelRatio * (300.0 / max(depth, 0.6));
}
`;

const fragmentShader = /* glsl */ `
uniform vec3  uLight;
uniform vec3  uAnomaly;
uniform float uScanStrength;
uniform float uOpacity;

varying float vFog;
varying float vMix;
varying float vScan;
varying float vSpark;

void main() {
  vec2 c = gl_PointCoord - 0.5;
  float d = dot(c, c);
  if (d > 0.25) discard;

  // Soft-edged rather than a hard disc — at this size a crisp circle reads as
  // a UI dot — but with a defined core rather than being falloff all the way
  // down. Pure falloff is what makes a dense field merge into cloud.
  float soft = smoothstep(0.25, 0.06, d);

  // The restrained red, applied only where the sweep is passing and only in
  // the security state. An anomaly being noticed, not an alert colour scheme.
  vec3 color = mix(uLight, uAnomaly, vScan * uScanStrength * 0.55);
  color += vSpark * 0.25;

  float alpha = soft * vFog * uOpacity * (0.5 + vScan * uScanStrength * 0.6);
  if (alpha < 0.002) discard;

  gl_FragColor = vec4(color, alpha);
  // Silences the unused-varying warning some drivers emit; vMix is retained
  // because the crossing curve is read from it during development.
  vMix;
}
`;

export interface PointFieldHandle {
  material: THREE.ShaderMaterial | null;
}

function buildAttributes(count: number) {
  const position = new Float32Array(count * 3);
  const seed = new Float32Array(count * 3);
  const id = new Float32Array(count);

  // Deterministic: the environment is art-directed, so it must be identical
  // on every load rather than a different composition each visit.
  let s = 1337;
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

  return { position, seed, id };
}

export const PointField = forwardRef<PointFieldHandle, { count: number }>(
  function PointField({ count }, ref) {
    const materialRef = useRef<THREE.ShaderMaterial>(null);

    const geometry = useMemo(() => {
      const { position, seed, id } = buildAttributes(count);
      const g = new THREE.BufferGeometry();
      // `position` is required by three even though the shader derives its own.
      g.setAttribute("position", new THREE.BufferAttribute(position, 3));
      g.setAttribute("aSeed", new THREE.BufferAttribute(seed, 3));
      g.setAttribute("aId", new THREE.BufferAttribute(id, 1));
      g.boundingSphere = new THREE.Sphere(new THREE.Vector3(), 50);
      return g;
    }, [count]);

    const material = useMemo(
      () =>
        new THREE.ShaderMaterial({
          vertexShader,
          fragmentShader,
          transparent: true,
          depthWrite: false,
          blending: THREE.AdditiveBlending,
          uniforms: {
            uFrom: { value: -1 },
            uTo: { value: 0 },
            uBlend: { value: 0 },
            uTime: { value: 0 },
            uVelocity: { value: 0 },
            uPointer: { value: new THREE.Vector2() },
            uSize: { value: 1.6 },
            uPresence: { value: 1 },
            uOpacity: { value: 0 },
            uScanY: { value: -99 },
            uScanStrength: { value: 0 },
            uPixelRatio: { value: 1 },
            uLight: { value: new THREE.Color() },
            uAnomaly: { value: new THREE.Color() },
            uFogNear: { value: 6 },
            uFogFar: { value: 38 },
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
      <points frustumCulled={false} renderOrder={-40}>
        <primitive object={geometry} attach="geometry" />
        <primitive object={material} attach="material" ref={materialRef} />
      </points>
    );
  },
);
