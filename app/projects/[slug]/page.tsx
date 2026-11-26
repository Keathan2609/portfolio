import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { ProjectPage } from "@/components/project/ProjectPage";
import { projects, getProject } from "@/lib/data/content";
import { isPreview, site } from "@/lib/data/site";

/**
 * A project case study, at its own URL.
 *
 * STATIC EXPORT CONTRACT. The site deploys as `output: "export"` with no
 * server of any kind, so this route must be fully enumerable at build time:
 * `generateStaticParams` lists every page, and `dynamicParams = false` makes
 * anything not in that list a 404 rather than an attempted render. Both are
 * required — a dynamic segment with either one missing is an export error,
 * not a runtime fallback.
 *
 * Only `presentation: "expanded"` projects get a page. A compact project is
 * a card and nothing more, and generating an almost-empty route for one
 * would put a thin page in the sitemap for no reader's benefit.
 */
export const dynamicParams = false;

/** Projects substantial enough to have a page of their own. */
const expanded = projects.filter((p) => p.presentation === "expanded");

export function generateStaticParams() {
  return expanded.map((project) => ({ slug: project.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const project = getProject(slug);
  if (!project) return {};

  const canonical = `/projects/${project.slug}`;

  /* The first real image, if there is one. A pending placeholder has no
     file behind it, so it would resolve to a 404 in a social card — the
     site's generated default is the honest fallback. */
  const hero = project.media.find((asset) => !asset.pending && asset.src);
  const images = hero
    ? [{ url: hero.src, alt: hero.alt || project.title }]
    : undefined;

  return {
    title: project.title,
    description: project.summary,
    alternates: { canonical },
    openGraph: {
      type: "article",
      url: canonical,
      title: project.title,
      description: project.summary,
      locale: site.locale,
      ...(images ? { images } : {}),
    },
    twitter: {
      card: "summary_large_image",
      title: project.title,
      description: project.summary,
      ...(images ? { images: images.map((i) => i.url) } : {}),
    },
    /* Unfinished work stays out of the index. `isPreview` already
       noindexes everything on a preview branch; this adds the same
       treatment to a placeholder case study on production, because a
       format demonstration is not something to be found by search. */
    robots:
      isPreview || project.placeholder
        ? { index: false, follow: false }
        : undefined,
  };
}

export default async function Page({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const project = getProject(slug);

  // Unreachable with dynamicParams:false, but the type says `undefined` is
  // possible and a silent crash on a data edit is worse than a 404.
  if (!project || project.presentation !== "expanded") notFound();

  return <ProjectPage project={project} />;
}
