import { createClient } from "@/lib/supabase/server";

export interface TopStore {
  id: string;
  name: string;
  slug: string;
  logo_url: string | null;
  is_verified: boolean;
  views: number;
  contacts: number;
  score: number;
}

export async function getTopStores(days = 30, limit = 50): Promise<TopStore[]> {
  const supabase = createClient();
  const { data, error } = await supabase.rpc("top_stores", { p_days: days, p_limit: limit });
  if (error) throw error;
  return ((data ?? []) as TopStore[]).map((s) => ({
    ...s,
    views: Number(s.views) || 0,
    contacts: Number(s.contacts) || 0,
    score: Number(s.score) || 0,
  }));
}

export async function getStoreStats(
  storeId: string,
  days = 30
): Promise<{ views: number; contacts: number }> {
  const supabase = createClient();
  const { data, error } = await supabase.rpc("store_stats", { p_store: storeId, p_days: days });
  if (error) throw error;
  const row = (data?.[0] ?? {}) as { views?: number; contacts?: number };
  return { views: Number(row.views) || 0, contacts: Number(row.contacts) || 0 };
}
