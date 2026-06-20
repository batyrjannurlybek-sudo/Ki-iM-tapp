"use client";

import Link from "next/link";
import { useState } from "react";
import { useLocale, useT } from "@/lib/i18n-context";
import { cn } from "@/lib/utils";

type Gender = "women" | "men" | "kids";
type TypeChip = { ru: string; kk: string; q?: string };

// Clothing types per gender. `q` is a search keyword (matched against product titles).
const TYPES: Record<Gender, TypeChip[]> = {
  women: [
    { ru: "Платья", kk: "Көйлектер", q: "платье" },
    { ru: "Верхняя одежда", kk: "Сыртқы киім", q: "куртка" },
    { ru: "Блузки и топы", kk: "Блузкалар", q: "блузка" },
    { ru: "Брюки и джинсы", kk: "Шалбар", q: "брюки" },
    { ru: "Обувь", kk: "Аяқ киім", q: "обувь" },
    { ru: "Аксессуары", kk: "Аксессуарлар", q: "сумка" },
  ],
  men: [
    { ru: "Рубашки", kk: "Жейделер", q: "рубашка" },
    { ru: "Футболки", kk: "Футболкалар", q: "футболка" },
    { ru: "Брюки и джинсы", kk: "Шалбар", q: "брюки" },
    { ru: "Верхняя одежда", kk: "Сыртқы киім", q: "куртка" },
    { ru: "Обувь", kk: "Аяқ киім", q: "обувь" },
    { ru: "Аксессуары", kk: "Аксессуарлар", q: "ремень" },
  ],
  kids: [
    { ru: "Для девочек", kk: "Қыздарға" },
    { ru: "Для мальчиков", kk: "Ұлдарға" },
    { ru: "Верхняя одежда", kk: "Сыртқы киім", q: "куртка" },
    { ru: "Обувь", kk: "Аяқ киім", q: "обувь" },
  ],
};

export function HomeGenderTabs() {
  const t = useT();
  const locale = useLocale();
  const [gender, setGender] = useState<Gender>("women");

  const tabs: { g: Gender; label: string }[] = [
    { g: "women", label: t.tabWomen },
    { g: "men", label: t.tabMen },
    { g: "kids", label: t.tabKids },
  ];

  return (
    <div className="space-y-3">
      {/* Gender segmented control */}
      <div className="grid grid-cols-3 gap-1 rounded-xl bg-muted p-1 text-sm font-medium">
        {tabs.map((tab) => (
          <button
            key={tab.g}
            type="button"
            onClick={() => setGender(tab.g)}
            className={cn(
              "rounded-lg py-2 text-center transition",
              gender === tab.g ? "bg-background text-foreground shadow-sm" : "text-muted-foreground"
            )}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Clothing-type slider for the active gender */}
      <div className="no-scrollbar -mx-1 flex gap-2 overflow-x-auto px-1 pb-1">
        {TYPES[gender].map((c, i) => {
          const label = locale === "kk" ? c.kk : c.ru;
          const href = `/search?gender=${gender}${c.q ? `&q=${encodeURIComponent(c.q)}` : ""}`;
          return (
            <Link
              key={i}
              href={href}
              className="shrink-0 rounded-full border px-4 py-2 text-sm font-medium hover:bg-accent"
            >
              {label}
            </Link>
          );
        })}
      </div>
    </div>
  );
}
