"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useT } from "@/lib/i18n-context";
import { cn } from "@/lib/utils";

/** Desktop top navigation — mirrors the mobile bottom nav. Hidden on mobile. */
export function HeaderNav() {
  const t = useT();
  const pathname = usePathname();

  const items = [
    { href: "/", label: t.navHome, exact: true },
    { href: "/search", label: t.navCatalog },
    { href: "/stores", label: t.navStores },
  ];

  return (
    <nav className="hidden items-center gap-1 md:flex">
      {items.map((it) => {
        const active = it.exact ? pathname === it.href : pathname.startsWith(it.href);
        return (
          <Link
            key={it.href}
            href={it.href}
            className={cn(
              "rounded-lg px-3 py-2 text-sm font-medium transition-colors",
              active ? "text-foreground" : "text-muted-foreground hover:text-foreground"
            )}
          >
            {it.label}
          </Link>
        );
      })}
    </nav>
  );
}
