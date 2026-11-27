"use client";

import { useRef } from "react";
import { Stage } from "@/components/layout/Stage";
import { RevealText } from "@/components/ui/Reveal";
import { Eyebrow } from "@/components/ui/Eyebrow";
import { gsap, useGSAP } from "@/lib/animation/register";
import { useReducedMotion } from "@/lib/animation/MotionProvider";
import { SCRUB } from "@/lib/animation/easings";
import { profile } from "@/lib/data/profile";
import { disciplines } from "@/lib/data/disciplines";
import styles from "./intro.module.css";

/**
 * PERSONAL INTRODUCTION
 *
 * First person, immediately after the hero. Not a services grid, not three
 * icon cards — a piece of writing, set as an editorial column, with the
 * disciplines listed alongside as evidence rather than as menu items.
 *
 * The only motion is a slow counter-drift between the column and the list,
 * scrubbed to scroll. It gives the section life without asking the reader
 * to wait for anything.
 */
export function Intro() {
  const root = useRef<HTMLDivElement>(null);
  const reduced = useReducedMotion();

  useGSAP(
    () => {
      if (reduced) return;

      gsap.to(`.${styles.aside}`, {
        yPercent: -14,
        ease: "none",
        scrollTrigger: {
          trigger: root.current,
          start: "top bottom",
          end: "bottom top",
          scrub: SCRUB,
        },
      });
    },
    { dependencies: [reduced], scope: root, revertOnUpdate: true },
  );

  return (
    <Stage id="intro" ariaLabelledBy="intro-title">
      <div ref={root} className={styles.intro}>
        <div className={styles.head}>
          <Eyebrow label="Introduction" />

          <RevealText
            id="intro-title"
            as="h2"
            text="I work across five disciplines"
            className={styles.title}
          />
        </div>

        <div className={styles.body}>
          <div className={styles.prose}>
            {profile.intro.map((paragraph) => (
              <p key={paragraph.slice(0, 24)}>{paragraph}</p>
            ))}
          </div>

          <aside className={styles.aside}>
            <h3 className={styles.asideTitle}>Five entrances</h3>
            <ul className={styles.list}>
              {disciplines.map((discipline) => (
                <li
                  key={discipline.id}
                  style={
                    {
                      "--c-accent": `var(${discipline.accentVar})`,
                    } as React.CSSProperties
                  }
                >
                  <span className={styles.dot} aria-hidden="true" />
                  <span className={styles.listName}>{discipline.name}</span>
                  <span className={styles.listLevel}>{discipline.level}</span>
                </li>
              ))}
            </ul>
          </aside>
        </div>
      </div>
    </Stage>
  );
}
