import { createAdminClient } from "@/lib/supabase/admin";
import { getT } from "@/lib/i18n-server";
import { storeStatusName } from "@/lib/i18n";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { formatPrice } from "@/lib/utils";
import {
  addBanner,
  adminLogin,
  adminLogout,
  deleteBanner,
  isAdmin,
  removeProduct,
  setStoreStatus,
} from "./actions";
import type { Banner, Product, Store } from "@/types";

export const dynamic = "force-dynamic";

export default async function AdminPage() {
  const t = getT();
  if (!(await isAdmin())) return <AdminLogin t={t} />;

  const supabase = createAdminClient();
  const [
    { count: storeCount },
    { count: productCount },
    { count: searchCount },
    pending,
    allStores,
    recentProducts,
    banners,
    searchRows,
  ] = await Promise.all([
    supabase.from("stores").select("*", { count: "exact", head: true }),
    supabase.from("products").select("*", { count: "exact", head: true }),
    supabase.from("search_events").select("*", { count: "exact", head: true }),
    supabase.from("stores").select("*").eq("status", "pending").order("created_at"),
    supabase.from("stores").select("*").order("created_at", { ascending: false }),
    supabase.from("products").select("*").order("created_at", { ascending: false }).limit(20),
    supabase.from("banners").select("*").order("created_at", { ascending: false }),
    supabase.from("search_events").select("query").order("created_at", { ascending: false }).limit(500),
  ]);

  // Aggregate top search queries.
  const counts = new Map<string, number>();
  for (const row of (searchRows.data as { query: string }[] | null) ?? []) {
    const q = row.query.toLowerCase().trim();
    if (q) counts.set(q, (counts.get(q) ?? 0) + 1);
  }
  const topSearches = [...counts.entries()].sort((a, b) => b[1] - a[1]).slice(0, 10);

  return (
    <div className="mx-auto max-w-3xl space-y-8">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold">{t.admin}</h1>
        <form action={adminLogout}>
          <Button variant="ghost" size="sm">{t.logOut}</Button>
        </form>
      </div>

      <div className="grid grid-cols-3 gap-3">
        <Stat label={t.stores} value={storeCount ?? 0} />
        <Stat label={t.products} value={productCount ?? 0} />
        <Stat label={t.searches} value={searchCount ?? 0} />
      </div>

      {/* Home banners */}
      <section className="space-y-3">
        <h2 className="font-semibold">{t.banners} ({banners.data?.length ?? 0})</h2>
        <form action={addBanner} className="space-y-2 rounded-xl border p-4">
          <label className="block text-sm font-medium">
            {t.bannerImage}
            <input type="file" name="image" accept="image/*" required
              className="mt-1 block w-full text-sm" />
          </label>
          <input name="link" placeholder={t.bannerLink}
            className="h-10 w-full rounded-lg border px-3 text-sm" />
          <Button type="submit" size="sm">{t.addBanner}</Button>
        </form>
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
          {(banners.data as Banner[] | null)?.map((b) => (
            <div key={b.id} className="relative overflow-hidden rounded-lg border">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={b.image_url} alt="" className="aspect-[16/9] w-full object-cover" />
              <form action={deleteBanner} className="absolute right-1 top-1">
                <input type="hidden" name="id" value={b.id} />
                <Button size="sm" variant="destructive">{t.remove}</Button>
              </form>
            </div>
          ))}
        </div>
      </section>

      <section className="space-y-3">
        <h2 className="font-semibold">{t.pendingStores} ({pending.data?.length ?? 0})</h2>
        {(pending.data as Store[] | null)?.map((s) => (
          <div key={s.id} className="flex items-center justify-between rounded-lg border p-3">
            <div>
              <p className="text-sm font-medium">{s.name}</p>
              <p className="text-xs text-muted-foreground">{s.phone ?? s.whatsapp ?? "—"}</p>
            </div>
            <div className="flex gap-2">
              <form action={setStoreStatus}>
                <input type="hidden" name="id" value={s.id} />
                <input type="hidden" name="status" value="approved" />
                <Button size="sm">{t.approve}</Button>
              </form>
              <form action={setStoreStatus}>
                <input type="hidden" name="id" value={s.id} />
                <input type="hidden" name="status" value="rejected" />
                <Button size="sm" variant="destructive">{t.reject}</Button>
              </form>
            </div>
          </div>
        ))}
      </section>

      {/* All stores — manage status (suspend / activate / reject) */}
      <section className="space-y-3">
        <h2 className="font-semibold">{t.allStores} ({allStores.data?.length ?? 0})</h2>
        {(allStores.data as Store[] | null)?.map((s) => (
          <div key={s.id} className="flex items-center justify-between gap-2 rounded-lg border p-3">
            <div className="min-w-0">
              <p className="truncate text-sm font-medium">{s.name}</p>
              <p className="text-xs text-muted-foreground">
                <Badge variant="muted">{storeStatusName(s.status, t)}</Badge>
                {s.whatsapp ? ` · ${s.whatsapp}` : ""}
              </p>
            </div>
            <div className="flex shrink-0 gap-2">
              {s.status !== "approved" && (
                <form action={setStoreStatus}>
                  <input type="hidden" name="id" value={s.id} />
                  <input type="hidden" name="status" value="approved" />
                  <Button size="sm">{t.activate}</Button>
                </form>
              )}
              {s.status === "approved" && (
                <form action={setStoreStatus}>
                  <input type="hidden" name="id" value={s.id} />
                  <input type="hidden" name="status" value="suspended" />
                  <Button size="sm" variant="destructive">{t.suspend}</Button>
                </form>
              )}
            </div>
          </div>
        ))}
      </section>

      {/* Top searches analytics */}
      <section className="space-y-3">
        <h2 className="font-semibold">{t.topSearches}</h2>
        {topSearches.length === 0 ? (
          <p className="text-sm text-muted-foreground">{t.noData}</p>
        ) : (
          <div className="space-y-1">
            {topSearches.map(([q, n]) => (
              <div key={q} className="flex items-center justify-between rounded-lg border px-3 py-2 text-sm">
                <span className="truncate">{q}</span>
                <Badge variant="muted">{n}</Badge>
              </div>
            ))}
          </div>
        )}
      </section>

      <section className="space-y-3">
        <h2 className="font-semibold">{t.recentProducts}</h2>
        {(recentProducts.data as Product[] | null)?.map((p) => (
          <div key={p.id} className="flex items-center justify-between rounded-lg border p-3">
            <div>
              <p className="text-sm font-medium">{p.title}</p>
              <p className="text-xs text-muted-foreground">
                {formatPrice(p.price)} · <Badge variant="muted">{p.status}</Badge>
              </p>
            </div>
            <form action={removeProduct}>
              <input type="hidden" name="id" value={p.id} />
              <Button size="sm" variant="destructive">{t.remove}</Button>
            </form>
          </div>
        ))}
      </section>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-2xl border p-4 text-center">
      <p className="text-2xl font-bold">{value}</p>
      <p className="text-xs text-muted-foreground">{label}</p>
    </div>
  );
}

function AdminLogin({ t }: { t: ReturnType<typeof getT> }) {
  return (
    <form action={adminLogin} className="mx-auto max-w-sm space-y-3 py-10">
      <h1 className="text-xl font-bold">{t.adminLogin}</h1>
      <input
        name="password"
        type="password"
        placeholder={t.adminPassword}
        className="h-11 w-full rounded-lg border px-4 text-sm"
      />
      <Button type="submit" className="w-full">{t.enter}</Button>
    </form>
  );
}
