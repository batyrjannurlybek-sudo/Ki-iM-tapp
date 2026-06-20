"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, LayoutGrid, Store, Heart, User } from "lucide-react";
import { useFavorites } from "@/lib/favorites";
import { useT } from "@/lib/i18n-context";
import { cn } from "@/lib/utils";

/** Mobile app-style bottom navigation (Lamoda-like). Hidden on desktop. */
export function BottomNav() {
  const t = useT();
  const pathname = usePathname();
  const { ids } = useFavorites("product");
  const favCount = ids.length;

  const items = [
    { href: "/", label: t.navHome, icon: Home, exact: true },
    { href: "/search", label: t.navCatalog, icon: LayoutGrid },
    { href: "/stores", label: t.navStores, icon: Store },
    { href: "/favorites", label: t.navFavorites, icon: Heart, badge: favCount },
    { href: "/dashboard", label: t.navProfile, icon: User },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 border-t bg-background/95 backdrop-blur md:hidden">
      <div className="mx-auto flex max-w-lg items-stretch justify-around">
        {items.map((it) => {
          const active = it.exact ? pathname === it.href : pathname.startsWith(it.href);
          const Icon = it.icon;
          return (
            <Link
              key={it.href}
              href={it.href}
              className={cn(
                "relative flex flex-1 flex-col items-center gap-0.5 py-2 text-[10px] font-medium transition-colors",
                active ? "text-primary" : "text-muted-foreground"
              )}
            >
              <span className="relative">
                <Icon className="h-5 w-5" />
                {it.badge ? (
                  <span className="absolute -right-2 -top-1.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-red-500 px-1 text-[8px] font-bold text-white">
                    {it.badge}
                  </span>
                ) : null}
              </span>
              {it.label}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
