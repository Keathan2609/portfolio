"use client";

import { useScrollToWithFocus } from "@/lib/scroll/useScrollTo";
import styles from "./skip-link.module.css";

/**
 * Skip link.
 *
 * A plain href="#main" would hand the jump to the browser, which fights
 * Lenis for the scroll position. Routing it through Lenis keeps one system
 * in charge, and moving focus explicitly means the keyboard lands where the
 * viewport lands.
 */
export function SkipLink() {
  const scrollToWithFocus = useScrollToWithFocus();

  return (
    <a
      href="#main"
      className={styles.skip}
      onClick={(event) => {
        event.preventDefault();
        scrollToWithFocus("#main");
      }}
    >
      Skip to content
    </a>
  );
}
