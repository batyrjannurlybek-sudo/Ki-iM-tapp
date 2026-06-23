"use client";

import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import { Download, Upload } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useT } from "@/lib/i18n-context";
import { tpl } from "@/lib/i18n";
import { bulkCreateProducts, type BulkProductItem } from "@/services/products-client";
import type { Category, Gender } from "@/types";

const HEADERS = ["title", "price", "category", "gender", "brand", "color", "sizes", "stock", "description", "images"];

/** Minimal CSV parser supporting quoted fields and `,` or `;` delimiters. */
function parseCSV(text: string): string[][] {
  const firstLine = text.split(/\r?\n/)[0] ?? "";
  const delimiter = (firstLine.match(/;/g)?.length ?? 0) > (firstLine.match(/,/g)?.length ?? 0) ? ";" : ",";
  const rows: string[][] = [];
  let row: string[] = [];
  let field = "";
  let inQuotes = false;
  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (inQuotes) {
      if (c === '"') {
        if (text[i + 1] === '"') { field += '"'; i++; }
        else inQuotes = false;
      } else field += c;
    } else if (c === '"') inQuotes = true;
    else if (c === delimiter) { row.push(field); field = ""; }
    else if (c === "\n") { row.push(field); rows.push(row); row = []; field = ""; }
    else if (c !== "\r") field += c;
  }
  if (field.length > 0 || row.length > 0) { row.push(field); rows.push(row); }
  return rows.filter((r) => r.some((c) => c.trim() !== ""));
}

const GENDERS: Gender[] = ["men", "women", "unisex", "kids"];
const RU_GENDER: Record<string, Gender> = {
  мужское: "men", мужчинам: "men", женское: "women", женщинам: "women",
  унисекс: "unisex", детское: "kids", детям: "kids",
};

type ParsedRow = BulkProductItem & { valid: boolean };

export function ProductImport({ storeId, categories }: { storeId: string; categories: Category[] }) {
  const t = useT();
  const router = useRouter();
  const [rows, setRows] = useState<ParsedRow[]>([]);
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);

  // category lookup: slug + localized names (ru/kk) -> id
  const catMap = useMemo(() => {
    const m = new Map<string, string>();
    const loc = (key: keyof typeof t) => String(t[key] ?? "").toLowerCase();
    for (const c of categories) {
      m.set(c.slug.toLowerCase(), c.id);
      m.set(c.name.toLowerCase(), c.id);
      const localized = loc(`cat_${c.slug}` as keyof typeof t);
      if (localized) m.set(localized, c.id);
    }
    return m;
  }, [categories, t]);

  function resolveCategory(value: string): string | null {
    const key = value.trim().toLowerCase();
    return catMap.get(key) ?? null;
  }

  function handleFile(file: File) {
    setError(null);
    setDone(null);
    const reader = new FileReader();
    reader.onload = () => {
      const grid = parseCSV(String(reader.result ?? ""));
      if (grid.length < 2) return setError(t.importEmpty);
      const header = grid[0].map((h) => h.trim().toLowerCase());
      const idx = (name: string) => header.indexOf(name);
      const parsed: ParsedRow[] = grid.slice(1).map((cells) => {
        const get = (name: string) => {
          const i = idx(name);
          return i >= 0 ? (cells[i] ?? "").trim() : "";
        };
        const title = get("title");
        const price = Number(get("price").replace(/[^\d.]/g, "")) || 0;
        const genderRaw = get("gender").toLowerCase();
        const gender: Gender = GENDERS.includes(genderRaw as Gender)
          ? (genderRaw as Gender)
          : RU_GENDER[genderRaw] ?? "unisex";
        const sizes = get("sizes").split(/[;,]/).map((s) => s.trim()).filter(Boolean);
        const images = get("images").split(/[;\n]/).map((s) => s.trim()).filter(Boolean);
        return {
          input: {
            title,
            description: get("description") || null,
            category_id: resolveCategory(get("category")),
            gender,
            brand: get("brand") || null,
            color: get("color") || null,
            price,
            sizes,
            stock_quantity: Number(get("stock")) || 1,
            status: "draft",
          },
          images,
          valid: title.length > 0,
        };
      });
      setRows(parsed);
    };
    reader.readAsText(file, "utf-8");
  }

  function downloadTemplate() {
    const sample =
      "Куртка зимняя,25000,men,men,Nike,Чёрный,M;L;XL,5,Тёплая зимняя куртка,https://example.com/photo.jpg";
    const csv = `${HEADERS.join(",")}\n${sample}\n`;
    const blob = new Blob(["﻿" + csv], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "kiyim-template.csv";
    a.click();
    URL.revokeObjectURL(url);
  }

  async function runImport() {
    const valid = rows.filter((r) => r.valid);
    if (valid.length === 0) return;
    setBusy(true);
    setError(null);
    try {
      const n = await bulkCreateProducts(storeId, valid.map(({ input, images }) => ({ input, images })));
      setDone(n);
      setRows([]);
      router.refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setBusy(false);
    }
  }

  const validCount = rows.filter((r) => r.valid).length;

  return (
    <div className="mx-auto max-w-2xl space-y-5">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold">{t.importProducts}</h1>
        <Button variant="ghost" size="sm" onClick={() => router.push("/dashboard")}>{t.back}</Button>
      </div>

      <p className="rounded-lg bg-muted px-4 py-3 text-sm text-muted-foreground">{t.importHint}</p>

      <div className="flex flex-wrap gap-3">
        <Button variant="outline" onClick={downloadTemplate}>
          <Download className="h-4 w-4" /> {t.downloadTemplate}
        </Button>
        <label className="inline-flex h-11 cursor-pointer items-center gap-2 rounded-lg bg-primary px-5 text-sm font-medium text-primary-foreground hover:bg-primary/90">
          <Upload className="h-4 w-4" /> {t.selectFile}
          <input
            type="file"
            accept=".csv,text/csv"
            className="hidden"
            onChange={(e) => e.target.files?.[0] && handleFile(e.target.files[0])}
          />
        </label>
      </div>

      {done !== null && (
        <p className="rounded-lg bg-green-50 px-4 py-3 text-sm text-green-700">{tpl(t.importDone, { n: done })}</p>
      )}
      {error && <p className="rounded-lg bg-destructive/10 px-4 py-3 text-sm text-destructive">{error}</p>}

      {rows.length > 0 && (
        <div className="space-y-3">
          <p className="text-sm font-medium">{tpl(t.rowsFound, { n: validCount })}</p>
          <div className="overflow-hidden rounded-xl border">
            <div className="max-h-80 overflow-auto">
              <table className="w-full text-left text-xs">
                <thead className="sticky top-0 bg-muted">
                  <tr>
                    <th className="p-2">title</th>
                    <th className="p-2">price</th>
                    <th className="p-2">gender</th>
                    <th className="p-2">sizes</th>
                    <th className="p-2">img</th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map((r, i) => (
                    <tr key={i} className={r.valid ? "" : "bg-destructive/5 text-muted-foreground"}>
                      <td className="p-2">{r.input.title || "—"}</td>
                      <td className="p-2">{r.input.price}</td>
                      <td className="p-2">{r.input.gender}</td>
                      <td className="p-2">{r.input.sizes.join(" ")}</td>
                      <td className="p-2">{r.images.length}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
          <Button onClick={runImport} disabled={busy || validCount === 0} className="w-full" size="lg">
            {busy ? t.importing : tpl(t.importBtn, { n: validCount })}
          </Button>
        </div>
      )}
    </div>
  );
}
