import Link from "next/link";
import { getT } from "@/lib/i18n-server";

export default function NotFound() {
  const t = getT();
  return (
    <div className="py-24 text-center">
      <h1 className="text-2xl font-bold">{t.notFound}</h1>
      <p className="mt-2 text-sm text-muted-foreground">{t.notFoundText}</p>
      <Link href="/" className="mt-4 inline-block text-sm font-medium underline">
        {t.backHome}
      </Link>
    </div>
  );
}
