import type { DisciplineId } from "@/lib/data/types";

/**
 * THE COMPOSITIONS
 * ================
 *
 * The art direction, as data.
 *
 * Each discipline is a set of planes placed in the SAME world the camera
 * already travels through — not a 2D overlay. That is the whole reason this
 * is world-space data and not CSS: the planes inherit the camera's authored
 * framing, the shared fog curve and the discipline's colour for free, so a
 * composition read at Creative's 34mm-equivalent lens is genuinely compressed
 * and the same numbers read at XR's 64° lens are genuinely enclosing.
 *
 * WHERE THE PLANES SIT, AND WHY IT IS NOT SYMMETRICAL. The DOM owns the left
 * and centre of every discipline frame — the heading spans the top, the
 * level/register pair and the capability list run down the left, and the
 * project rail crosses the bottom. The atmosphere shader already suppresses
 * its key through the middle band to protect that type. So the media occupies
 * the right hemisphere and the depth behind, which is simultaneously the only
 * place it can go and the better composition: the frame becomes asymmetric
 * and layered rather than a centred image with text on it.
 *
 * COORDINATES are world units in the environment's space. The camera sits
 * between z=6.4 (XR, nearest) and z=10.6 (Creative, furthest) looking down
 * -Z, so a plane at z=-4 is mid-depth and a plane at z=+1 is genuinely in
 * front of the camera's convergence point — a real foreground element rather
 * than a smaller background one.
 *
 * THE ONE PIECE OF ARITHMETIC THAT MATTERS WHEN AUTHORING THESE. The visible
 * half-extent shrinks with proximity, and getting this wrong is what clipped
 * the first two passes of the XR chapter off the right edge of the frame:
 *
 *     d              = cameraZ - planeZ
 *     halfHeight     = d · tan(fov/2)
 *     halfWidth      = halfHeight · viewportAspect
 *
 * At XR's 64° lens on a 16:10 viewport that collapses to the useful
 * approximation halfWidth ≈ d and halfHeight ≈ 0.625·d. So a plane at z=-3.4
 * (d=9.8) has ±9.8 of room, but a foreground plane at z=+1.4 (d=5.0) has only
 * ±5.0 — the same x value that is comfortably inside the frame at mid-depth
 * runs off the edge up close. Every `x` below is checked as
 * |x| + w/2 ≤ 0.92·halfWidth, and the 0.92 is the margin that keeps an edge
 * visible, because a plane whose boundary leaves the viewport stops reading as
 * a surface in space and becomes a border.
 *
 * Creative's plane widths are roughly half XR's for the same apparent size,
 * for the same reason in reverse: the long 34° lens sees far less.
 *
 * `minTier` is how the composition thins out rather than shrinks. On MEDIUM
 * the supporting and deep-background planes drop and the authored focal
 * relationship survives; on LOW only the hero plane and its glass remain.
 * That is a deliberately different strategy from lowering resolution
 * everywhere, which would keep all seven planes and make all seven muddy.
 */

export type MediaKind = "image" | "video" | "glass";
export type RevealDir = "up" | "down" | "left" | "right";
export type TierFloor = "high" | "medium" | "low";

export interface CompositionItem {
  id: string;
  kind: MediaKind;
  /** Asset base path under /media; the tier appends `-lg` / `-sm`.webp. */
  asset?: string;
  /** Native aspect (w/h) of the source, so `fit` resolves correctly. */
  aspect?: number;
  /** Video source + poster. Poster is mandatory, as everywhere else. */
  video?: { src: string; poster: string };

  /* ---- placement, in world units ---- */
  x: number;
  y: number;
  z: number;
  /** Plane width; height is derived from `h` when given, else from `aspect`. */
  w: number;
  h?: number;
  rotX?: number;
  rotY?: number;
  rotZ?: number;

  /* ---- treatment ---- */
  /** 1 = cover (fill and crop), 0 = contain. Defaults to cover. */
  fit?: number;
  /** >1 crops further in. For detail crops of a larger board. */
  crop?: number;
  opacity?: number;
  /** Corner radius in world units. 0 = sharp. */
  radius?: number;
  /** Edge light strength. Suppressed automatically as `feather` rises. */
  edge?: number;
  /**
   * Where this plane sits between "framed card" and "material".
   *
   * 0 (default) keeps the hard edge and lit rim — right for a deliberate
   * editorial frame. 1 dissolves the boundary entirely so the image reads as a
   * region of the scene rather than a rectangle in it. Anything oversized or
   * bleeding off the frame should be feathered; a hard edge on a crop that
   * leaves the viewport just draws attention to the rectangle.
   */
  feather?: number;
  /**
   * How much this plane yields to the left-hand type column, 0-1.
   *
   * Screen-space suppression toward the left edge, where every discipline's
   * DOM text lives. Background washes should yield fully (1); a hero on the
   * right barely needs it (0.2-0.4); a deliberate foreground accent that sits
   * clear of the type can ignore it (0).
   */
  textGuard?: number;
  /** Pull the image toward the world hue. Used to push support planes back. */
  desaturate?: number;
  tint?: number;
  /** Interior vignette, for cinematic framing of the plane itself. */
  vignette?: number;
  /** Exposure trim, so a bright board does not out-shine the type. */
  lift?: number;
  /** Glass panel opacity. Only meaningful for kind: "glass". */
  glassAlpha?: number;

  /* ---- behaviour ---- */
  /** View-space pointer lean. Higher on near planes — that IS the parallax. */
  parallax?: number;
  /** Ambient drift amplitude. Kept small; this is not a floating-card site. */
  drift?: number;
  reveal?: RevealDir;
  /** Stagger order within the composition, 0 first. */
  order?: number;
  /** Dropped on tiers below this. */
  minTier?: TierFloor;
}

export interface Composition {
  discipline: DisciplineId;
  items: CompositionItem[];
}

/* Native aspects of the encoded assets, so `fit` never distorts. */
const R16_9 = 16 / 9;

