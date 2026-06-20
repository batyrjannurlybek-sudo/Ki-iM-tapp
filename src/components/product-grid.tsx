"use client";

import { ProductCard } from "@/components/product-card";
import { useT } from "@/lib/i18n-context";
import type { Product } from "@/types";

export function ProductGrid({ products }: { products: Product[] }) {
  const t = useT();
  if (products.length === 0) {
    return <p className="py-16 text-center text-sm text-muted-foreground">{t.noResults}</p>;
  }
  return (
    <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4">
      {products.map((p) => (
        <ProductCard key={p.id} product={p} />
      ))}
    </div>
  );
}
