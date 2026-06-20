"use client";

import Image from "next/image";
import Link from "next/link";
import { Heart } from "lucide-react";
import { cn, formatPrice } from "@/lib/utils";
import { useFavorites } from "@/lib/favorites";
import { useT } from "@/lib/i18n-context";
import type { Product } from "@/types";

export function ProductCard({ product }: { product: Product }) {
  const t = useT();
  const { isFavorite, toggle } = useFavorites("product");
  const cover = product.images?.[0];
  const fav = isFavorite(product.id);

  return (
    <div className="group relative">
      <Link href={`/product/${product.id}`} className="block">
        <div className="relative aspect-[3/4] w-full overflow-hidden rounded-xl bg-muted">
          {cover ? (
            <Image
              src={cover}
              alt={product.title}
              fill
              sizes="(max-width: 768px) 50vw, 25vw"
              className="object-cover transition-transform duration-300 group-hover:scale-105"
            />
          ) : (
            <div className="flex h-full items-center justify-center text-xs text-muted-foreground">
              {t.noImage}
            </div>
          )}
          {product.stock_quantity === 0 && (
            <span className="absolute left-2 top-2 rounded-full bg-black/70 px-2 py-0.5 text-xs text-white">
              {t.outOfStock}
            </span>
          )}
        </div>
      </Link>

      <button
        aria-label="Toggle favorite"
        onClick={() => toggle(product.id)}
        className="absolute right-2 top-2 rounded-full bg-white/90 p-2 shadow-sm transition hover:scale-110"
      >
        <Heart className={cn("h-4 w-4", fav && "fill-red-500 text-red-500")} />
      </button>

      <div className="mt-2 space-y-0.5">
        <Link href={`/product/${product.id}`} className="line-clamp-1 text-sm font-medium">
          {product.title}
        </Link>
        <p className="text-sm font-semibold">{formatPrice(product.price, product.currency)}</p>
        {product.sizes?.length > 0 && (
          <p className="text-xs text-muted-foreground">{product.sizes.join(" · ")}</p>
        )}
        {product.store?.name && (
          <p className="line-clamp-1 text-xs text-muted-foreground">{product.store.name}</p>
        )}
      </div>
    </div>
  );
}
