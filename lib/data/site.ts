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
  process.env.NEXT_PUBLIC_SITE_URL ??
  (process.env.NEXT_PUBLIC_VERCEL_PROJECT_PRODUCTION_URL
    ? `https://${process.env.NEXT_PUBLIC_VERCEL_PROJECT_PRODUCTION_URL}`
    : undefined);

export const siteUrl = fromEnv ?? "https://keathannaidoo.com";

export const site = {
  url: siteUrl,

  /** Kept short deliberately — long titles are truncated in results. */
  title: "Keathan Naidoo — Creative Developer",

  /**
   * Describes what he does and nothing more. No metrics, no seniority
   * claim, no awards, no keyword stuffing.
   */
  description:
    "Creative developer working across software development, 3D and VFX, AI and data, design, and cybersecurity.",

  locale: "en_ZA",

  /**
   * Open Graph image. `opengraph-image.tsx` in app/ generates this at build
   * time from the site's own type and colour tokens — no separate visual
   * identity, and no throwaway artwork.
   */
  ogImage: {
    width: 1200,
    height: 630,
    alt: "Keathan Naidoo — Creative Developer",
  },
} as const;
