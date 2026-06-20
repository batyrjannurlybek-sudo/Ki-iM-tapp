import { notFound } from "next/navigation";
import { Instagram, MapPin, MessageCircle } from "lucide-react";
import { ProductGrid } from "@/components/product-grid";
import type { Metadata } from "next";
import { getStoreBySlug, getStoreProducts } from "@/services/stores";
import { mapsLink, whatsappLink } from "@/lib/utils";
import { getT } from "@/lib/i18n-server";
import { tpl } from "@/lib/i18n";

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: { params: { slug: string } }): Promise<Metadata> {
  const store = await getStoreBySlug(params.slug);
  if (!store) return { title: "Ki-iM | tapp" };
  const description = store.description?.slice(0, 160) || `${store.name}${store.address ? ` · ${store.address}` : ""}`;
  return {
    title: `${store.name} — Ki-iM | tapp`,
    description,
    openGraph: {
      title: store.name,
      description,
      images: store.cover_url || store.logo_url ? [store.cover_url || store.logo_url!] : [],
    },
  };
}

export default async function StorePage({ params }: { params: { slug: string } }) {
  const t = getT();
  const store = await getStoreBySlug(params.slug);
  if (!store) notFound();

  const products = await getStoreProducts(store.id);
  const maps = mapsLink({ lat: store.lat, lng: store.lng, address: store.address });
  const wa = whatsappLink(store.whatsapp, tpl(t.storeWaMessage, { name: store.name }));

  return (
    <div className="space-y-6">
      <div className="relative h-40 w-full overflow-hidden rounded-2xl bg-muted sm:h-56">
        {store.cover_url && (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={store.cover_url} alt="" className="h-full w-full object-cover" />
        )}
      </div>

      <div className="flex items-start gap-4">
        <div className="-mt-12 h-20 w-20 shrink-0 overflow-hidden rounded-2xl border-4 border-background bg-muted">
          {store.logo_url && (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={store.logo_url} alt={store.name} className="h-full w-full object-cover" />
          )}
        </div>
        <div className="flex-1 space-y-1">
          <h1 className="text-xl font-bold">{store.name}</h1>
          {store.description && (
            <p className="text-sm text-muted-foreground">{store.description}</p>
          )}
        </div>
      </div>

      <div className="flex flex-wrap gap-2">
        {wa && (
          <a href={wa} target="_blank" rel="noopener noreferrer"
            className="flex h-10 items-center gap-2 rounded-lg bg-[#25D366] px-4 text-sm font-medium text-white">
            <MessageCircle className="h-4 w-4" /> {t.whatsapp}
          </a>
        )}
        {maps && (
          <a href={maps} target="_blank" rel="noopener noreferrer"
            className="flex h-10 items-center gap-2 rounded-lg border px-4 text-sm font-medium hover:bg-accent">
            <MapPin className="h-4 w-4" /> {t.map}
          </a>
        )}
        {store.instagram && (
          <a href={store.instagram} target="_blank" rel="noopener noreferrer"
            className="flex h-10 items-center gap-2 rounded-lg border px-4 text-sm font-medium hover:bg-accent">
            <Instagram className="h-4 w-4" /> {t.instagram}
          </a>
        )}
      </div>

      <div className="space-y-4">
        <h2 className="text-lg font-semibold">{t.products} ({products.length})</h2>
        <ProductGrid products={products} />
      </div>
    </div>
  );
}
