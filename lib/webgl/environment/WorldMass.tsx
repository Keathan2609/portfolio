"use client";

import { forwardRef, useEffect, useImperativeHandle, useMemo, useRef } from "react";
import * as THREE from "three";
import { FOG, ROTATE } from "./shaders";

/**
 * THE WORLD MASS
 * ==============
 *
 * Solid architecture. The layer everything else in this environment was
 * missing.
 *
 * WHY THIS EXISTS. Every previous layer — the atmosphere, the structural
 * panes, the point field, the near drift — is additively blended with
 * depthWrite off. That was a deliberate choice each time and individually
 * defensible: additive needs no sorting, produces no transparency artefacts,
 * and lets a hundred forms pass through each other mid-crossing without
 * flickering. But additive blending has one property that no amount of art
 * direction can work around:
 *
 *   IT CAN ONLY ADD LIGHT. It can never occlude anything.
 *
 * A surface that cannot occlude cannot cast a silhouette, cannot pass in
 * front of something, cannot hide a thing behind it, and therefore cannot
 * read as MASS. It reads as light in the air — which is the exact definition
 * of a visual effect. That is the whole reason the site still looked like a
 * website with VFX behind it: there was no object in the entire world that
 * anything could be behind.
 *
 * So this layer is opaque. It writes depth, it tests depth, it uses normal
 * blending, and it is lit rather than emissive. Distant masses are fogged
 * toward the deep colour, so scale reads as aerial perspective the way it
 * does in a real space rather than as things getting smaller.
 *
 * THE CONTRAST DIVIDEND. Solid geometry behind type sounds like an
 * accessibility hazard and is in fact the opposite here. These surfaces are
 * dark graphite — considerably darker than the lit atmosphere behind them —
 * so where a mass covers the frame it LOWERS the background luminance under
 * the text. The layer adds depth and buys contrast headroom at the same time.
 *
 * THE CLEAR CENTRE. Every layout pushes its forms radially out of the middle
 * of the frame, by an amount that widens with depth. The result is a clear
 * axis down the centre of the world with structure to either side, which
 * keeps the typography untouched and is, independently, the oldest
 * architectural composition there is: you are always looking down something.
 */

