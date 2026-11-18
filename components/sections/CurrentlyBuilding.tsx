"use client";

import { Stage } from "@/components/layout/Stage";
import { currentlyBuilding } from "@/lib/data/content";
import { disciplinesById } from "@/lib/data/disciplines";
import styles from "./building.module.css";

const STATUS_LABEL: Record<string, string> = {
  exploring: "Exploring",
  building: "Building",
  studying: "Studying",
};

/**
 * CURRENTLY BUILDING / LEARNING
 *
 * Sits with the CV because it belongs to the same claim: this is what the
 * record looks like right now, in progress. Every entry is explicitly
 * marked as unfinished — the section would be actively dishonest if an
 * in-flight experiment read as a shipped achievement.
 */
export function CurrentlyBuilding() {
  return (
    <Stage id="building" ariaLabelledBy="building-title">
      <div className={styles.head}>
        <h2 id="building-title" className={styles.title}>
          Currently building / learning
        </h2>
        <p className={styles.note}>
          In progress, not finished work.
        </p>
      </div>

      <ul className={styles.list}>
        {currentlyBuilding.map((item) => (
          <li
            key={item.id}
            className={styles.item}
            style={
              {
                "--c-accent": `var(${
                  disciplinesById[item.discipline].accentVar
                })`,
              } as React.CSSProperties
            }
          >
            <div className={styles.itemHead}>
              <span className={styles.status}>
                <span className={styles.pulse} aria-hidden="true" />
                {STATUS_LABEL[item.status]}
              </span>
              <span className={styles.world}>
                {disciplinesById[item.discipline].shortName}
              </span>
            </div>

            <h3 className={styles.itemTitle}>{item.title}</h3>
            <p className={styles.itemNote}>{item.note}</p>
          </li>
        ))}
      </ul>
    </Stage>
  );
}
