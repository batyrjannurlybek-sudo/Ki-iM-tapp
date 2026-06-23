"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { Store, User } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { useT } from "@/lib/i18n-context";

/**
 * Client-side profile chip. Checks the session in the browser so the server
 * render of every page is NOT blocked on a Supabase auth round-trip.
 */
export function HeaderProfile() {
  const t = useT();
  const [profile, setProfile] = useState<{ loggedIn: boolean; logo: string | null; name: string | null }>({
    loggedIn: false,
    logo: null,
    name: null,
  });

  useEffect(() => {
    let active = true;
    const supabase = createClient();
    supabase.auth.getSession().then(async ({ data }) => {
      if (!data.session || !active) return;
      const { data: store } = await supabase
        .from("stores")
        .select("name, logo_url")
        .eq("owner_id", data.session.user.id)
        .maybeSingle();
      if (active) {
        setProfile({ loggedIn: true, logo: store?.logo_url ?? null, name: store?.name ?? null });
      }
    });
    return () => {
      active = false;
    };
  }, []);

  if (!profile.loggedIn) {
    return (
      <Link
        href="/dashboard"
        className="flex items-center gap-1.5 rounded-lg px-3 py-2 text-sm font-medium hover:bg-accent"
      >
        <Store className="h-4 w-4" />
        <span className="hidden sm:inline">{t.forStores}</span>
      </Link>
    );
  }

  return (
    <Link
      href="/dashboard"
      aria-label={t.dashboard}
      title={profile.name ?? t.dashboard}
      className="flex h-9 w-9 items-center justify-center overflow-hidden rounded-full border bg-secondary hover:bg-accent"
    >
      {profile.logo ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={profile.logo} alt={profile.name ?? ""} className="h-full w-full object-cover" />
      ) : (
        <User className="h-5 w-5" />
      )}
    </Link>
  );
}
