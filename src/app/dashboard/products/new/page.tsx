import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getCategories } from "@/services/products";
import { ProductForm } from "@/components/dashboard/product-form";

export const dynamic = "force-dynamic";

export default async function NewProductPage() {
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

  // Only approved stores can add products.
  if (!store || store.status !== "approved") redirect("/dashboard");

  const categories = await getCategories();
  return <ProductForm mode="create" storeId={store.id} categories={categories} />;
}