const LAYOUTS = /* glsl */ `
// Each layout writes a centre, a box half-extent and an XYZ rotation.
// Out-parameters rather than a struct: compiles identically on the GLSL ES
// 1.00 targets some mobile drivers still report.

// 01 SOFTWARE ENGINEERING — monumental modular architecture.
// Tall slabs on a coarse lattice, stepped back in discrete layers, perfectly
// axis-aligned. Read from inside, a regular colonnade receding into fog is
// the most direct statement of "engineered structure" available, and it is
// architecture rather than a diagram of architecture because the forms are
// solid and occlude one another.
void massSoftware(vec3 s, float id, float t, out vec3 c, out vec3 sz, out vec3 r) {
  float col = floor(s.x * 2.2);
  float row = floor(s.y * 1.4);
  float layer = floor(fract(id * 3.71) * 5.0);

  c = vec3(col * 7.4, row * 4.6 - 1.5, -9.0 - layer * 11.0);
  sz = vec3(1.7, 3.4, 1.7) * (0.55 + fract(id * 7.13) * 0.9);
  r = vec3(0.0, sin(t * 0.05 + id * 6.28) * 0.01, 0.0);
}

// 02 XR DEVELOPMENT — the chamber.
// The lattice opens out into a room the camera stands inside: masses arranged
// on concentric shells, quantised onto a small number of radii and latitudes
// so the arrangement reads as built enclosure rather than as debris in orbit.
// This is the largest world in the set by a wide margin, and it is the one
// that has to answer "does this feel spatial" on its own.
void massXR(vec3 s, float id, float t, out vec3 c, out vec3 sz, out vec3 r) {
  float shell = 11.0 + floor(fract(id * 7.31) * 4.0) * 7.0;
  float lat = floor((s.y * 0.5 + 0.5) * 4.0) / 4.0;
  float phi = (0.12 + lat * 0.76) * 3.14159;
  float theta = s.x * 3.14159 + t * 0.008;

  c = vec3(
    shell * sin(phi) * cos(theta),
    shell * cos(phi) * 0.78,
    shell * sin(phi) * sin(theta) - 6.0
  );
  sz = vec3(2.6, 2.2, 2.6) * (0.6 + fract(id * 3.37) * 1.5);
  // Turned to face the chamber's centre, so the inner faces are what the
  // viewer sees and the volume reads as enclosing.
  r = vec3(0.0, -theta, 0.0);
}

// 03 CREATIVE — the installation.
// Few, enormous, thin slabs standing in an editorial arrangement. Most of the
// set collapses out entirely; what remains is deliberately unbalanced and
// deliberately sparse, because a gallery is defined by the space between the
// works. Thin in Z so they read as sheets rather than blocks.
void massCreative(vec3 s, float id, float t, out vec3 c, out vec3 sz, out vec3 r) {
  float keep = step(fract(id * 13.71), 0.42);
  float slot = floor(fract(id * 5.13) * 5.0);

  c = vec3(
    cos(slot * 2.13) * 11.0,
    sin(slot * 1.71) * 4.0 - 0.5,
    -6.0 - slot * 4.4
  );
  sz = vec3(3.6, 5.2, 0.22) * keep * (0.7 + fract(id * 2.11) * 0.8);
  r = vec3(0.0, (fract(id * 9.13) - 0.5) * 0.5, (fract(id * 4.7) - 0.5) * 0.05);
  t;
}

// 04 DATA SCIENCE — the corridor.
// Long beams running away down the Z axis on both sides, at staggered heights
// and depths. Trajectory expressed as architecture rather than as a line
// graph: the space itself is organised into routes, and the viewer is looking
// along them.
void massData(vec3 s, float id, float t, out vec3 c, out vec3 sz, out vec3 r) {
  float lane = fract(id * 11.73);
  float side = lane < 0.5 ? -1.0 : 1.0;
  float rung = floor(fract(id * 4.31) * 5.0);

  c = vec3(
    side * (7.5 + fract(id * 6.7) * 6.0),
    -4.0 + rung * 2.3 + sin(t * 0.06 + lane * 6.28) * 0.25,
    -12.0 - fract(id * 2.91) * 22.0
  );
  // Long in Z: the beam IS the trajectory.
  sz = vec3(0.5 + fract(id * 5.5) * 0.4, 0.5, 13.0 + fract(id * 3.3) * 10.0);
  r = vec3(0.0, side * 0.06, 0.0);
}

// 05 CYBERSECURITY — the containment.
// Everything quantises onto a hard grid of heavy blocks forming boundary
// walls, with a stable per-cell offset so the topology is asymmetric. Tighter
// and lower than Software's colonnade — the same ordered instinct, but
// closing in rather than opening up.
void massSecurity(vec3 s, float id, float t, out vec3 c, out vec3 sz, out vec3 r) {
  float col = floor(s.x * 2.8);
  float tier = floor(fract(id * 4.19) * 4.0) - 1.5;
  float jitter = fract(sin(col * 12.9898 + tier * 78.233) * 43758.5453);

  c = vec3(
    col * 6.2 + (jitter - 0.5) * 1.6,
    tier * 3.4 + (jitter - 0.5) * 0.8,
    -8.0 - fract(id * 2.31) * 16.0
  );
  sz = vec3(2.4, 1.1, 2.4) * (0.5 + jitter * 0.8);
  r = vec3(0.0, (jitter - 0.5) * 0.12, 0.0);
  t;
}

void massAt(float i, vec3 s, float id, float t, out vec3 c, out vec3 sz, out vec3 r) {
  if (i < 0.5)      massSoftware(s, id, t, c, sz, r);
  else if (i < 1.5) massXR(s, id, t, c, sz, r);
  else if (i < 2.5) massCreative(s, id, t, c, sz, r);
  else if (i < 3.5) massData(s, id, t, c, sz, r);
  else              massSecurity(s, id, t, c, sz, r);
}

// The opening and closing state: Software's colonnade pushed far back and
// thinned, so arriving at Software is the same architecture resolving toward
// the viewer rather than a different world appearing.
void massNeutral(vec3 s, float id, float t, out vec3 c, out vec3 sz, out vec3 r) {
  massSoftware(s, id, t, c, sz, r);
  c.z -= 12.0;
  c.xy *= 1.3;
  sz *= 0.8;
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
uniform float uGroundY;

attribute vec3 aSeed;
attribute float aId;

varying vec3  vNormal;
varying vec3  vView;
varying float vFog;
varying float vTone;
varying float vHeight;

void main() {
  // Masses cross on their own schedule, spread by id, so the architecture
  // comes apart and rebuilds instead of cross-fading between two rigid sets.
  float stagger = fract(aId * 2.71);
  float b = clamp((uBlend - stagger * 0.36) / 0.64, 0.0, 1.0);
  b = b * b * (3.0 - 2.0 * b);

  vec3 cA, cB, rA, rB, sA, sB;

  if (uFrom < -0.5) massNeutral(aSeed, aId, uTime, cA, sA, rA);
  else              massAt(uFrom, aSeed, aId, uTime, cA, sA, rA);

  if (uTo < -0.5)   massNeutral(aSeed, aId, uTime, cB, sB, rB);
  else              massAt(uTo, aSeed, aId, uTime, cB, sB, rB);

  vec3 centre = mix(cA, cB, b);
  vec3 extent = mix(sA, sB, b);
  vec3 rot    = mix(rA, rB, b);

  extent *= uPresence;

  /* ROOT MOST OF THE ARCHITECTURE TO THE FLOOR.

     A form whose base does not meet the ground is debris, however solid it
     is. Sitting the majority of the set ON the floor is what converts a
     collection of masses into a built environment — the floor gives them a
     common datum, and a common datum is most of what "architecture" means.

     A deliberate minority stay suspended. Everything grounded reads as a
     model village; a few pieces overhead give the volume a ceiling and stop
     the composition from being uniformly bottom-weighted. */
  float grounded = step(fract(aId * 31.17), 0.68);
  float base = uGroundY + extent.y;
  centre.y = mix(centre.y, base, grounded);

  /* KEEP A CLEAR CORRIDOR DOWN THE MIDDLE — AFTER grounding, and on X only.

     This was originally a radial push on XY, applied before the forms were
     dropped to the floor, and grounding silently broke it: a mass moved out
     to a safe radius mostly by its HEIGHT (x=2, y=12) had its y overwritten
     by the floor datum and landed back at x=2 — dead centre, directly behind
     the capability list. Measured on the XR frame, that put a large lit block
     behind the body copy.

     Horizontal-only is also the more correct test. The type column is centred
     in X and runs most of the height of the viewport, so the axis that has to
     stay clear is X; height was never the dimension that protected it. The
     corridor widens with depth because a fixed world offset that clears the
     column at 10 units clears nothing at 40. */
  float side = centre.x >= 0.0 ? 1.0 : -1.0;
  // A form sitting exactly on the axis has no side to be pushed to; give it
  // one from its own seed so the split stays deterministic.
  if (abs(centre.x) < 0.001) side = fract(aId * 7.13) < 0.5 ? -1.0 : 1.0;

  /* THE CORRIDOR IS ASYMMETRIC, because the type is.

     A symmetric exclusion emptied the middle of every frame and pushed all
     the architecture to the two extreme edges, which cleared the text and
     cost the composition — the world went back to looking sparse. But the DOM
     is left-aligned: the headline runs from the left gutter to roughly three
     quarters across, and nothing of consequence sits in the right quarter. So
     the left side is held well clear and the right side is allowed much
     closer, which is where the density can live.

     Low forms are exempt as well. A mass whose top is below the type entirely
     cannot obscure anything, so it is free to come to the centre — which is
     what lets the near floor carry foreground massing instead of being an
     empty apron. */
  float top = centre.y + extent.y;
  float low = step(top, uGroundY + 4.2);

  float base_clear = side > 0.0 ? 4.6 : 8.6;
  float clearance = (base_clear + max(-centre.z, 0.0) * 0.30) * mix(1.0, 0.35, low);

  if (abs(centre.x) < clearance) centre.x = side * clearance;

  vec3 local = rotateXYZ(position * extent, rot);
  vec3 world = centre + local;

  // How far up this fragment sits on its own form, 0 at the base. Used for a
  // contact-darkening term in the fragment stage.
  vHeight = clamp((world.y - uGroundY) / max(extent.y * 2.0, 0.001), 0.0, 1.0);

  // Parallax scaled by nearness, so distant architecture stays put and near
  // architecture leans. Small: these are heavy objects.
  float far = clamp(-world.z / 40.0, 0.0, 1.0);
  world.xy += uPointer * (1.0 - far) * 0.5;
  world.z += uVelocity * 1.8;

  vec4 mv = modelViewMatrix * vec4(world, 1.0);
  float depth = -mv.z;

  vNormal = normalize(mat3(modelViewMatrix) * rotateXYZ(normal, rot));
  vView = normalize(-mv.xyz);
  vFog = fogAmount(depth);

  // A stable per-instance albedo variation. Identical surfaces read as a
  // repeated asset; a spread reads as a built thing made of many parts.
  vTone = 0.72 + fract(aId * 17.31) * 0.56;

  gl_Position = projectionMatrix * mv;
}
`;