/* ------------------------------------------------------------------ */
/* 02 — XR DEVELOPMENT · real ORBITAL material                         */
/*                                                                     */
/* The chapter that has to prove the claim. Every plane here is an      */
/* actual Blender/EEVEE render of an actual modular environment kit —   */
/* nothing is stand-in. The camera is already inside the shells at      */
/* z=6.4 on the widest lens in the set (64°), so the composition is     */
/* built to be stood inside: a large hero plane off-centre, a moving    */
/* turntable at mid-depth, a cropped detail genuinely in front of the   */
/* camera, and two heavily-desaturated passes far back carrying depth.  */
/* ------------------------------------------------------------------ */
const xr: Composition = {
  discipline: "xr",
  items: [
    /* AGGRESSIVE PASS. The previous version of this chapter kept all seven
       planes fully inside the frame, each with a rounded corner and a lit rim,
       on a rule of |x| + w/2 <= 0.92 * halfWidth. Every plane was therefore a
       complete, bordered rectangle — eight of them — and the result read as a
       gallery wall rather than as a place. The frame was also 60% near-black,
       because nothing was large enough to fill it.

       Three rules changed:
         1. The largest planes now BLEED off the viewport deliberately. Seeing
            only part of the subject is what makes a frame cinematic; a fully
            contained subject reads as a picture of a thing.
         2. Anything oversized is FEATHERED, so a crop leaving the frame does
            not announce a rectangle on its way out.
         3. An oversized, heavily-feathered environment wash sits behind
            everything at z=-12. Its only job is to make sure no part of the
            viewport is black. It is the reason this chapter now has a floor. */
    {
      /* THE WASH. 30 units wide against 18.4 of half-width — it bleeds off
         both sides by design and is fully dissolved at its boundary, so it is
         not a plane, it is the air having structure in it. Desaturated hard
         toward violet: this is atmosphere that happens to be made of a real
         render of a real corridor, which is why it reads as depth rather than
         as wallpaper. */
      id: "xr-wash",
      textGuard: 1.0,
      kind: "image",
      asset: "/media/projects/orbital/environment",
      aspect: R16_9,
      x: 0,
      y: 0.4,
      z: -12,
      w: 30,
      opacity: 0.6,
      desaturate: 0.62,
      tint: 0.5,
      feather: 1,
      edge: 0,
      radius: 0,
      vignette: 0.55,
      lift: 0.94,
      parallax: 0.05,
      drift: 0.008,
      reveal: "up",
      order: 0,
    },
    {
      /* THE SUBJECT, OVERSIZED AND OFF-FRAME. 15 units wide at z=-3.0 where
         the half-width is 9.4, centred at x=6 — so it spans -1.5 to 13.5 and
         runs off the right edge of the viewport by about a third of itself.
         The reactor's gimbal ring lands centre-right at roughly twice the
         apparent size of the previous pass. Feathered at 0.55 so the part
         still inside the frame dissolves into the wash instead of stopping at
         a border. */
      id: "xr-reactor-hero",
      textGuard: 0.3,
      kind: "image",
      asset: "/media/projects/orbital/reactor-hero",
      aspect: R16_9,
      x: 6.0,
      y: 1.4,
      z: -3.0,
      w: 15,
      rotY: -0.1,
      crop: 1.22,
      feather: 0.55,
      edge: 0.3,
      radius: 0,
      vignette: 0.5,
      tint: 0.14,
      lift: 1.06,
      parallax: 0.22,
      drift: 0.014,
      reveal: "left",
      order: 1,
    },
    {
      /* MACRO FOREGROUND, bleeding off the bottom-left corner. At z=+2.2 the
         half-extent is only 4.2 x 2.6, so a 6-unit plane cannot be contained
         and is not meant to be: cropped 2.1x into the containment chamber, it
         is a detail at a scale where the eye cannot tell it is a photograph
         of a render rather than the thing itself. This is the plane doing the
         most work for depth, because it is unambiguously on this side of the
         space. */
      id: "xr-macro",
      textGuard: 0.9,
      kind: "image",
      asset: "/media/projects/orbital/reactor-detail",
      aspect: R16_9,
      x: -3.4,
      y: -3.5,
      z: 2.2,
      w: 6,
      rotY: 0.3,
      rotZ: 0.04,
      crop: 2.1,
      feather: 0.8,
      edge: 0.2,
      radius: 0,
      vignette: 0.55,
      tint: 0.2,
      lift: 0.78,
      parallax: 0.8,
      drift: 0.022,
      reveal: "right",
      order: 2,
    },
    {
      /* THE ONE DELIBERATE FRAME IN THE CHAPTER. The turntable keeps a hard
         edge and a bright rim, because it is playback — a screen showing a
         rotating model — and a screen is supposed to have a boundary. Against
         six feathered planes, the single hard-edged element becomes the
         accent rather than the norm. */
      id: "xr-turntable",
      textGuard: 0.0,
      kind: "video",
      video: {
        src: "/media/projects/orbital/reactor-turntable.mp4",
        poster: "/media/projects/orbital/reactor-turntable-poster",
      },
      aspect: R16_9,
      x: 4.4,
      y: -3.2,
      z: -1.0,
      w: 4.8,
      rotY: -0.28,
      rotZ: -0.018,
      radius: 0.05,
      feather: 0,
      edge: 0.8,
      vignette: 0.45,
      tint: 0.2,
      lift: 0.9,
      parallax: 0.46,
      drift: 0.02,
      reveal: "up",
      order: 3,
    },
    {
      /* The console hero — previously encoded and never used. Set left and
         feathered, it fills the mid-left region that was the emptiest part of
         the old frame. */
      id: "xr-console",
      textGuard: 1.0,
      kind: "image",
      asset: "/media/projects/orbital/console-hero",
      aspect: R16_9,
      x: -6.4,
      y: -0.8,
      z: -5.4,
      w: 9.5,
      rotY: 0.22,
      crop: 1.3,
      feather: 0.85,
      edge: 0.2,
      radius: 0,
      opacity: 0.48,
      desaturate: 0.55,
      tint: 0.4,
      vignette: 0.55,
      lift: 0.76,
      parallax: 0.14,
      drift: 0.012,
      reveal: "up",
      order: 4,
      minTier: "medium",
    },
    {
      /* The technical pass, upper-left, dissolved almost to annotation. It
         says the thing was built rather than sourced. */
      id: "xr-wireframe",
      textGuard: 0.95,
      kind: "image",
      asset: "/media/projects/orbital/wireframe",
      aspect: R16_9,
      x: -5.0,
      y: 4.4,
      z: -6.5,
      w: 8,
      rotY: 0.16,
      opacity: 0.4,
      desaturate: 0.86,
      tint: 0.45,
      feather: 0.8,
      edge: 0.18,
      radius: 0,
      parallax: 0.12,
      drift: 0.012,
      reveal: "right",
      order: 5,
      minTier: "high",
    },
    {
      /* The modular kit, deep and wide across the bottom, fully dissolved.
         States that the work is a system rather than one object, and keeps
         the lower third of the frame from going black. */
      id: "xr-modular-kit",
      textGuard: 1.0,
      kind: "image",
      asset: "/media/projects/orbital/modular-kit",
      aspect: R16_9,
      x: 1.5,
      y: -6.6,
      z: -8.6,
      w: 14,
      rotX: 0.1,
      opacity: 0.4,
      desaturate: 0.6,
      tint: 0.44,
      feather: 0.95,
      edge: 0,
      radius: 0,
      lift: 0.9,
      parallax: 0.08,
      drift: 0.01,
      reveal: "up",
      order: 6,
      minTier: "high",
    },
  ],
};

