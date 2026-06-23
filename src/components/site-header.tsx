import Link from "next/link";
import { Heart } from "lucide-react";
import { LanguageSwitcher } from "@/components/language-switcher";
import { HeaderProfile } from "@/components/header-profile";
import { getT } from "@/lib/i18n-server";

export function SiteHeader() {
  const t = getT();
  return (
    <header className="sticky top-0 z-40 border-b bg-background/80 backdrop-blur">
      <div className="container flex h-14 items-center justify-between">
        <Link href="/" className="flex items-center gap-2 text-lg font-bold tracking-tight">
          <span>Ki-iM</span>
          <span className="h-5 w-[2px] rotate-12 rounded-full bg-primary" aria-hidden="true" />
          <span className="font-semibold text-muted-foreground">tapp</span>
        </Link>
        <nav className="flex items-center gap-1">
          <LanguageSwitcher />
          <Link href="/favorites" aria-label={t.favorites} className="rounded-lg p-2 hover:bg-accent">
            <Heart className="h-5 w-5" />
          </Link>
          <HeaderProfile />
        </nav>
      </div>
    </header>
  );
}
