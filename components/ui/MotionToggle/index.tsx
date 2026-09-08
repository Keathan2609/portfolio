"use client";

import { useMotion } from "@/lib/animation/MotionProvider";
import styles from "./motion-toggle.module.css";

/**
 * Visible reduced-motion control.
 *
 * The OS preference is honoured automatically, but plenty of people who are
 * bothered by heavy motion have never found that setting — and some who set
 * it system-wide still want the full experience here. So the control
 * overrides in both directions, and persists.
 *
 * It is a real button with real state, not an icon-only affordance.
 */
export function MotionToggle() {
  const { reduced, setPreference } = useMotion();

  return (
    <button
      type="button"
      className={styles.toggle}
      aria-pressed={reduced}
      onClick={() => setPreference(reduced ? "full" : "reduced")}
    >
      <span className={styles.dot} data-on={!reduced} aria-hidden="true" />
      <span className={styles.label}>
        Motion
        <span className={styles.state}>{reduced ? "Off" : "On"}</span>
      </span>
      <span className="sr-only">
        {reduced
          ? "Reduced motion is on. Activate to enable full motion."
          : "Full motion is on. Activate to reduce motion."}
      </span>
    </button>
  );
}
