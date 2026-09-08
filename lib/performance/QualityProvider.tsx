"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import { useReducedMotion } from "@/lib/animation/MotionProvider";
import { useIsCoarsePointer } from "@/lib/hooks/useMediaQuery";
import { useIsHydrated } from "@/lib/hooks/useIsHydrated";
import {
  QUALITY_CONFIG,
  type QualityConfig,
  type QualityTier,
  capTier,
  detectQualityTier,
  stepDown,
} from "./quality";

/**
 * Detection runs exactly once per page load, memoised at module scope.
 *
 * Re-detecting mid-session would be worse than useless: it could swap the
 * tier under a running scene and force a canvas rebuild. Changes that DO
 * need to take effect live — the motion toggle, runtime degradation — are
 * applied as caps and overrides on top of this fixed baseline.
 */
let detectedTier: QualityTier | null = null;

function getDetectedTier(coarsePointer: boolean) {
  detectedTier ??= detectQualityTier({
    // Deliberately false: detection measures what the DEVICE can do, and is
    // memoised for the page load. Motion preference is applied afterwards as
    // a cap, so a visitor who arrives with reduced motion stored and then
    // turns motion on gets the tier their hardware actually deserves —
    // rather than being pinned to "low" until they reload.
    reducedMotion: false,
    coarsePointer,
    viewportWidth: window.innerWidth,
  });
  return detectedTier;
}

interface QualityContextValue extends QualityConfig {
  /** True until detection has run — render no canvas before this. */
  detecting: boolean;
  /** Manual override, mainly for development and QA. */
  setTier: (tier: QualityTier) => void;
  /** Called by the runtime performance monitor when frame rate degrades. */
  degrade: () => void;
}

const QualityContext = createContext<QualityContextValue | null>(null);

export function QualityProvider({ children }: { children: React.ReactNode }) {
  const reducedMotion = useReducedMotion();
  const coarsePointer = useIsCoarsePointer();

  const [override, setOverride] = useState<QualityTier | null>(null);
  const hydrated = useIsHydrated();

  // Stays null through SSR *and* through hydration, so the first client
  // render matches the server HTML exactly — no canvas on either side. The
  // real tier lands on the render straight after hydration completes.
  const detected = hydrated ? getDetectedTier(coarsePointer) : null;
  const detecting = detected === null;

  const base = override ?? detected ?? "none";
  // Turning reduced motion on mid-session must take effect immediately.
  const effectiveTier = reducedMotion ? capTier(base, "low") : base;

  // Runtime degradation floors at "low": the canvas may get simpler under
  // load, but it is never yanked out from under the visitor mid-session.
  // "none" is reserved for boot-time decisions (no WebGL, Save-Data, 2G).
  const degrade = useCallback(() => {
    setOverride((current) => {
      const next = stepDown(current ?? detectedTier ?? "none");
      return next === "none" ? "low" : next;
    });
  }, []);

  const setTier = useCallback((tier: QualityTier) => setOverride(tier), []);

  const value = useMemo<QualityContextValue>(
    () => ({
      ...QUALITY_CONFIG[effectiveTier],
      detecting,
      setTier,
      degrade,
    }),
    [effectiveTier, detecting, setTier, degrade],
  );

  // Exposed for CSS: sections can restrain their own effects on low tiers
  // without a JS round-trip.
  useEffect(() => {
    document.documentElement.dataset.quality = effectiveTier;
  }, [effectiveTier]);

  /**
   * Development-only tier bridge.
   *
   * The environment is art-directed per tier — point counts, instance counts
   * and the atmosphere's shader octave count all change — and there is
   * otherwise no way to look at a tier other than the one the current machine
   * happens to detect. Pinning the tier is also the only way to review the
   * HIGH composition in a software rasteriser, where PerformanceMonitor
   * correctly degrades within seconds and hides the thing being reviewed.
   *
   * Mirrors the __knp convention in ScrollProvider and is stripped from
   * production builds by the NODE_ENV check.
   */
  useEffect(() => {
    if (process.env.NODE_ENV === "production") return;
    const w = window as unknown as Record<string, unknown>;
    w.__knpQuality = { tier: effectiveTier, setTier };
    return () => {
      delete w.__knpQuality;
    };
  }, [effectiveTier, setTier]);

  return (
    <QualityContext.Provider value={value}>{children}</QualityContext.Provider>
  );
}

export function useQuality(): QualityContextValue {
  const ctx = useContext(QualityContext);
  if (!ctx) throw new Error("useQuality must be used inside <QualityProvider>");
  return ctx;
}
