import { profile, socialLinks } from "@/lib/data/profile";
import styles from "./footer.module.css";

/**
 * FOOTER — the close of the journey.
 *
 * Minimal by instruction and by judgement: the name at scale, the links,
 * the colophon. No sitemap, no newsletter, no repeated navigation. The
 * name appears here and in the hero, and nowhere else at this size.
 */
export function Footer() {
  const year = new Date().getFullYear();

  return (
    <footer id="footer" className={styles.footer}>
      <div className={styles.inner}>
        <p className={styles.name} aria-hidden="true">
          {profile.name}
        </p>

        <div className={styles.row}>
          <p className={styles.colophon}>
            &copy; {year} {profile.name} — I build absolutely anything.
          </p>

          <ul className={styles.links}>
            {socialLinks.map((link) => (
              <li key={link.label}>
                {link.pending ? (
                  <span className={styles.pending}>{link.label}</span>
                ) : (
                  <a
                    className={styles.link}
                    href={link.href}
                    aria-label={link.ariaLabel}
                    target="_blank"
                    rel="noreferrer noopener"
                  >
                    {link.label}
                  </a>
                )}
              </li>
            ))}
          </ul>
        </div>
      </div>
    </footer>
  );
}
