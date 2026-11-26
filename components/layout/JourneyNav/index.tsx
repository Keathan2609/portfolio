"use client";

import { useMemo } from "react";
import { usePathname } from "next/navigation";
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
 *
 * ONLY ON THE JOURNEY. The header lives in the shell, so this used to
 * render on project pages too — where every entry pointed at a `#stage-id`
 * that is not in the document. The click handler preventDefaults and hands
 * the scroll to Lenis, which then had nothing to find, so the rail was a
 * column of visible, focusable links that did nothing at all. A progress
 * indicator for a sequence you are not currently in has nothing to
 * indicate.
 */
export function JourneyNav() {
  const pathname = usePathname();
  const stageIds = useMemo(() => navStages.map((s) => s.id), []);
  const active = useActiveStage(stageIds);
  const scrollToWithFocus = useScrollToWithFocus();

  // After the hooks, never before: the rule is unconditional hook order,
  // and this component is rendered on both kinds of route.
  if (pathname !== "/") return null;

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
