/**
 * Site-level configuration.
 *
 * Kept beside the rest of the data layer so deployment details are editable
 * without touching the layout, exactly like every other piece of content.
 */

/**
 * Canonical origin.
 *
 * TODO — replace with the real production domain once it exists. Reading
 * from the environment first means the deployed build gets the right value
 * without a code change; the fallback keeps local and preview builds
 * generating absolute URLs that are at least well-formed.
 *
 * Vercel sets NEXT_PUBLIC_VERCEL_PROJECT_PRODUCTION_URL automatically.
 */
const fromEnv =
  // Set this explicitly once a real domain exists — it wins over everything.
  process.env.NEXT_PUBLIC_SITE_URL ??
  // Cloudflare Pages sets CF_PAGES_URL in its build environment. On the
  // production branch that is the project's canonical *.pages.dev address,
  // so the deployed build gets correct absolute URLs with nothing to
  // configure. Reading an unprefixed variable is safe here precisely
  // because every consumer of this module is server-side — layout metadata,
  // the OG image, robots.txt and sitemap.xml, all resolved at build time.
  // It would silently become undefined if a client component imported it.
  process.env.CF_PAGES_URL ??
  (process.env.NEXT_PUBLIC_VERCEL_PROJECT_PRODUCTION_URL
    ? `https://${process.env.NEXT_PUBLIC_VERCEL_PROJECT_PRODUCTION_URL}`
    : undefined);

/**
 * The fallback is a domain that does not exist yet. That is deliberate: it
 * keeps local builds emitting well-formed absolute URLs, and anything
 * deployed picks up its real origin from the environment above instead.
 */
export const siteUrl = fromEnv ?? "https://keathannaidoo.com";

/**
 * THE PRODUCTION BRANCH. Everything else is a preview.
 *
 * Cloudflare Pages builds every branch, not just the production one, and
 * serves each at its own address. That is exactly the staging environment
 * this project wants — somewhere to see a change on the real stack before
 * it is the CV a recruiter opens — but it comes with a trap: a preview is a
 * complete, publicly reachable copy of the site, and by default it is as
 * crawlable as the real one.
 *
 * Left alone that means several near-identical CVs in the index, competing
 * with each other, and a recruiter who can land on a half-finished draft
 * from a search result. Hence `isPreview` below, which is the one fact the
 * robots route and the page metadata both key off.
 */
const PRODUCTION_BRANCH = "master";

/**
 * True on any Cloudflare build that is not the production branch.
 *
 * CF_PAGES_BRANCH is set by the Pages build environment and by nothing
 * else, so a local build and a production build both read as "not a
 * preview" — which is the safe direction to be wrong in: the worst case is
 * that something indexable stays indexable, never that the live CV
 * silently de-indexes itself.
 */
export const isPreview =
  typeof process.env.CF_PAGES_BRANCH === "string" &&
  process.env.CF_PAGES_BRANCH !== "" &&
  process.env.CF_PAGES_BRANCH !== PRODUCTION_BRANCH;

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
