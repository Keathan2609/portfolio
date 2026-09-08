"use client";

import { useMemo } from "react";
import { navStages } from "@/lib/data/journey";
import { useActiveStage } from "@/lib/scroll/useActiveStage";
import { useScrollToWithFocus } from "@/lib/scroll/useScrollTo";
import { cn } from "@/lib/utils/cn";
import styles from "./journey-nav.module.css";

/**
 * THE JOURNEY INDICATOR
 *
 * Wayfinding for a single continuous experience: it shows where you are in
 * the sequence rather than offering a set of destinations. Entries are
 * generated from lib/data/journey so the order lives in exactly one place.
 *
 * These are real anchors with real hrefs — they work without JavaScript and
 * they announce correctly. The click handler exists only to hand the scroll
 * to Lenis instead of the browser, and to move focus with the viewport,
 * which is the failure that makes most scroll-driven sites unusable by
 * keyboard.
 *
 * Labels stay collapsed until hover or focus so the rail reads as a quiet
 * progress indicator rather than a menu — but they are always in the DOM
 * and always available to assistive technology.
 */
export function JourneyNav() {
  const stageIds = useMemo(() => navStages.map((s) => s.id), []);
  const active = useActiveStage(stageIds);
  const scrollToWithFocus = useScrollToWithFocus();

  return (
    <nav className={styles.rail} aria-label="Journey">
      <ol className={styles.list}>
        {navStages.map((stage) => {
          const isActive = active === stage.id;
          return (
            <li key={stage.id}>
              <a
                href={`#${stage.id}`}
                className={cn(styles.link, isActive && styles.active)}
                aria-current={isActive ? "location" : undefined}
                data-cursor="OPEN"
                onClick={(event) => {
                  event.preventDefault();
                  scrollToWithFocus(`#${stage.id}`);
                }}
              >
                <span
                  className={cn(
                    styles.index,
                    !stage.navIndex && styles.indexBlank,
                  )}
                  aria-hidden="true"
                >
                  {stage.navIndex ?? "·"}
                </span>
                <span className={styles.label}>{stage.navLabel}</span>
                <span className={styles.tick} aria-hidden="true" />
              </a>
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
