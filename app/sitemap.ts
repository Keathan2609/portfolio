import type { MetadataRoute } from "next";
import { siteUrl } from "@/lib/data/site";

/**
 * One route, because the portfolio is one continuous journey. Case-study
 * routes would be added here if projects ever get their own URLs.
 */
export default function sitemap(): MetadataRoute.Sitemap {
  return [
    {
      url: siteUrl,
      lastModified: new Date(),
      changeFrequency: "monthly",
      priority: 1,
    },
  ];
}
