"use client";

import { useRouter } from "next/navigation";
import { locales, LANG_COOKIE, type Locale } from "@/lib/i18n";
import { useLocale } from "@/lib/i18n-context";
import { cn } from "@/lib/utils";

export function LanguageSwitcher() {
  const router = useRouter();
  const current = useLocale();

  function set(locale: Locale) {
    document.cookie = `${LANG_COOKIE}=${locale}; path=/; max-age=${60 * 60 * 24 * 365}`;
    router.refresh();
  }

  return (
    <div className="flex items-center rounded-lg border p-0.5 text-xs font-medium">
      {locales.map((l) => (
        <button
          key={l}
          onClick={() => set(l)}
          className={cn(
            "rounded-md px-2 py-1 uppercase transition-colors",
            current === l ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground"
          )}
        >
          {l}
        </button>
      ))}
    </div>
  );
}
