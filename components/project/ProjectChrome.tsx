"use client";

import { useEffect, useRef } from "react";
import { gsap, useGSAP } from "@/lib/animation/register";
import { DURATION, EASE } from "@/lib/animation/easings";
import { useReducedMotion } from "@/lib/animation/MotionProvider";
import { disciplines, disciplinesById } from "@/lib/data/disciplines";
import { holdJourneyAt } from "@/lib/webgl/journey-state";
import type { DisciplineId } from "@/lib/data/types";
import styles from "./project-page.module.css";

/**
 * The client half of a project page.
 *
 * Four jobs, all of which need the browser and none of which belong in the
 * page's static HTML:
 *
 *  1. THE ACCENT. Set as a local custom property, exactly as <Stage> does on
 *     the homepage, so everything below uses var(--c-accent) and no
 *     component ever names a discipline colour.
 *
 *  2. FREEZING THE ENVIRONMENT. A project route mounts no stages, so nothing
 *     publishes stage progress and `readJourneyState` holds its last value
 *     on its own. All this does is set what that value IS, for a visitor who
 *     opened the URL directly and has never been through the journey. See
 *     holdJourneyAt.
 *
 *  3. THE ENTRANCE. A short fade in the site's own easing, skipped entirely
 *     under reduced motion — which covers both the OS setting and the
 *     in-page toggle, because useReducedMotion resolves the two.
 *
 *  4. FOCUS. Moving it to the h1 on arrival, so a keyboard or screen-reader
 *     visitor lands on the page rather than back at the top of the shell.
 *     Without this a client navigation leaves focus on the link that was
 *     just clicked, which no longer exists.
 */
export function ProjectChrome({
  discipline,
  children,
}: {
  discipline: DisciplineId;
  children: React.ReactNode;
}) {
  const root = useRef<HTMLDivElement>(null);
  const reduced = useReducedMotion();

  const meta = disciplinesById[discipline];

  useEffect(() => {
    // `index` is 1-based for display; JourneyState.position is 0-based from
    // the first discipline. Derived from the array rather than from `index`
    // so a reordering of the journey carries this with it.
    const position = disciplines.findIndex((d) => d.id === discipline);
    if (position >= 0) holdJourneyAt(position);
  }, [discipline]);

  useEffect(() => {
    const node = root.current?.querySelector<HTMLElement>("[data-page-title]");
    if (!node) return;
    /* preventScroll matters: the h1 sits below the breadcrumb, and letting
       the browser scroll it into view would fight the scroll reset that
       runs on the same navigation. */
    node.focus({ preventScroll: true });
  }, []);

  useGSAP(
    () => {
      if (reduced) return;
      const node = root.current;
      if (!node) return;

      gsap.fromTo(
        node,
        { opacity: 0, y: 12 },
        {
          opacity: 1,
          y: 0,
          duration: DURATION.base,
          ease: EASE.out,
          // Cleared so the page is left with no inline transform: a lingering
          // one creates a containing block and breaks position:fixed inside.
          clearProps: "opacity,transform",
        },
      );
    },
    { dependencies: [reduced], scope: root },
  );

  return (
    <div
      ref={root}
      className={styles.chrome}
      style={{ "--c-accent": `var(${meta.accentVar})` } as React.CSSProperties}
    >
      {children}
    </div>
  );
}
