import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { StoreSettingsForm } from "@/components/dashboard/store-settings-form";
import type { Store } from "@/types";

export const dynamic = "force-dynamic";

export default async function StoreSettingsPage() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/dashboard/login");

  const { data: store } = await supabase
    .from("stores")
    .select("*")
    .eq("owner_id", user.id)
    .maybeSingle();
  if (!store) redirect("/dashboard");

  return <StoreSettingsForm store={store as Store} />;
}
