"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Camera } from "lucide-react";
import { useT } from "@/lib/i18n-context";
import { uploadStoreLogo } from "@/services/stores-client";

export function StoreLogoUploader({
  storeId,
  name,
  logoUrl,
}: {
  storeId: string;
  name: string;
  logoUrl: string | null;
}) {
  const t = useT();
  const router = useRouter();
  const [url, setUrl] = useState(logoUrl);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onPick(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setBusy(true);
    setError(null);
    try {
      const newUrl = await uploadStoreLogo(storeId, file);
      setUrl(newUrl);
      router.refresh(); // updates the header avatar too
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="flex items-center gap-4 rounded-2xl border p-4">
      <label className="group relative h-16 w-16 shrink-0 cursor-pointer overflow-hidden rounded-2xl border bg-muted">
        {url ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={url} alt={name} className="h-full w-full object-cover" />
        ) : (
          <span className="flex h-full w-full items-center justify-center text-xl font-bold text-muted-foreground">
            {name.charAt(0).toUpperCase()}
          </span>
        )}
        <span className="absolute inset-0 flex items-center justify-center bg-black/40 opacity-0 transition-opacity group-hover:opacity-100">
          <Camera className="h-5 w-5 text-white" />
        </span>
        <input type="file" accept="image/*" className="hidden" onChange={onPick} disabled={busy} />
      </label>
      <div className="min-w-0">
        <p className="truncate font-semibold">{name}</p>
        <p className="text-xs text-muted-foreground">
          {busy ? t.uploading : error ? error : t.storeLogoHint}
        </p>
      </div>
    </div>
  );
}
