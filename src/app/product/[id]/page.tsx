import Link from "next/link";
import { notFound } from "next/navigation";
import { AlertTriangle, MapPin, MessageCircle, Store as StoreIcon } from "lucide-react";
import { ProductGallery } from "@/components/product-gallery";
import { Badge } from "@/components/ui/badge";
import type { Metadata } from "next";
import { getProductById } from "@/services/products";
import { formatPrice, mapsLink, whatsappLink } from "@/lib/utils";
import { getT } from "@/lib/i18n-server";
import { tpl } from "@/lib/i18n";

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: { params: { id: string } }): Promise<Metadata> {
  const product = await getProductById(params.id);
  if (!product) return { title: "Ki-iM | tapp" };
  const title = `${product.title} — ${formatPrice(product.price, product.currency)}`;
  const description =
    product.description?.slice(0, 160) ||
    `${product.title}${product.store?.name ? ` · ${product.store.name}` : ""}`;
  const image = product.images?.[0];
  return {
    title,
    description,
    openGraph: { title, description, images: image ? [image] : [] },
  };
}

export default async function ProductPage({ params }: { params: { id: string } }) {
  const t = getT();
  const product = await getProductById(params.id);
  if (!product) notFound();

  const store = product.store;
  const maps = store ? mapsLink({ lat: store.lat, lng: store.lng, address: store.address }) : null;
  const wa = whatsappLink(
    store?.whatsapp,
    tpl(t.productWaMessage, {
      title: product.title,
      price: formatPrice(product.price, product.currency),
    })
  );

  return (
    <div className="grid gap-8 md:grid-cols-2">
      <ProductGallery images={product.images} videoUrl={product.videos[0] ?? null} title={product.title} />

      <div className="space-y-5">
        <div>
          <h1 className="text-2xl font-bold">{product.title}</h1>
          <p className="mt-1 text-2xl font-semibold">
            {formatPrice(product.price, product.currency)}
          </p>
        </div>

        {product.stock_quantity === 0 && <Badge variant="muted">{t.outOfStock}</Badge>}

        {product.sizes.length > 0 && (
          <div className="space-y-2">
            <p className="text-sm font-medium">{t.availableSizes}</p>
            <div className="flex flex-wrap gap-2">
              {product.sizes.map((s) => (
                <span key={s} className="rounded-lg border px-3 py-1.5 text-sm">
                  {s}
                </span>
              ))}
            </div>
          </div>
        )}

        {product.description && (
          <p className="whitespace-pre-line text-sm leading-relaxed text-muted-foreground">
            {product.description}
          </p>
        )}

        {/* Availability disclaimer for buyers */}
        <div className="flex items-start gap-2 rounded-xl bg-amber-50 px-3 py-2.5 text-sm text-amber-800">
          <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
          <span>{t.availabilityWarning}</span>
        </div>

        {store && (
          <div className="space-y-3 rounded-2xl border p-4">
            <Link href={`/store/${store.slug}`} className="flex items-center gap-3">
              <div className="h-10 w-10 overflow-hidden rounded-full bg-muted">
                {store.logo_url && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={store.logo_url} alt={store.name} className="h-full w-full object-cover" />
                )}
              </div>
              <div>
                <p className="font-medium">{store.name}</p>
                {store.address && (
                  <p className="line-clamp-1 text-xs text-muted-foreground">{store.address}</p>
                )}
              </div>
            </Link>

            <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
              {wa && (
                <a
                  href={wa}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex h-11 items-center justify-center gap-2 rounded-lg bg-[#25D366] text-sm font-medium text-white hover:bg-[#1ebe5b]"
                >
                  <MessageCircle className="h-4 w-4" /> {t.whatsapp}
                </a>
              )}
              {maps && (
                <a
                  href={maps}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex h-11 items-center justify-center gap-2 rounded-lg border text-sm font-medium hover:bg-accent"
                >
                  <MapPin className="h-4 w-4" /> {t.openMaps}
                </a>
              )}
              <Link
                href={`/store/${store.slug}`}
                className="flex h-11 items-center justify-center gap-2 rounded-lg border text-sm font-medium hover:bg-accent sm:col-span-2"
              >
                <StoreIcon className="h-4 w-4" /> {t.viewStore}
              </Link>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
