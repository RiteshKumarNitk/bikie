import type { MetadataRoute } from "next";
import { getSiteUrl } from "@/lib/site-url";

export default function robots(): MetadataRoute.Robots {
  const siteUrl = getSiteUrl();

  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: [
        "/dashboard",
        "/admin",
        "/api",
        // Scoped as an exact match + subpath prefix (not the bare "/partner"
        // prefix) so this doesn't also swallow the public "/partners"
        // marketing section (become-a-partner, pricing, etc.) — those are
        // meant to be indexed.
        "/partner$",
        "/partner/",
      ],
    },
    sitemap: `${siteUrl}/sitemap.xml`,
  };
}