const fragmentShader = /* glsl */ `
uniform vec3  uLight;
uniform vec3  uDeep;
uniform vec3  uGraphite;
uniform vec3  uLightDir;
uniform float uPresence;

varying vec3  vNormal;
varying vec3  vView;
varying float vFog;
varying float vTone;
varying float vHeight;

void main() {
  vec3 n = normalize(vNormal);
  vec3 v = normalize(vView);

  /* A dark surface, lit. Not an emissive one.

     The albedo is graphite — genuinely dark, well under the atmosphere
     behind it — so these masses read by their SHAPE and their edge rather
     than by glowing. That is the difference between architecture and a
     lightbox, and it is also what lets a large form sit near the type
     without touching its contrast. */
  float ndl = max(dot(n, normalize(uLightDir)), 0.0);

  /* The albedo is dark; the RANGE across it is what has to be wide.

     The first attempt multiplied a near-black graphite by a soft terminator
     and produced surfaces that topped out around rgb(28) — below the lit
     atmosphere behind them, so every mass read as a flat black cut-out
     punched into the frame rather than as a lit solid. A dark material is
     correct, but it still needs a real lit-to-unlit spread or there is
     nothing for the eye to resolve as form.

     Lit faces now reach roughly rgb(50) and faces turned away fall to about
     rgb(6). That spread is the whole read: the same surface, clearly catching
     a light on one side and clearly not on the other, which is what tells you
     something is solid. */
  vec3 albedo = uGraphite * vTone;
  vec3 base = albedo * (0.3 + ndl * 1.45);

  // The discipline's light bleeds onto the faces it actually reaches, so the
  // architecture belongs to the same room as the air around it rather than
  // being neutral geometry sitting in coloured fog.
  base += uLight * ndl * 0.1;

  // Rim. A grazing edge picks up the key, which is what makes a dark mass
  // legible against a dark background at all.
  float fres = pow(1.0 - max(dot(n, v), 0.0), 2.6);
  base += uLight * fres * 0.5;

  // A narrow highlight where a face turns directly into the key. Restrained:
  // this is matte stone catching a light, not polished metal.
  base += uLight * pow(ndl, 16.0) * 0.11;

  /* Aerial perspective. Far masses converge on the deep colour of the
     atmosphere, so distance reads as air rather than as scale alone — the
     single most effective depth cue available and the reason the world can
     feel larger than the frame it is drawn in. */
  /* CONTACT DARKENING — the cheapest occlusion that reads.

     Real ambient occlusion needs a depth prepass and a blur; a shadow map
     needs a second render from the light. Both were weighed and both cost a
     full pass for a term that, at this scale and this darkness, is almost
     entirely a gradient near the floor.

     So it is approximated: surfaces darken toward their base, where a real
     scene would have the floor and the neighbouring geometry stealing their
     ambient light. It costs one clamp and one mix, it is exact enough at
     these luminances to be indistinguishable, and — unlike either real
     option — it runs identically on the low tier and on a phone. */
  base *= 0.45 + 0.55 * smoothstep(0.0, 0.42, vHeight);

  vec3 color = mix(base, uDeep, vFog);

  gl_FragColor = vec4(color, 1.0);
}
`;

