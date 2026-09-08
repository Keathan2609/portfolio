"use client";

import { useRef } from "react";
import { CanvasRoot } from "@/lib/webgl/CanvasRoot";
import { EnvironmentLayer } from "@/lib/webgl/EnvironmentLayer";
import { SkipLink } from "@/components/layout/SkipLink";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { Cursor } from "@/components/ui/Cursor";
import styles from "./app-shell.module.css";

/**
 * The application shell.
 *
 * Owns the element R3F uses as its event source. Hosting events on this DOM
 * container rather than on the canvas is what lets the canvas stay
 * pointer-events:none while individual views can still opt in to
 * interaction — the DOM keeps input, WebGL borrows it by request.
 */
export function AppShell({ children }: { children: React.ReactNode }) {
  const shellRef = useRef<HTMLDivElement>(null);

  return (
    <div ref={shellRef} className={styles.shell} data-app-shell>
      {/* First in the tab order, before anything else. */}
      <SkipLink />

      {/* Fixed, behind everything, mounted once for the whole journey. */}
      <CanvasRoot eventSource={shellRef} />

      {/*
        The persistent environment, ahead of <main> so it paints beneath every
        section's own view. This is what makes the journey continuous rather
        than a sequence of scenes with black between them — see
        lib/webgl/scenes/JourneyEnvironment.tsx.
      */}
      <EnvironmentLayer />

      <Header />

      <main id="main" className={styles.main} tabIndex={-1}>
        {children}
      </main>

      {/*
        Outside <main> deliberately. HTML-AAM only maps <footer> to the
        contentinfo landmark when it is NOT scoped to main/article/section,
        so rendering it as one of the page's children left the page with no
        contentinfo at all.
      */}
      <Footer />

      {/* Desktop only, motion-respecting, purely decorative. */}
      <Cursor />
    </div>
  );
}
