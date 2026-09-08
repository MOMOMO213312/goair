import { createContext, useContext, useEffect, useState, type ReactNode } from "react";

import { DEFAULT_LANGUAGE, translations, type Language, type TranslationKey } from "./translations";

const STORAGE_KEY = "goair_lang";

type LanguageContextValue = {
  language: Language;
  setLanguage: (lang: Language) => void;
  dir: "rtl" | "ltr";
};

const LanguageContext = createContext<LanguageContextValue | null>(null);

function readStoredLanguage(): Language {
  if (typeof window === "undefined") return DEFAULT_LANGUAGE;
  const stored = window.localStorage.getItem(STORAGE_KEY);
  return stored === "ar" || stored === "en" ? stored : DEFAULT_LANGUAGE;
}

/**
 * Wrap the app in this once, in __root.tsx, above <SiteHeader />/<Outlet />/<SiteFooter />.
 *
 * SSR always renders Arabic/RTL (matches the <html lang="ar" dir="rtl"> in the shell).
 * On the client, we read the saved preference right after mount and flip <html> if the
 * visitor previously chose English — this trades a possible one-frame flash for simplicity
 * (no cookie-reading on the server). If that flash becomes a real problem later, move the
 * language read into a server-side cookie check in __root's loader instead.
 */
export function LanguageProvider({ children }: { children: ReactNode }) {
  const [language, setLanguageState] = useState<Language>(DEFAULT_LANGUAGE);

  useEffect(() => {
    setLanguageState(readStoredLanguage());
  }, []);

  useEffect(() => {
    document.documentElement.lang = language;
    document.documentElement.dir = language === "ar" ? "rtl" : "ltr";
  }, [language]);

  const setLanguage = (lang: Language) => {
    setLanguageState(lang);
    window.localStorage.setItem(STORAGE_KEY, lang);
  };

  return (
    <LanguageContext.Provider
      value={{ language, setLanguage, dir: language === "ar" ? "rtl" : "ltr" }}
    >
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const ctx = useContext(LanguageContext);
  if (!ctx) {
    throw new Error("useLanguage must be used inside <LanguageProvider>");
  }
  return ctx;
}

function getNestedValue(dict: unknown, path: string): string | undefined {
  return path.split(".").reduce<unknown>((acc, key) => {
    if (acc && typeof acc === "object" && key in (acc as Record<string, unknown>)) {
      return (acc as Record<string, unknown>)[key];
    }
    return undefined;
  }, dict) as string | undefined;
}

/**
 * const { t } = useTranslation();
 * t("home.hero.title")
 * t("home.hero.statCountryPlural", { count: 2 })  // {{count}} inside the string gets replaced
 */
export function useTranslation() {
  const { language } = useLanguage();

  const t = (key: TranslationKey, vars?: Record<string, string | number>): string => {
    const raw =
      getNestedValue(translations[language], key) ??
      getNestedValue(translations[DEFAULT_LANGUAGE], key) ??
      key;

    if (!vars) return raw;

    return Object.entries(vars).reduce(
      (str, [varKey, varValue]) => str.replaceAll(`{{${varKey}}}`, String(varValue)),
      raw,
    );
  };

  return { t, language };
}
