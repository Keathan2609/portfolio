"use client";

import { useEffect, useRef, type RefObject } from "react";
import { createPortal } from "react-dom";
import { useLenis } from "lenis/react";
import type { Project } from "@/lib/data/types";
import { Media } from "@/components/ui/Media";
import { useReducedMotion } from "@/lib/animation/MotionProvider";
import { useIsHydrated } from "@/lib/hooks/useIsHydrated";
import { gsap, useGSAP } from "@/lib/animation/register";
import { DURATION, EASE } from "@/lib/animation/easings";
import styles from "./takeover.module.css";

/**
 * Full-screen case study.
 *
 * A takeover rather than a route: the journey is one continuous page, and
 * navigating away to read about a project would break that. It behaves as a
 * modal dialog because that is what it is.
 *
 * EVERY block below is conditional. A project with only a title, a summary
 * and one image renders as a clean, complete case study — no empty "Role"
 * label, no "Outcome: N/A", no stub rows. Fields appear when they exist and
 * are absent otherwise.
 *
 * RENDERED THROUGH A PORTAL, and that is not optional. The card that opens
 * it lives inside the discipline rail's horizontal track, which GSAP
 * translates and which carries `will-change: transform` and an
 * `overflow: hidden` parent. A `position: fixed` descendant of a
 * transformed ancestor is positioned against THAT ancestor's box rather
 * than the viewport — so on desktop with full motion the dialog opened
 * somewhere inside a track several thousand pixels wide, and was then
 * clipped out of sight. Portalling to <body> takes it out of that
 * containing block entirely.
 *
 * Accessibility contract:
 *  - `role="dialog"` + `aria-modal`, labelled by the project title.
 *  - The panel itself is focusable (`tabIndex={-1}`) so the trap always has
 *    a known anchor, even after a click on non-interactive content.
 *  - The rest of the page is marked `inert` while it is open.
 *  - Focus moves in on open and returns to the trigger on close.
 *  - Tab is trapped inside; Escape closes.
 *  - Lenis is stopped while it is open, so the page behind cannot scroll —
 *    and started again on close, even if the component unmounts abruptly.
 */
