import { cache } from "react";
import { createClient } from "@/lib/supabase/server";
import type { Product, Store } from "@/types";

const STORE_SELECT = "*";

export async function getFeaturedStores(limit = 6): Promise<Store[]> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("stores")
    .select(STORE_SELECT)
    .eq("status", "approved")
    .order("created_at", { ascending: false })
    .limit(limit);
  if (error) throw error;
  return (data ?? []) as Store[];
}

export async function getAllStores(): Promise<Store[]> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("stores")
    .select("*")
    .eq("status", "approved")
    .order("created_at", { ascending: false });
  if (error) throw error;
  return (data ?? []) as Store[];
}

export const getStoreBySlug = cache(async (slug: string): Promise<Store | null> => {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("stores")
    .select(STORE_SELECT)
    .eq("slug", slug)
    .eq("status", "approved")
    .maybeSingle();
  if (error) throw error;
  return (data as Store) ?? null;
});

export async function getStoreProducts(storeId: string): Promise<Product[]> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("products_with_media")
    .select("*")
    .eq("store_id", storeId)
    .eq("status", "published")
    .order("created_at", { ascending: false });
  if (error) throw error;
  return (data ?? []) as Product[];
}