/* ------------------------------------------------------------------ */
/* 03 — CREATIVE · four real brand identity systems                    */
/*                                                                     */
/* The densest chapter, and deliberately so — this is the one that      */
/* should read as an editorial spread rather than a gallery. It draws   */
/* from all four systems at once (EMBER, VANTA, FORM, KAERA) so the     */
/* frame states range rather than showing one project at a time.        */
/*                                                                     */
/* Creative's camera is the longest lens in the set (34°) and the       */
/* furthest back, which compresses the planes into each other. Widths   */
/* are roughly half XR's for that reason. The compression is the point: */
/* it stacks the boards into a composition and flattens the perspective */
/* cues, which is exactly what an art director's contact sheet does.    */
/* ------------------------------------------------------------------ */
/* 03 — CREATIVE · four real identity systems, editorial grid          */
/*                                                                     */
/* The most saturated chapter in the set, drawn from REF 2's flat      */
/* colour fields and the ORYZO 4-tile grid: a committed warm field, an */
/* opaque hero board, and adjacent boards tiled as a deliberate grid.  */
/* Every asset is real work — EMBER, FORM, KAERA, VANTA.               */
/* ------------------------------------------------------------------ */
const creative: Composition = {
  discipline: "creative",
  items: [
  /* LIFT WAS REMAPPED WHEN THIS CHAPTER WAS ASSEMBLED.
     The design pass treated `lift` as an ADDITIVE exposure where 0 means
     neutral. In the shader it is a MULTIPLIER on colour where 1.0 is neutral
     (colour *= uLift), so the authored values rendered this chapter at 6-22%
     brightness — a near-black frame, the exact failure it was designed to fix.
     Values are mapped 0.95 + v*0.45, preserving the authored RELATIVE ordering
     (which was the real design decision) while landing in the range the shader
     actually means. */
    {
      /* The committed colour field. d 22.6, halfW 11.074, halfH 7.006: w 25
         = 2.258x halfW (rule needs >= 2.2) and |x| + w/2 = 12.50 = 1.129x
         halfW, inside the 1.15 ceiling; height 25/1.499 = 16.68 against a
         14.01 frame. Vignette cut to 0.10 and opacity taken to 1.0 so it is
         a FLAT saturated warm field edge to edge — REF 2, not a lit centre
         fading to black corners. */
      id: "creative-backdrop-field",
      kind: "image",
      asset: "/media/projects/brand/ember/palette",
      aspect: 1.499,
      x: 0,
      y: 0.2,
      z: -12,
      w: 25,
      crop: 2.7,
      opacity: 1,
      edge: 0,
      feather: 1,
      tint: 0.58,
      vignette: 0.1,
      lift: 1.049,
      parallax: 0.04,
      drift: 0.01,
      order: 0,
      textGuard: 1,
      reveal: "up",
      minTier: "low",
    },
    {
      /* Deep left counterweight. d 19.2, halfW 9.408: |x| + w/2 = 4.50 +
         4.50 = 9.00 = 0.957x halfW, deliberate bleed off the left; height
         9/1.778 = 5.06, top edge 4.03 inside halfH 5.952. De-ghosted to
         opacity 0.82 / desaturate 0.08 so the heading side carries real
         saturated material; textGuard 1 does the legibility work instead of
         blanket transparency. */
      id: "creative-echo-vanta",
      kind: "image",
      asset: "/media/projects/brand/vanta/showcase",
      aspect: 1.778,
      x: -4.5,
      y: 1.5,
      z: -8.6,
      w: 9,
      rotY: 0.07,
      crop: 1.35,
      opacity: 0.82,
      radius: 0.12,
      edge: 0.14,
      feather: 0.7,
      desaturate: 0.08,
      tint: 0.42,
      vignette: 0.28,
      lift: 0.995,
      parallax: 0.12,
      drift: 0.014,
      order: 1,
      textGuard: 1,
      reveal: "left",
      minTier: "medium",
    },
    {
      /* Warm tinted separator holding contrast under the DOM column. d 16.0,
         halfW 7.84, halfH 4.96: |x| + w/2 = 3.40 + 4.70 = 8.10 = 1.033x
         halfW and h 11.0 over-runs the 9.92 frame height top and bottom. The
         only non-image plane in the chapter; now survives to medium tier
         because it is what keeps the capability list readable over a fully
         opaque field. */
      id: "creative-warm-scrim",
      kind: "glass",
      x: -3.4,
      y: -0.2,
      z: -5.4,
      w: 9.4,
      h: 11,
      opacity: 0.5,
      radius: 0.6,
      edge: 0.1,
      feather: 0.95,
      tint: 0.62,
      vignette: 0.2,
      glassAlpha: 0.16,
      parallax: 0.06,
      drift: 0.008,
      order: 2,
      textGuard: 1,
      reveal: "up",
      minTier: "medium",
    },
    {
      /* The one opaque subject that owns the frame. d 11.6, halfW 5.684,
         halfH 3.596: w = 1.108x halfW (rule needs >= 1.1), |x| + w/2 = 6.40
         = 1.126x halfW so the right side bleeds off-frame; height 6.3/1.671
         = 3.77, spanning y -2.885 to 0.885. Feather tightened to 0.22 so the
         silhouette is an object, not a projection. textGuard 0.5 is
         mandatory, not lazy: w >= 1.1*halfW and left edge >= 0.44*halfW are
         mutually unsatisfiable (they would demand w <= 0.71*halfW), so any
         legal hero overlaps the text column. */
      id: "creative-hero-ember",
      kind: "image",
      asset: "/media/projects/brand/ember/showcase",
      aspect: 1.671,
      x: 3.25,
      y: -1,
      z: -1,
      w: 6.3,
      rotY: -0.05,
      rotZ: 0.015,
      crop: 1.16,
      opacity: 0.97,
      radius: 0.06,
      edge: 0.35,
      feather: 0.22,
      desaturate: 0.04,
      tint: 0.1,
      vignette: 0.16,
      lift: 0.995,
      parallax: 0.26,
      drift: 0.012,
      order: 3,
      textGuard: 0.5,
      reveal: "right",
      minTier: "low",
    },
    {
      /* Editorial grid, top-left cell. d 15.2, halfW 7.448, halfH 4.712.
         Cell 2.50 x 1.668. Left edge 3.50 clears the 0.44*halfW text
         boundary (3.277) by 0.223 world units, ~21px, which survives
         parallax 0.18; top edge 4.834 bleeds past halfH 4.712. Rim light
         killed (edge 0.08, radius 0) so the four boards fuse into one tiled
         block rather than four UI cards. */
      id: "creative-grid-form",
      kind: "image",
      asset: "/media/projects/brand/form/website",
      aspect: 1.499,
      x: 4.75,
      y: 4,
      z: -4.6,
      w: 2.5,
      crop: 1.06,
      opacity: 0.97,
      edge: 0.08,
      feather: 0.08,
      desaturate: 0.06,
      tint: 0.16,
      vignette: 0.1,
      lift: 0.977,
      parallax: 0.18,
      drift: 0.008,
      order: 4,
      textGuard: 0.22,
      reveal: "up",
      minTier: "medium",
    },
    {
      /* Grid, top-right cell. |x| + w/2 = 7.25 + 1.25 = 8.50 = 1.141x halfW,
         so the block runs off the right edge, and its top at 4.834 runs off
         the top — the ORYZO tile section. Shares its left edge exactly with
         the form cell at x 6.00, no gutter. */
      id: "creative-grid-kaera",
      kind: "image",
      asset: "/media/projects/brand/kaera/typography",
      aspect: 1.499,
      x: 7.25,
      y: 4,
      z: -4.6,
      w: 2.5,
      crop: 1.06,
      opacity: 0.98,
      edge: 0.08,
      feather: 0.08,
      desaturate: 0.05,
      tint: 0.14,
      vignette: 0.1,
      lift: 0.977,
      parallax: 0.18,
      drift: 0.008,
      order: 5,
      textGuard: 0.08,
      reveal: "up",
      minTier: "medium",
    },
    {
      /* Grid, bottom-left cell. Top edge 3.166 meets the top row's bottom
         edge 3.166 exactly — zero gutter is what makes four boards read as
         one tiled block instead of a scatter. Left edge 3.50, same 21px
         clearance from the DOM column. */
      id: "creative-grid-vanta",
      kind: "image",
      asset: "/media/projects/brand/vanta/applications",
      aspect: 1.499,
      x: 4.75,
      y: 2.332,
      z: -4.6,
      w: 2.5,
      crop: 1.06,
      opacity: 0.97,
      edge: 0.08,
      feather: 0.08,
      desaturate: 0.06,
      tint: 0.16,
      vignette: 0.1,
      lift: 0.977,
      parallax: 0.18,
      drift: 0.008,
      order: 6,
      textGuard: 0.22,
      reveal: "up",
      minTier: "medium",
    },
    {
      /* Grid, bottom-right cell, also bleeding at 1.141x halfW. Completes
         one cell per identity system (form, kaera, vanta, ember). Block
         bottom edge 1.498 sits just above the hero's top edge 0.885 in
         screen space, stacking two opaque masses up the right side. */
      id: "creative-grid-ember",
      kind: "image",
      asset: "/media/projects/brand/ember/website",
      aspect: 1.499,
      x: 7.25,
      y: 2.332,
      z: -4.6,
      w: 2.5,
      crop: 1.06,
      opacity: 0.98,
      edge: 0.08,
      feather: 0.08,
      desaturate: 0.05,
      tint: 0.14,
      vignette: 0.1,
      lift: 0.977,
      parallax: 0.18,
      drift: 0.008,
      order: 7,
      textGuard: 0.08,
      reveal: "up",
      minTier: "medium",
    },
    {
      /* The single hard-edged specimen and the only feather-0 plane: kaera's
         palette cropped 3.4x to bare colour, nearest the camera at z +1.7,
         zero desaturation and zero tint so it is the truest colour in the
         frame. d 8.9, halfW 4.361, halfH 2.759: |x| + w/2 = 4.50 = 1.032x
         halfW so it now bleeds off the right instead of sitting inside; left
         edge 2.20 clears the 1.919 text boundary by 0.281 world (~46px),
         which parallax 0.34 cannot cross. minTier low because dropping it
         would remove the composition's only z > +1 plane and flatten the -12
         to +1.7 depth stage on most devices. */
      id: "creative-specimen-strip",
      kind: "image",
      asset: "/media/projects/brand/kaera/palette",
      aspect: 1.499,
      x: 3.35,
      y: -1.75,
      z: 1.7,
      w: 2.3,
      rotZ: -0.03,
      crop: 3.4,
      opacity: 1,
      edge: 0.55,
      feather: 0,
      lift: 1.013,
      parallax: 0.34,
      drift: 0.006,
      order: 8,
      textGuard: 0,
      reveal: "up",
      minTier: "low",
    },
  ],
};

