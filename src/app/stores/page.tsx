import Link from "next/link";
import { Eye, MessageCircle } from "lucide-react";
import { getT } from "@/lib/i18n-server";
import { getTopStores, type TopStore } from "@/services/stats";
import { getAllStores } from "@/services/stores";
import { VerifiedBadge } from "@/components/verified-badge";

export const dynamic = "force-dynamic";

const MEDALS = ["🥇", "🥈", "🥉"];

export default async function StoresPage() {
  const t = getT();
  // Gracefully fall back to a plain store list if analytics isn't migrated yet.
  const stores: TopStore[] = await getTopStores(30, 100).catch(async () => {
    const all = await getAllStores().catch(() => []);
    return all.map((s) => ({
      id: s.id,
      name: s.name,
      slug: s.slug,
      logo_url: s.logo_url,
      is_verified: s.is_verified,
      views: 0,
      contacts: 0,
      score: 0,
    }));
  });

  return (
    <div className="space-y-5">
      <h1 className="text-xl font-bold">{t.topStores}</h1>
      <p className="text-sm text-muted-foreground">{t.last30}</p>

      {stores.length === 0 ? (
        <p className="py-16 text-center text-sm text-muted-foreground">{t.noResults}</p>
      ) : (
        <div className="space-y-2">
          {stores.map((s, i) => (
            <Link
              key={s.id}
              href={`/store/${s.slug}`}
              className="flex items-center gap-3 rounded-xl border p-3 transition hover:bg-accent"
            >
              <div className="flex w-7 shrink-0 items-center justify-center text-lg font-bold text-muted-foreground">
                {MEDALS[i] ?? i + 1}
              </div>
              <div className="h-12 w-12 shrink-0 overflow-hidden rounded-full bg-muted ring-1 ring-border">
                {s.logo_url ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={s.logo_url} alt={s.name} className="h-full w-full object-cover" />
                ) : (
                  <span className="flex h-full w-full items-center justify-center text-base font-bold text-muted-foreground">
                    {s.name.charAt(0).toUpperCase()}
                  </span>
                )}
              </div>
              <div className="min-w-0 flex-1">
                <p className="flex items-center gap-1 truncate text-sm font-medium">
                  {s.name}
                  {s.is_verified && <VerifiedBadge className="h-4 w-4" />}
                </p>
                <p className="flex items-center gap-3 text-xs text-muted-foreground">
                  <span className="inline-flex items-center gap-1">
                    <Eye className="h-3.5 w-3.5" /> {s.views}
                  </span>
                  <span className="inline-flex items-center gap-1">
                    <MessageCircle className="h-3.5 w-3.5" /> {s.contacts}
                  </span>
                </p>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
