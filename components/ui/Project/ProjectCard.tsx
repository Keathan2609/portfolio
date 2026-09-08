"use client";

import { useCallback, useRef, useState } from "react";
import type { Project } from "@/lib/data/types";
import { Media } from "@/components/ui/Media";
import { ProjectTakeover } from "./ProjectTakeover";
import { cn } from "@/lib/utils/cn";
import styles from "./project.module.css";

/**
 * A project, presented at the weight it deserves.
 *
 * `compact` — visual, title, summary, technologies. A quiet entry.
 * `expanded` — the same card, but it opens a full-screen case study.
 *
 * The presentation is chosen per project in the data layer, not by position
 * on the page, so a small experiment never gets dressed up as a flagship.
 *
 * STRUCTURE NOTE: the expandable variant does NOT wrap the card in a
 * <button>. It used to, which was invalid — <button> takes phrasing content
 * only, and an <h4> plus two <p>s inside one meant the heading vanished from
 * the document outline and the button's accessible name became the entire
 * card read as a single run-on string. The button is now a small control
 * that names itself, stretched across the card with a pseudo-element so the
 * whole surface stays clickable. Same interaction, valid markup, and the
 * heading stays a heading.
 */
export function ProjectCard({
  project,
  index,
}: {
  project: Project;
  index: number;
}) {
  const [open, setOpen] = useState(false);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const expandable = project.presentation === "expanded";

  // Stable identity: ProjectTakeover's setup effect depends on this, and a
  // fresh function each render would tear the dialog's focus state down and
  // rebuild it on any incidental re-render while it is open.
  const close = useCallback(() => setOpen(false), []);

  return (
    <>
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
            <button
              ref={triggerRef}
              type="button"
              className={styles.trigger}
              onClick={() => setOpen(true)}
              data-cursor="VIEW"
              aria-haspopup="dialog"
            >
              Case study
              <span className="sr-only"> for {project.title}</span>
            </button>
          )}
        </div>
      </article>

      {open && (
        <ProjectTakeover
          project={project}
          onClose={close}
          returnFocusTo={triggerRef}
        />
      )}
    </>
  );
}