/* ------------------------------------------------------------------ */
/* 01 — SOFTWARE ENGINEERING · glass only, and deliberately so         */
/*                                                                     */
/* THERE IS NO REAL SOFTWARE MEDIA YET. Every project entry in         */
/* lib/data/content.ts is still `placeholder: true` with no asset, and  */
/* the brief is explicit: do not fabricate screenshots, dashboards or   */
/* terminal output. So this chapter is built entirely from material —   */
/* aligned translucent panels at graded depth — which is honest about   */
/* having no content while still being a composition rather than a gap. */
/*                                                                     */
/* The visual argument is structure: four panels on a strict grid,      */
/* parallel, hairline-edged, receding. It reads as an exploded system   */
/* diagram without claiming to be one. When real project media lands it */
/* drops into these exact slots by adding `asset` and `aspect`.         */
/* ------------------------------------------------------------------ */
/* 01 — SOFTWARE ENGINEERING · committed field, no fabricated media    */
/*                                                                     */
/* Designed against REF 2 (a saturated colour field owning the whole   */
/* viewport) and REF 4 (one lit form dominating it), then revised by   */
/* an adversarial pass that checked every plane's frame arithmetic.    */
/* NO REAL SOFTWARE MEDIA EXISTS — every plane here is glass. Nothing  */
/* is fabricated; the chapter is built from light and material only.   */
/* ------------------------------------------------------------------ */
const software: Composition = {
  discipline: "software",
  items: [
  /* LIFT WAS REMAPPED WHEN THIS CHAPTER WAS ASSEMBLED.
     The design pass treated `lift` as an ADDITIVE exposure where 0 means
     neutral. In the shader it is a MULTIPLIER on colour where 1.0 is neutral
     (colour *= uLift), so the authored values rendered this chapter at 6-22%
     brightness — a near-black frame, the exact failure it was designed to fix.
     Values are mapped 0.95 + v*0.45, preserving the authored RELATIVE ordering
     (which was the real design decision) while landing in the range the shader
     actually means. */
    {
      /* REF 2 committed backdrop. d 24.8, halfW 13.888, halfH 8.432. |0| +
         15.5 = 1.116 x halfW (two-sided bleed); w 31 = 2.232 x halfW, clears
         the 2.2 minimum; h 20 against a 16.86 frame height. Saturation
         raised (opacity 0.92 / glassAlpha 0.96 / tint 0.95) so this reads as
         a colour field, not a veil. */
      id: "software-field-deep",
      kind: "glass",
      x: 0,
      y: 0,
      z: -15,
      w: 31,
      h: 20,
      opacity: 0.92,
      edge: 0,
      feather: 1,
      tint: 0.95,
      vignette: 0.45,
      lift: 1.004,
      glassAlpha: 0.96,
      parallax: 0.04,
      drift: 0.005,
      order: 0,
      textGuard: 1,
      reveal: "up",
      minTier: "low",
    },
    {
      /* Second chromatic field giving the backdrop an azimuth. d 19.3, halfW
         10.808, halfH 6.562. 3.4 + 8.4 = 11.8 = 1.092 x halfW, right bleed;
         h 13.4 against a 13.12 frame height. Left edge lands at normalised
         -0.463 (26.9% width) so the gradient falls off behind the heading
         rather than terminating on it. */
      id: "software-field-azimuth",
      kind: "glass",
      x: 3.4,
      y: 0.6,
      z: -9.5,
      w: 16.8,
      h: 13.4,
      rotX: 0.04,
      rotY: -0.13,
      rotZ: 0.1,
      opacity: 0.86,
      radius: 0.35,
      edge: 0.14,
      feather: 0.88,
      desaturate: 0.06,
      tint: 0.74,
      vignette: 0.18,
      lift: 1.022,
      glassAlpha: 0.72,
      parallax: 0.1,
      drift: 0.01,
      order: 1,
      textGuard: 0.92,
      reveal: "right",
      minTier: "low",
    },
    {
      /* Graphite falloff behind the DOM column. d 16.8, halfW 9.408, halfH
         5.712. 4.4 + 4.8 = 9.2 = 0.978 x halfW, effectively edge-to-edge on
         the left; h 11.6 against 11.42. Fully feathered at textGuard 1 and
         opacity 0.60, so it gives the 102px heading separation without
         competing. */
      id: "software-wash-left",
      kind: "glass",
      x: -4.4,
      y: 0,
      z: -7,
      w: 9.6,
      h: 11.6,
      rotY: 0.16,
      rotZ: -0.07,
      opacity: 0.6,
      radius: 1.2,
      edge: 0.05,
      feather: 1,
      desaturate: 0.12,
      tint: 0.8,
      vignette: 0.3,
      lift: 0.968,
      glassAlpha: 0.38,
      parallax: 0.07,
      drift: 0.006,
      order: 2,
      textGuard: 1,
      reveal: "left",
      minTier: "high",
    },
    {
      /* REF 4 emission, resized so it is NOT swallowed by the hero. d 14.0,
         halfW 7.84, halfH 4.76. 3.3 + 5.6 = 8.9 = 1.135 x halfW (legal
         bleed). Normalised span x -0.293..1.135, y +/-1.186 against the
         hero's x -0.010..1.126, y -1.215..1.087: the glow now spills as a
         visible crescent from 35% to 50% of viewport width and past the hero
         top and bottom. radius = w/2 keeps it a true circle. textGuard 0.85
         because at lift 0.85 the crescent overlaps the heading measure. */
      id: "software-halo-core",
      kind: "glass",
      x: 3.3,
      y: 0.1,
      z: -4.2,
      w: 11.2,
      h: 11.2,
      opacity: 0.72,
      radius: 5.6,
      edge: 0,
      feather: 0.95,
      tint: 0.96,
      lift: 1.333,
      glassAlpha: 0.62,
      parallax: 0.14,
      drift: 0.008,
      order: 3,
      textGuard: 0.85,
      reveal: "up",
      minTier: "medium",
    },
    {
      /* THE HERO. d 9.2, halfW 5.152, halfH 3.128. 2.9 + 2.9 = 5.80 = 1.126
         x halfW, right bleed; w = 1.126 x halfW clears the 1.1 hero minimum;
         h 7.2 spans y -3.80..3.40 against a 3.128 half-height, so it now
         genuinely runs off top AND bottom (was a 0.022 overshoot). opacity
         0.95, desaturate 0.04, feather 0.42 all inside the hero rule;
         glassAlpha lifted to 0.86 so the subject is the densest plane after
         the backdrop. Left edge sits at world 0 = 50% of viewport width,
         inside the DOM measure, so textGuard is held at 0.50 rather than the
         0.2-0.35 a right-side hero would normally take. */
      id: "software-hero-monolith",
      kind: "glass",
      x: 2.9,
      y: -0.2,
      z: 0.6,
      w: 5.8,
      h: 7.2,
      rotX: 0.05,
      rotY: -0.21,
      rotZ: 0.03,
      opacity: 0.95,
      radius: 0.18,
      edge: 0.86,
      feather: 0.42,
      desaturate: 0.04,
      tint: 0.55,
      vignette: 0.1,
      lift: 1.139,
      glassAlpha: 0.86,
      parallax: 0.46,
      drift: 0.018,
      order: 4,
      textGuard: 0.5,
      reveal: "up",
      minTier: "low",
    },
    {
      /* Low horizontal datum, now a real two-sided bleed. d 12.0, halfW
         6.72, halfH 4.08. Right edge 7.40 = 1.101 x halfW, left edge -7.00 =
         1.042 x halfW (previously -6.60, contained). Lowered to y -3.35 so
         the rotZ -0.04 corner lift of 0.288 still leaves the top at y -2.11,
         strictly below y = -2, which is what legitimises textGuard 0.22
         under the DOM rule; the bottom at -4.59 runs off the frame. */
      id: "software-band-datum",
      kind: "glass",
      x: 0.2,
      y: -3.35,
      z: -2.2,
      w: 14.4,
      h: 1.9,
      rotZ: -0.04,
      opacity: 0.7,
      radius: 0.08,
      edge: 0.6,
      feather: 0.45,
      desaturate: 0.04,
      tint: 0.5,
      lift: 1.049,
      glassAlpha: 0.55,
      parallax: 0.34,
      drift: 0.012,
      order: 5,
      textGuard: 0.22,
      reveal: "left",
      minTier: "medium",
    },
    {
      /* Machined alignment rail, moved from z -0.8 (where the hero occluded
         all but a sliver of it) to z +1.9, in FRONT of the hero. d 7.9,
         halfW 4.424, halfH 2.686. 4.08 + 0.475 = 4.555 = 1.030 x halfW,
         pinned to the right edge with a true bleed; h 6.4 against a 5.372
         frame height runs off top and bottom. Inner edge at 90.7% of
         viewport width, well clear of the 72% DOM measure, so textGuard 0.08
         is safe. Feather eased to 0.32 so a near-camera rimmed element does
         not join the card-soup reading; its 1:6.7 proportion reads as
         furniture, not a card. */
      id: "software-rail-datum",
      kind: "glass",
      x: 4.08,
      y: 0,
      z: 1.9,
      w: 0.95,
      h: 6.4,
      rotY: -0.1,
      opacity: 0.76,
      radius: 0.45,
      edge: 0.95,
      feather: 0.32,
      desaturate: 0.05,
      tint: 0.36,
      lift: 1.198,
      glassAlpha: 0.64,
      parallax: 0.66,
      drift: 0.014,
      order: 6,
      textGuard: 0.08,
      reveal: "down",
      minTier: "high",
    },
    {
      /* The single feather-0 plane, REF 1's opaque card language at roughly
         1/6 the hero's angular area. d 7.2, halfW 4.032, halfH 2.448. 3.1 +
         1.2 = 4.30 = 1.066 x halfW, slight right bleed; nudged out from x
         3.0 so the inner edge moves from 72.3% to 73.6% of viewport width,
         off the 72% DOM boundary rather than sitting on it. Occupies screen
         y 583-868 in the right quarter only, clear of the tool row, process
         strip and capability list. Crosses in front of the rail at z 1.9,
         layering the near field instead of flattening it. */
      id: "software-specimen-card",
      kind: "glass",
      x: 3.1,
      y: -1.5,
      z: 2.6,
      w: 2.4,
      h: 1.55,
      rotX: -0.06,
      rotY: -0.24,
      rotZ: 0.05,
      opacity: 0.9,
      radius: 0.05,
      edge: 0.92,
      feather: 0,
      desaturate: 0.1,
      tint: 0.4,
      lift: 1.076,
      glassAlpha: 0.88,
      parallax: 0.72,
      drift: 0.02,
      order: 7,
      textGuard: 0.06,
      reveal: "right",
      minTier: "medium",
    },
  ],
};

