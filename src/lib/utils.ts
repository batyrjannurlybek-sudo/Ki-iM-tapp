import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/** Format a price for Kazakhstan (KZT) — e.g. "12 990 ₸". */
export function formatPrice(value: number, currency = "KZT") {
  if (currency === "KZT") {
    return `${new Intl.NumberFormat("ru-RU").format(value)} ₸`;
  }
  return new Intl.NumberFormat("ru-RU", { style: "currency", currency }).format(value);
}

/** Build a WhatsApp deep link with a pre-filled message. */
export function whatsappLink(phone: string | null | undefined, message: string) {
  if (!phone) return null;
  const digits = phone.replace(/[^\d]/g, "");
  return `https://wa.me/${digits}?text=${encodeURIComponent(message)}`;
}

/** Build a Google Maps link from coordinates or a free-text address. */
export function mapsLink(opts: { lat?: number | null; lng?: number | null; address?: string | null }) {
  if (opts.lat != null && opts.lng != null) {
    return `https://www.google.com/maps/search/?api=1&query=${opts.lat},${opts.lng}`;
  }
  if (opts.address) {
    return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(opts.address)}`;
  }
  return null;
}
