"use client";

import Link from "next/link";
import type { Project } from "@/lib/data/types";
import { Media } from "@/components/ui/Media";
import { disciplinesById } from "@/lib/data/disciplines";
import { rememberReturn } from "@/lib/scroll/return-anchor";
import { cn } from "@/lib/utils/cn";
import styles from "./project.module.css";

/**
 * A project, presented at the weight it deserves.
 *
 * `compact` — visual, title, summary, technologies. A quiet entry.
 * `expanded` — the same card, linking to the project's own page.
 *
 * The presentation is chosen per project in the data layer, not by position
 * on the page, so a small experiment never gets dressed up as a flagship.
 *
 * THIS USED TO OPEN A MODAL. It now navigates, which is why the control is
 * a <Link> and not a <button>: a case study at its own URL can be shared,
 * opened in a new tab, found by search and reached with the back button,
 * and none of those are things a portalled dialog can offer. Middle-click
 * and ⌘-click work again for free, which they never did before.
 *
 * STRUCTURE NOTE, unchanged and still load-bearing: the card is NOT wrapped
 * in the link. Wrapping it would fold the <h4> and two <p>s into the link's
 * accessible name — one run-on string — and take the heading out of the
 * document outline. Instead a small control names itself and is stretched
 * across the card with a pseudo-element, so the whole surface is clickable,
 * the heading stays a heading, and the copy stays selectable.
 */
export function ProjectCard({
  project,
  index,
}: {
  project: Project;
  index: number;
}) {
  const expandable = project.presentation === "expanded";

  return (
    <article
      className={cn(
        styles.card,
        expandable ? styles.expandable : styles.compact,
      )}
    >
      {project.media[0] && (
        <Media
          asset={project.media[0]}
          ratio={project.media[0].ratio ?? (expandable ? "16 / 10" : "4 / 3")}
          sizes="(max-width: 48rem) 100vw, (max-width: 80rem) 50vw, 33vw"
          placeholderLabel={`${project.title} — visual pending`}
          className={styles.media}
        />
      )}

      <div className={styles.body}>
        <div className={styles.headRow}>
          <span className={styles.index} aria-hidden="true">
            {String(index + 1).padStart(2, "0")}
          </span>
          {project.placeholder && (
            <span className={styles.tag}>Placeholder</span>
          )}
        </div>

        <h4 className={styles.title}>{project.title}</h4>
        <p className={styles.summary}>{project.summary}</p>

        {project.stack.length > 0 && (
          <p className={styles.stack}>
            {project.stack.map((tech, i) => (
              <span key={tech}>
                {i > 0 && <span aria-hidden="true"> · </span>}
                {tech}
              </span>
            ))}
          </p>
        )}

        {expandable && (
          <Link
            href={`/projects/${project.slug}`}
            className={styles.trigger}
            data-cursor="VIEW"
            /* Recorded on the way out so Back can return to this discipline
               rather than the top of a 28,000px document. See
               lib/scroll/return-anchor.ts for why the browser's own
               restoration cannot do this under Lenis. */
            onClick={() =>
              rememberReturn({
                slug: project.slug,
                section: disciplinesById[project.discipline].slug,
              })
            }
          >
            Case study
            <span className="sr-only"> for {project.title}</span>
          </Link>
        )}
      </div>
    </article>
  );
}