/* ------------------------------------------------------------------ */
/* 04 — DATA SCIENCE · glass only, receding along the view axis         */
/*                                                                     */
/* Also no real media, and the same rule applies — no invented          */
/* dashboards, notebooks or charts. Data's camera is the one that looks */
/* DOWN a long axis (y=3.3 toward y=-2.6, z=-15), so the panels are     */
/* staged as a receding stack along that axis instead of a parallel     */
/* wall. Trajectory and ordering, expressed with material rather than   */
/* with fake plots.                                                    */
/* ------------------------------------------------------------------ */
/* 04 — DATA SCIENCE · luminous, and the chapter that breaks the dark  */
/*                                                                     */
/* REF 5 (IGLOO) is the model: bright, atmospheric, not another dark   */
/* frame. The camera looks DOWN a long axis, so the planes are staged  */
/* as a receding perspective ladder along it. NO REAL MEDIA EXISTS —   */
/* glass only. No fabricated dashboards, notebooks or charts.          */
/* ------------------------------------------------------------------ */
const data: Composition = {
  discipline: "ai",
  items: [
  /* LIFT WAS REMAPPED WHEN THIS CHAPTER WAS ASSEMBLED.
     The design pass treated `lift` as an ADDITIVE exposure where 0 means
     neutral. In the shader it is a MULTIPLIER on colour where 1.0 is neutral
     (colour *= uLift), so the authored values rendered this chapter at 6-22%
     brightness — a near-black frame, the exact failure it was designed to fix.
     Values are mapped 0.95 + v*0.45, preserving the authored RELATIVE ordering
     (which was the real design decision) while landing in the range the shader
     actually means. */
    {
      /* The committed field and the BRIGHTEST surface in the chapter.
         d=24.7, halfW=17.29: w=2.232*halfW (above the 2.2 floor), extent
         19.3/17.29=1.116, h/2=12.5 vs halfH 10.62 so it overspills all four
         edges. lift 0.86 makes the field itself the light source,
         IGLOO-style, instead of a dark plate with glowing debris on it. */
      id: "data-backdrop-luminous-shelf",
      kind: "glass",
      x: 0,
      y: 0.45,
      z: -15.5,
      w: 38.6,
      h: 25,
      rotX: 0.05,
      opacity: 0.9,
      edge: 0,
      feather: 1,
      desaturate: 0.04,
      tint: 0.9,
      vignette: 0.08,
      lift: 1.337,
      glassAlpha: 0.9,
      parallax: 0.04,
      drift: 0.008,
      order: 0,
      textGuard: 1,
      reveal: "up",
      minTier: "low",
    },
    {
      /* Far floor at the vanishing end of the axis. d=19.0, halfW=13.3,
         extent 13/13.3=0.977. Now the FAINTEST of the depth planes so
         atmospheric perspective runs the right way toward camera. */
      id: "data-deep-stratum",
      kind: "glass",
      x: 0,
      y: -1.25,
      z: -9.8,
      w: 26,
      h: 3.2,
      rotX: 0.12,
      rotZ: 0.02,
      opacity: 0.58,
      radius: 0.4,
      edge: 0.12,
      feather: 0.92,
      desaturate: 0.08,
      tint: 0.85,
      vignette: 0.06,
      lift: 1.229,
      glassAlpha: 0.5,
      parallax: 0.12,
      drift: 0.012,
      order: 1,
      textGuard: 0.85,
      reveal: "up",
      minTier: "medium",
    },
    {
      /* Rung 1 of 3, physically identical to the others (w 16, h 0.8, x 0).
         d=15.4, halfW=10.78, extent 8/10.78=0.742 - small because it is far,
         which is the entire point. */
      id: "data-axis-rung-far",
      kind: "glass",
      x: 0,
      y: -1.9,
      z: -6.2,
      w: 16,
      h: 0.8,
      rotX: 0.1,
      rotZ: 0.015,
      opacity: 0.62,
      radius: 0.28,
      edge: 0.3,
      feather: 0.7,
      desaturate: 0.1,
      tint: 0.7,
      vignette: 0.04,
      lift: 1.238,
      glassAlpha: 0.52,
      parallax: 0.22,
      drift: 0.012,
      order: 2,
      textGuard: 0.7,
      reveal: "left",
      minTier: "medium",
    },
    {
      /* Overhead spill breaking the darkness from above. d=13.8, halfW=9.66,
         extent 10.25/9.66=1.061 so it bleeds both sides; top edge y=6.3 vs
         halfH 5.93 so it bleeds off the top. opacity held at 0.60 with guard
         1 so the 102px heading stays crisp. */
      id: "data-ceiling-wash",
      kind: "glass",
      x: 0,
      y: 3.6,
      z: -4.6,
      w: 20.5,
      h: 5.4,
      rotX: -0.14,
      opacity: 0.6,
      edge: 0,
      feather: 1,
      desaturate: 0.04,
      tint: 0.9,
      lift: 1.31,
      glassAlpha: 0.68,
      parallax: 0.08,
      drift: 0.01,
      order: 3,
      textGuard: 1,
      reveal: "down",
      minTier: "low",
    },
    {
      /* Rung 2 of 3, added so the ladder has a legible interval rather than
         two isolated bands. d=12.8, halfW=8.96, extent 8/8.96=0.893. Dropped
         below high tier; the outer two rungs still carry the recession. */
      id: "data-axis-rung-mid",
      kind: "glass",
      x: 0,
      y: -2.15,
      z: -3.6,
      w: 16,
      h: 0.8,
      rotX: 0.13,
      rotZ: 0.01,
      opacity: 0.68,
      radius: 0.24,
      edge: 0.4,
      feather: 0.62,
      desaturate: 0.1,
      tint: 0.62,
      vignette: 0.03,
      lift: 1.256,
      glassAlpha: 0.55,
      parallax: 0.3,
      drift: 0.014,
      order: 4,
      textGuard: 0.6,
      reveal: "left",
      minTier: "high",
    },
    {
      /* THE HERO, now actually owning the frame. d=11.8, halfW=8.26,
         halfH=5.07: w=1.235*halfW and extent 9.2/8.26=1.114, so it bleeds
         off the right edge instead of floating inside it. opacity 0.95,
         desaturate 0.06, feather 0.42 all clear the hero thresholds;
         textGuard 0.55 keeps it legal where its left edge (-1.0) crosses the
         DOM column. */
      id: "data-hero-prism",
      kind: "glass",
      x: 4.1,
      y: -0.2,
      z: -2.6,
      w: 10.2,
      h: 6.4,
      rotX: 0.07,
      rotY: -0.17,
      rotZ: 0.03,
      opacity: 0.95,
      radius: 0.22,
      edge: 0.58,
      feather: 0.42,
      desaturate: 0.06,
      tint: 0.5,
      vignette: 0.05,
      lift: 1.301,
      glassAlpha: 0.9,
      parallax: 0.5,
      drift: 0.018,
      order: 5,
      textGuard: 0.55,
      reveal: "up",
      minTier: "low",
    },
    {
      /* Rung 3 of 3, same physical object as the other two. d=10.3,
         halfW=7.21, extent 8/7.21=1.109 - it runs off both edges while the
         identical far rung reads 0.742, and that 0.74 -> 0.89 -> 1.11 ramp
         is the perspective. Spans y -2.85 to -2.05, entirely below y=-2, so
         opacity 0.80 never fights the capability list. */
      id: "data-axis-rung-near",
      kind: "glass",
      x: 0,
      y: -2.45,
      z: -1.1,
      w: 16,
      h: 0.8,
      rotX: 0.16,
      rotZ: -0.02,
      opacity: 0.8,
      radius: 0.2,
      edge: 0.48,
      feather: 0.55,
      desaturate: 0.1,
      tint: 0.55,
      vignette: 0.03,
      lift: 1.274,
      glassAlpha: 0.6,
      parallax: 0.42,
      drift: 0.02,
      order: 6,
      textGuard: 0.5,
      reveal: "right",
      minTier: "medium",
    },
    {
      /* The ONLY feather-0 plane - a single crisp REF 1 card. d=10.0,
         halfW=7.0, extent 6.2/7.0=0.886 (deliberately contained, it is a
         specimen not a bleed). Its left edge x=3.60 clears the 72% DOM
         boundary at 0.439*7.0=3.07, so textGuard 0 is safe. */
      id: "data-specimen-card",
      kind: "glass",
      x: 4.9,
      y: 1.45,
      z: -0.8,
      w: 2.6,
      h: 1.7,
      rotY: -0.1,
      opacity: 0.94,
      radius: 0.04,
      edge: 0.8,
      feather: 0,
      desaturate: 0.02,
      tint: 0.35,
      lift: 1.283,
      glassAlpha: 0.72,
      parallax: 0.6,
      drift: 0.01,
      order: 7,
      textGuard: 0,
      reveal: "left",
      minTier: "medium",
    },
    {
      /* Near-camera parallax anchor, now the densest thing in the near field
         rather than the faintest. d=7.4, halfW=5.18, extent 5.8/5.18=1.120
         so it cuts off the right edge; left edge 2.60 clears the DOM
         boundary at 2.27, so opacity 0.70 needs no heavy guard. Softened to
         feather 0.50 / edge 0.45 so it stops reading as a second UI card. */
      id: "data-foreground-shard",
      kind: "glass",
      x: 4.2,
      y: -1.5,
      z: 1.8,
      w: 3.2,
      h: 2.3,
      rotX: 0.05,
      rotY: 0.22,
      rotZ: 0.13,
      opacity: 0.7,
      radius: 0.14,
      edge: 0.45,
      feather: 0.5,
      desaturate: 0.12,
      tint: 0.45,
      lift: 1.319,
      glassAlpha: 0.58,
      parallax: 0.85,
      drift: 0.026,
      order: 8,
      textGuard: 0.3,
      reveal: "right",
      minTier: "high",
    },
  ],
};

