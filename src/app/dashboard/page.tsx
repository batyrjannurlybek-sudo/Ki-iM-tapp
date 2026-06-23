import Link from "next/link";
import { redirect } from "next/navigation";
import { Plus, Settings, Upload } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { getT } from "@/lib/i18n-server";
import { storeStatusName } from "@/lib/i18n";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { DashboardProducts } from "@/components/dashboard/dashboard-products";
import { StoreLogoUploader } from "@/components/dashboard/store-logo-uploader";
import { StoreRegisterForm } from "@/components/dashboard/store-register-form";
import { signOut } from "./actions";
import type { Product, Store } from "@/types";
import type { Dict as TDict } from "@/lib/i18n";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const t = getT();
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

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold">{t.dashboard}</h1>
        <div className="flex items-center gap-1">
          {store && (
            <Link
              href="/dashboard/settings"
              className="flex items-center gap-1.5 rounded-lg px-3 py-2 text-sm font-medium hover:bg-accent"
            >
              <Settings className="h-4 w-4" />
              <span className="hidden sm:inline">{t.storeSettings}</span>
            </Link>
          )}
          <form action={signOut}>
            <Button variant="ghost" size="sm">{t.signOut}</Button>
          </form>
        </div>
      </div>

      {!store ? (
        <StoreRegisterForm />
      ) : (
        <>
          <StoreLogoUploader storeId={store.id} name={store.name} logoUrl={store.logo_url} />
          {store.status !== "approved" ? (
            <PendingNotice status={store.status} t={t} />
          ) : (
            <ApprovedDashboard store={store as Store} supabase={supabase} t={t} />
          )}
        </>
      )}
    </div>
  );
}

async function ApprovedDashboard({
  store,
  supabase,
  t,
}: {
  store: Store;
  supabase: ReturnType<typeof createClient>;
  t: TDict;
}) {
  const { data } = await supabase
    .from("products_with_media")
    .select("*")
    .eq("store_id", store.id)
    .order("created_at", { ascending: false });
  const products = (data ?? []) as Product[];
  const publishedCount = products.filter((p) => p.status === "published").length;

  return (
    <div className="space-y-6">
      {/* Stats */}
      <div className="grid grid-cols-3 gap-3">
        <Stat label={t.statTotal} value={String(products.length)} />
        <Stat label={t.statPublished} value={String(publishedCount)} />
        <Stat label={t.statStoreStatus} value={storeStatusName(store.status, t)} />
      </div>

      <div className="flex flex-wrap items-center justify-between gap-2">
        <h2 className="font-semibold">{t.manageProducts}</h2>
        <div className="flex gap-2">
          <Link
            href="/dashboard/import"
            className="inline-flex h-9 items-center gap-1.5 rounded-lg border px-3 text-sm font-medium hover:bg-accent"
          >
            <Upload className="h-4 w-4" /> {t.importProducts}
          </Link>
          <Link
            href="/dashboard/products/new"
            className="inline-flex h-9 items-center gap-1.5 rounded-lg bg-primary px-3 text-sm font-medium text-primary-foreground hover:bg-primary/90"
          >
            <Plus className="h-4 w-4" /> {t.newProduct}
          </Link>
        </div>
      </div>

      <DashboardProducts products={products} />
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border p-4 text-center">
      <p className="truncate text-lg font-bold">{value}</p>
      <p className="text-xs text-muted-foreground">{label}</p>
    </div>
  );
}

function PendingNotice({ status, t }: { status: string; t: TDict }) {
  return (
    <div className="rounded-2xl border p-5">
      <Badge variant="muted">{storeStatusName(status, t)}</Badge>
      <p className="mt-2 text-sm text-muted-foreground">
        {status === "pending" ? t.statusPending : t.statusInactive}
      </p>
    </div>
  );
}

