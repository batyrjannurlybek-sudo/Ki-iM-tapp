"use client";

import { createClient } from "@/lib/supabase/client";
import type { ProductInput } from "@/types";

const BUCKET = "products";

function fileExt(name: string): string {
  const i = name.lastIndexOf(".");
  return i >= 0 ? name.slice(i) : "";
}

function randomId(): string {
  return Math.random().toString(36).slice(2, 10);
}

/** Upload a single file to the public `products` bucket; returns its public URL. */
export async function uploadMedia(file: File, storeId: string, productId: string): Promise<string> {
  const supabase = createClient();
  const path = `${storeId}/${productId}/${Date.now()}-${randomId()}${fileExt(file.name)}`;
  const { error } = await supabase.storage
    .from(BUCKET)
    .upload(path, file, { contentType: file.type, upsert: false });
  if (error) throw error;
  return supabase.storage.from(BUCKET).getPublicUrl(path).data.publicUrl;
}

/** Insert a product, then upload + link its images and videos. Returns product id. */
export async function createProduct(
  storeId: string,
  input: ProductInput,
  images: File[],
  videos: File[]
): Promise<string> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("products")
    .insert({ store_id: storeId, ...input })
    .select("id")
    .single();
  if (error) throw error;
  const productId = data.id as string;
  await addImages(productId, storeId, images, true);
  await addVideos(productId, storeId, videos);
  return productId;
}

/** Update a product's scalar fields. Media is managed separately. */
export async function updateProduct(productId: string, input: ProductInput): Promise<void> {
  const supabase = createClient();
  const { error } = await supabase.from("products").update(input).eq("id", productId);
  if (error) throw error;
}

/** Upload + link images. `firstIsPrimary` marks the first uploaded image as cover. */
export async function addImages(
  productId: string,
  storeId: string,
  files: File[],
  firstIsPrimary: boolean
): Promise<void> {
  const supabase = createClient();
  for (let i = 0; i < files.length; i++) {
    const url = await uploadMedia(files[i], storeId, productId);
    const { error } = await supabase.from("product_images").insert({
      product_id: productId,
      url,
      sort_order: i,
      is_primary: firstIsPrimary && i === 0,
    });
    if (error) throw error;
  }
}

export async function addVideos(productId: string, storeId: string, files: File[]): Promise<void> {
  const supabase = createClient();
  for (let i = 0; i < files.length; i++) {
    const url = await uploadMedia(files[i], storeId, productId);
    const { error } = await supabase
      .from("product_videos")
      .insert({ product_id: productId, url, sort_order: i });
    if (error) throw error;
  }
}

export async function deleteProductImage(imageId: string): Promise<void> {
  const supabase = createClient();
  const { error } = await supabase.from("product_images").delete().eq("id", imageId);
  if (error) throw error;
}

export async function deleteProductVideo(videoId: string): Promise<void> {
  const supabase = createClient();
  const { error } = await supabase.from("product_videos").delete().eq("id", videoId);
  if (error) throw error;
}

export async function deleteProduct(productId: string): Promise<void> {
  const supabase = createClient();
  const { error } = await supabase.from("products").delete().eq("id", productId);
  if (error) throw error;
}

export async function setProductStatus(
  productId: string,
  status: ProductInput["status"]
): Promise<void> {
  const supabase = createClient();
  const { error } = await supabase.from("products").update({ status }).eq("id", productId);
  if (error) throw error;
}

export interface BulkProductItem {
  input: ProductInput;
  images: string[];
}

/** Bulk-create products (from a CSV/Excel import). Returns how many succeeded. */
export async function bulkCreateProducts(storeId: string, items: BulkProductItem[]): Promise<number> {
  const supabase = createClient();
  let created = 0;
  for (const item of items) {
    const { data, error } = await supabase
      .from("products")
      .insert({ store_id: storeId, ...item.input })
      .select("id")
      .single();
    if (error) throw error;
    const productId = data.id as string;
    for (let i = 0; i < item.images.length; i++) {
      await supabase.from("product_images").insert({
        product_id: productId,
        url: item.images[i],
        sort_order: i,
        is_primary: i === 0,
      });
    }
    created++;
  }
  return created;
}

/** Quick in-stock / out-of-stock toggle (stock_quantity 0 = out, 1 = in). */
export async function setAvailability(productId: string, available: boolean): Promise<void> {
  const supabase = createClient();
  const { error } = await supabase
    .from("products")
    .update({ stock_quantity: available ? 1 : 0 })
    .eq("id", productId);
  if (error) throw error;
}
