"use client";

import { useRef } from "react";
import { Stage } from "@/components/layout/Stage";
import { Eyebrow } from "@/components/ui/Eyebrow";
import { gsap, useGSAP } from "@/lib/animation/register";
import { useReducedMotion } from "@/lib/animation/MotionProvider";
import { DURATION, EASE } from "@/lib/animation/easings";
import { useScrollTo } from "@/lib/scroll/useScrollTo";
import { profile } from "@/lib/data/profile";
import { disciplines } from "@/lib/data/disciplines";
import styles from "./opening.module.css";

/**
 * THE OPENING
 *
 * A threshold, not a loading screen. There is no progress bar, no
 * "INITIALIZING", no artificial wait — the page is already interactive
 * underneath, and this sequence simply establishes register before the
 * name lands.
 *
 * The mechanic is purely typographic: five discipline words are struck
 * through in sequence, leaving one word standing — BUILDER — which is the
 * argument the entire site goes on to make. Rules draw across the frame to
 * hold the composition.
 *
 * It completes in about two seconds, and a skip control is the first thing
 * in the tab order.
 */
export function Opening() {
  const root = useRef<HTMLDivElement>(null);
  const reduced = useReducedMotion();
  const scrollTo = useScrollTo();

  useGSAP(
    () => {
      if (reduced) return;

      const tl = gsap.timeline({ defaults: { ease: EASE.out } });

      tl.from(`.${styles.rule}`, {
        scaleX: 0,
        duration: DURATION.slower,
        stagger: 0.08,
        transformOrigin: "left center",
      })
        .from(
          `.${styles.word}`,
          {
            yPercent: 110,
            opacity: 0,
            duration: DURATION.slow,
            stagger: 0.09,
          },
          "-=0.9",
        )
        // Each discipline is crossed out in turn — not erased, struck
        // through. The disciplines remain; they simply stop being separate.
        .to(
          `.${styles.strike}`,
          {
            scaleX: 1,
            duration: 0.28,
            stagger: 0.11,
            transformOrigin: "left center",
          },
          "-=0.2",
        )
        .to(
          `.${styles.word}[data-struck="true"]`,
          { opacity: 0.22, duration: DURATION.base, stagger: 0.11 },
          "<",
        )
        .from(
          `.${styles.resolve}`,
          { yPercent: 110, opacity: 0, duration: DURATION.slower },
          "-=0.35",
        )
        .from(
          `.${styles.foot}`,
          { opacity: 0, duration: DURATION.base },
          "-=0.6",
        );
    },
    { dependencies: [reduced], scope: root, revertOnUpdate: true },
  );

  return (
    <Stage id="opening" ariaLabel="Opening" full>
      <div ref={root} className={styles.opening}>
        <Eyebrow label="Portfolio" />

        <div className={styles.words}>
          {disciplines.map((discipline) => (
            <p key={discipline.id} className={styles.line}>
              <span className={styles.word} data-struck="true">
                {discipline.name}
                <span className={styles.strike} aria-hidden="true" />
              </span>
            </p>
          ))}

          <p className={styles.line}>
            <span className={styles.resolve}>One builder.</span>
          </p>
        </div>

        <div className={styles.foot}>
          <span className={styles.rule} aria-hidden="true" />
          <p className={styles.name}>{profile.name}</p>
          <button
            type="button"
            className={styles.skip}
            onClick={() => scrollTo("#hero")}
            data-cursor="OPEN"
          >
            Enter
          </button>
        </div>
      </div>
    </Stage>
  );
}
