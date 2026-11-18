"use client";

import { Stage } from "@/components/layout/Stage";
import { RevealText } from "@/components/ui/Reveal";
import { Eyebrow } from "@/components/ui/Eyebrow";
import {
  certifications,
  experience,
  languages,
  professionalDevelopment,
  timeline,
  training,
} from "@/lib/data/content";
import { disciplinesById } from "@/lib/data/disciplines";
import { profile } from "@/lib/data/profile";
import styles from "./cv.module.css";

/**
 * CV / PROFESSIONAL PROFILE
 *
 * Lives inside the site. There is no PDF and no download button — the CV is
 * a section of the portfolio, not an attachment to it.
 *
 * There is deliberately NO education section: Keathan does not have a
 * degree, and a heading with nothing honest under it would imply one.
 *
 * Professional development is the only place levels are stated, and they
 * are the four supplied. The bar is a relative measure with no number
 * attached, because a percentage would be a fabricated precision.
 */
export function CurriculumVitae() {
  return (
    <Stage id="cv" ariaLabelledBy="cv-title">
      <div className={styles.head}>
        <Eyebrow label="Record" />
        <RevealText
          id="cv-title"
          as="h2"
          text="Professional profile"
          className={styles.title}
        />
      </div>

      <div className={styles.grid}>
        {/* ---------------------------------------------------- profile */}
        <section className={styles.block}>
          <h3 className={styles.blockTitle}>Profile</h3>
          <p className={styles.summary}>{profile.summary}</p>
        </section>

        {/* ------------------------------------- professional development */}
        <section className={styles.block}>
          <h3 className={styles.blockTitle}>Professional development</h3>
          <ul className={styles.levels}>
            {professionalDevelopment.map((entry) => (
              <li
                key={entry.discipline}
                style={
                  {
                    "--c-accent": `var(${
                      disciplinesById[entry.discipline].accentVar
                    })`,
                  } as React.CSSProperties
                }
              >
                <div className={styles.levelRow}>
                  <span className={styles.levelLabel}>{entry.label}</span>
                  <span className={styles.levelValue}>{entry.level}</span>
                </div>
                <div className={styles.meter} aria-hidden="true">
                  <span style={{ width: `${entry.weight * 100}%` }} />
                </div>
                <p className={styles.levelNote}>{entry.note}</p>
              </li>
            ))}
          </ul>
        </section>

        {/* ------------------------------------------------- experience */}
        <section className={styles.block}>
          <h3 className={styles.blockTitle}>Experience</h3>
          <ul className={styles.entries}>
            {experience.map((entry) => (
              <li key={entry.id} className={styles.entry}>
                <div className={styles.entryHead}>
                  <h4>{entry.role}</h4>
                  {entry.placeholder && (
                    <span className={styles.tag}>Placeholder</span>
                  )}
                </div>
                {/* An absent organisation or period renders as nothing at
                    all — not as an empty string beside a stranded separator.
                    The data layer's promise is that omitting a field removes
                    it from the page; the separator has to be conditional for
                    that to be true. */}
                {(entry.organisation || entry.period) && (
                  <p className={styles.entryMeta}>
                    {[entry.organisation, entry.period]
                      .filter(Boolean)
                      .join(" · ")}
                  </p>
                )}
                {entry.summary && (
                  <p className={styles.entryBody}>{entry.summary}</p>
                )}
                {entry.highlights.length > 0 && (
                  <ul className={styles.highlights}>
                    {entry.highlights.map((highlight) => (
                      <li key={highlight}>{highlight}</li>
                    ))}
                  </ul>
                )}
              </li>
            ))}
          </ul>
        </section>

        {/* ---------------------------------------------- certifications */}
        <section className={styles.block}>
          <h3 className={styles.blockTitle}>Certifications</h3>
          <ul className={styles.entries}>
            {certifications.map((entry) => (
              <li key={entry.id} className={styles.entry}>
                <div className={styles.entryHead}>
                  <h4>{entry.name}</h4>
                  {entry.placeholder && (
                    <span className={styles.tag}>Placeholder</span>
                  )}
                </div>
                {/* Same rule as experience: no issue date means the issuer
                    stands alone, rather than trailing a separator into
                    nothing. */}
                {(entry.issuer || entry.issued) && (
                  <p className={styles.entryMeta}>
                    {[entry.issuer, entry.issued].filter(Boolean).join(" · ")}
                  </p>
                )}
              </li>
            ))}
          </ul>
        </section>

        {/* -------------------------------------------------- languages */}
        <section className={styles.block}>
          <h3 className={styles.blockTitle}>Languages</h3>
          <ul className={styles.entries}>
            {languages.map((language) => (
              <li key={language.name} className={styles.entry}>
                <div className={styles.entryHead}>
                  <h4>{language.name}</h4>
                </div>
                <p className={styles.entryMeta}>{language.level}</p>
              </li>
            ))}
          </ul>
        </section>

        {/* --------------------------------------------------- training */}
        <section className={styles.block}>
          <h3 className={styles.blockTitle}>Training</h3>
          <ul className={styles.entries}>
            {training.map((entry) => (
              <li key={entry.id} className={styles.entry}>
                <div className={styles.entryHead}>
                  <h4>{entry.name}</h4>
                  {entry.inProgress && (
                    <span className={styles.tagLive}>In progress</span>
                  )}
                </div>
                <p className={styles.entryMeta}>
                  {entry.provider}
                  {entry.period ? ` · ${entry.period}` : ""}
                </p>
              </li>
            ))}
          </ul>
        </section>
      </div>

      {/* ---------------------------------------------------- timeline */}
      <section className={styles.timelineBlock}>
        <h3 className={styles.blockTitle}>Timeline</h3>
        <ol className={styles.timeline}>
          {timeline.map((entry) => (
            <li
              key={entry.id}
              style={
                entry.discipline
                  ? ({
                      "--c-accent": `var(${
                        disciplinesById[entry.discipline].accentVar
                      })`,
                    } as React.CSSProperties)
                  : undefined
              }
            >
              <span className={styles.timelineDot} aria-hidden="true" />
              {entry.period && (
                <p className={styles.timelinePeriod}>{entry.period}</p>
              )}
              <h4 className={styles.timelineTitle}>{entry.title}</h4>
              <p className={styles.timelineDetail}>{entry.detail}</p>
            </li>
          ))}
        </ol>
      </section>
    </Stage>
  );
}
