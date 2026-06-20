"use client";

import { createClient } from "@/lib/supabase/client";

const BUCKET = "products";

function fileExt(name: string): string {
  const i = name.lastIndexOf(".");
  return i >= 0 ? name.slice(i) : "";
}

async function uploadAndSet(
  storeId: string,
  file: File,
  kind: "logo" | "cover",
  column: "logo_url" | "cover_url"
): Promise<string> {
  const supabase = createClient();
  const path = `stores/${storeId}/${kind}-${Date.now()}${fileExt(file.name)}`;
  const { error } = await supabase.storage
    .from(BUCKET)
    .upload(path, file, { contentType: file.type, upsert: true });
  if (error) throw error;

  const url = supabase.storage.from(BUCKET).getPublicUrl(path).data.publicUrl;
  const { error: updateError } = await supabase
    .from("stores")
    .update({ [column]: url })
    .eq("id", storeId);
  if (updateError) throw updateError;
  return url;
}

/** Upload a store logo to storage and save its URL on the store (RLS: owner only). */
export function uploadStoreLogo(storeId: string, file: File): Promise<string> {
  return uploadAndSet(storeId, file, "logo", "logo_url");
}

/** Upload a store cover image and save its URL on the store. */
export function uploadStoreCover(storeId: string, file: File): Promise<string> {
  return uploadAndSet(storeId, file, "cover", "cover_url");
}

export interface StoreEditableFields {
  name: string;
  description: string | null;
  phone: string | null;
  whatsapp: string | null;
  instagram: string | null;
  address: string | null;
}

/** Update a store's editable fields (RLS: owner only). */
export async function updateStore(storeId: string, fields: StoreEditableFields): Promise<void> {
  const supabase = createClient();
  const { error } = await supabase.from("stores").update(fields).eq("id", storeId);
  if (error) throw error;
}
