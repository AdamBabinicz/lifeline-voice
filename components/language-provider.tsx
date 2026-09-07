"use client";

import {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
  useMemo,
} from "react";

export type Locale = "pl" | "en";

import en from "@/locales/en.json";
import pl from "@/locales/pl.json";

const translations: Record<Locale, typeof pl> = {
  pl,
  en,
};

type LanguageContextValue = {
  locale: Locale;
  t: typeof pl;
  setLocale: (locale: Locale) => void;
  toggleLocale: () => void;
  mounted: boolean;
};

const LanguageContext = createContext<LanguageContextValue | null>(null);

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  // Język polski jako dominujący / domyślny
  const [locale, setLocaleState] = useState<Locale>("pl");
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    try {
      const storedLocale = window.localStorage.getItem(
        "first-aid-locale",
      ) as Locale;
      if (storedLocale === "pl" || storedLocale === "en") {
        setLocaleState(storedLocale);
        document.documentElement.lang = storedLocale;
      } else {
        setLocaleState("pl");
        document.documentElement.lang = "pl";
      }
    } catch {
      setLocaleState("pl");
    } finally {
      setMounted(true);
    }
  }, []);

  const setLocale = useCallback((nextLocale: Locale) => {
    setLocaleState(nextLocale);
    try {
      window.localStorage.setItem("first-aid-locale", nextLocale);
      document.cookie = `first-aid-locale=${nextLocale}; path=/; max-age=31536000; SameSite=Lax`;
      document.documentElement.lang = nextLocale;
    } catch {
      // ignore
    }
  }, []);

  const toggleLocale = useCallback(() => {
    setLocaleState((prev) => {
      const next: Locale = prev === "pl" ? "en" : "pl";
      try {
        window.localStorage.setItem("first-aid-locale", next);
        document.cookie = `first-aid-locale=${next}; path=/; max-age=31536000; SameSite=Lax`;
        document.documentElement.lang = next;
      } catch {
        // ignore
      }
      return next;
    });
  }, []);

  // useMemo z bezpośrednią zależnością od locale gwarantuje aktualizację obiektu t
  const value = useMemo(
    () => ({
      locale,
      t: translations[locale] || translations.pl,
      setLocale,
      toggleLocale,
      mounted,
    }),
    [locale, mounted, setLocale, toggleLocale],
  );

  return (
    <LanguageContext.Provider value={value}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error("useLanguage must be used inside LanguageProvider");
  }
  return context;
}
