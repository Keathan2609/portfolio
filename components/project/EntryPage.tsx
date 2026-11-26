import Link from "next/link";
import type { Project, ProjectEntry } from "@/lib/data/types";
import { Slideshow } from "@/components/ui/Slideshow";
import { ProjectChrome } from "./ProjectChrome";
import styles from "./project-page.module.css";

/**
 * One entry of a collection, as a page.
 *
 * A ProjectEntry is deliberately a subset of Project — a title, a line, its
 * boards, an optional narrative and optional notes — so this page is the
 * same shape as a project page with the blocks that do not apply left out.
 * It carries no details row, no case study and no links, because an entry
 * has none of those: they belong to the project above it, which the
 * breadcrumb leads back to.
 */
export function EntryPage({
  project,
  entry,
}: {
  project: Project;
  entry: ProjectEntry;
}) {
  return (
    <ProjectChrome discipline={project.discipline}>
      <article className={styles.page}>
        <nav className={styles.crumb} aria-label="Breadcrumb">
          <Link href="/" className={styles.crumbBack} data-cursor="BACK">
            <span aria-hidden="true">←</span> Projects
          </Link>
          <span className={styles.crumbSep} aria-hidden="true">
            /
          </span>
          <Link
            href={`/projects/${project.slug}`}
            className={styles.crumbBack}
            data-cursor="BACK"
          >
            {project.title}
          </Link>
          <span className={styles.crumbSep} aria-hidden="true">
            /
          </span>
          <span className={styles.crumbHere}>{entry.title}</span>
        </nav>

        <header className={styles.head}>
          <h1 className={styles.title} tabIndex={-1} data-page-title>
            {entry.title}
          </h1>
          <p className={styles.summary}>{entry.summary}</p>
        </header>

        {entry.media.length > 0 && (
          <Slideshow
            assets={entry.media}
            label={entry.title}
            priority
            placeholderLabel={`${entry.title} — visual pending`}
          />
        )}

        {entry.body && (
          <div className={styles.entryBody}>
            <p>{entry.body}</p>
          </div>
        )}

        {entry.details && entry.details.length > 0 && (
          <ul className={styles.technical}>
            {entry.details.map((detail) => (
              <li key={detail}>{detail}</li>
            ))}
          </ul>
        )}
      </article>
    </ProjectChrome>
  );
}
