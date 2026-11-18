"use client";

import { Stage } from "@/components/layout/Stage";
import { RevealText } from "@/components/ui/Reveal";
import { profile, socialLinks } from "@/lib/data/profile";
import styles from "./hire.module.css";

/**
 * HIRE ME — the conclusion of the journey.
 *
 * No form, no "get in touch" card, no calendar embed. The single most
 * important thing on this section is that a recruiter can copy an email
 * address in one second, so the address is a plain, large, real mailto link
 * — not obfuscated, not revealed by JavaScript, not behind a click.
 *
 * Profile links are typographic. Those whose real URLs have not been
 * supplied are marked `pending` in the data and rendered as inert text
 * rather than as links that go nowhere — a dead link is worse than an
 * honest "coming".
 */
export function HireMe() {
  return (
    <Stage id="hire" full ariaLabelledBy="hire-title" className={styles.stage}>
      <div className={styles.hire}>
        <div className={styles.statement}>
          <RevealText
            id="hire-title"
            as="h2"
            text="Have an idea?"
            className={styles.line}
          />
          <RevealText
            as="p"
            text="Let's build it."
            delay={0.12}
            className={`${styles.line} ${styles.lineStrong}`}
          />
        </div>

        <div className={styles.details}>
          <div className={styles.contact}>
            <p className={styles.name}>{profile.name}</p>
            <a
              className={styles.email}
              href={`mailto:${profile.email}`}
              data-cursor="OPEN"
            >
              {profile.email}
            </a>
            {/* `profile.location` existed in the data model and was rendered
                nowhere, which made this the one section that answers "can we
                hire him" without answering "where is he". A recruiter asks
                that second. */}
            {profile.location && (
              <p className={styles.location}>{profile.location}</p>
            )}
            {profile.availability && (
              <p className={styles.availability}>{profile.availability}</p>
            )}
          </div>

          <nav aria-label="Professional profiles">
            <ul className={styles.links}>
              {socialLinks.map((link) => (
                <li key={link.label}>
                  {link.pending ? (
                    <span className={styles.linkPending}>
                      {link.label}
                      <span className={styles.pendingTag}>Link pending</span>
                    </span>
                  ) : (
                    <a
                      className={styles.link}
                      href={link.href}
                      aria-label={link.ariaLabel}
                      target="_blank"
                      rel="noreferrer noopener"
                      data-cursor="OPEN"
                    >
                      {link.label}
                    </a>
                  )}
                </li>
              ))}
            </ul>
          </nav>
        </div>
      </div>
    </Stage>
  );
}
