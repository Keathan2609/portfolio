"use client";

import { forwardRef, useEffect, useImperativeHandle, useMemo, useRef } from "react";
import * as THREE from "three";
import { FOG, ROTATE } from "./shaders";

/**
 * THE STRUCTURAL LAYER
 * ====================
 *
 * Large forms at distance. This is where the depth actually comes from.
 *
 * The environment before this had one point field and one glow quad, both
 * sitting in a narrow slice of Z, which is why the measured luminance
 * standard deviation of a whole XR frame was 5.96 — there was no near, no
 * far, and therefore nothing for the eye to read as space. Points alone
 * cannot carry depth: they have no silhouette, no scale, and nothing to be
 * partially obscured by.
 *
 * So this layer is deliberately the opposite of the point field. Few
 * elements, very large, spread across 30 units of depth, dissolving into the
 * same fog the atmosphere establishes. Foreground, midground and background
 * are separated by scale and by falloff rather than by being different
 * systems.
 *
 * ONE GEOMETRY, FIVE LAYOUTS, EVALUATED ON THE GPU. Every instance carries a
 * stable seed. The vertex shader evaluates the layout function for the state
 * being left and the state being entered and mixes the results — position,
 * orientation and size together, so a rectangle in Software's lattice
 * physically rotates and travels into its place on XR's shell. Nothing is
 * rebuilt on the CPU while scrolling; the whole layer costs a handful of
 * uniforms per frame regardless of instance count.
 *
 * MATERIAL. Dark glass with an emissive edge: the face carries almost
 * nothing, the border carries the discipline's light, and both fall off on
 * the shared fog curve. That reading holds across all five states, which is
 * what makes five very different layouts feel like one universe rather than
 * five sets. It is also additive, which means no depth sorting and no
 * transparency artefacts while a hundred large planes fly through each other
 * mid-crossing.
 */