export function ProjectTakeover({
  project,
  onClose,
  returnFocusTo,
}: {
  project: Project;
  onClose: () => void;
  /**
   * The control that opened this dialog. Passed explicitly rather than
   * inferred from document.activeElement: a pointer click does not always
   * leave the trigger focused, and restoring focus to <body> drops the
   * keyboard user at the top of a very long page.
   */
  returnFocusTo?: RefObject<HTMLElement | null>;
}) {
  const panel = useRef<HTMLDivElement>(null);
  const lenis = useLenis();
  const reduced = useReducedMotion();
  const returnFocus = useRef<HTMLElement | null>(null);

  // Portals need document.body, which does not exist during SSR. The
  // existing hydration gate is used rather than a setState-in-effect.
  const mounted = useIsHydrated();

  useEffect(() => {
    returnFocus.current =
      returnFocusTo?.current ?? (document.activeElement as HTMLElement | null);

    lenis?.stop();
    // Belt and braces: if Lenis is absent (quality NONE, or it failed to
    // initialise) the native scroll still has to be locked.
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    const node = panel.current;
    node?.querySelector<HTMLElement>("[data-autofocus]")?.focus();

    // Everything behind the dialog stops being reachable — by pointer, by
    // Tab, and by assistive tech. aria-modal alone is honoured unevenly.
    const shell = document.querySelector<HTMLElement>("[data-app-shell]");
    shell?.setAttribute("inert", "");

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.preventDefault();
        onClose();
        return;
      }

      if (event.key !== "Tab" || !node) return;

      const focusable = node.querySelectorAll<HTMLElement>(
        'a[href], button:not([disabled]), [tabindex]:not([tabindex="-1"])',
      );
      if (focusable.length === 0) return;

      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      const active = document.activeElement;

      // Clicking non-interactive content inside the panel moves focus to
      // <body>, which matched neither edge and let Tab walk out to the skip
      // link. Anything outside the panel is pulled back in.
      if (!node.contains(active)) {
        event.preventDefault();
        (event.shiftKey ? last : first).focus();
        return;
      }

      if (event.shiftKey && active === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && active === last) {
        event.preventDefault();
        first.focus();
      }
    };

    document.addEventListener("keydown", onKeyDown);

    return () => {
      document.removeEventListener("keydown", onKeyDown);
      document.body.style.overflow = previousOverflow;
      shell?.removeAttribute("inert");
      lenis?.start();
      returnFocus.current?.focus?.();
    };
  }, [lenis, onClose, returnFocusTo]);

  useGSAP(
    () => {
      if (reduced) return;
      gsap.from(panel.current, {
        yPercent: 4,
        opacity: 0,
        duration: DURATION.slow,
        ease: EASE.out,
      });
    },
    { dependencies: [reduced], scope: panel },
  );

  if (!mounted) return null;

  const titleId = `takeover-${project.slug}`;
  const [hero, ...gallery] = project.media;

  // Assembled rather than hardcoded, so the metadata row simply shrinks
  // when a project has less to say about itself.
  const meta = [
    project.role && { key: "Role", value: project.role },
    project.stack.length > 0 && {
      key: "Stack",
      value: project.stack.join(" · "),
    },
    project.year && { key: "Year", value: project.year },
  ].filter(Boolean) as Array<{ key: string; value: string }>;

  const links = [
    project.liveUrl && { label: "View live", href: project.liveUrl },
    project.repositoryUrl && {
      label: "Repository",
      href: project.repositoryUrl,
    },
    ...(project.links ?? []),
  ].filter(Boolean) as Array<{ label: string; href: string }>;

  return createPortal(
    <div className={styles.scrim} onClick={onClose}>
      <div
        ref={panel}
        className={styles.panel}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        tabIndex={-1}
        onClick={(event) => event.stopPropagation()}
      >
        <header className={styles.header}>
          <div>
            {project.placeholder && (
              <p className={styles.tag}>Placeholder case study</p>
            )}
            <h2 id={titleId} className={styles.title}>
              {project.title}
            </h2>
          </div>

          <button
            type="button"
            className={styles.close}
            onClick={onClose}
            data-autofocus
            data-cursor="CLOSE"
          >
            <span aria-hidden="true">Close</span>
            <span className="sr-only">Close case study</span>
          </button>
        </header>

        <div className={styles.content}>
          {hero && (
            <Media
              asset={hero}
              ratio={hero.ratio ?? "21 / 9"}
              sizes="(max-width: 72rem) 100vw, 72rem"
              placeholderLabel={`${project.title} — visual pending`}
            />
          )}

          {meta.length > 0 && (
            <dl className={styles.meta}>
              {meta.map((entry) => (
                <div key={entry.key}>
                  <dt>{entry.key}</dt>
                  <dd>{entry.value}</dd>
                </div>
              ))}
            </dl>
          )}

          <p className={styles.summary}>{project.summary}</p>

          {project.caseStudy?.map((section) => (
            <section key={section.heading} className={styles.section}>
              <h3>{section.heading}</h3>
              <p>{section.body}</p>
            </section>
          ))}

          {project.outcome && (
            <section className={styles.section}>
              <h3>Outcome</h3>
              <p>{project.outcome}</p>
            </section>
          )}

          {project.technicalDetails && project.technicalDetails.length > 0 && (
            <section className={styles.section}>
              <h3>Technical</h3>
              <ul className={styles.technical}>
                {project.technicalDetails.map((detail) => (
                  <li key={detail}>{detail}</li>
                ))}
              </ul>
            </section>
          )}

          {gallery.length > 0 && (
            <ul className={styles.gallery}>
              {gallery.map((asset, i) => (
                <li key={asset.src || i}>
                  <Media
                    asset={asset}
                    ratio={asset.ratio ?? "4 / 3"}
                    sizes="(max-width: 48rem) 100vw, 36rem"
                    placeholderLabel="Gallery visual pending"
                  />
                </li>
              ))}
            </ul>
          )}

          {links.length > 0 && (
            <ul className={styles.links}>
              {links.map((link) => (
                <li key={link.href}>
                  <a
                    href={link.href}
                    target="_blank"
                    rel="noreferrer noopener"
                    data-cursor="OPEN"
                  >
                    {link.label}
                  </a>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>,
    document.body,
  );
}
