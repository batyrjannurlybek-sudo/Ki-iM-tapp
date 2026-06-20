import Link from "next/link";
import { getT } from "@/lib/i18n-server";
import { categoryName } from "@/lib/i18n";
import type { Category } from "@/types";

export function CategoryChips({ categories }: { categories: Category[] }) {
  const t = getT();
  return (
    <div className="no-scrollbar -mx-1 flex gap-2 overflow-x-auto px-1 pb-1">
      {categories.map((c) => (
        <Link
          key={c.id}
          href={`/search?category=${c.id}`}
          className="shrink-0 rounded-full border px-4 py-2 text-sm font-medium hover:bg-accent"
        >
          {categoryName(c.slug, c.name, t)}
        </Link>
      ))}
    </div>
  );
}
