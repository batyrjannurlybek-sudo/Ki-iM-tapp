"use client";

import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import { ImagePlus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useT } from "@/lib/i18n-context";
import { updateStore, uploadStoreCover } from "@/services/stores-client";
import type { Store } from "@/types";

export function StoreSettingsForm({ store }: { store: Store }) {
  const t = useT();
  const router = useRouter();

  const [name, setName] = useState(store.name);
  const [description, setDescription] = useState(store.description ?? "");
  const [phone, setPhone] = useState(store.phone ?? "");
  const [whatsapp, setWhatsapp] = useState(store.whatsapp ?? "");
  const [instagram, setInstagram] = useState(store.instagram ?? "");
  const [address, setAddress] = useState(store.address ?? "");
  const [cover, setCover] = useState<File | null>(null);
  const [coverUrl, setCoverUrl] = useState(store.cover_url);

  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const coverPreview = useMemo(
    () => (cover ? URL.createObjectURL(cover) : coverUrl),
    [cover, coverUrl]
  );

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (!name.trim()) return setError(t.storeNameRequired);
    if (!whatsapp.trim()) return setError(t.whatsappRequired);

    setBusy(true);
    try {
      await updateStore(store.id, {
        name: name.trim(),
        description: description.trim() || null,
        phone: phone.trim() || null,
        whatsapp: whatsapp.trim(),
        instagram: instagram.trim() || null,
        address: address.trim() || null,
      });
      if (cover) await uploadStoreCover(store.id, cover);
      router.push("/dashboard");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
      setBusy(false);
    }
  }

  const label = "block text-sm font-medium";

  return (
    <form onSubmit={submit} className="mx-auto max-w-2xl space-y-5">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold">{t.storeSettings}</h1>
        <Button type="button" variant="ghost" size="sm" onClick={() => router.push("/dashboard")}>
          {t.back}
        </Button>
      </div>

      {/* Cover */}
      <div className="space-y-1.5">
        <span className={label}>{t.cover}</span>
        <label className="group relative block aspect-[16/6] w-full cursor-pointer overflow-hidden rounded-2xl border-2 border-dashed bg-muted">
          {coverPreview ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={coverPreview} alt="" className="h-full w-full object-cover" />
          ) : (
            <span className="flex h-full w-full flex-col items-center justify-center gap-1 text-muted-foreground">
              <ImagePlus className="h-6 w-6" />
              <span className="text-xs">{t.coverHint}</span>
            </span>
          )}
          <input type="file" accept="image/*" className="hidden"
            onChange={(e) => setCover(e.target.files?.[0] ?? null)} />
        </label>
      </div>

      <div className="space-y-3 rounded-2xl border p-5">
        <Field label={t.storeName} value={name} onChange={setName} required />
        <Field label={t.whatsappWithCode} value={whatsapp} onChange={setWhatsapp} required />
        <Field label={t.phone} value={phone} onChange={setPhone} />
        <Field label={t.instagramUrl} value={instagram} onChange={setInstagram} />
        <Field label={t.address} value={address} onChange={setAddress} />
        <label className="block text-sm font-medium">
          {t.description}
          <textarea rows={3} value={description} onChange={(e) => setDescription(e.target.value)}
            className="mt-1 w-full rounded-lg border border-input bg-background px-3 py-2 text-sm" />
        </label>
      </div>

      {error && <p className="rounded-lg bg-destructive/10 px-4 py-3 text-sm text-destructive">{error}</p>}

      <Button type="submit" disabled={busy} className="w-full" size="lg">
        {busy ? t.saving : t.save}
      </Button>
    </form>
  );
}

function Field({
  label,
  value,
  onChange,
  required,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  required?: boolean;
}) {
  return (
    <label className="block text-sm font-medium">
      {label} {required && <span className="text-destructive">*</span>}
      <Input className="mt-1" value={value} onChange={(e) => onChange(e.target.value)} />
    </label>
  );
}