const LAYOUTS = /* glsl */ `
// Each layout writes a centre, a size and an XYZ rotation for one instance.
// Out-parameters rather than a struct: this compiles identically on the
// GLSL ES 1.00 targets some mobile drivers still report.

// 01 SOFTWARE ENGINEERING — engineered structure.
// Square-on rectangles on a coarse lattice, stepped back in discrete layers.
// Nothing is rotated and nothing is jittered off-axis: the order IS the
// content. Read from inside, a regular grid receding in depth is the most
// direct statement of "architecture" available without drawing a building.
void layoutSoftware(vec3 s, float id, float t, out vec3 c, out vec2 sz, out vec3 r) {
  float col = floor(s.x * 2.6);
  float row = floor(s.y * 1.9);
  float layer = floor(fract(id * 3.71) * 4.0);

  c = vec3(col * 4.8, row * 3.1, -3.5 - layer * 7.2);
  sz = vec2(3.4, 2.0) * (0.62 + fract(id * 7.13) * 0.7);
  // A fraction of a degree of sway, so the lattice is not dead. Any more and
  // it stops reading as built.
  r = vec3(0.0, sin(t * 0.09 + id * 6.28) * 0.014, 0.0);
}

// 02 XR DEVELOPMENT — entering space.
// The lattice opens into concentric shells with the camera inside them, and
// every pane is oriented tangent to its shell so the volume is legible as a
// volume rather than as scattered rectangles. This is the widest state in
// the set and the only one that surrounds the viewer.
void layoutXR(vec3 s, float id, float t, out vec3 c, out vec2 sz, out vec3 r) {
  float shell = 5.5 + fract(id * 7.31) * 10.0;
  float theta = s.x * 3.14159 + t * 0.012;
  float phi = acos(clamp(s.y, -1.0, 1.0));

  c = vec3(
    shell * sin(phi) * cos(theta),
    shell * cos(phi) * 0.82,
    shell * sin(phi) * sin(theta) - 4.5
  );
  sz = vec2(3.0, 1.9) * (0.5 + fract(id * 3.37) * 1.0);
  // Tangent to the shell: rotate out of the XY plane by the polar angle, then
  // around Y by the azimuth. The pane faces the shell's centre, i.e. the
  // viewer, which is what makes the arrangement read as enclosing.
  r = vec3(phi - 1.5708, theta, 0.0);
}

// 03 CREATIVE — composition becoming physical.
// Deliberately the sparsest layout: two thirds of the instances collapse to
// zero size and leave the frame, and what remains is large, front-facing and
// placed on a slot system rather than a grid. Negative space is the material
// here — an editorial spread is defined by what is not on it.
void layoutCreative(vec3 s, float id, float t, out vec3 c, out vec2 sz, out vec3 r) {
  float keep = step(fract(id * 13.71), 0.36);
  float slot = floor(fract(id * 5.13) * 6.0);

  c = vec3(
    cos(slot * 2.13) * 5.6 + sin(t * 0.05 + slot) * 0.22,
    sin(slot * 1.71) * 3.0,
    -2.2 - slot * 1.9
  );
  sz = vec2(5.2, 3.6) * keep * (0.7 + fract(id * 2.11) * 0.8);
  // Flat to camera, off by a degree or two. The composition is the subject;
  // perspective would only get in its way.
  r = vec3(0.0, 0.0, (fract(id * 9.13) - 0.5) * 0.07);
}

// 04 DATA SCIENCE — information becoming pattern.
// The panes lie down and stretch along the depth axis into ribbons, so the
// state reads as trajectories running away from the viewer. Long and thin is
// doing all the work: the same rectangle at a different aspect stops being a
// surface and becomes a path.
void layoutData(vec3 s, float id, float t, out vec3 c, out vec2 sz, out vec3 r) {
  float lane = fract(id * 11.73);
  float bend = sin(lane * 6.2831 + t * 0.12) * 1.9;

  /* WIDER AND NEARER THAN THEY WANT TO BE.

     The first version of this layout made the ribbons 0.09 units across and
     pushed them out to z=-24. Laid flat in the XZ plane and seen almost
     edge-on from a camera only 2.6 units above them, that is a sub-pixel
     sliver at distance — and the entire Data world rendered as a soft teal
     haze with no legible structure in it at all, which is the one thing
     "information becoming pattern" cannot afford to be.

     Width is what makes a flat ribbon catch the light at a grazing angle.
     These are wide enough to read, fanned enough to converge toward a
     vanishing point, and staggered in depth so the near ones cross the frame
     while the far ones resolve into the fog. */
  /* Dropped BELOW the camera, as a field rather than a cloud.

     Flat ribbons scattered evenly above and below eye level are seen almost
     exactly edge-on, and an edge-on plane has no area to catch light no
     matter how wide it is made. Sitting them all under the viewer, with the
     camera raised and angled down to match (see CAMERA_STATES), is what turns
     the layout from a haze into a field of paths running away toward a
     vanishing point. */
  /* TWO FAMILIES, ONE STATE.

     The ribbon field alone occupied only the lower third of the frame and
     left the upper two-thirds empty, which read as an unfinished composition
     rather than as negative space. The second family are upright traces —
     thin vertical marks standing in the upper half at varying depths, the
     visual of a measurement taken rather than a path travelled.

     Two related forms doing different jobs is also what stops the state from
     reading as one repeated primitive: paths below, readings above, the same
     material and the same light on both. */
  float trace = step(0.6, fract(id * 19.71));

  c = vec3(
    (lane - 0.5) * 19.0,
    -3.2 + (fract(id * 4.31) - 0.5) * 3.4 + bend * 0.5,
    -3.5 - fract(id * 2.91) * 15.0
  );
  sz = vec2(0.34 + fract(id * 6.7) * 0.42, 13.0);

  if (trace > 0.5) {
    c.y = 1.4 + fract(id * 3.77) * 5.2 + bend * 0.35;
    c.z = -5.0 - fract(id * 2.91) * 16.0;
    sz = vec2(0.14 + fract(id * 6.7) * 0.13, 2.4 + fract(id * 4.41) * 5.0);
  }

  /* Laid into the XZ plane, yawed by its lane so the set fans toward a
     vanishing point, and banked slightly so no two ribbons catch the key at
     the same angle — a fan of identically-lit bands reads as a printed
     pattern rather than as paths through a space. */
  r = vec3(
    1.5708 + (fract(id * 5.9) - 0.5) * 0.22,
    (lane - 0.5) * 0.62,
    (fract(id * 8.3) - 0.5) * 0.3
  );

  // Traces stand upright and square to the viewer instead of lying down.
  if (trace > 0.5) r = vec3(0.0, (lane - 0.5) * 0.45, 0.0);
}

// 05 CYBERSECURITY — systems under observation.
// Everything quantises. Columns and tiers on a hard grid, but with a stable
// per-node offset so the topology is asymmetric — a tidy grid here would
// simply read as the Software state again, which is the mistake the previous
// version of this world made.
void layoutSecurity(vec3 s, float id, float t, out vec3 c, out vec2 sz, out vec3 r) {
  float col = floor(s.x * 3.1);
  float tier = floor(fract(id * 4.19) * 4.0) - 1.5;
  float jitter = fract(sin(col * 12.9898 + tier * 78.233) * 43758.5453);

  c = vec3(
    col * 3.6 + (jitter - 0.5) * 1.0,
    tier * 2.5 + (jitter - 0.5) * 0.5,
    -4.5 - fract(id * 2.31) * 12.0
  );
  sz = vec2(2.4, 0.55) * (0.55 + jitter * 0.6);
  r = vec3(0.0, 0.0, 0.0);
  // Unused, but keeps the signature uniform across all five.
  t;
}

void layoutAt(float i, vec3 s, float id, float t, out vec3 c, out vec2 sz, out vec3 r) {
  if (i < 0.5)      layoutSoftware(s, id, t, c, sz, r);
  else if (i < 1.5) layoutXR(s, id, t, c, sz, r);
  else if (i < 2.5) layoutCreative(s, id, t, c, sz, r);
  else if (i < 3.5) layoutData(s, id, t, c, sz, r);
  else              layoutSecurity(s, id, t, c, sz, r);
}

// The neutral state the journey opens and closes on. Not a sixth discipline:
// the Software lattice pushed far back and shrunk, so arriving at Software is
// the same forms resolving toward the viewer rather than a different set
// appearing. index -1 is mapped onto this by the caller.
void layoutNeutral(vec3 s, float id, float t, out vec3 c, out vec2 sz, out vec3 r) {
  layoutSoftware(s, id, t, c, sz, r);
  c.z -= 9.0;
  c.xy *= 1.25;
  sz *= 0.85;
}
`;

