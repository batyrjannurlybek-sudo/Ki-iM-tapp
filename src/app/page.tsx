import Link from "next/link";
import { SearchBar } from "@/components/search-bar";
import { HomeGenderTabs } from "@/components/home-gender-tabs";
import { ProductGrid } from "@/components/product-grid";
import { getNewArrivals, getTrendingSearches } from "@/services/products";
import { getBanners } from "@/services/banners";
import { getT } from "@/lib/i18n-server";

export const revalidate = 60; // ISR — keep the home page fast and fresh.

/** Resolve a promise, falling back to a default if it rejects (e.g. DB not migrated yet). */
async function safe<T>(p: Promise<T>, fallback: T): Promise<T> {
  try {
    return await p;
  } catch (e) {
    console.error("[home] data fetch failed:", e);
    return fallback;
  }
}

export default async function HomePage() {
  const t = getT();
  const [arrivals, trending, banners] = await Promise.all([
    safe(getNewArrivals(8), []),
    safe(getTrendingSearches(6), []),
    safe(getBanners(), []),
  ]);

  return (
    <div className="space-y-8">
      {/* Search + gender tabs with per-gender clothing types */}
      <section className="space-y-4 pt-1">
        <SearchBar />
        <HomeGenderTabs />

        {trending.length > 0 && (
          <div className="flex flex-wrap items-center gap-2 text-sm">
            <span className="text-muted-foreground">{t.trending}</span>
            {trending.map((term) => (
              <Link
                key={term}
                href={`/search?q=${encodeURIComponent(term)}`}
                className="rounded-full bg-muted px-3 py-1 text-foreground hover:bg-accent"
              >
                {term}
              </Link>
            ))}
          </div>
        )}
      </section>

      {/* Promo banners — managed by admin */}
      {banners.length > 0 && (
        <section className="no-scrollbar -mx-4 flex snap-x snap-mandatory gap-3 overflow-x-auto px-4">
          {banners.map((b) => {
            const inner = (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={b.image_url} alt={b.title ?? ""} className="h-full w-full object-cover" />
            );
            const cls =
              "relative aspect-[16/9] w-[88%] shrink-0 snap-center overflow-hidden rounded-2xl bg-muted sm:w-[60%]";
            return b.link_url ? (
              <a key={b.id} href={b.link_url} className={cls}>{inner}</a>
            ) : (
              <div key={b.id} className={cls}>{inner}</div>
            );
          })}
        </section>
      )}

      {/* New arrivals */}
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold">{t.newArrivals}</h2>
          <Link href="/search" className="text-sm text-muted-foreground hover:underline">
            {t.seeAll}
          </Link>
        </div>
        <ProductGrid products={arrivals} />
      </section>
    </div>
  );
}
