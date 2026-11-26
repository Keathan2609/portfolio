import type { MetadataRoute } from "next";
import { projects } from "@/lib/data/content";
import { siteUrl } from "@/lib/data/site";

/**
 * The journey, plus a page per case study.
 *
 * This file used to say "one route, because the portfolio is one continuous
 * journey", and that stopped being true when case studies moved out of a
 * modal and onto their own URLs. The journey is still one page; the work on
 * it is now independently addressable.
 *
 * WHAT IS DELIBERATELY ABSENT. A placeholder project is listed nowhere: its
 * page carries `robots: noindex` (see app/projects/[slug]/page.tsx), and
 * asking a crawler to visit a URL that then tells it to go away wastes a
 * crawl and says two different things about the same page. A sitemap is a
 * list of pages worth indexing, not an inventory of files that exist.
 *
 * Compact projects have no page at all, so there is nothing to list.
 */
/** See the note in app/robots.ts — required by the static export build. */
export const dynamic = "force-static";

export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date();

  const indexable = projects.filter(
    (project) => project.presentation === "expanded" && !project.placeholder,
  );

  const projectPages: MetadataRoute.Sitemap = indexable.map((project) => ({
    url: `${siteUrl}/projects/${project.slug}`,
    lastModified: now,
    changeFrequency: "monthly",
    priority: 0.8,
  }));

  const entryPages: MetadataRoute.Sitemap = indexable.flatMap((project) =>
    (project.entries ?? []).map((entry) => ({
      url: `${siteUrl}/projects/${project.slug}/${entry.id}`,
      lastModified: now,
      changeFrequency: "monthly" as const,
      // Below its parent: an entry is a part of a case study rather than a
      // destination of its own.
      priority: 0.6,
    })),
  );

  return [
    {
      url: siteUrl,
      lastModified: now,
      changeFrequency: "monthly",
      priority: 1,
    },
    ...projectPages,
    ...entryPages,
  ];
}