const vertexShader = /* glsl */ `
${ROTATE}
${LAYOUTS}
${FOG}

uniform float uFrom;
uniform float uTo;
uniform float uBlend;
uniform float uTime;
uniform float uVelocity;
uniform vec2  uPointer;
uniform float uPresence;
uniform vec3  uLightDir;

attribute vec3 aSeed;
attribute float aId;

varying vec2  vUv;
varying float vFog;
varying float vBright;
varying float vAnchor;
varying float vFacing;

void main() {
  vUv = uv;

  /* THE MONUMENT TIER.

     A stable ~7% of instances are promoted to enormous forms sitting close to
     the camera. This is the answer to the sharpest weakness of the previous
     pass: every element in the world was roughly the same size, so the eye had
     nothing to measure against and the frame read as a textured backdrop
     rather than as a space. Scale is comparative — you cannot feel that a
     world is big without something in it being big.

     They are the same instances in every state, carried through every
     crossing. That matters as much as their size: the transitions previously
     rearranged a field with nothing in it a viewer could track from one
     discipline into the next, so a crossing read as "the texture changed".
     A monument that visibly rotates and travels from Software's lattice into
     XR's shell is a thread the eye can follow through the transformation. */
  float anchor = step(fract(aId * 53.71), 0.07);
  vAnchor = anchor;

  // Instances cross on their own schedule, spread by id. Without the stagger
  // the entire layer arrives at once and the crossing reads as a cut; with
  // it, the structure comes apart and rebuilds, which is the thing that makes
  // a transition feel like a transformation of one world rather than a swap
  // of two.
  float stagger = fract(aId * 2.71);
  float b = clamp((uBlend - stagger * 0.34) / 0.66, 0.0, 1.0);
  b = b * b * (3.0 - 2.0 * b);

  vec3 cA, cB, rA, rB;
  vec2 sA, sB;

  if (uFrom < -0.5) layoutNeutral(aSeed, aId, uTime, cA, sA, rA);
  else              layoutAt(uFrom, aSeed, aId, uTime, cA, sA, rA);

  if (uTo < -0.5)   layoutNeutral(aSeed, aId, uTime, cB, sB, rB);
  else              layoutAt(uTo, aSeed, aId, uTime, cB, sB, rB);

  vec3 centre = mix(cA, cB, b);
  vec2 size   = mix(sA, sB, b);
  vec3 rot    = mix(rA, rB, b);

  // Mid-crossing the forms lose a little of themselves. Small, but it is what
  // stops the morph from looking like two rigid states being cross-faded.
  size *= 1.0 - b * (1.0 - b) * 0.5;

  // Presence scales the whole layer down rather than fading it out: forms
  // that shrink toward their vanishing point read as receding, and forms that
  // simply lose alpha read as being switched off.
  size *= uPresence;

  if (anchor > 0.5) {
    // Large, and pulled toward the viewer so they read as foreground rather
    // than as bigger background.
    size *= 3.4 + fract(aId * 7.7) * 2.2;
    centre.z = centre.z * 0.34 - 3.0;

    /* Pushed OUT of the centre of the frame, hard.

       A form this size sitting behind the headline would obliterate it, and
       the typography is approved and is the top of the hierarchy. Driving the
       monuments radially outward puts them at the edges and corners where they
       frame the type instead of competing with it — which is also the better
       composition, since a large form is more interesting cropped by the
       viewport than centred in it. */
    vec2 dir = normalize(centre.xy + vec2(0.001, 0.0012));
    centre.xy = dir * (9.5 + abs(centre.x) * 0.5 + fract(aId * 3.3) * 4.0);
  }

  vec3 local = rotateXYZ(vec3(position.xy * size, 0.0), rot);
  vec3 world = centre + local;

  // Parallax scaled by depth, so distant structure barely moves and near
  // structure leans. This is the cue that makes the layer read as being at
  // different distances rather than painted on one plane.
  float far = clamp(-world.z / 28.0, 0.0, 1.0);
  world.xy += uPointer * (1.0 - far) * 0.85;
  world.z += uVelocity * 2.2;

  vec4 mv = modelViewMatrix * vec4(world, 1.0);
  float depth = -mv.z;

  vFog = 1.0 - fogAmount(depth);

  /* HOW MUCH LIGHT THIS SURFACE ACTUALLY RECEIVES.

     Until now every form in the world was pure emission: a pane's brightness
     came only from its own edge falloff, so a pane turned edge-on to the key
     was exactly as bright as one facing it square. That is why the structural
     layer read as a set of glowing outlines rather than as surfaces in a lit
     room — nothing in the frame responded to where the light was.

     The quad's local normal is +Z, so rotating it by the same euler the
     instance uses gives its world normal for free, and one dot product
     against the key's direction gives a real Lambert term. Absolute value,
     because the panes are double-sided: a surface turned away from the key
     is lit the same amount from behind rather than going black, which is
     what a translucent sheet actually does.

     Computed per vertex, not per fragment: the normal is constant across a
     flat quad, so a fragment-rate evaluation would compute the identical
     number four thousand times per instance for nothing. */
  vec3 nrm = rotateXYZ(vec3(0.0, 0.0, 1.0), rot);
  vFacing = abs(dot(normalize(nrm), normalize(uLightDir)));

  // A stable per-instance brightness. Composition needs a few forms to read
  // louder than the rest; a uniformly lit set of rectangles is wallpaper.
  vBright = 0.35 + fract(aId * 17.31) * 0.65;

  gl_Position = projectionMatrix * mv;
}
`;

