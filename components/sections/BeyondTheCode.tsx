"use client";

import { useRef } from "react";
import { Stage } from "@/components/layout/Stage";
import { Media } from "@/components/ui/Media";
import { beyond } from "@/lib/data/content";
import { gsap, useGSAP } from "@/lib/animation/register";
import { useReducedMotion } from "@/lib/animation/MotionProvider";
import { SCRUB } from "@/lib/animation/easings";
import styles from "./beyond.module.css";

/**
 * BEYOND THE CODE
 *
 * A short visual breath before the close, reminding the reader that the
 * engineering sits on top of a genuine visual practice. Deliberately not
 * another portfolio category — four frames, one line, and out.
 *
 * The only motion is a scrubbed vertical offset per frame, so the row
 * breathes as it passes rather than sitting flat.
 */
export function BeyondTheCode() {
  const root = useRef<HTMLDivElement>(null);
  const reduced = useReducedMotion();

  useGSAP(
    () => {
      if (reduced) return;

      gsap.utils.toArray<HTMLElement>(`.${styles.frame}`).forEach((frame, i) => {
        gsap.to(frame, {
          y: i % 2 === 0 ? -34 : 34,
          ease: "none",
          scrollTrigger: {
            trigger: root.current,
            start: "top bottom",
            end: "bottom top",
            scrub: SCRUB,
          },
        });
      });
    },
    { dependencies: [reduced], scope: root, revertOnUpdate: true },
  );

  return (
    <Stage id="beyond" ariaLabelledBy="beyond-title">
      <div ref={root} className={styles.beyond}>
        <div className={styles.head}>
          <h2 id="beyond-title" className={styles.title}>
            Beyond the code
          </h2>
          <p className={styles.note}>
            The visual practice the engineering is built on.
          </p>
        </div>

        <ul className={styles.row}>
          {beyond.map((entry) => (
            <li key={entry.id} className={styles.frame}>
              <Media
                asset={entry.media}
                ratio="3 / 4"
                sizes="(max-width: 48rem) 45vw, 22vw"
                placeholderLabel={entry.label}
              />
              <p className={styles.label}>{entry.label}</p>
            </li>
          ))}
        </ul>
      </div>
    </Stage>
  );
}
