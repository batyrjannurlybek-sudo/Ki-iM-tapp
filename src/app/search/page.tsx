import { SearchBar } from "@/components/search-bar";
import { SearchFilters } from "@/components/search-filters";
import { ProductGrid } from "@/components/product-grid";
import { getCategories, logSearch, searchProducts } from "@/services/products";
import { getT } from "@/lib/i18n-server";
import { tpl } from "@/lib/i18n";
import type { Gender } from "@/types";

export const dynamic = "force-dynamic"; // results depend on query params

type SearchParams = {
  q?: string;
  category?: string;
  gender?: string;
  store?: string;
  size?: string;
  min?: string;
  max?: string;
};

export default async function SearchPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const filters = {
    q: searchParams.q,
    category: searchParams.category,
    gender: searchParams.gender as Gender | undefined,
    store: searchParams.store,
    size: searchParams.size,
    minPrice: searchParams.min ? Number(searchParams.min) : undefined,
    maxPrice: searchParams.max ? Number(searchParams.max) : undefined,
    limit: 48,
  };

  const t = getT();
  const [categories, products] = await Promise.all([
    getCategories(),
    searchProducts(filters),
  ]);

  if (searchParams.q) {
    // Fire-and-forget analytics; don't block render.
    void logSearch(searchParams.q, products.length);
  }

  return (
    <div className="space-y-5">
      <SearchBar defaultValue={searchParams.q ?? ""} size="sm" />
      <SearchFilters categories={categories} />
      <p className="text-sm text-muted-foreground">
        {tpl(t.resultsCount, { n: products.length })}
        {searchParams.q ? tpl(t.resultsFor, { q: searchParams.q }) : ""}
      </p>
      <ProductGrid products={products} />
    </div>
  );
}
