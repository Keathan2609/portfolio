import type { MetadataRoute } from "next";
import { isPreview, siteUrl } from "@/lib/data/site";

/**
 * Required by `output: "export"`, which the Cloudflare Pages build uses.
 *
 * Next treats a metadata route as a route handler, and a route handler is
 * dynamic until it says otherwise — so an export build refuses to emit it
 * rather than quietly shipping a file that can never update. This function
 * reads one build-time constant and nothing request-shaped, so declaring it
 * static is a statement of fact, not a workaround. Harmless in server mode,
 * where the output was already static.
 */
export const dynamic = "force-static";

export default function robots(): MetadataRoute.Robots {
  /* A preview is a full, publicly reachable copy of the CV. It must never
     be crawled, or the staging draft ends up in the index beside the live
     one — and no sitemap is offered either, since inviting a crawler to a
     site it is told not to read is a mixed signal at best. */
  if (isPreview) {
    return { rules: { userAgent: "*", disallow: "/" } };
  }

  return {
    rules: { userAgent: "*", allow: "/" },
    sitemap: `${siteUrl}/sitemap.xml`,
  };
}
