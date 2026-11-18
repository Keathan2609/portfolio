"use client";

import { useRef } from "react";
import { Stage } from "@/components/layout/Stage";
import { disciplinesById } from "@/lib/data/disciplines";
import type { TransitionKind } from "@/lib/data/types";
import { gsap, useGSAP } from "@/lib/animation/register";
import { useReducedMotion } from "@/lib/animation/MotionProvider";
import { SCRUB } from "@/lib/animation/easings";
import styles from "./transition.module.css";

/**
 * A TRANSITION BAND.
 *
 * The connective tissue between two worlds. Each runs a different mechanic —
 * extrusion, fragmentation, flattening, structural break — so no two worlds
 * are joined the same way, and the mechanic itself argues for why those two
 * disciplines sit next to each other.
 *
 * THIS COMPONENT CARRIES NO SCENE, AND THAT IS THE POINT.
 *
 * A band used to mount its own WebGL view, covering the viewport so it could
 * cross-dissolve with the worlds either side. That was the best available fix
 * for a seam it should never have had: a scene of its own is a separate thing
 * that starts and stops, so however carefully its envelope was shaped, the
 * band remained an interruption between two other scenes with its own camera
 * and its own fade.
 *
 * The transformation now happens inside the persistent environment, which
 * never unmounts and owns the only camera — see
 * lib/webgl/scenes/JourneyEnvironment.tsx. A band is simply a stretch of
 * scroll over which the world is partway between two of its own arrangements:
 * the Software lattice tumbling into XR's shells, Data's ribbons quantising
 * into a topology. Nothing begins and nothing ends.
 *
 * What remains here is the part that was always DOM: the mono label naming
 * the crossing, and a VERTICAL thread rather than a horizontal rule. That
 * choice still matters — a full-width horizontal line is the universal
 * graphic for "one thing ends, another begins", which is the exact opposite
 * of the claim being made. A hairline running down the band, drawing itself
 * as you scroll, says continuing.
 *
 * EACH BAND USED TO CARRY A SECOND LINE naming its mechanic — "Interfaces
 * extrude into space", "Type resolves into signal", and two more like them.
 * They are gone. They described the WebGL transformation in the language of
 * an art statement rather than the language of the person whose work this
 * is, and a reader arriving to find out what he builds does not need a
 * caption telling them how to feel about a gradient. The world pair stays,
 * because it says where you are. The poetry does not.
 *
 * These bands carry no content a visitor needs, so they stay `aria-hidden`
 * and outside the tab order. With WebGL absent the thread and its label are
 * the whole passage — still deliberate, just no longer atmospheric.
 */

const COPY: Record<TransitionKind, { from: string; to: string }> = {
  "software-xr": { from: "software", to: "xr" },
  "xr-creative": { from: "xr", to: "creative" },
  "creative-ai": { from: "creative", to: "ai" },
  "ai-security": { from: "ai", to: "security" },
};

export function TransitionBand({ kind }: { kind: TransitionKind }) {
  const root = useRef<HTMLDivElement>(null);
  const reduced = useReducedMotion();

  const copy = COPY[kind];
  const from = disciplinesById[copy.from as keyof typeof disciplinesById];
  const to = disciplinesById[copy.to as keyof typeof disciplinesById];

  useGSAP(
    () => {
      if (reduced) return;
      const thread = root.current?.querySelector(`.${styles.thread}`);
      if (!thread) return;

      // The thread draws downward in step with the transformation behind it,
      // so the DOM layer and the WebGL layer are telling the same story off
      // the same scroll position rather than animating independently.
      gsap.fromTo(
        thread,
        { scaleY: 0 },
        {
          scaleY: 1,
          ease: "none",
          scrollTrigger: {
            trigger: root.current,
            start: "top bottom",
            end: "bottom top",
            scrub: SCRUB,
          },
        },
      );
    },
    { dependencies: [reduced], scope: root, revertOnUpdate: true },
  );

  return (
    <Stage
      id={`transition-${kind}`}
      decorative
      className={styles.band}
      accentVar={to.accentVar}
    >
      <div ref={root} className={styles.marker}>
        <span className={styles.thread} />
        <span className={styles.note}>
          <span className={styles.pair}>
            {from.shortName}
            <span className={styles.arrow} aria-hidden="true">
              &#8595;
            </span>
            {to.shortName}
          </span>
        </span>
      </div>
    </Stage>
  );
}
