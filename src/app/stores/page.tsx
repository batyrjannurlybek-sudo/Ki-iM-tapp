import Link from "next/link";
import { getT } from "@/lib/i18n-server";
import { getAllStores } from "@/services/stores";

export const dynamic = "force-dynamic";

export default async function StoresPage() {
  const t = getT();
  const stores = await getAllStores();

  return (
    <div className="space-y-5">
      <h1 className="text-xl font-bold">{t.allStores}</h1>
      {stores.length === 0 ? (
        <p className="py-16 text-center text-sm text-muted-foreground">{t.noResults}</p>
      ) : (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
          {stores.map((s) => (
            <Link
              key={s.id}
              href={`/store/${s.slug}`}
              className="flex flex-col items-center gap-2 rounded-2xl border p-4 text-center transition hover:bg-accent"
            >
              <div className="h-16 w-16 overflow-hidden rounded-full bg-muted ring-1 ring-border">
                {s.logo_url ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={s.logo_url} alt={s.name} className="h-full w-full object-cover" />
                ) : (
                  <span className="flex h-full w-full items-center justify-center text-lg font-bold text-muted-foreground">
                    {s.name.charAt(0).toUpperCase()}
                  </span>
                )}
              </div>
              <span className="line-clamp-2 text-sm font-medium leading-tight">{s.name}</span>
              {s.address && (
                <span className="line-clamp-1 text-xs text-muted-foreground">{s.address}</span>
              )}
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
