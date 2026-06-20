import { redirect, notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getCategories } from "@/services/products";
import { ProductForm } from "@/components/dashboard/product-form";
import type { Product, ProductImage, ProductVideo } from "@/types";

export const dynamic = "force-dynamic";

export default async function EditProductPage({ params }: { params: { id: string } }) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/dashboard/login");

  const { data: store } = await supabase
    .from("stores")
    .select("id, status")
    .eq("owner_id", user.id)
    .maybeSingle();
  if (!store || store.status !== "approved") redirect("/dashboard");

  // RLS guarantees the owner can only read their own product here.
  const { data: product } = await supabase
    .from("products_with_media")
    .select("*")
    .eq("id", params.id)
    .eq("store_id", store.id)
    .maybeSingle();
  if (!product) notFound();

  const [{ data: images }, { data: videos }, categories] = await Promise.all([
    supabase.from("product_images").select("*").eq("product_id", params.id).order("sort_order"),
    supabase.from("product_videos").select("*").eq("product_id", params.id).order("sort_order"),
    getCategories(),
  ]);

  return (
    <ProductForm
      mode="edit"
      storeId={store.id}
      categories={categories}
      product={product as Product}
      initialImages={(images ?? []) as ProductImage[]}
      initialVideos={(videos ?? []) as ProductVideo[]}
    />
  );
}