export interface WorldMassHandle {
  material: THREE.ShaderMaterial | null;
}

export const WorldMass = forwardRef<WorldMassHandle, { count: number }>(
  function WorldMass({ count }, ref) {
    const materialRef = useRef<THREE.ShaderMaterial>(null);

    const geometry = useMemo(() => {
      const base = new THREE.BoxGeometry(1, 1, 1);
      const geo = new THREE.InstancedBufferGeometry();
      geo.index = base.index;
      geo.attributes.position = base.attributes.position;
      geo.attributes.normal = base.attributes.normal;
      geo.attributes.uv = base.attributes.uv;

      const seed = new Float32Array(count * 3);
      const id = new Float32Array(count);
      // Deterministic: the architecture is authored, so it must be the same
      // composition on every load rather than reshuffled each visit.
      let s = 24601;
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
      geo.boundingSphere = new THREE.Sphere(new THREE.Vector3(), 80);

      base.dispose();
      return geo;
    }, [count]);

    const material = useMemo(
      () =>
        new THREE.ShaderMaterial({
          vertexShader,
          fragmentShader,
          // Opaque, depth-tested, depth-writing. The entire point of this
          // layer: these forms occlude each other and everything drawn after
          // them, which is what makes them mass rather than light.
          transparent: false,
          depthWrite: true,
          depthTest: true,
          side: THREE.FrontSide,
          uniforms: {
            uFrom: { value: -1 },
            uTo: { value: 0 },
            uBlend: { value: 0 },
            uTime: { value: 0 },
            uVelocity: { value: 0 },
            uPointer: { value: new THREE.Vector2() },
            uPresence: { value: 1 },
            uLight: { value: new THREE.Color() },
            uDeep: { value: new THREE.Color() },
            uGraphite: { value: new THREE.Color("#161b26") },
            uLightDir: { value: new THREE.Vector3(0, 0, 1) },
            uGroundY: { value: -7.2 },
            uFogNear: { value: 8 },
            uFogFar: { value: 52 },
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
      // Drawn before every additive layer so they composite over it, and
      // before the atmosphere in depth terms — the atmosphere writes no depth,
      // so it can never occlude this.
      <mesh frustumCulled={false} renderOrder={-60}>
        <primitive object={geometry} attach="geometry" />
        <primitive object={material} attach="material" ref={materialRef} />
      </mesh>
    );
  },
);
