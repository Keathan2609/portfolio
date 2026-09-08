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
const creative: Composition = {
  discipline: "creative",
  items: [
    /* SECOND AGGRESSIVE PASS. The previous version solved the density problem
       by removing density: one board at readable size, everything else pushed
       to near-invisibility. It was legible and safe and it looked like a dark
       page with a photograph on it.

       Creative's 34° lens is the constraint — the visible frame is only about
       +/-5.9 x +/-3.7 units — but the answer is not smaller planes, it is
       planes that EXCEED the frame. An oversized board that bleeds off two
       edges reads as being in a room full of work; the same board scaled to
       fit reads as a slide. Same asset, opposite impression.

       All four identity systems are present again, but now as: one wash that
       fills the frame, one oversized hero bleeding right, one hard-edged
       colour block as the single deliberate frame, one macro type crop
       bleeding off the bottom-left corner, and two dissolved boards carrying
       the mid-depth. */
    {
      /* THE WASH. FORM's application board — dense product mockups — at 22
         units against 9.1 of half-width. Fully dissolved, desaturated toward
         the warm accent. It exists so that no part of this chapter is black,
         which was the single biggest failure of the previous pass. */
      id: "cr-wash",
      textGuard: 1,
      kind: "image",
      asset: "/media/projects/brand/form/applications",
      aspect: 1024 / 683,
      x: 0.6,
      y: -0.4,
      z: -8,
      w: 22,
      opacity: 0.5,
      desaturate: 0.58,
      tint: 0.5,
      feather: 1,
      edge: 0,
      radius: 0,
      vignette: 0.5,
      lift: 0.92,
      parallax: 0.05,
      drift: 0.008,
      reveal: "up",
      order: 0,
    },
    {
      /* THE HERO, OVERSIZED AND OFF-FRAME RIGHT. EMBER's showcase board at 11
         units where the half-width is 5.9 — so roughly a third of it is
         outside the viewport. Left almost untinted: on brand work the board's
         own colour IS the content, and this is the one plane the world hue is
         not allowed to recolour. */
      id: "cr-ember-hero",
      textGuard: 0.32,
      kind: "image",
      asset: "/media/projects/brand/ember/showcase",
      aspect: 1200 / 718,
      x: 3.2,
      y: 0.2,
      z: -1.5,
      w: 11,
      rotY: -0.11,
      rotZ: 0.008,
      crop: 1.12,
      feather: 0.5,
      edge: 0.3,
      radius: 0,
      vignette: 0.45,
      tint: 0.04,
      lift: 1.12,
      parallax: 0.24,
      drift: 0.014,
      reveal: "left",
      order: 1,
    },
    {
      /* THE ONE DELIBERATE FRAME. KAERA's palette cropped to a colour block,
         hard-edged with a bright rim. Pure hue, no image content — against
         five dissolved planes this reads as a specimen card pinned to the
         wall, which is exactly what a palette is. */
      id: "cr-kaera-palette",
      textGuard: 0,
      kind: "image",
      asset: "/media/projects/brand/kaera/palette",
      aspect: 1024 / 683,
      /* Held at x=4.9 so its left edge clears the heading's longest line
         (which ends at ~1130px) and it bleeds very slightly off the right.
         At its first position, x=4.1/y=1.9, it sat directly under the second
         and third heading lines — a bright specimen card behind 102px display
         type, which is the one collision this chapter cannot afford. */
      x: 4.9,
      y: 2.4,
      z: -1.0,
      w: 2.2,
      rotY: -0.3,
      rotZ: 0.02,
      crop: 1.8,
      feather: 0,
      radius: 0.03,
      edge: 0.75,
      vignette: 0.12,
      tint: 0.04,
      lift: 1.16,
      parallax: 0.42,
      drift: 0.02,
      reveal: "right",
      order: 2,
    },
    {
      /* MACRO TYPE, bleeding off the bottom-left corner. FORM's typography
         board cropped 2.4x — at this scale the letterforms are the subject and
         the board is irrelevant. Cropped type at foreground scale is the most
         characteristic image a design practice can show, because it is the
         craft at the size the craft is judged at. Yields to the type column,
         because the capability list runs across it. */
      id: "cr-form-macro",
      textGuard: 0.9,
      kind: "image",
      asset: "/media/projects/brand/form/typography",
      aspect: 1024 / 683,
      x: -2.6,
      y: -2.5,
      z: 2.0,
      w: 5,
      rotY: 0.26,
      rotZ: -0.03,
      crop: 2.4,
      feather: 0.78,
      edge: 0.2,
      radius: 0,
      vignette: 0.5,
      tint: 0.1,
      lift: 0.84,
      parallax: 0.78,
      drift: 0.026,
      reveal: "down",
      order: 3,
      minTier: "medium",
    },
    {
      /* VANTA, dissolved into the mid-left depth. Present as the second
         system; not competing. */
      id: "cr-vanta",
      textGuard: 1,
      kind: "image",
      asset: "/media/projects/brand/vanta/showcase",
      aspect: 1200 / 675,
      x: -4.6,
      y: 1.4,
      z: -5.0,
      w: 9,
      rotY: 0.24,
      opacity: 0.46,
      desaturate: 0.5,
      tint: 0.36,
      feather: 0.85,
      edge: 0.18,
      radius: 0,
      vignette: 0.45,
      lift: 0.86,
      parallax: 0.12,
      drift: 0.012,
      reveal: "up",
      order: 4,
      minTier: "medium",
    },
    {
      /* EMBER's logo board, deep right, dissolved. Fills the depth behind the
         hero so the right side of the frame has layers rather than one plane
         against fog. */
      id: "cr-ember-logo",
      textGuard: 0.4,
      kind: "image",
      asset: "/media/projects/brand/ember/logo",
      aspect: 1024 / 683,
      x: 4.6,
      y: -2.2,
      z: -6.4,
      w: 8,
      rotY: -0.22,
      opacity: 0.34,
      desaturate: 0.55,
      tint: 0.4,
      feather: 0.92,
      edge: 0.14,
      radius: 0,
      lift: 0.86,
      parallax: 0.08,
      drift: 0.01,
      reveal: "up",
      order: 5,
      minTier: "high",
    },
    {
      /* KAERA's website board, deep upper-left, almost pure texture. */
      id: "cr-kaera-web",
      textGuard: 1,
      kind: "image",
      asset: "/media/projects/brand/kaera/website",
      aspect: 1024 / 683,
      x: -2.0,
      y: 3.4,
      z: -7.2,
      w: 9,
      rotY: 0.14,
      opacity: 0.3,
      desaturate: 0.62,
      tint: 0.44,
      feather: 0.95,
      edge: 0,
      radius: 0,
      lift: 0.86,
      parallax: 0.07,
      drift: 0.008,
      reveal: "up",
      order: 6,
      minTier: "high",
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
const software: Composition = {
  discipline: "software",
  items: [
    {
      id: "sw-panel-back",
      kind: "glass",
      x: 3.6,
      y: 0.4,
      z: -6.0,
      w: 9.6,
      h: 6.0,
      rotY: -0.1,
      glassAlpha: 0.3,
      radius: 0.06,
      edge: 0.45,
      parallax: 0.08,
      drift: 0.008,
      reveal: "up",
      order: 0,
    },
    {
      id: "sw-panel-mid",
      kind: "glass",
      x: 4.4,
      y: -0.5,
      z: -3.6,
      w: 7.4,
      h: 4.4,
      rotY: -0.1,
      glassAlpha: 0.34,
      radius: 0.05,
      edge: 0.6,
      parallax: 0.2,
      drift: 0.01,
      reveal: "up",
      order: 1,
    },
    {
      id: "sw-panel-front",
      kind: "glass",
      x: 6.2,
      y: 2.4,
      z: -1.4,
      w: 4.6,
      h: 2.7,
      rotY: -0.16,
      glassAlpha: 0.4,
      radius: 0.04,
      edge: 0.75,
      parallax: 0.4,
      drift: 0.014,
      reveal: "left",
      order: 2,
      minTier: "medium",
    },
    {
      id: "sw-panel-near",
      kind: "glass",
      x: -5.4,
      y: -2.6,
      z: 0.6,
      w: 3.4,
      h: 2.0,
      rotY: 0.22,
      glassAlpha: 0.3,
      radius: 0.04,
      edge: 0.7,
      parallax: 0.62,
      drift: 0.018,
      reveal: "down",
      order: 3,
      minTier: "high",
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
const data: Composition = {
  discipline: "ai",
  items: [
    {
      id: "da-plane-far",
      kind: "glass",
      x: 1.4,
      y: -1.6,
      z: -11.0,
      w: 11.0,
      h: 6.4,
      rotX: -0.16,
      rotY: -0.06,
      glassAlpha: 0.28,
      radius: 0.08,
      edge: 0.4,
      parallax: 0.06,
      drift: 0.01,
      reveal: "up",
      order: 0,
    },
    {
      id: "da-plane-mid",
      kind: "glass",
      x: 3.0,
      y: -0.4,
      z: -7.0,
      w: 8.0,
      h: 4.6,
      rotX: -0.2,
      rotY: -0.1,
      glassAlpha: 0.32,
      radius: 0.07,
      edge: 0.55,
      parallax: 0.16,
      drift: 0.012,
      reveal: "up",
      order: 1,
    },
    {
      id: "da-plane-near",
      kind: "glass",
      x: 5.0,
      y: 1.4,
      z: -3.0,
      w: 5.4,
      h: 3.1,
      rotX: -0.24,
      rotY: -0.18,
      glassAlpha: 0.36,
      radius: 0.06,
      edge: 0.7,
      parallax: 0.38,
      drift: 0.016,
      reveal: "left",
      order: 2,
      minTier: "medium",
    },
    {
      id: "da-plane-fore",
      kind: "glass",
      x: -4.6,
      y: 2.8,
      z: 0.4,
      w: 3.6,
      h: 2.1,
      rotX: -0.1,
      rotY: 0.26,
      glassAlpha: 0.26,
      radius: 0.05,
      edge: 0.65,
      parallax: 0.6,
      drift: 0.02,
      reveal: "down",
      order: 3,
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
const security: Composition = {
  discipline: "security",
  items: [
    {
      id: "cy-window-back",
      kind: "glass",
      x: 4.8,
      y: 0.2,
      z: -5.0,
      w: 7.2,
      h: 4.6,
      rotY: -0.14,
      glassAlpha: 0.26,
      radius: 0.03,
      edge: 0.4,
      parallax: 0.1,
      drift: 0.006,
      reveal: "up",
      order: 0,
    },
    {
      id: "cy-window-mid",
      kind: "glass",
      x: 5.6,
      y: -1.3,
      z: -2.6,
      w: 5.0,
      h: 2.9,
      rotY: -0.18,
      glassAlpha: 0.32,
      radius: 0.02,
      edge: 0.66,
      parallax: 0.26,
      drift: 0.008,
      reveal: "left",
      order: 1,
    },
    {
      id: "cy-window-fore",
      kind: "glass",
      x: 7.4,
      y: 2.6,
      z: -0.4,
      w: 3.0,
      h: 1.7,
      rotY: -0.26,
      glassAlpha: 0.34,
      radius: 0.02,
      edge: 0.85,
      parallax: 0.5,
      drift: 0.012,
      reveal: "down",
      order: 2,
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
