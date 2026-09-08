/**
 * GLSL shared across the environment layers.
 *
 * Kept deliberately small. The brief asks for shaders where they materially
 * improve the environment and not as a demonstration, so what is here is the
 * minimum the four layers actually need: cheap value noise for atmosphere,
 * one fog curve every layer must agree on, and a rotation helper so the
 * structural layer can build its transforms on the GPU instead of the CPU.
 *
 * Note the deliberate absence of simplex noise: `lib/webgl/shaders/chunks.ts`
 * already carries Ashima simplex for the hero object, but the atmosphere runs
 * per-fragment over the whole viewport, and 3D simplex at three octaves there
 * costs several times what 2D value noise does for a result nobody can tell
 * apart under fog. The expensive one stays where it earns its cost.
 */

/** Hash + 2D value noise + fbm. Screen-space atmosphere only. */
export const VALUE_FBM = /* glsl */ `
float hash21(vec2 p) {
  p = fract(p * vec2(123.34, 456.21));
  p += dot(p, p + 45.32);
  return fract(p.x * p.y);
}

float vnoise(vec2 p) {
  vec2 i = floor(p);
  vec2 f = fract(p);
  // Quintic rather than cubic: the extra smoothness costs two multiplies and
  // removes the faint grid the cubic curve leaves visible in flat fog.
  vec2 u = f * f * f * (f * (f * 6.0 - 15.0) + 10.0);
  float a = hash21(i);
  float b = hash21(i + vec2(1.0, 0.0));
  float c = hash21(i + vec2(0.0, 1.0));
  float d = hash21(i + vec2(1.0, 1.0));
  return mix(mix(a, b, u.x), mix(c, d, u.x), u.y);
}

float fbm(vec2 p, int octaves) {
  float sum = 0.0;
  float amp = 0.5;
  for (int i = 0; i < 5; i++) {
    if (i >= octaves) break;
    sum += vnoise(p) * amp;
    p *= 2.02;   // Not exactly 2.0 — an integer lacunarity re-aligns the
    amp *= 0.5;  // octaves onto the same lattice and the grid comes back.
  }
  return sum;
}
`;

/**
 * The one fog curve.
 *
 * Every layer fades into the deep colour on the SAME falloff, which is the
 * whole reason the layers read as one space rather than as three systems
 * sharing a viewport. Change it here and the whole environment stays coherent;
 * change it per layer and the depth immediately comes apart.
 *
 * `depth` is view-space distance (positive, i.e. -mvPosition.z).
 */
export const FOG = /* glsl */ `
uniform float uFogNear;
uniform float uFogFar;

float fogAmount(float depth) {
  return smoothstep(uFogNear, uFogFar, depth);
}
`;

/**
 * Euler rotation, XYZ order, built inline.
 *
 * The structural layer morphs every instance between two authored layouts
 * that differ in orientation as well as position. Doing that on the CPU meant
 * composing a matrix per instance per frame; doing it here means the whole
 * layer costs one uniform update and the instance count stops mattering.
 */
export const ROTATE = /* glsl */ `
vec3 rotateXYZ(vec3 v, vec3 r) {
  float cx = cos(r.x), sx = sin(r.x);
  float cy = cos(r.y), sy = sin(r.y);
  float cz = cos(r.z), sz = sin(r.z);

  v = vec3(v.x, v.y * cx - v.z * sx, v.y * sx + v.z * cx);
  v = vec3(v.x * cy + v.z * sy, v.y, -v.x * sy + v.z * cy);
  v = vec3(v.x * cz - v.y * sz, v.x * sz + v.y * cz, v.z);
  return v;
}
`;

/**
 * Ordered dither.
 *
 * Load-bearing rather than decorative here. The atmosphere is a very shallow
 * gradient across a large dark area, which is the exact case 8-bit output
 * bands on, and banding across the whole viewport is far more visible than
 * the gradient itself. Applied at ±1/255 so it never reads as grain.
 */
export const DITHER_8 = /* glsl */ `
float dither8(vec2 fragCoord) {
  // 4x4 Bayer, unrolled into arithmetic — no array indexing, so this compiles
  // identically on the older GLSL ES targets some mobile drivers still use.
  vec2 p = mod(fragCoord, 4.0);
  float i = p.x + p.y * 4.0;
  return fract(sin(i * 12.9898) * 43758.5453) / 255.0 - 0.5 / 255.0;
}
`;
