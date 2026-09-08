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
  /** Edge light strength. The thing that stops a plane reading as a rectangle. */
  edge?: number;
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
    {
      id: "xr-glass",
      kind: "glass",
      x: 4.6,
      y: 1.7,
      z: -5.4,
      w: 11,
      h: 7.4,
      rotY: -0.14,
      glassAlpha: 0.4,
      radius: 0.18,
      edge: 0.5,
      parallax: 0.1,
      drift: 0.012,
      reveal: "up",
      order: 0,
    },
    {
      /* The hero. Reactor three-quarter, 42mm, the strongest single frame in
         the render set.

         SIZED DOWN FROM 10.8 AND MOVED INTO THE UPPER-RIGHT QUADRANT, which
         is the correction that made this chapter work. At its first width it
         ran off both edges of the frame and read as a background photograph
         rather than as a plane standing in a room — the one thing a 2.5D
         composition cannot afford, because the entire illusion is that these
         are surfaces with edges at a distance. Seeing the plane end is what
         sells it. It also sat straight through the capability list at
         y≈570px, putting bright render behind 14px body text.

         At 7.4 units, up at y=2.3 and held at x=4.6 (so the right edge lands
         at 8.3 against 9.8 of available half-width), all four edges are
         inside the frame, the type band below it is clear, and the tint pulls
         the render's fairly neutral steel toward the discipline's violet so
         the chapter still reads as XR rather than as a photo of a machine. */
      id: "xr-reactor-hero",
      kind: "image",
      asset: "/media/projects/orbital/reactor-hero",
      aspect: R16_9,
      x: 4.6,
      y: 2.3,
      z: -3.4,
      w: 7.4,
      rotY: -0.18,
      rotZ: 0.008,
      radius: 0.09,
      edge: 0.5,
      vignette: 0.6,
      tint: 0.16,
      lift: 1.04,
      parallax: 0.26,
      drift: 0.018,
      reveal: "up",
      order: 1,
    },
    {
      /* The one moving element in the chapter. A turntable is the honest way
         to show modelling work — it states the geometry is real and rotates
         to prove it — and it earns the only video texture in the site.
         Lower-right, in the gap between the capability list and the project
         rail. */
      id: "xr-turntable",
      kind: "video",
      video: {
        src: "/media/projects/orbital/reactor-turntable.mp4",
        poster: "/media/projects/orbital/reactor-turntable-poster",
      },
      aspect: R16_9,
      x: 4.4,
      y: -2.6,
      z: -1.4,
      w: 4.4,
      rotY: -0.3,
      rotZ: -0.02,
      radius: 0.08,
      edge: 0.55,
      /* Vignette and exposure pushed harder than the hero's. The reactor
         render has a bright studio pedestal in the lower third, and at this
         plane's scale that pale area read as the brightest thing in the frame
         — brighter than the hero it is meant to support. Trimming it is the
         difference between a composition with one subject and two competing
         images. */
      vignette: 0.62,
      lift: 0.86,
      tint: 0.24,
      parallax: 0.46,
      drift: 0.022,
      reveal: "left",
      order: 2,
    },
    {
      /* A genuine foreground element at z=+1.4 — nearer than the camera's
         convergence point, cropped hard into the containment gimbal. This is
         the plane that creates the sense of depth, because it is the only one
         the eye reads as being on this side of the space.

         Moved to the lower LEFT: at upper-right it was clipped by the viewport
         edge, and a foreground plane that leaves the frame stops being a
         foreground plane and becomes a border. */
      id: "xr-reactor-detail",
      kind: "image",
      asset: "/media/projects/orbital/reactor-detail",
      aspect: R16_9,
      x: -3.2,
      y: -2.4,
      z: 1.4,
      w: 3.0,
      rotY: 0.44,
      rotZ: 0.03,
      crop: 1.38,
      radius: 0.06,
      edge: 0.55,
      vignette: 0.5,
      tint: 0.18,
      parallax: 0.74,
      drift: 0.03,
      reveal: "down",
      order: 3,
      minTier: "medium",
    },
    {
      /* Deep background, heavily desaturated toward the violet so it reads as
         atmosphere with structure in it rather than as a second photograph.
         Opacity dropped to 0.42: this plane sits BEHIND the capability list
         and the process strip, and at 0.6 it was lifting their background
         enough to matter. It is depth, not content. */
      id: "xr-environment",
      kind: "image",
      asset: "/media/projects/orbital/environment",
      aspect: R16_9,
      x: -6.6,
      y: -1.0,
      z: -9.6,
      w: 10.4,
      rotY: 0.24,
      opacity: 0.5,
      desaturate: 0.68,
      tint: 0.46,
      radius: 0.1,
      edge: 0.2,
      lift: 0.84,
      parallax: 0.08,
      drift: 0.01,
      reveal: "up",
      order: 4,
      minTier: "medium",
    },
    {
      /* The technical pass. Wireframe over the same reactor — it says the
         thing was built, not sourced. Pushed almost to a diagram so it reads
         as annotation on the world rather than a competing image. Sits in the
         band between the heading and the level row. */
      id: "xr-wireframe",
      kind: "image",
      asset: "/media/projects/orbital/wireframe",
      aspect: R16_9,
      x: -0.4,
      y: 4.8,
      z: -7.4,
      w: 4.4,
      rotY: 0.14,
      rotZ: -0.02,
      opacity: 0.34,
      desaturate: 0.88,
      tint: 0.5,
      radius: 0.06,
      edge: 0.32,
      parallax: 0.12,
      drift: 0.014,
      reveal: "right",
      order: 5,
      minTier: "high",
    },
    {
      /* The modular kit breakdown, pushed deep and dim. It is the plane that
         states the work is a SYSTEM rather than one object, which is worth
         having in the frame even at 0.3 — but only as depth. */
      id: "xr-modular-kit",
      kind: "image",
      asset: "/media/projects/orbital/modular-kit",
      aspect: R16_9,
      x: 3.0,
      y: -6.0,
      z: -8.4,
      w: 6.4,
      rotX: 0.1,
      rotY: -0.08,
      opacity: 0.3,
      desaturate: 0.7,
      tint: 0.45,
      radius: 0.08,
      edge: 0.22,
      lift: 0.86,
      parallax: 0.1,
      drift: 0.012,
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
    /* THE FIRST PASS OF THIS CHAPTER WAS THE WORST FRAME IN THE BUILD, and
       the reason is worth recording because it is a trap specific to a long
       lens. Creative's camera sits furthest back (z=10.6) on the narrowest
       lens in the set (34°), which means the visible frame is only about
       ±5.5 x ±3.4 world units — barely half XR's. The plane widths carried
       over from XR were therefore roughly DOUBLE what the frame could hold:
       eight boards at those sizes covered the viewport edge to edge, ran off
       all four sides, buried the heading under a typography board, and turned
       the entire frame orange because every warm brand board was stacked at
       full saturation.

       The rebuild inverts the strategy. There is exactly ONE board at
       readable size, held in the lower-right quadrant where the DOM has no
       content, one small colour crop upper-right, and the remaining boards
       are pushed deep and heavily desaturated so they read as textured depth
       rather than as competing images. Negative space came back, the heading
       is clear, and the chapter still shows four real identity systems.

       Screen-space budget for this lens, at 1440x900:
         DOM occupies x < ~1020px and the bands y 220-340, 390-410, 500-530,
         570-660. The genuinely free regions are the right column (x > 1020)
         and the lower band (y > 680). Every bright plane below lands in one
         of those two. */
    {
      id: "cr-glass",
      kind: "glass",
      x: 2.4,
      y: -0.6,
      z: -2.2,
      w: 6.0,
      h: 4.2,
      rotY: -0.1,
      glassAlpha: 0.34,
      radius: 0.12,
      edge: 0.5,
      parallax: 0.1,
      drift: 0.01,
      reveal: "up",
      order: 0,
    },
    {
      /* THE ONE BOARD AT FULL STRENGTH. EMBER's final showcase — the single
         board that states an entire identity system in one frame. Held in the
         lower right, the largest genuinely empty region at this lens, and
         left almost untinted: the whole point of showing brand work is that
         its own colour is the content, so this is the one plane the world hue
         is not allowed to recolour. */
      id: "cr-ember-showcase",
      kind: "image",
      asset: "/media/projects/brand/ember/showcase",
      aspect: 1200 / 718,
      x: 3.4,
      y: -1.9,
      z: -0.9,
      w: 3.5,
      rotY: -0.13,
      rotZ: 0.01,
      radius: 0.05,
      edge: 0.5,
      vignette: 0.3,
      tint: 0.04,
      lift: 1.12,
      parallax: 0.28,
      drift: 0.016,
      reveal: "up",
      order: 1,
    },
    {
      /* KAERA's palette, cropped to a colour strip and set upper-right. Pure
         hue, no image content — it is what keeps the chapter from reading as
         a stack of rectangles, and it is the most honest possible statement
         of what a brand system actually is. */
      id: "cr-kaera-palette",
      kind: "image",
      asset: "/media/projects/brand/kaera/palette",
      aspect: 1024 / 683,
      x: 4.3,
      y: 1.4,
      z: -1.5,
      w: 1.9,
      rotY: -0.28,
      rotZ: 0.016,
      crop: 1.7,
      radius: 0.04,
      edge: 0.6,
      vignette: 0.14,
      tint: 0.05,
      lift: 1.14,
      parallax: 0.4,
      drift: 0.02,
      reveal: "right",
      order: 2,
    },
    {
      /* A hard crop into FORM's typography board, genuinely in front of the
         camera at z=+1.6 and placed LOW-left, under the capability list.
         Cropped type at foreground scale is the most characteristic image a
         design practice can show. Small — 1.8 units at this depth is already
         a fifth of the frame width. */
      id: "cr-form-type",
      kind: "image",
      asset: "/media/projects/brand/form/typography",
      aspect: 1024 / 683,
      x: 2.8,
      y: -2.0,
      z: 1.6,
      w: 1.7,
      rotY: -0.34,
      rotZ: -0.03,
      crop: 2.1,
      radius: 0.03,
      edge: 0.55,
      vignette: 0.22,
      tint: 0.07,
      lift: 1.08,
      parallax: 0.75,
      drift: 0.026,
      reveal: "down",
      order: 3,
      minTier: "medium",
    },
    {
      /* VANTA, set back and turned away — present as a second system, clearly
         subordinate, and desaturated enough that it does not fight EMBER for
         the eye. */
      id: "cr-vanta-showcase",
      kind: "image",
      asset: "/media/projects/brand/vanta/showcase",
      aspect: 1200 / 675,
      x: -3.2,
      y: 1.5,
      z: -4.4,
      w: 3.4,
      rotY: 0.24,
      rotZ: -0.012,
      opacity: 0.66,
      desaturate: 0.34,
      tint: 0.2,
      radius: 0.05,
      edge: 0.4,
      vignette: 0.32,
      lift: 1.0,
      parallax: 0.12,
      drift: 0.012,
      reveal: "left",
      order: 4,
      minTier: "medium",
    },
    {
      /* Deep texture. Three boards from three systems, pushed far back and
         desaturated hard toward the world hue. At these opacities they are
         not readable as designs and are not meant to be — they are what makes
         the depth behind the focal board feel like a studio wall rather than
         empty fog. */
      id: "cr-form-applications",
      kind: "image",
      asset: "/media/projects/brand/form/applications",
      aspect: 1024 / 683,
      x: 1.2,
      y: -2.2,
      z: -6.2,
      w: 4.4,
      rotX: 0.05,
      rotY: 0.06,
      opacity: 0.4,
      desaturate: 0.55,
      tint: 0.3,
      radius: 0.05,
      edge: 0.26,
      lift: 0.94,
      parallax: 0.08,
      drift: 0.01,
      reveal: "up",
      order: 5,
      minTier: "high",
    },
    {
      id: "cr-ember-logo",
      kind: "image",
      asset: "/media/projects/brand/ember/logo",
      aspect: 1024 / 683,
      x: -4.8,
      y: -0.4,
      z: -6.8,
      w: 3.4,
      rotY: 0.3,
      opacity: 0.36,
      desaturate: 0.58,
      tint: 0.32,
      radius: 0.04,
      edge: 0.26,
      lift: 0.94,
      parallax: 0.07,
      drift: 0.01,
      reveal: "up",
      order: 6,
      minTier: "high",
    },
    {
      id: "cr-vanta-social",
      kind: "image",
      asset: "/media/projects/brand/vanta/social",
      aspect: 1024 / 768,
      x: 5.0,
      y: 0.2,
      z: -7.6,
      w: 3.0,
      rotY: -0.3,
      opacity: 0.34,
      desaturate: 0.6,
      tint: 0.34,
      radius: 0.04,
      edge: 0.24,
      lift: 0.94,
      parallax: 0.06,
      drift: 0.008,
      reveal: "up",
      order: 7,
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
