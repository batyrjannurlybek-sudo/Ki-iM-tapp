import Link from "next/link";
import { Heart, Store, User } from "lucide-react";
import { LanguageSwitcher } from "@/components/language-switcher";
import { getT } from "@/lib/i18n-server";
import { createClient } from "@/lib/supabase/server";

export async function SiteHeader() {
  const t = getT();
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // For a logged-in seller, show their store logo as the profile avatar.
  let storeLogo: string | null = null;
  let storeName: string | null = null;
  if (user) {
    const { data: store } = await supabase
      .from("stores")
      .select("name, logo_url")
      .eq("owner_id", user.id)
      .maybeSingle();
    storeLogo = store?.logo_url ?? null;
    storeName = store?.name ?? null;
  }

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
          {user ? (
            <Link
              href="/dashboard"
              aria-label={t.dashboard}
              title={storeName ?? t.dashboard}
              className="flex h-9 w-9 items-center justify-center overflow-hidden rounded-full border bg-secondary hover:bg-accent"
            >
              {storeLogo ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={storeLogo} alt={storeName ?? ""} className="h-full w-full object-cover" />
              ) : (
                <User className="h-5 w-5" />
              )}
            </Link>
          ) : (
            <Link
              href="/dashboard"
              className="flex items-center gap-1.5 rounded-lg px-3 py-2 text-sm font-medium hover:bg-accent"
            >
              <Store className="h-4 w-4" />
              <span className="hidden sm:inline">{t.forStores}</span>
            </Link>
          )}
        </nav>
      </div>
    </header>
  );
}
