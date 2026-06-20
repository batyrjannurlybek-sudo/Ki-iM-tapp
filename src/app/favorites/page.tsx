"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { useFavorites } from "@/lib/favorites";
import { ProductGrid } from "@/components/product-grid";
import { useT } from "@/lib/i18n-context";
import type { Product } from "@/types";

export default function FavoritesPage() {
  const t = useT();
  const { ids } = useFavorites("product");
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      setLoading(true);
      if (ids.length === 0) {
        setProducts([]);
        setLoading(false);
        return;
      }
      const supabase = createClient();
      const { data } = await supabase.from("products_with_media").select("*").in("id", ids);
      if (!cancelled) {
        setProducts((data ?? []) as Product[]);
        setLoading(false);
      }
    }
    load();
    return () => {
      cancelled = true;
    };
  }, [ids]);

  return (
    <div className="space-y-5">
      <h1 className="text-xl font-bold">{t.favorites}</h1>
      {loading ? (
        <p className="py-16 text-center text-sm text-muted-foreground">{t.loading}</p>
      ) : ids.length === 0 ? (
        <p className="py-16 text-center text-sm text-muted-foreground">{t.favoritesEmpty}</p>
      ) : (
        <ProductGrid products={products} />
      )}
    </div>
  );
}
