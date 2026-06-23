"use client";

import { track } from "@/services/analytics-client";

/** A WhatsApp/contact link that logs a 'contact' event before opening. */
export function ContactLink({
  href,
  storeId,
  productId,
  className,
  children,
}: {
  href: string;
  storeId: string | null;
  productId?: string | null;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className={className}
      onClick={() => track("contact", storeId, productId)}
    >
      {children}
    </a>
  );
}