/* ------------------------------------------------------------------ */
/* 05 — CYBERSECURITY · constrained, and the quietest of the five       */
/*                                                                     */
/* No real media, and the highest cliché risk in the set — no terminal  */
/* output, no padlocks, no green-on-black. The treatment is restraint:  */
/* fewer panels than any other chapter, tighter, held to one side, with */
/* a lot of empty frame. Negative space IS the art direction here, and  */
/* it is also the honest visual for the one discipline whose own copy   */
/* says "currently developing".                                        */
/* ------------------------------------------------------------------ */
/* 05 — CYBERSECURITY · controlled, tense, and no longer black         */
/*                                                                     */
/* Measured at ~90% near-black before this pass — the worst frame in   */
/* the build. Rebuilt on REF 4's discipline: dark, but with one lit    */
/* form, a real value ladder and a committed steel field. Fewest       */
/* planes of any chapter. NO REAL MEDIA EXISTS — glass only. No        */
/* terminals, no padlocks, no green-on-black.                          */
/* ------------------------------------------------------------------ */
const security: Composition = {
  discipline: "security",
  items: [
  /* LIFT WAS REMAPPED WHEN THIS CHAPTER WAS ASSEMBLED.
     The design pass treated `lift` as an ADDITIVE exposure where 0 means
     neutral. In the shader it is a MULTIPLIER on colour where 1.0 is neutral
     (colour *= uLift), so the authored values rendered this chapter at 6-22%
     brightness — a near-black frame, the exact failure it was designed to fix.
     Values are mapped 0.95 + v*0.45, preserving the authored RELATIVE ordering
     (which was the real design decision) while landing in the range the shader
     actually means. */
    {
      /* Committed cold-steel colour field. d=22, halfW 12.76, halfH 7.92: w
         28.6 sits inside the only legal window (2.2*halfW = 28.072 minimum,
         2*1.15*halfW = 29.348 maximum), ext 14.30 / ratio 1.121, and h 18.4
         overruns 2*halfH = 15.84, so it exceeds the frame on all four sides.
         glassAlpha raised 0.34 -> 0.66 so the field actually carries steel
         chroma instead of letting two-thirds of the near-black substrate
         through; vignette 0.42 keeps the corners falling off rather than
         reading as a uniform wash. */
      id: "sec-backdrop-steel-field",
      kind: "glass",
      x: 0,
      y: 0.2,
      z: -14,
      w: 28.6,
      h: 18.4,
      opacity: 0.9,
      edge: 0,
      feather: 1,
      desaturate: 0.05,
      tint: 0.95,
      vignette: 0.42,
      lift: 1.031,
      glassAlpha: 0.66,
      parallax: 0.03,
      drift: 0.006,
      order: 0,
      textGuard: 1,
      reveal: "up",
      minTier: "low",
    },
    {
      /* The second rung of the value ladder. d=17.5, halfW 10.15, halfH 6.3:
         ext 10.65 / ratio 1.049, so it runs off both sides; spans y -7.4 to
         -2.0, entirely at or below y = -2 and clipped by the bottom of the
         frame, giving a true horizon. glassAlpha 0.26 -> 0.32 so the
         ground/air split registers as a tonal step now that the backdrop
         behind it is stronger. */
      id: "sec-horizon-shelf",
      kind: "glass",
      x: 0.35,
      y: -4.7,
      z: -9.5,
      w: 20.6,
      h: 5.4,
      opacity: 0.7,
      radius: 0.6,
      edge: 0.12,
      feather: 0.92,
      desaturate: 0.1,
      tint: 0.8,
      vignette: 0.3,
      lift: 0.959,
      glassAlpha: 0.32,
      parallax: 0.08,
      drift: 0.01,
      order: 1,
      textGuard: 1,
      reveal: "up",
      minTier: "low",
    },
    {
      /* The single light source, and now genuinely off-frame rather than a
         contained oval. d=14.5, halfW 8.41, halfH 5.22: ext 8.55 / ratio
         1.017 off the right edge, top edge at y 6.0 against halfH 5.22 — a
         real overrun instead of the previous 0.08-unit token overhang. It is
         what the monolith is lit by; textGuard 0.8 keeps the heading column
         clean, and minTier dropped to low because this plane is the only
         source of midtones and must survive every tier. */
      id: "sec-halo-bloom",
      kind: "glass",
      x: 2.6,
      y: 0.9,
      z: -6.5,
      w: 11.9,
      h: 10.2,
      opacity: 0.56,
      edge: 0.1,
      feather: 1,
      tint: 0.7,
      vignette: 0.15,
      lift: 1.139,
      glassAlpha: 0.26,
      parallax: 0.14,
      drift: 0.012,
      order: 2,
      textGuard: 0.8,
      reveal: "up",
      minTier: "low",
    },
    {
      /* One solid, strongly lit monolith owning the right of the frame.
         d=9.2, halfW 5.336, halfH 3.312: ext 6.075 / ratio 1.138 (limit
         6.136) so it bleeds off the right; w/halfW 1.134 clears the 1.1
         dominance floor; h 7.55 against 2*halfH 6.624 so it is also cut by
         top and bottom. glassAlpha 0.52 -> 0.82 ends the ghosting — it now
         occludes the bloom behind it. edge 0.82 -> 0.58 and feather 0.34 ->
         0.40 stop it reading as a second UI card, leaving the chip as the
         only hard-edged rectangle. textGuard 0.34 -> 0.5 because the DOM
         column reaches x 2.348 at this depth and the hero's left edge sits
         at x 0.025 — the overlap is geometrically unavoidable for any plane
         satisfying the dominance rule, so the guard has to carry it. */
      id: "sec-hero-monolith",
      kind: "glass",
      x: 3.05,
      y: -0.25,
      z: -1.2,
      w: 6.05,
      h: 7.55,
      rotX: 0.02,
      rotY: 0.1,
      rotZ: -0.03,
      opacity: 0.95,
      radius: 0.24,
      edge: 0.58,
      feather: 0.4,
      desaturate: 0.08,
      tint: 0.62,
      vignette: 0.2,
      lift: 1.175,
      glassAlpha: 0.82,
      parallax: 0.22,
      drift: 0.014,
      order: 3,
      textGuard: 0.5,
      reveal: "up",
      minTier: "low",
    },
    {
      /* The one controlled anomaly and the only feather-0 plane in the
         chapter. d=6.4, halfW 3.712, halfH 2.304: x moved 2.88 -> 3.1 gives
         ext 3.910 / ratio 1.053, a genuine clip by the right edge instead of
         the previous 0.994 near-miss, and y -1.62 with h 1.94 puts its base
         at -2.59 past halfH so the bottom-right corner truly cuts it.
         glassAlpha 0.88 makes the flagged outlier the most solid and hottest
         thing in the frame. Left edge x 2.29 is clear of the DOM column edge
         at 1.633, so textGuard 0 is legitimate. minTier medium so the
         chapter's signature accent is not lost to the majority tier. */
      id: "sec-anomaly-chip",
      kind: "glass",
      x: 3.1,
      y: -1.62,
      z: 1.6,
      w: 1.62,
      h: 1.94,
      rotY: -0.14,
      rotZ: 0.06,
      opacity: 0.97,
      radius: 0.015,
      edge: 0.9,
      feather: 0,
      desaturate: 0.02,
      tint: 0.35,
      lift: 1.22,
      glassAlpha: 0.88,
      parallax: 0.38,
      drift: 0.02,
      order: 4,
      textGuard: 0,
      reveal: "right",
      minTier: "medium",
    },
    {
      /* Unchanged — it verifies clean. d=5.8, halfW 3.364, halfH 2.088: ext
         3.70 / ratio 1.100, running off both sides, and its base at y -4.15
         is well past the bottom of the frame. It supplies the darkest value,
         pushes the monolith into depth and darkens the plate under the
         capability list, and at opacity 0.58 with textGuard 1 it is inside
         the DOM rule. Depth range across the chapter now runs z -14 to +2.2
         with planes at both z < -8 and z > +1. */
      id: "sec-foreground-shade",
      kind: "glass",
      x: 0.1,
      y: -2.75,
      z: 2.2,
      w: 7.2,
      h: 2.8,
      opacity: 0.58,
      edge: 0,
      feather: 1,
      desaturate: 0.35,
      tint: 0.9,
      vignette: 0.6,
      glassAlpha: 0.3,
      parallax: 0.05,
      drift: 0.008,
      order: 5,
      textGuard: 1,
      reveal: "up",
      minTier: "medium",
    },
  ],
};

export const COMPOSITIONS: Composition[] = [
  software,
  xr,
  creative,
  data,
  security,
];

/** Journey-order index → composition. Matches `disciplines` ordering. */
export const compositionByIndex: Record<number, Composition> = {
  0: software,
  1: xr,
  2: creative,
  3: data,
  4: security,
};

const TIER_RANK: Record<string, number> = { none: 0, low: 1, medium: 2, high: 3 };

/** Whether an item survives at the given tier. */
export function itemAllowed(item: CompositionItem, tier: string): boolean {
  if (!item.minTier) return true;
  return TIER_RANK[tier] >= TIER_RANK[item.minTier];
}
