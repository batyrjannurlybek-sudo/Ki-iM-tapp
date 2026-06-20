"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useCallback } from "react";
import { useT } from "@/lib/i18n-context";
import { categoryName } from "@/lib/i18n";
import type { Category } from "@/types";

const GENDERS = ["men", "women", "unisex", "kids"] as const;

export function SearchFilters({ categories }: { categories: Category[] }) {
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();
  const t = useT();
  const genderLabel = { men: t.gender_men, women: t.gender_women, unisex: t.gender_unisex, kids: t.gender_kids };

  const setParam = useCallback(
    (key: string, value: string) => {
      const next = new URLSearchParams(params.toString());
      if (value) next.set(key, value);
      else next.delete(key);
      router.push(`${pathname}?${next.toString()}`);
    },
    [params, pathname, router]
  );

  const selectCls =
    "h-10 rounded-lg border border-input bg-background px-3 text-sm";

  return (
    <div className="no-scrollbar flex gap-2 overflow-x-auto pb-1">
      <select
        className={selectCls}
        value={params.get("category") ?? ""}
        onChange={(e) => setParam("category", e.target.value)}
      >
        <option value="">{t.allCategories}</option>
        {categories.map((c) => (
          <option key={c.id} value={c.id}>
            {categoryName(c.slug, c.name, t)}
          </option>
        ))}
      </select>

      <select
        className={selectCls}
        value={params.get("gender") ?? ""}
        onChange={(e) => setParam("gender", e.target.value)}
      >
        <option value="">{t.allGenders}</option>
        {GENDERS.map((g) => (
          <option key={g} value={g}>
            {genderLabel[g]}
          </option>
        ))}
      </select>

      <input
        type="number"
        inputMode="numeric"
        placeholder={t.minPrice}
        defaultValue={params.get("min") ?? ""}
        onBlur={(e) => setParam("min", e.target.value)}
        className={`${selectCls} w-24`}
      />
      <input
        type="number"
        inputMode="numeric"
        placeholder={t.maxPrice}
        defaultValue={params.get("max") ?? ""}
        onBlur={(e) => setParam("max", e.target.value)}
        className={`${selectCls} w-24`}
      />
      <input
        placeholder={t.size}
        defaultValue={params.get("size") ?? ""}
        onBlur={(e) => setParam("size", e.target.value)}
        className={`${selectCls} w-20`}
      />
    </div>
  );
}
