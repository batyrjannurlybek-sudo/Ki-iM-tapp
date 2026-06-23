import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getCategories } from "@/services/products";
import { ProductImport } from "@/components/dashboard/product-import";

export const dynamic = "force-dynamic";

export default async function ImportPage() {
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

  const categories = await getCategories();
  return <ProductImport storeId={store.id} categories={categories} />;
}
