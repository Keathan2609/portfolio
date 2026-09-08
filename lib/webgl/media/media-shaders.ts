import { FOG } from "@/lib/webgl/environment/shaders";

/**
 * THE MEDIA PLANE SHADER
 * ======================
 *
 * One material serves every plane in the composition — real media, technical
 * overlays, and the glass panels they sit against. The mode is a uniform
 * rather than three separate materials, because the planes are sorted and
 * drawn together and a shared program means one shader compile and no state
 * thrash between them.
 *
 * WHAT IT HAS TO DO, and why each part is here rather than in CSS:
 *
 *  FIT. A plane's world dimensions are set by the composition, not by the
 *  image. Cover/contain is therefore resolved in the shader from the ratio of
 *  plane aspect to image aspect, so an asset can be swapped for one with a
 *  different aspect and the layout does not move. This is the single most
 *  important property for a data-driven registry: the composition owns the
 *  frame, the asset owns its content, and neither has to know the other's
 *  proportions.
 *
 *  FOG, on the same curve as everything else. This is what makes media read
 *  as being IN the space rather than composited over a picture of one. It is
 *  the identical `smoothstep(uFogNear, uFogFar, depth)` the structural,
 *  point, mass and ground layers use — imported, not re-derived, because the
 *  moment the curves diverge the depth comes apart.
 *
 *  REVEAL as a directional wipe with a soft edge, not an opacity fade. A fade
 *  says "an element appeared"; a wipe says "the composition is assembling".
 *  Driven by scroll, so it scrubs.
 *
 *  A ROUNDED MASK computed as a box SDF, so the corner radius is in world
 *  units and stays visually constant as the plane changes depth — a UV-space
 *  radius would appear to grow as a plane recedes.
 *
 *  AN EDGE TERM. A lit hairline along the plane boundary, picking up the
 *  world's key colour. This is what stops a floating rectangle reading as a
 *  floating rectangle: real surfaces catch light at their edges.
 *
 *  GLASS, without refraction. Refraction needs the scene in a render target,
 *  which is a second pass over the whole viewport, and the brief is explicit
 *  that expensive postprocessing has to justify itself. A tinted translucent
 *  panel with a gradient body, an edge highlight and a Fresnel-ish falloff
 *  reads as glass at these angles for a fraction of the cost. What sells it
 *  is the edge and the fact that it fogs with everything else — not blur.
 */

export const MEDIA_VERTEX = /* glsl */ `
uniform float uReveal;
uniform float uRevealDir;
uniform float uDrift;
uniform float uTime;
uniform vec2  uPointer;
uniform float uParallax;

varying vec2  vUv;
varying float vDepth;
varying vec3  vViewPos;

void main() {
  vUv = uv;

  vec3 p = position;

  /* The plane eases in along its own normal as it reveals, so an arriving
     element travels toward the viewer rather than simply becoming opaque.
     Small — 0.35 of a unit — because the composition is authored and a plane
     that moves far would land somewhere nobody framed. */
  p.z += (1.0 - uReveal) * 0.35;

  /* Ambient drift is per-plane and phase-offset by the plane's own position,
     so a composition of six planes does not breathe in unison. */
  float phase = position.x * 0.7 + position.y * 1.3;
  p.x += sin(uTime * 0.21 + phase) * uDrift;
  p.y += cos(uTime * 0.17 + phase * 1.4) * uDrift * 0.7;

  vec4 mv = modelViewMatrix * vec4(p, 1.0);

  /* Pointer parallax is applied in VIEW space, after the model matrix. In
     world space it would fight the plane's authored rotation and shear the
     composition; in view space every plane leans toward the cursor in the
     same screen direction regardless of how it is turned. */
  mv.xy += uPointer * uParallax;

  vViewPos = mv.xyz;
  vDepth = -mv.z;

  gl_Position = projectionMatrix * mv;
}
`;

