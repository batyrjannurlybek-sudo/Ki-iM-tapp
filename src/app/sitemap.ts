import type { MetadataRoute } from "next";
import { searchProducts } from "@/services/products";
import { getAllStores } from "@/services/stores";

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";

export const revalidate = 3600; // rebuild the sitemap hourly

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const staticRoutes: MetadataRoute.Sitemap = [
    { url: `${siteUrl}/`, changeFrequency: "daily", priority: 1 },
    { url: `${siteUrl}/search`, changeFrequency: "daily", priority: 0.8 },
    { url: `${siteUrl}/stores`, changeFrequency: "weekly", priority: 0.6 },
  ];

  try {
    const [products, stores] = await Promise.all([
      searchProducts({ limit: 1000 }),
      getAllStores(),
    ]);
    const productRoutes: MetadataRoute.Sitemap = products.map((p) => ({
      url: `${siteUrl}/product/${p.id}`,
      lastModified: p.updated_at,
      changeFrequency: "weekly",
      priority: 0.7,
    }));
    const storeRoutes: MetadataRoute.Sitemap = stores.map((s) => ({
      url: `${siteUrl}/store/${s.slug}`,
      lastModified: s.updated_at,
      changeFrequency: "weekly",
      priority: 0.5,
    }));
    return [...staticRoutes, ...productRoutes, ...storeRoutes];
  } catch {
    // DB unavailable — still return static routes so the sitemap never 500s.
    return staticRoutes;
  }
}
