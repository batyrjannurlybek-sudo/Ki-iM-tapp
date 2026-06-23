"use client";

import { useEffect, useRef } from "react";
import { track } from "@/services/analytics-client";

/** Logs one 'view' event when a product page mounts. */
export function TrackView({ storeId, productId }: { storeId: string | null; productId: string }) {
  const logged = useRef(false);
  useEffect(() => {
    if (logged.current) return;
    logged.current = true;
    track("view", storeId, productId);
  }, [storeId, productId]);
  return null;
}
