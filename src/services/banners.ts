import { createClient } from "@/lib/supabase/server";
import type { Banner } from "@/types";

/** Active promo banners for the home carousel (managed by admin). */
export async function getBanners(): Promise<Banner[]> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("banners")
    .select("*")
    .eq("is_active", true)
    .order("sort_order", { ascending: true })
    .order("created_at", { ascending: false });
  if (error) throw error;
  return (data ?? []) as Banner[];
}
