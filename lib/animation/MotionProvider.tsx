"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useSyncExternalStore,
} from "react";
import { useSystemReducedMotion } from "@/lib/hooks/useMediaQuery";

export type MotionPreference = "system" | "full" | "reduced";

export const MOTION_STORAGE_KEY = "knp:motion";

/* ------------------------------------------------------------------ */
/* Preference store                                                    */
/*                                                                     */
/* localStorage is an external store, so it is read through            */
/* useSyncExternalStore rather than copied into state inside an effect.*/
/* That gives the correct value on the first client render, keeps the  */
/* server snapshot explicit, and avoids a cascading re-render on mount.*/
/* ------------------------------------------------------------------ */

const listeners = new Set<() => void>();

function readPreference(): MotionPreference {
  try {
    const stored = localStorage.getItem(MOTION_STORAGE_KEY);
    if (stored === "full" || stored === "reduced" || stored === "system") {
      return stored;
    }
  } catch {
    /* Private mode or blocked storage — fall through to the default. */
  }
  return "system";
}

function subscribe(onChange: () => void) {
  listeners.add(onChange);
  // Keeps duplicate tabs in agreement.
  window.addEventListener("storage", onChange);
  return () => {
    listeners.delete(onChange);
    window.removeEventListener("storage", onChange);
  };
}

function writePreference(preference: MotionPreference) {
  try {
    localStorage.setItem(MOTION_STORAGE_KEY, preference);
  } catch {
    /* Non-fatal: the choice simply won't persist across visits. */
  }
  for (const listener of listeners) listener();
}

const serverPreference = (): MotionPreference => "system";

/* ------------------------------------------------------------------ */

interface MotionContextValue {
  /** What the visitor chose. "system" defers to the OS setting. */
  preference: MotionPreference;
  /** The resolved answer every consumer should branch on. */
  reduced: boolean;
  /** What the OS reports, exposed so the toggle can label "system" honestly. */
  systemReduced: boolean;
  setPreference: (p: MotionPreference) => void;
}

const MotionContext = createContext<MotionContextValue | null>(null);

/**
 * NOTE ON PRE-HYDRATION STATE
 *
 * There is deliberately no inline boot script here. The reduced-motion
 * default is expressed in CSS (see tokens.css), which applies before first
 * paint with no JavaScript at all — no inline-script CSP exemption, and no
 * script element inside the React tree for hydration to trip over.
 *
 * This provider only layers the in-page override on top of that baseline.
 */

export function MotionProvider({ children }: { children: React.ReactNode }) {
  const systemReduced = useSystemReducedMotion();
  const preference = useSyncExternalStore(
    subscribe,
    readPreference,
    serverPreference,
  );

  const reduced =
    preference === "reduced" || (preference === "system" && systemReduced);

  // Keep the attribute authoritative: CSS, GSAP branches and the quality
  // tier all read from this single resolved value.
  useEffect(() => {
    document.documentElement.dataset.motion = reduced ? "reduced" : "full";
  }, [reduced]);

  const setPreference = useCallback((p: MotionPreference) => {
    writePreference(p);
  }, []);

  const value = useMemo(
    () => ({ preference, reduced, systemReduced, setPreference }),
    [preference, reduced, systemReduced, setPreference],
  );

  return (
    <MotionContext.Provider value={value}>{children}</MotionContext.Provider>
  );
}

export function useMotion(): MotionContextValue {
  const ctx = useContext(MotionContext);
  if (!ctx) throw new Error("useMotion must be used inside <MotionProvider>");
  return ctx;
}

/** Convenience for the common case. */
export function useReducedMotion(): boolean {
  return useMotion().reduced;
}
