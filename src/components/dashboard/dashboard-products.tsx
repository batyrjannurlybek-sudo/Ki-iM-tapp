"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import { Eye, EyeOff, Pencil, Search, Send, Archive, Trash2 } from "lucide-react";
import { useT } from "@/lib/i18n-context";
import { productStatusName } from "@/lib/i18n";
import { cn, formatPrice } from "@/lib/utils";
import { deleteProduct, setAvailability, setProductStatus } from "@/services/products-client";
import type { Product, ProductStatus } from "@/types";

const FILTERS: (ProductStatus | "all")[] = ["all", "published", "draft", "hidden", "archived"];

export function DashboardProducts({ products }: { products: Product[] }) {
  const t = useT();
  const router = useRouter();
  const [pending, setPending] = useState<string | null>(null);
  const [filter, setFilter] = useState<ProductStatus | "all">("all");
  const [query, setQuery] = useState("");

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return products.filter(
      (p) =>
        (filter === "all" || p.status === filter) &&
        (!q || p.title.toLowerCase().includes(q))
    );
  }, [products, filter, query]);

  const filterLabel = (f: ProductStatus | "all") =>
    f === "all" ? t.filterAll : productStatusName(f, t);

  async function run(fn: () => Promise<void>, id: string) {
    setPending(id);
    try {
      await fn();
      router.refresh();
    } finally {
      setPending(null);
    }
  }

  function changeStatus(id: string, status: ProductStatus) {
    return run(() => setProductStatus(id, status), id);
  }

  function toggleAvailability(id: string, available: boolean) {
    return run(() => setAvailability(id, available), id);
  }

  function remove(id: string) {
    if (!confirm(t.confirmDeleteProduct)) return;
    return run(() => deleteProduct(id), id);
  }

  if (products.length === 0) {
    return <p className="rounded-2xl border p-8 text-center text-sm text-muted-foreground">{t.noProductsYet}</p>;
  }

  const statusColor: Record<string, string> = {
    published: "bg-green-100 text-green-700",
    draft: "bg-muted text-muted-foreground",
    hidden: "bg-amber-100 text-amber-700",
    archived: "bg-muted text-muted-foreground",
    pending_review: "bg-blue-100 text-blue-700",
  };

  return (
    <div className="space-y-3">
      {/* Search + status filter */}
      <div className="relative">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder={t.searchProductsPh}
          className="h-10 w-full rounded-lg border border-input bg-background pl-9 pr-3 text-sm"
        />
      </div>
      <div className="no-scrollbar flex gap-2 overflow-x-auto pb-1">
        {FILTERS.map((f) => {
          const count = f === "all" ? products.length : products.filter((p) => p.status === f).length;
          return (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={cn(
                "shrink-0 rounded-full border px-3 py-1.5 text-xs font-medium transition",
                filter === f ? "border-primary bg-primary text-primary-foreground" : "hover:bg-accent"
              )}
            >
              {filterLabel(f)} ({count})
            </button>
          );
        })}
      </div>

      {filtered.length === 0 ? (
        <p className="rounded-2xl border p-8 text-center text-sm text-muted-foreground">{t.noResults}</p>
      ) : (
        filtered.map((p) => {
        const busy = pending === p.id;
        return (
          <div key={p.id} className="space-y-3 rounded-xl border p-3">
            <div className="flex items-center gap-3">
              <div className="h-14 w-14 shrink-0 overflow-hidden rounded-lg bg-muted">
                {p.images?.[0] && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={p.images[0]} alt="" className="h-full w-full object-cover" />
                )}
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium">{p.title}</p>
                <p className="text-xs text-muted-foreground">{formatPrice(p.price)}</p>
                <span className={`mt-1 inline-block rounded-full px-2 py-0.5 text-[10px] font-medium ${statusColor[p.status] ?? "bg-muted"}`}>
                  {productStatusName(p.status, t)}
                </span>
              </div>
              <div className="flex shrink-0 items-center gap-1">
                <Link href={`/dashboard/products/${p.id}/edit`} aria-label={t.act_edit}
                  className="rounded-lg p-2 hover:bg-accent">
                  <Pencil className="h-4 w-4" />
                </Link>
                {p.status !== "published" ? (
                  <button disabled={busy} aria-label={t.act_publish} title={t.act_publish}
                    onClick={() => changeStatus(p.id, "published")} className="rounded-lg p-2 hover:bg-accent">
                    <Send className="h-4 w-4" />
                  </button>
                ) : (
                  <button disabled={busy} aria-label={t.act_hide} title={t.act_hide}
                    onClick={() => changeStatus(p.id, "hidden")} className="rounded-lg p-2 hover:bg-accent">
                    <EyeOff className="h-4 w-4" />
                  </button>
                )}
                {p.status === "hidden" && (
                  <button disabled={busy} aria-label={t.act_show} title={t.act_show}
                    onClick={() => changeStatus(p.id, "published")} className="rounded-lg p-2 hover:bg-accent">
                    <Eye className="h-4 w-4" />
                  </button>
                )}
                {p.status !== "archived" && (
                  <button disabled={busy} aria-label={t.act_archive} title={t.act_archive}
                    onClick={() => changeStatus(p.id, "archived")} className="rounded-lg p-2 hover:bg-accent">
                    <Archive className="h-4 w-4" />
                  </button>
                )}
                <button disabled={busy} aria-label={t.delete} title={t.delete}
                  onClick={() => remove(p.id)} className="rounded-lg p-2 text-destructive hover:bg-destructive/10">
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            </div>

            {/* Prominent availability toggle */}
            <button
              type="button"
              disabled={busy}
              onClick={() => toggleAvailability(p.id, p.stock_quantity === 0)}
              className={cn(
                "flex w-full items-center justify-between rounded-lg border px-3 py-2.5 transition-colors disabled:opacity-50",
                p.stock_quantity > 0 ? "border-green-200 bg-green-50" : "bg-muted"
              )}
            >
              <span className="text-sm font-medium">{t.availability}</span>
              <span className="flex items-center gap-2">
                <span className={cn("text-sm font-semibold", p.stock_quantity > 0 ? "text-green-700" : "text-muted-foreground")}>
                  {p.stock_quantity > 0 ? t.inStock : t.outStock}
                </span>
                <span className={cn("relative h-6 w-11 rounded-full transition-colors", p.stock_quantity > 0 ? "bg-green-500" : "bg-zinc-300")}>
                  <span className={cn("absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-all", p.stock_quantity > 0 ? "left-[22px]" : "left-0.5")} />
                </span>
              </span>
            </button>
          </div>
        );
        })
      )}
    </div>
  );
}