const fragmentShader = /* glsl */ `
uniform vec3  uLight;
uniform vec3  uDeep;
uniform float uOpacity;

varying vec2  vUv;
varying float vFog;
varying float vBright;
varying float vAnchor;
varying float vFacing;

void main() {
  // Distance to the nearest border, normalised so 0 is the edge and 1 the
  // centre of the pane.
  vec2 e = min(vUv, 1.0 - vUv);
  float border = min(e.x, e.y) * 2.0;

  /* Two materials, one geometry.

     ORDINARY PANES get a tight emissive edge and an almost empty face — a
     soft inner falloff rather than a hairline, because a one-pixel outline
     reads as a wireframe debug view, but tight enough that the pane never
     fills in and turns into a coloured sheet stacked in front of the type.

     MONUMENTS get the opposite treatment. At their size a tight bright edge
     would draw a huge glowing rectangle across the frame, which is the single
     most generic thing this layer could possibly do. They instead take a very
     wide, very faint gradient — the way a large dark surface picks up a
     grazing light along one side — so they read as mass occupying space
     rather than as an outline of a shape. Same primitive, entirely different
     reading, and no extra draw call. */
  float rimTight = pow(1.0 - smoothstep(0.0, 0.2, border), 2.2);
  float rimWide  = pow(1.0 - smoothstep(0.0, 0.85, border), 1.35);
  float rim = mix(rimTight, rimWide, vAnchor);

  float face = smoothstep(0.0, 0.3, border);

  /* THE LIGHTING TERM.

     Two things fall out of one dot product, and both are what a dark glass
     panel actually does:

       lit    a pane square-on to the key takes the light across its whole
              face; one edge-on to it takes almost none. Floored at 0.34 so
              turned-away forms stay part of the composition rather than
              punching holes in it.
       graze  the complement. A sheet seen almost edge-on catches the light
              along its border instead of across its face, which is the
              single most recognisable read of "this is glass and not a
              glowing rectangle".

     The result is that the field is now unevenly lit by a source that has a
     position, so scrolling past it changes which forms are bright — depth
     the geometry alone was never going to produce. */
  float lit = 0.34 + 0.66 * pow(vFacing, 1.4);
  float graze = pow(1.0 - vFacing, 2.0);

  vec3 color = uLight * rim * (0.55 + 0.45 * lit)
             + mix(uDeep, uLight, 0.2) * face * 0.05 * lit
             + uLight * graze * rim * 0.35;

  // Monuments are held far below the panes in alpha. They are enormous on
  // screen, so equal alpha would make them the loudest thing in the frame;
  // at this level they register as presence and depth, not as objects.
  float weight = mix(0.3, 0.145, vAnchor);
  float alpha = (rim * weight * lit + face * 0.012 * lit) * vFog * vBright * uOpacity;

  if (alpha < 0.002) discard;
  gl_FragColor = vec4(color, alpha);
}
`;

