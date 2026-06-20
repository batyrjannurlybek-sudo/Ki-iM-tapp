"use client";

import { useCallback, useEffect, useState } from "react";

type FavoriteKind = "product" | "store";
const KEY = (kind: FavoriteKind) => `kiyim:fav:${kind}`;

function read(kind: FavoriteKind): string[] {
  if (typeof window === "undefined") return [];
  try {
    return JSON.parse(localStorage.getItem(KEY(kind)) ?? "[]");
  } catch {
    return [];
  }
}

/**
 * Anonymous favorites stored in localStorage — no login required to save items.
 * Syncs across tabs/components via a window event.
 */
export function useFavorites(kind: FavoriteKind) {
  const [ids, setIds] = useState<string[]>([]);

  useEffect(() => {
    setIds(read(kind));
    const onChange = () => setIds(read(kind));
    window.addEventListener("kiyim:fav-change", onChange);
    window.addEventListener("storage", onChange);
    return () => {
      window.removeEventListener("kiyim:fav-change", onChange);
      window.removeEventListener("storage", onChange);
    };
  }, [kind]);

  const toggle = useCallback(
    (id: string) => {
      const current = read(kind);
      const next = current.includes(id)
        ? current.filter((x) => x !== id)
        : [...current, id];
      localStorage.setItem(KEY(kind), JSON.stringify(next));
      window.dispatchEvent(new Event("kiyim:fav-change"));
    },
    [kind]
  );

  return { ids, isFavorite: (id: string) => ids.includes(id), toggle };
}
