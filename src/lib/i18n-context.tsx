"use client";

import { createContext, useContext } from "react";
import { defaultLocale, getDict, type Dict, type Locale } from "./i18n";

const LocaleContext = createContext<Locale>(defaultLocale);

/** Provides the server-resolved locale to client components (no hydration flicker). */
export function LocaleProvider({
  locale,
  children,
}: {
  locale: Locale;
  children: React.ReactNode;
}) {
  return <LocaleContext.Provider value={locale}>{children}</LocaleContext.Provider>;
}

export function useLocale(): Locale {
  return useContext(LocaleContext);
}

export function useT(): Dict {
  return getDict(useLocale());
}
