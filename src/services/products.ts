import { cache } from "react";
import { createClient } from "@/lib/supabase/server";
import type { Category, Product, ProductFilters, ProductWithStore } from "@/types";

/**
 * Core product search. Delegates to the `search_products` RPC so the ranking
 * logic lives in one place and can be swapped for Meilisearch later.
 */
export async function searchProducts(filters: ProductFilters = {}): Promise<Product[]> {
  const supabase = createClient();
  const { data, error } = await supabase.rpc("search_products", {
    q: filters.q ?? null,
    p_category: filters.category ?? null,
    p_gender: filters.gender ?? null,
    p_store: filters.store ?? null,
    p_size: filters.size ?? null,
    p_min_price: filters.minPrice ?? null,
    p_max_price: filters.maxPrice ?? null,
    p_limit: filters.limit ?? 24,
    p_offset: filters.offset ?? 0,
  });
  if (error) throw error;
  return (data ?? []) as Product[];
}

/** Log a search for trending/analytics. Fire-and-forget; never blocks the UI. */
export async function logSearch(query: string, results: number) {
  if (!query.trim()) return;
  const supabase = createClient();
  await supabase.from("search_events").insert({ query: query.trim(), results });
}

export async function getNewArrivals(limit = 12): Promise<ProductWithStore[]> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("products_with_media")
    .select("*")
    .eq("status", "published")
    .order("created_at", { ascending: false })
    .limit(limit);
  if (error) throw error;
  return (data ?? []) as ProductWithStore[];
}

// Wrapped in React cache so generateMetadata + the page share one DB query.
export const getProductById = cache(
  async (id: string): Promise<ProductWithStore | null> => {
    const supabase = createClient();
    const { data, error } = await supabase
      .from("products_with_media")
      .select("*")
      .eq("id", id)
      .maybeSingle();
    if (error) throw error;
    return (data as ProductWithStore) ?? null;
  }
);

export async function getCategories(): Promise<Category[]> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("categories")
    .select("*")
    .order("sort_order");
  if (error) throw error;
  return (data ?? []) as Category[];
}

/** Most frequent recent search terms — powers "Trending searches" on the home page. */
export async function getTrendingSearches(limit = 8): Promise<string[]> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("search_events")
    .select("query")
    .order("created_at", { ascending: false })
    .limit(500);
  if (error || !data) return [];
  const counts = new Map<string, number>();
  for (const row of data as { query: string }[]) {
    const q = row.query.toLowerCase();
    counts.set(q, (counts.get(q) ?? 0) + 1);
  }
  return [...counts.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, limit)
    .map(([q]) => q);
}
