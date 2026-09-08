"use client";

import { profile } from "@/lib/data/profile";
import { useScrollToWithFocus } from "@/lib/scroll/useScrollTo";
import { MotionToggle } from "@/components/ui/MotionToggle";
import { JourneyNav } from "@/components/layout/JourneyNav";
import styles from "./header.module.css";

/**
 * Persistent header.
 *
 * Deliberately thin: identity on the left, controls on the right. The
 * journey rail handles wayfinding separately so the header does not have to
 * grow a menu as the content grows.
 */
export function Header() {
  const scrollToWithFocus = useScrollToWithFocus();

  return (
    <>
      <header className={styles.header}>
        <a
          href="#hero"
          className={styles.identity}
          onClick={(event) => {
            event.preventDefault();
            scrollToWithFocus("#hero");
          }}
        >
          <span className={styles.name}>{profile.name}</span>
        </a>

        <div className={styles.controls}>
          <MotionToggle />
        </div>
      </header>

      <JourneyNav />
    </>
  );
}
