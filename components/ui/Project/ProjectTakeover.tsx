"use client";

import { useEffect, useRef, useState, type RefObject } from "react";
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
 * TWO LEVELS, when the project carries `entries`. ORBITAL is one project
 * made of four subjects; "Identity systems" is one project made of four
 * identities. Both were flattening into a single row of pictures with no
 * indication of which image belonged to what. A project with entries
 * therefore renders a CATALOGUE — a grid of tiles — and opening a tile
 * replaces the content region with that entry alone.
 *
 * The dialog's label does NOT follow the selection: it stays the project
 * title, because the reader is still inside ORBITAL while looking at the
 * reactor. The entry announces itself as a heading within that dialog, and
 * a back control returns to the grid.
 *
 * Accessibility contract:
 *  - `role="dialog"` + `aria-modal`, labelled by the project title.
 *  - The panel itself is focusable (`tabIndex={-1}`) so the trap always has
 *    a known anchor, even after a click on non-interactive content.
 *  - The rest of the page is marked `inert` while it is open.
 *  - Focus moves in on open and returns to the trigger on close.
 *  - Tab is trapped inside; Escape closes. Escape inside an entry goes back
 *    to the catalogue first rather than discarding the whole dialog, which
 *    is what a reader one level deep actually means by it.
 *  - Opening an entry moves focus to its back control and resets the panel's
 *    scroll; returning puts focus back on the tile that was opened.
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
  const content = useRef<HTMLDivElement>(null);
  const scrim = useRef<HTMLDivElement>(null);
  const lenis = useLenis();

  /**
   * Which catalogue entry is open, or null for the catalogue itself.
   *
   * Mirrored into a ref because the Escape handler is installed once, in an
   * effect whose dependencies deliberately exclude this: re-running that
   * effect would stop and restart Lenis and steal focus back to the close
   * button every time the reader opened a tile.
   */
  const [openEntryId, setOpenEntryId] = useState<string | null>(null);
  const openEntryIdRef = useRef<string | null>(null);
  /** The tile to restore focus to when the reader comes back up a level. */
  const lastOpenedId = useRef<string | null>(null);
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
        // One level at a time. A reader inside "The reactor" who presses
        // Escape means "out of the reactor", not "out of ORBITAL".
        if (openEntryIdRef.current !== null) {
          setOpenEntryId(null);
          return;
        }
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

  /**
   * Moving between levels.
   *
   * Going DOWN into an entry: the scroller is reset, so the reader starts at
   * the top of the entry rather than halfway down a page they have not seen,
   * and focus lands on the back control.
   *
   * Coming back UP: the reset still runs, but focusing the tile the reader
   * opened scrolls it into view again straight afterwards — so they are
   * returned to their place in the catalogue rather than to its top. That
   * ordering is the intended behaviour, not an accident of it.
   *
   * The scroller is the SCRIM, not the panel and not the content — see
   * takeover.module.css, where overflow-y lives on the outer layer.
   */
  useEffect(() => {
    // Synced here rather than during render: writing a ref while rendering
    // is a lint error and a real hazard under concurrent rendering. The
    // Escape handler only reads it from an event, which is always after
    // this has run.
    openEntryIdRef.current = openEntryId;

    const node = content.current;
    if (!node) return;

    scrim.current?.scrollTo({ top: 0 });

    if (openEntryId !== null) {
      node.querySelector<HTMLElement>("[data-entry-back]")?.focus();
    } else if (lastOpenedId.current !== null) {
      node
        .querySelector<HTMLElement>(
          `[data-entry-tile="${lastOpenedId.current}"]`,
        )
        ?.focus();
    }
  }, [openEntryId]);

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

  const entries = project.entries ?? [];
  const openEntry =
    openEntryId === null
      ? null
      : (entries.find((entry) => entry.id === openEntryId) ?? null);
  // A collection shows its entries instead of a flat gallery: those assets
  // live on the entries now, and rendering both would print every image
  // twice.
  const showFlatGallery = entries.length === 0 && gallery.length > 0;

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
    <div ref={scrim} className={styles.scrim} onClick={onClose}>
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

        <div ref={content} className={styles.content}>
          {openEntry ? (
            <>
            <nav className={styles.crumb}>
              <button
                type="button"
                className={styles.crumbBack}
                data-entry-back
                data-cursor="BACK"
                onClick={() => setOpenEntryId(null)}
              >
                <span aria-hidden="true">&#8592;</span> Back to {project.title}
              </button>
            </nav>

            <h3 className={styles.entryTitle}>{openEntry.title}</h3>
            <p className={styles.summary}>{openEntry.summary}</p>

            {openEntry.media[0] && (
              <Media
                asset={openEntry.media[0]}
                ratio={openEntry.media[0].ratio ?? "16 / 9"}
                sizes="(max-width: 72rem) 100vw, 72rem"
                placeholderLabel={`${openEntry.title} — visual pending`}
              />
            )}

            {openEntry.body && (
              <section className={styles.section}>
                <p>{openEntry.body}</p>
              </section>
            )}

            {openEntry.details && openEntry.details.length > 0 && (
              <ul className={styles.technical}>
                {openEntry.details.map((detail) => (
                  <li key={detail}>{detail}</li>
                ))}
              </ul>
            )}

            {openEntry.media.length > 1 && (
              <ul className={styles.gallery}>
                {openEntry.media.slice(1).map((asset, i) => (
                  <li key={asset.src || i}>
                    <Media
                      asset={asset}
                      ratio={asset.ratio ?? "4 / 3"}
                      sizes="(max-width: 48rem) 100vw, 36rem"
                      placeholderLabel="Board pending"
                    />
                  </li>
                ))}
              </ul>
            )}
            </>
          ) : (
            <>
            {hero && (
              <div className={styles.heroFigure}>
                <Media
                  asset={hero}
                  ratio={hero.ratio ?? "21 / 9"}
                  sizes="(max-width: 72rem) 100vw, 72rem"
                  placeholderLabel={`${project.title} — visual pending`}
                />
                {hero.caption && (
                  <p className={styles.caption}>{hero.caption}</p>
                )}
              </div>
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

            {/* Boards, not thumbnails.

                This was a `repeat(auto-fit, minmax(18rem, 1fr))` grid, which
                is right for photographs and wrong for everything these
                projects actually have: an architecture diagram three columns
                wide is a grey smear. One per row, full width, with its
                caption under it — so a case study reads top to bottom like a
                readme rather than ending in a contact sheet. */}
            {showFlatGallery && (
              <ul className={styles.boards}>
                {gallery.map((asset, i) => (
                  <li key={asset.src || i}>
                    <Media
                      asset={asset}
                      ratio={asset.ratio ?? "16 / 9"}
                      sizes="(max-width: 72rem) 100vw, 72rem"
                      placeholderLabel="Board pending"
                    />
                    {asset.caption && (
                      <p className={styles.caption}>{asset.caption}</p>
                    )}
                  </li>
                ))}
              </ul>
            )}

            {entries.length > 0 && (
              <section className={styles.collection}>
                <h3>{project.entriesLabel ?? "In this collection"}</h3>

                <ul className={styles.catalogue}>
                  {entries.map((entry) => (
                    <li key={entry.id} className={styles.tile}>
                      {entry.media[0] && (
                        <Media
                          asset={entry.media[0]}
                          ratio={entry.media[0].ratio ?? "16 / 9"}
                          sizes="(max-width: 48rem) 100vw, 22rem"
                          placeholderLabel={`${entry.title} — visual pending`}
                          className={styles.tileMedia}
                        />
                      )}

                      <div className={styles.tileBody}>
                        <h4 className={styles.tileTitle}>{entry.title}</h4>
                        <p className={styles.tileSummary}>{entry.summary}</p>

                        {/* Same stretched-control pattern as ProjectCard, and
                            for the same reason: <button> takes phrasing
                            content only, so the tile cannot BE the button
                            without dissolving its heading. */}
                        <button
                          type="button"
                          className={styles.tileTrigger}
                          data-entry-tile={entry.id}
                          data-cursor="VIEW"
                          onClick={() => {
                            lastOpenedId.current = entry.id;
                            setOpenEntryId(entry.id);
                          }}
                        >
                          View
                          <span className="sr-only"> {entry.title}</span>
                        </button>
                      </div>
                    </li>
                  ))}
                </ul>
              </section>
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
            </>
          )}
        </div>
      </div>
    </div>,
    document.body,
  );
}
