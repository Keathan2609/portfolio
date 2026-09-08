/**
 * Quality tiers.
 *
 * Decided once at boot, then read by every WebGL experience. Features must
 * branch on the tier rather than sniffing device conditions themselves —
 * otherwise "is this device fast enough?" gets re-answered inconsistently in
 * a dozen places.
 *
 *   high    full effects, high DPR
 *   medium  reduced DPR, no postprocessing, lighter geometry
 *   low     minimal ambient WebGL, static where possible
 *   none    no canvas at all — the DOM site stands alone
 */
export type QualityTier = "high" | "medium" | "low" | "none";

export interface QualityConfig {
  tier: QualityTier;
  /** Whether the persistent canvas mounts at all. */
  webgl: boolean;
  /** [min, max] passed to <Canvas dpr>. */
  dpr: [number, number];
  antialias: boolean;
  /** Gate for any fullscreen effect pass. */
  postprocessing: boolean;
  shadows: boolean;
  /** Multiplier applied to particle counts / instance counts. */
  density: number;
  /** Whether ambient scenes animate continuously or hold a static frame. */
  animateAmbient: boolean;
  /** Whether decorative video may autoplay. */
  video: boolean;
}

export const QUALITY_CONFIG: Record<QualityTier, QualityConfig> = {
  high: {
    tier: "high",
    webgl: true,
    dpr: [1, 2],
    antialias: true,
    postprocessing: true,
    shadows: true,
    density: 1,
    animateAmbient: true,
    video: true,
  },
  medium: {
    tier: "medium",
    webgl: true,
    dpr: [1, 1.5],
    antialias: true,
    postprocessing: false,
    shadows: false,
    density: 0.6,
    animateAmbient: true,
    video: true,
  },
  low: {
    tier: "low",
    webgl: true,
    dpr: [1, 1],
    antialias: false,
    postprocessing: false,
    shadows: false,
    density: 0.25,
    animateAmbient: false,
    video: false,
  },
  none: {
    tier: "none",
    webgl: false,
    dpr: [1, 1],
    antialias: false,
    postprocessing: false,
    shadows: false,
    density: 0,
    animateAmbient: false,
    video: false,
  },
};

const TIER_ORDER: QualityTier[] = ["none", "low", "medium", "high"];

/** Returns whichever tier is lower. Used to apply caps without branching. */
export function capTier(tier: QualityTier, ceiling: QualityTier): QualityTier {
  return TIER_ORDER.indexOf(tier) <= TIER_ORDER.indexOf(ceiling)
    ? tier
    : ceiling;
}

export function stepDown(tier: QualityTier): QualityTier {
  const i = TIER_ORDER.indexOf(tier);
  return TIER_ORDER[Math.max(0, i - 1)];
}

/** Cheap capability probe — creates and immediately discards a context. */
export function supportsWebGL(): boolean {
  if (typeof window === "undefined") return false;
  try {
    const canvas = document.createElement("canvas");
    const gl =
      canvas.getContext("webgl2") ??
      canvas.getContext("webgl") ??
      canvas.getContext("experimental-webgl");
    if (!gl) return false;
    // Release the probe context immediately; browsers cap concurrent contexts.
    const lose = (gl as WebGLRenderingContext).getExtension("WEBGL_lose_context");
    lose?.loseContext();
    return true;
  } catch {
    return false;
  }
}

interface DetectInput {
  /** Resolved reduced-motion preference (OS or in-page override). */
  reducedMotion: boolean;
  coarsePointer: boolean;
  viewportWidth: number;
}

/**
 * Initial tier detection.
 *
 * Deliberately conservative: it is far better to start at medium and let
 * PerformanceMonitor promote nothing, than to start at high and drop frames
 * during the opening sequence — the one moment a visitor is definitely
 * paying attention.
 */
export function detectQualityTier({
  reducedMotion,
  coarsePointer,
  viewportWidth,
}: DetectInput): QualityTier {
  if (typeof window === "undefined") return "none";
  if (!supportsWebGL()) return "none";

  // An explicit ask for less motion outranks any hardware capability.
  if (reducedMotion) return "low";

  const nav = navigator as Navigator & {
    deviceMemory?: number;
    connection?: { saveData?: boolean; effectiveType?: string };
  };

  if (nav.connection?.saveData) return "none";

  const effectiveType = nav.connection?.effectiveType ?? "";
  if (effectiveType === "slow-2g" || effectiveType === "2g") return "none";
  if (effectiveType === "3g") return "low";

  const memory = nav.deviceMemory ?? 8;
  const cores = navigator.hardwareConcurrency ?? 8;
  const dpr = window.devicePixelRatio || 1;

  if (memory <= 2 || cores <= 2) return "low";

  // Mobile / touch: WebGL is intentionally simplified rather than scaled down.
  if (coarsePointer || viewportWidth < 768) {
    return memory >= 6 && cores >= 6 ? "medium" : "low";
  }

  // A high-DPR laptop with modest cores will melt at dpr 2 on fullscreen work.
  if (dpr > 2 && cores < 8) return "medium";
  if (memory >= 8 && cores >= 8) return "high";

  return "medium";
}

/**
 * Should this visitor be sent large decorative imagery?
 *
 * Deliberately NOT the same question as the quality tier. `none` is returned
 * both for Save-Data and for a browser with no WebGL at all — and in the
 * second case a still backdrop is the ONLY atmosphere the site has left, so
 * it is wanted more, not less. This answers the narrower question on its own
 * terms: is the connection asking us for fewer bytes?
 */
export function prefersLightPayload(): boolean {
  if (typeof navigator === "undefined") return false;

  const nav = navigator as Navigator & {
    connection?: { saveData?: boolean; effectiveType?: string };
  };

  if (nav.connection?.saveData) return true;

  const effectiveType = nav.connection?.effectiveType ?? "";
  return effectiveType === "slow-2g" || effectiveType === "2g";
}
