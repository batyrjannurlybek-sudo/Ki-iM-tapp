import { cookies } from "next/headers";
import { defaultLocale, getDict, LANG_COOKIE, locales, type Locale } from "./i18n";

/** Resolve the active locale from the request cookie (server components). */
export function getLocale(): Locale {
  const v = cookies().get(LANG_COOKIE)?.value as Locale | undefined;
  return v && locales.includes(v) ? v : defaultLocale;
}

/** Translation dictionary for the current request (server components). */
export function getT() {
  return getDict(getLocale());
}
