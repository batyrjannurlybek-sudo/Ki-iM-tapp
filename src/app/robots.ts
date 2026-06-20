import type { MetadataRoute } from "next";

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      // Don't index the seller dashboard or admin panel.
      disallow: ["/dashboard", "/admin", "/auth"],
    },
    sitemap: `${siteUrl}/sitemap.xml`,
  };
}
