import type { Metadata, Viewport } from "next";
import "./globals.css";
import { SiteHeader } from "@/components/site-header";
import { BottomNav } from "@/components/bottom-nav";
import { LocaleProvider } from "@/lib/i18n-context";
import { getLocale } from "@/lib/i18n-server";

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: "Ki-iM | tapp — Find clothing in your city",
    template: "%s · Ki-iM | tapp",
  },
  description:
    "Discover clothing across local stores in Aktobe. Search products, compare prices, find stores, and try in person.",
  manifest: "/manifest.webmanifest",
  openGraph: {
    siteName: "Ki-iM | tapp",
    type: "website",
  },
};

export const viewport: Viewport = {
  themeColor: "#ffffff",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  const locale = getLocale();
  return (
    <html lang={locale}>
      <body className="min-h-screen">
        <LocaleProvider locale={locale}>
          <SiteHeader />
          <main className="container py-6 pb-24 md:pb-6">{children}</main>
          <BottomNav />
        </LocaleProvider>
      </body>
    </html>
  );
}