export const MEDIA_FRAGMENT = /* glsl */ `
${FOG}

uniform sampler2D uMap;
uniform float uHasMap;
/** 0 = media, 1 = glass panel. */
uniform float uMode;
uniform float uPlaneAspect;
uniform float uImageAspect;
/** 0 = contain, 1 = cover. */
uniform float uFit;
uniform float uCrop;
uniform float uOpacity;
uniform float uReveal;
uniform float uRevealDir;
uniform float uRadius;
uniform vec2  uSize;
uniform vec3  uDeep;
uniform vec3  uLight;
uniform vec3  uTint;
uniform float uTintAmount;
uniform float uEdge;
uniform float uGlassAlpha;
uniform float uVignette;
uniform float uDesaturate;
uniform float uLift;

varying vec2  vUv;
varying float vDepth;
varying vec3  vViewPos;

/** Signed distance to a rounded box, in the plane's own world units. */
float roundedBoxSDF(vec2 p, vec2 half_, float r) {
  vec2 q = abs(p) - half_ + r;
  return min(max(q.x, q.y), 0.0) + length(max(q, 0.0)) - r;
}

void main() {
  /* ---- fit -------------------------------------------------------------
     Scale UVs about the centre so the image fills (cover) or sits inside
     (contain) the plane without distortion. */
  vec2 uv = vUv - 0.5;
  float ratio = uPlaneAspect / max(uImageAspect, 0.0001);
  vec2 coverScale = ratio > 1.0 ? vec2(1.0 / ratio, 1.0) : vec2(1.0, ratio);
  vec2 containScale = ratio > 1.0 ? vec2(1.0, ratio) : vec2(1.0 / ratio, 1.0);
  vec2 fitScale = mix(containScale, coverScale, uFit);
  uv = uv * fitScale / max(uCrop, 0.0001) + 0.5;

  vec4 media = vec4(0.0);
  if (uHasMap > 0.5) {
    media = texture2D(uMap, clamp(uv, 0.0, 1.0));
  }

  /* ---- glass body ------------------------------------------------------
     A vertical gradient in the world's own two colours, not a grey panel.
     The panel therefore belongs to whichever discipline is on screen and
     transitions with it for free. */
  vec3 glass = mix(uDeep * 1.35, uLight * 0.55, pow(clamp(vUv.y, 0.0, 1.0), 1.4));
  glass += uLight * 0.12 * pow(1.0 - abs(vUv.x - 0.5) * 2.0, 3.0);

  vec3 colour = mix(media.rgb, glass, uMode);

  /* Desaturate + tint. Used to push technical passes and background boards
     back into the world's hue so a composition of six real images does not
     read as six unrelated photographs. */
  float luma = dot(colour, vec3(0.2126, 0.7152, 0.0722));
  colour = mix(colour, vec3(luma), uDesaturate * (1.0 - uMode));
  colour = mix(colour, uTint * max(luma, 0.08) * 1.6, uTintAmount * (1.0 - uMode));
  colour *= uLift;

  /* ---- interior vignette ---------------------------------------------
     Cinematic framing on the media itself. Keeps the eye in the middle of
     each plane and stops a bright board's corner competing with the type. */
  vec2 vc = (vUv - 0.5) * 2.0;
  float vig = 1.0 - uVignette * dot(vc, vc) * 0.34;
  colour *= clamp(vig, 0.0, 1.0);

  /* ---- rounded mask, in world units ---------------------------------- */
  vec2 half_ = uSize * 0.5;
  vec2 p = (vUv - 0.5) * uSize;
  float d = roundedBoxSDF(p, half_, min(uRadius, min(half_.x, half_.y)));
  /* One-pixel-ish feather derived from the plane's own scale rather than
     fwidth: fwidth on a steeply angled plane produces a visibly thicker
     edge on the receding side. */
  float feather = max(uSize.x, uSize.y) * 0.0022;
  float mask = 1.0 - smoothstep(-feather, feather, d);

  /* ---- edge light ----------------------------------------------------- */
  float edgeBand = 1.0 - smoothstep(0.0, max(uSize.x, uSize.y) * 0.012, abs(d));
  colour += uLight * edgeBand * uEdge;

  /* ---- reveal wipe ----------------------------------------------------
     uRevealDir selects the axis and sign: 0 up, 1 down, 2 left, 3 right.
     The wipe runs slightly past 1 so the soft edge clears the plane fully. */
  float axis =
      uRevealDir < 0.5 ? vUv.y
    : uRevealDir < 1.5 ? 1.0 - vUv.y
    : uRevealDir < 2.5 ? 1.0 - vUv.x
    : vUv.x;
  float wipe = smoothstep(axis - 0.34, axis + 0.02, uReveal * 1.36 - 0.18);

  /* ---- fog, the shared curve ----------------------------------------- */
  float fog = fogAmount(vDepth);
  colour = mix(colour, uDeep, fog);

  float alpha = mask * wipe * uOpacity * mix(1.0, uGlassAlpha, uMode);
  if (uHasMap < 0.5 && uMode < 0.5) alpha = 0.0;
  /* Fogged-out planes are fully absorbed rather than lingering as faint
     rectangles at the back of the frame. */
  alpha *= 1.0 - fog * 0.85;

  if (alpha < 0.004) discard;

  gl_FragColor = vec4(colour, alpha);
}
`;
