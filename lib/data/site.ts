/**
 * Site-level configuration.
 *
 * Kept beside the rest of the data layer so deployment details are editable
 * without touching the layout, exactly like every other piece of content.
 */

/**
 * THE PRODUCTION BRANCH. Everything else Cloudflare builds is a preview.
 *
 * CF_PAGES_BRANCH is set by the Pages build environment and by nothing
 * else, so a local build reads as "not a preview" — the safe direction to
 * be wrong in, since the worst case is that something indexable stays
 * indexable, never that the live CV silently de-indexes itself.
 */
const PRODUCTION_BRANCH = "master";

const isPreviewBuild =
  typeof process.env.CF_PAGES_BRANCH === "string" &&
  process.env.CF_PAGES_BRANCH !== "" &&
  process.env.CF_PAGES_BRANCH !== PRODUCTION_BRANCH;

/**
 * THE PRODUCTION ORIGIN, as a fact about the site rather than as config.
 *
 * This lives in the repository on purpose. It is the address the CV is
 * published at, every absolute URL on the page is derived from it, and a
 * value that important should not sit in a dashboard field where it can
 * drift without anyone noticing.
 *
 * Replace it when a custom domain exists — or override it per environment
 * with NEXT_PUBLIC_SITE_URL, which still wins over everything below.
 */
const PRODUCTION_URL = "https://keathan-naidoo.pages.dev";

/**
 * Canonical origin.
 *
 * CF_PAGES_URL IS NOT THE SITE'S ADDRESS, and an earlier version of this
 * file said it was. Cloudflare sets it to the UNIQUE DEPLOYMENT URL —
 * https://1f4a85ad.keathan-naidoo.pages.dev — not the project alias, and
 * that hash changes on every single build.
 *
 * The first production deploy proved it: the canonical link, the og:url,
 * the og:image and the one entry in sitemap.xml all pointed at a hostname
 * that would be replaced by the next push. A canonical URL that moves every
 * deploy is worse than no canonical at all, because each build asks the
 * index to treat the CV as a different page.
 *
 * So the production branch takes the stable address above, and CF_PAGES_URL
 * is used only where it is genuinely the right answer: a preview, which
 * really does live at its own per-deployment hostname and is noindexed
 * anyway.
 */
const fromEnv =
  // An explicit override wins over everything. This is where a custom
  // domain goes, per environment, without touching the code.
  process.env.NEXT_PUBLIC_SITE_URL ??
  // A preview is genuinely addressed by its deployment URL.
  (isPreviewBuild ? process.env.CF_PAGES_URL : undefined) ??
  // Any other Cloudflare build is production, and has a fixed address.
  (process.env.CF_PAGES === "1" ? PRODUCTION_URL : undefined) ??
  (process.env.NEXT_PUBLIC_VERCEL_PROJECT_PRODUCTION_URL
    ? `https://${process.env.NEXT_PUBLIC_VERCEL_PROJECT_PRODUCTION_URL}`
    : undefined);

/**
 * The fallback is only ever reached by a local build, where no absolute URL
 * is published anywhere. It keeps `new URL()` in the layout from throwing.
 */
export const siteUrl = fromEnv ?? PRODUCTION_URL;

/**
 * True on any Cloudflare build that is not the production branch.
 *
 * CF_PAGES_BRANCH is set by the Pages build environment and by nothing
 * else, so a local build and a production build both read as "not a
 * preview" — which is the safe direction to be wrong in: the worst case is
 * that something indexable stays indexable, never that the live CV
 * silently de-indexes itself.
 */
export const isPreview = isPreviewBuild;

export const site = {
  url: siteUrl,

  /** Kept short deliberately — long titles are truncated in results. */
  title: "Keathan Naidoo — Software Engineer",

  /**
   * Describes what he does and nothing more. No metrics, no seniority
   * claim, no awards, no keyword stuffing.
   */
  description:
    "Software engineer working across full-stack and edge systems, applied AI and data, security engineering, 3D and real-time, and design.",

  locale: "en_ZA",

  /**
   * Open Graph image. `opengraph-image.tsx` in app/ generates this at build
   * time from the site's own type and colour tokens — no separate visual
   * identity, and no throwaway artwork.
   */
  ogImage: {
    width: 1200,
    height: 630,
    alt: "Keathan Naidoo — Software Engineer",
  },
} as const;
