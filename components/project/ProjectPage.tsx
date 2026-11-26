import Link from "next/link";
import type { Project } from "@/lib/data/types";
import { Media } from "@/components/ui/Media";
import { Slideshow } from "@/components/ui/Slideshow";
import { disciplinesById } from "@/lib/data/disciplines";
import { ProjectChrome } from "./ProjectChrome";
import styles from "./project-page.module.css";

/**
 * A project, as a page.
 *
 * This is a SERVER component. Everything that needs the browser — the entry
 * animation, the accent, freezing the environment, moving focus to the h1 —
 * lives in <ProjectChrome>, which wraps it. That split keeps the page's
 * content static HTML, which is the point of the route existing at all: a
 * shareable URL that renders without JavaScript.
 *
 * THE CONDITIONAL RULE, unchanged from the takeover it replaces: every
 * block below is guarded. A project with a title, a summary and one image
 * renders as a clean page with no empty labels, no "N/A" and no stub rows.
 * Nothing here invents a fallback for missing data; it omits the block.
 */
export function ProjectPage({ project }: { project: Project }) {
  const discipline = disciplinesById[project.discipline];

  // Assembled rather than hardcoded, so the details row simply shrinks when
  // a project has less to say about itself.
  const details = [
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

  const entries = project.entries ?? [];

  return (
    <ProjectChrome discipline={project.discipline}>
      <article className={styles.page}>
        <nav className={styles.crumb} aria-label="Breadcrumb">
          <Link href="/" className={styles.crumbBack} data-cursor="BACK">
            <span aria-hidden="true">←</span> Back to projects
          </Link>
          <span className={styles.crumbSep} aria-hidden="true">
            /
          </span>
          <span className={styles.crumbHere}>{discipline.name}</span>
        </nav>

        <header className={styles.head}>
          {project.placeholder && (
            <p className={styles.tag}>Placeholder case study</p>
          )}
          {/* The page's only h1, and the focus target on navigation. */}
          <h1 className={styles.title} tabIndex={-1} data-page-title>
            {project.title}
          </h1>
          <p className={styles.summary}>{project.summary}</p>
        </header>

        {project.media.length > 0 && (
          <Slideshow
            assets={project.media}
            label={project.title}
            priority
            placeholderLabel={`${project.title} — visual pending`}
          />
        )}

        {details.length > 0 && (
          <dl className={styles.details}>
            {details.map((entry) => (
              <div key={entry.key}>
                <dt>{entry.key}</dt>
                <dd>{entry.value}</dd>
              </div>
            ))}
          </dl>
        )}

        {project.caseStudy && project.caseStudy.length > 0 && (
          <div className={styles.study}>
            {project.caseStudy.map((section) => (
              <section key={section.heading} className={styles.row}>
                <h2 className={styles.rowHeading}>{section.heading}</h2>
                <p className={styles.rowBody}>{section.body}</p>
              </section>
            ))}
          </div>
        )}

        {project.outcome && (
          <div className={styles.study}>
            <section className={styles.row}>
              <h2 className={styles.rowHeading}>Outcome</h2>
              <p className={styles.rowBody}>{project.outcome}</p>
            </section>
          </div>
        )}

        {project.technicalDetails && project.technicalDetails.length > 0 && (
          <div className={styles.study}>
            <section className={styles.row}>
              <h2 className={styles.rowHeading}>Technical</h2>
              <ul className={styles.technical}>
                {project.technicalDetails.map((detail) => (
                  <li key={detail}>{detail}</li>
                ))}
              </ul>
            </section>
          </div>
        )}

        {entries.length > 0 && (
          <section className={styles.collection}>
            <h2 className={styles.collectionHeading}>
              {project.entriesLabel ?? "In this collection"}
            </h2>

            <ul className={styles.catalogue}>
              {entries.map((entry) => (
                <li key={entry.id} className={styles.tile}>
                  {entry.media[0] && (
                    <Media
                      asset={entry.media[0]}
                      ratio={entry.media[0].ratio ?? "16 / 9"}
                      sizes="(max-width: 48rem) 100vw, (max-width: 72rem) 50vw, 24rem"
                      placeholderLabel={`${entry.title} — visual pending`}
                      className={styles.tileMedia}
                    />
                  )}
                  <div className={styles.tileBody}>
                    <h3 className={styles.tileTitle}>{entry.title}</h3>
                    <p className={styles.tileSummary}>{entry.summary}</p>
                    {/* Stretched link: the whole tile is clickable, and the
                        heading above stays a heading rather than being
                        swallowed into a control's accessible name. */}
                    <Link
                      href={`/projects/${project.slug}/${entry.id}`}
                      className={styles.tileTrigger}
                      data-cursor="VIEW"
                    >
                      View
                      <span className="sr-only"> {entry.title}</span>
                    </Link>
                  </div>
                </li>
              ))}
            </ul>
          </section>
        )}

        {project.erd && (
          <section className={styles.erd}>
            <h2 className={styles.rowHeading}>Data model</h2>
            {/* Scrolls sideways rather than shrinking: an ERD squeezed to
                phone width is a picture of a schema nobody can read. */}
            <div className={styles.erdScroll}>
              <Media
                asset={project.erd}
                ratio={project.erd.ratio ?? "16 / 9"}
                sizes="(max-width: 72rem) 200vw, 72rem"
                placeholderLabel={`${project.title} — data model pending`}
                className={styles.erdMedia}
              />
            </div>
            {project.erd.caption && (
              <p className={styles.caption}>{project.erd.caption}</p>
            )}
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
      </article>
    </ProjectChrome>
  );
}
