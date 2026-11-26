import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { EntryPage } from "@/components/project/EntryPage";
import { projects, getProject } from "@/lib/data/content";
import { isPreview, site } from "@/lib/data/site";

/**
 * One entry of a collection project, at its own URL.
 *
 * Two dynamic segments, both enumerated. Next runs a child
 * `generateStaticParams` once per parent param set, but returning the full
 * `{ slug, entry }` pairs from here is equivalent and reads in one piece —
 * there is no parent data to thread through, just a flat list of what
 * exists.
 */
export const dynamicParams = false;

export function generateStaticParams() {
  return projects
    .filter((p) => p.presentation === "expanded" && p.entries?.length)
    .flatMap((project) =>
      (project.entries ?? []).map((entry) => ({
        slug: project.slug,
        entry: entry.id,
      })),
    );
}

function find(slug: string, entryId: string) {
  const project = getProject(slug);
  if (!project || project.presentation !== "expanded") return null;
  const entry = project.entries?.find((e) => e.id === entryId);
  if (!entry) return null;
  return { project, entry };
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string; entry: string }>;
}): Promise<Metadata> {
  const { slug, entry: entryId } = await params;
  const found = find(slug, entryId);
  if (!found) return {};
  const { project, entry } = found;

  const canonical = `/projects/${project.slug}/${entry.id}`;
  const hero = entry.media.find((asset) => !asset.pending && asset.src);
  const images = hero
    ? [{ url: hero.src, alt: hero.alt || entry.title }]
    : undefined;

  /* Titled with its parent, because "Ember" alone says nothing in a search
     result or a shared link — "Ember — Identity systems" says what it is
     part of. The layout's template then appends the name. */
  const title = `${entry.title} — ${project.title}`;

  return {
    title,
    description: entry.summary,
    alternates: { canonical },
    openGraph: {
      type: "article",
      url: canonical,
      title,
      description: entry.summary,
      locale: site.locale,
      ...(images ? { images } : {}),
    },
    twitter: {
      card: "summary_large_image",
      title,
      description: entry.summary,
      ...(images ? { images: images.map((i) => i.url) } : {}),
    },
    // An entry inherits its project's indexability: an entry of a
    // placeholder case study is placeholder work too.
    robots:
      isPreview || project.placeholder
        ? { index: false, follow: false }
        : undefined,
  };
}

export default async function Page({
  params,
}: {
  params: Promise<{ slug: string; entry: string }>;
}) {
  const { slug, entry: entryId } = await params;
  const found = find(slug, entryId);
  if (!found) notFound();

  return <EntryPage project={found.project} entry={found.entry} />;
}
