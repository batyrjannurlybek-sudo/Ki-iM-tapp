"use client";

import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import { Camera } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useT } from "@/lib/i18n-context";
import { createClient } from "@/lib/supabase/client";
import { uploadStoreLogo } from "@/services/stores-client";

function slugify(s: string) {
  return s
    .toLowerCase()
    .trim()
    .replace(/[^\p{L}\p{N}]+/gu, "-")
    .replace(/^-+|-+$/g, "");
}

export function StoreRegisterForm() {
  const t = useT();
  const router = useRouter();

  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [whatsapp, setWhatsapp] = useState("");
  const [instagram, setInstagram] = useState("");
  const [address, setAddress] = useState("");
  const [description, setDescription] = useState("");
  const [logo, setLogo] = useState<File | null>(null);

  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const logoPreview = useMemo(() => (logo ? URL.createObjectURL(logo) : null), [logo]);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (!name.trim()) return setError(t.storeNameRequired);
    if (!whatsapp.trim()) return setError(t.whatsappRequired);
    if (!logo) return setError(t.logoRequired);

    setBusy(true);
    try {
      const supabase = createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      const slug = `${slugify(name)}-${Math.random().toString(36).slice(2, 6)}`;
      const { data, error: insertError } = await supabase
        .from("stores")
        .insert({
          owner_id: user.id,
          name: name.trim(),
          slug,
          phone: phone.trim() || null,
          whatsapp: whatsapp.trim(),
          instagram: instagram.trim() || null,
          address: address.trim() || null,
          description: description.trim() || null,
          status: "pending",
        })
        .select("id")
        .single();
      if (insertError) throw insertError;

      // Upload the logo now that the store row (and its id) exists.
      await uploadStoreLogo(data.id as string, logo);

      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
      setBusy(false);
    }
  }

  return (
    <form onSubmit={submit} className="space-y-4 rounded-2xl border p-5">
      <div>
        <h2 className="font-semibold">{t.registerStore}</h2>
        <p className="text-sm text-muted-foreground">{t.registerHint}</p>
      </div>

      {/* Logo (required) */}
      <div className="flex items-center gap-4">
        <label className="group relative h-20 w-20 shrink-0 cursor-pointer overflow-hidden rounded-2xl border-2 border-dashed bg-muted">
          {logoPreview ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={logoPreview} alt="" className="h-full w-full object-cover" />
          ) : (
            <span className="flex h-full w-full flex-col items-center justify-center gap-1 text-muted-foreground">
              <Camera className="h-5 w-5" />
              <span className="text-[10px]">{t.storeLogo}</span>
            </span>
          )}
          <input
            type="file"
            accept="image/*"
            className="hidden"
            onChange={(e) => setLogo(e.target.files?.[0] ?? null)}
          />
        </label>
        <p className="text-xs text-muted-foreground">{t.storeLogoHint}</p>
      </div>

      <Field label={t.storeName} value={name} onChange={setName} required />
      <Field label={t.whatsappWithCode} value={whatsapp} onChange={setWhatsapp} placeholder="+7700…" required />
      <Field label={t.phone} value={phone} onChange={setPhone} />
      <Field label={t.instagramUrl} value={instagram} onChange={setInstagram} />
      <Field label={t.address} value={address} onChange={setAddress} />
      <label className="block text-sm font-medium">
        {t.description}
        <textarea
          rows={3}
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          className="mt-1 w-full rounded-lg border border-input bg-background px-3 py-2 text-sm"
        />
      </label>

      {error && <p className="rounded-lg bg-destructive/10 px-4 py-3 text-sm text-destructive">{error}</p>}

      <Button type="submit" disabled={busy}>
        {busy ? t.uploading : t.submitApproval}
      </Button>
    </form>
  );
}

function Field({
  label,
  value,
  onChange,
  placeholder,
  required,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  required?: boolean;
}) {
  return (
    <label className="block text-sm font-medium">
      {label} {required && <span className="text-destructive">*</span>}
      <Input
        className="mt-1"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
      />
    </label>
  );
}
