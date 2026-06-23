"use client";

import { createClient } from "@/lib/supabase/client";

/** Fire-and-forget analytics event (view / contact). Never blocks or throws. */
export async function track(
  type: "view" | "contact",
  storeId: string | null | undefined,
  productId?: string | null
): Promise<void> {
  if (!storeId) return;
  try {
    const supabase = createClient();
    await supabase.from("events").insert({ store_id: storeId, product_id: productId ?? null, type });
  } catch {
    // analytics must never break the UI
  }
}
