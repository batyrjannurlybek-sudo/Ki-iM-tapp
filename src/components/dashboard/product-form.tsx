"use client";

import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import { ImagePlus, Video, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useT } from "@/lib/i18n-context";
import { categoryName } from "@/lib/i18n";
import {
  addImages,
  addVideos,
  createProduct,
  deleteProductImage,
  deleteProductVideo,
  updateProduct,
} from "@/services/products-client";
import type { Category, Gender, Product, ProductImage, ProductStatus, ProductVideo } from "@/types";

type Mode = "create" | "edit";

export function ProductForm({
  mode,
  storeId,
  categories,
  product,
  initialImages = [],
  initialVideos = [],
}: {
  mode: Mode;
  storeId: string;
  categories: Category[];
  product?: Product;
  initialImages?: ProductImage[];
  initialVideos?: ProductVideo[];
}) {
  const t = useT();
  const router = useRouter();

  const [title, setTitle] = useState(product?.title ?? "");
  const [price, setPrice] = useState(product ? String(product.price) : "");
  const [categoryId, setCategoryId] = useState(product?.category_id ?? "");
  const [gender, setGender] = useState<Gender>(product?.gender ?? "unisex");
  const [brand, setBrand] = useState(product?.brand ?? "");
  const [color, setColor] = useState(product?.color ?? "");
  const [stock, setStock] = useState(product ? String(product.stock_quantity) : "1");
  const [sizes, setSizes] = useState(product?.sizes?.join(", ") ?? "");
  const [description, setDescription] = useState(product?.description ?? "");

  const [existingImages, setExistingImages] = useState<ProductImage[]>(initialImages);
  const [existingVideos, setExistingVideos] = useState<ProductVideo[]>(initialVideos);
  const [newImages, setNewImages] = useState<File[]>([]);
  const [newVideos, setNewVideos] = useState<File[]>([]);

  const [busy, setBusy] = useState<null | "draft" | "publish">(null);
  const [error, setError] = useState<string | null>(null);

  const newImagePreviews = useMemo(() => newImages.map((f) => URL.createObjectURL(f)), [newImages]);
  const totalImages = existingImages.length + newImages.length;

  function buildInput(status: ProductStatus) {
    return {
      title: title.trim(),
      description: description.trim() || null,
      category_id: categoryId || null,
      gender,
      brand: brand.trim() || null,
      color: color.trim() || null,
      price: Number(price) || 0,
      sizes: sizes.split(",").map((s) => s.trim()).filter(Boolean),
      stock_quantity: Number(stock) || 0,
      status,
    };
  }

  async function removeExistingImage(id: string) {
    await deleteProductImage(id);
    setExistingImages((xs) => xs.filter((x) => x.id !== id));
  }
  async function removeExistingVideo(id: string) {
    await deleteProductVideo(id);
    setExistingVideos((xs) => xs.filter((x) => x.id !== id));
  }

  async function submit(intent: "draft" | "publish") {
    setError(null);
    if (!title.trim()) return setError(t.titleRequired);
    if (intent === "publish") {
      if (!Number(price)) return setError(t.publishNeedsPrice);
      if (totalImages === 0) return setError(t.publishNeedsImage);
    }
    const status: ProductStatus = intent === "publish" ? "published" : "draft";

    setBusy(intent);
    try {
      if (mode === "create") {
        await createProduct(storeId, buildInput(status), newImages, newVideos);
      } else if (product) {
        await updateProduct(product.id, buildInput(status));
        if (newImages.length) await addImages(product.id, storeId, newImages, existingImages.length === 0);
        if (newVideos.length) await addVideos(product.id, storeId, newVideos);
      }
      router.push("/dashboard");
      router.refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
      setBusy(null);
    }
  }

  const label = "block text-sm font-medium";
  const fieldWrap = "space-y-1.5";

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold">{mode === "create" ? t.newProduct : t.editProduct}</h1>
        <Button variant="ghost" size="sm" onClick={() => router.push("/dashboard")}>
          {t.back}
        </Button>
      </div>

      <div className="space-y-4 rounded-2xl border p-5">
        {/* Photos */}
        <div className={fieldWrap}>
          <span className={label}>{t.photos}</span>
          <div className="flex flex-wrap gap-2">
            {existingImages.map((img, i) => (
              <Thumb key={img.id} src={img.url} primary={i === 0 ? t.primaryPhoto : undefined}
                onRemove={() => removeExistingImage(img.id)} />
            ))}
            {newImagePreviews.map((src, i) => (
              <Thumb key={src} src={src}
                primary={existingImages.length === 0 && i === 0 ? t.primaryPhoto : undefined}
                onRemove={() => setNewImages((xs) => xs.filter((_, j) => j !== i))} />
            ))}
            <label className="flex h-20 w-20 cursor-pointer flex-col items-center justify-center gap-1 rounded-lg border-2 border-dashed text-muted-foreground hover:bg-accent">
              <ImagePlus className="h-5 w-5" />
              <span className="text-[10px]">{t.addPhotos}</span>
              <input
                type="file"
                accept="image/*"
                multiple
                className="hidden"
                onChange={(e) => setNewImages((xs) => [...xs, ...Array.from(e.target.files ?? [])])}
              />
            </label>
          </div>
        </div>

        {/* Video */}
        <div className={fieldWrap}>
          <span className={label}>{t.video} <span className="text-muted-foreground">{t.optional}</span></span>
          <div className="flex flex-wrap gap-2">
            {existingVideos.map((v) => (
              <VideoThumb key={v.id} src={v.url} onRemove={() => removeExistingVideo(v.id)} />
            ))}
            {newVideos.map((f, i) => (
              <div key={i} className="flex h-20 items-center gap-2 rounded-lg border px-3 text-xs">
                <Video className="h-4 w-4" />
                <span className="max-w-[120px] truncate">{f.name}</span>
                <button onClick={() => setNewVideos((xs) => xs.filter((_, j) => j !== i))}>
                  <X className="h-4 w-4" />
                </button>
              </div>
            ))}
            <label className="flex h-20 w-20 cursor-pointer flex-col items-center justify-center gap-1 rounded-lg border-2 border-dashed text-muted-foreground hover:bg-accent">
              <Video className="h-5 w-5" />
              <span className="text-[10px]">{t.addVideo}</span>
              <input
                type="file"
                accept="video/*"
                multiple
                className="hidden"
                onChange={(e) => setNewVideos((xs) => [...xs, ...Array.from(e.target.files ?? [])])}
              />
            </label>
          </div>
        </div>

        {/* Core fields */}
        <div className={fieldWrap}>
          <label className={label} htmlFor="title">{t.title}</label>
          <Input id="title" value={title} onChange={(e) => setTitle(e.target.value)} autoFocus />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div className={fieldWrap}>
            <label className={label} htmlFor="price">{t.priceKzt}</label>
            <Input id="price" type="number" inputMode="numeric" value={price} onChange={(e) => setPrice(e.target.value)} />
          </div>
          <div className={fieldWrap}>
            <label className={label} htmlFor="stock">{t.stock}</label>
            <Input id="stock" type="number" inputMode="numeric" value={stock} onChange={(e) => setStock(e.target.value)} />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div className={fieldWrap}>
            <label className={label}>{t.category}</label>
            <select value={categoryId} onChange={(e) => setCategoryId(e.target.value)}
              className="h-11 w-full rounded-lg border border-input bg-background px-3 text-sm">
              <option value="">{t.selectCategory}</option>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>{categoryName(c.slug, c.name, t)}</option>
              ))}
            </select>
          </div>
          <div className={fieldWrap}>
            <label className={label}>{t.gender}</label>
            <select value={gender} onChange={(e) => setGender(e.target.value as Gender)}
              className="h-11 w-full rounded-lg border border-input bg-background px-3 text-sm">
              <option value="unisex">{t.gender_unisex}</option>
              <option value="men">{t.gender_men}</option>
              <option value="women">{t.gender_women}</option>
              <option value="kids">{t.gender_kids}</option>
            </select>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div className={fieldWrap}>
            <label className={label} htmlFor="brand">{t.brand} <span className="text-muted-foreground">{t.optional}</span></label>
            <Input id="brand" value={brand} onChange={(e) => setBrand(e.target.value)} />
          </div>
          <div className={fieldWrap}>
            <label className={label} htmlFor="color">{t.color}</label>
            <Input id="color" value={color} onChange={(e) => setColor(e.target.value)} />
          </div>
        </div>

        <div className={fieldWrap}>
          <label className={label} htmlFor="sizes">{t.sizesComma}</label>
          <Input id="sizes" value={sizes} onChange={(e) => setSizes(e.target.value)} placeholder="S, M, L, XL" />
        </div>

        <div className={fieldWrap}>
          <label className={label} htmlFor="desc">{t.description}</label>
          <textarea id="desc" rows={3} value={description} onChange={(e) => setDescription(e.target.value)}
            className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm" />
        </div>
      </div>

      {error && <p className="rounded-lg bg-destructive/10 px-4 py-3 text-sm text-destructive">{error}</p>}

      <div className="sticky bottom-0 flex gap-3 bg-background/90 py-3 backdrop-blur">
        <Button variant="outline" className="flex-1" disabled={busy !== null} onClick={() => submit("draft")}>
          {busy === "draft" ? t.saving : t.saveDraft}
        </Button>
        <Button className="flex-1" disabled={busy !== null} onClick={() => submit("publish")}>
          {busy === "publish" ? t.uploading : t.publishProduct}
        </Button>
      </div>
    </div>
  );
}

function Thumb({ src, primary, onRemove }: { src: string; primary?: string; onRemove: () => void }) {
  return (
    <div className="relative h-20 w-20 overflow-hidden rounded-lg border">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={src} alt="" className="h-full w-full object-cover" />
      {primary && (
        <span className="absolute bottom-0 left-0 right-0 bg-black/60 text-center text-[9px] text-white">
          {primary}
        </span>
      )}
      <button onClick={onRemove} className="absolute right-0.5 top-0.5 rounded-full bg-white/90 p-0.5 shadow">
        <X className="h-3 w-3" />
      </button>
    </div>
  );
}

function VideoThumb({ src, onRemove }: { src: string; onRemove: () => void }) {
  return (
    <div className="relative h-20 w-20 overflow-hidden rounded-lg border bg-black">
      <video src={src} className="h-full w-full object-cover" />
      <button onClick={onRemove} className="absolute right-0.5 top-0.5 rounded-full bg-white/90 p-0.5 shadow">
        <X className="h-3 w-3" />
      </button>
    </div>
  );
}