export interface StructureHandle {
  material: THREE.ShaderMaterial | null;
}

function buildInstances(count: number) {
  const seed = new Float32Array(count * 3);
  const id = new Float32Array(count);

  // Deterministic. The environment is art-directed, so the composition must
  // be identical on every load rather than reshuffled each visit.
  let s = 90210;
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

  return { seed, id };
}

export const DepthStructures = forwardRef<StructureHandle, { count: number }>(
  function DepthStructures({ count }, ref) {
    const materialRef = useRef<THREE.ShaderMaterial>(null);

    const geometry = useMemo(() => {
      const base = new THREE.PlaneGeometry(1, 1);
      const geo = new THREE.InstancedBufferGeometry();
      geo.index = base.index;
      geo.attributes.position = base.attributes.position;
      geo.attributes.uv = base.attributes.uv;

      const { seed, id } = buildInstances(count);
      geo.setAttribute("aSeed", new THREE.InstancedBufferAttribute(seed, 3));
      geo.setAttribute("aId", new THREE.InstancedBufferAttribute(id, 1));
      geo.instanceCount = count;

      // The shader places instances far outside the base geometry's bounds,
      // so an automatic bounding sphere would cull the layer the moment it
      // moved. frustumCulled is off as well; this is the belt to that braces.
      geo.boundingSphere = new THREE.Sphere(new THREE.Vector3(), 60);

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
          // Additive: no sorting, and therefore no transparency artefacts
          // while a hundred large planes pass through each other mid-crossing.
          blending: THREE.AdditiveBlending,
          side: THREE.DoubleSide,
          uniforms: {
            uFrom: { value: -1 },
            uTo: { value: 0 },
            uBlend: { value: 0 },
            uTime: { value: 0 },
            uVelocity: { value: 0 },
            uPointer: { value: new THREE.Vector2() },
            uPresence: { value: 1 },
            uOpacity: { value: 0 },
            uLightDir: { value: new THREE.Vector3(0, 0, 1) },
            uLight: { value: new THREE.Color() },
            uDeep: { value: new THREE.Color() },
            uFogNear: { value: 6 },
            uFogFar: { value: 34 },
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
      <mesh frustumCulled={false} renderOrder={-50}>
        <primitive object={geometry} attach="geometry" />
        <primitive object={material} attach="material" ref={materialRef} />
      </mesh>
    );
  },
);
