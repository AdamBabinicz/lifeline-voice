"use client";

import Link from "next/link";
import { useLanguage } from "@/components/language-provider";

export function Footer() {
  const { locale, t } = useLanguage();

  const openCookiePreferences = () => {
    if (typeof window !== "undefined") {
      window.dispatchEvent(new Event("open-cookie-settings"));
    }
  };

  return (
    <footer className="border-t border-border bg-background pb-16 sm:pb-6">
      <div className="mx-auto flex max-w-7xl flex-col gap-3 px-4 py-6 text-xs text-muted-foreground sm:flex-row sm:items-center sm:justify-between sm:px-6 lg:px-8">
        <p className="max-w-xl leading-relaxed">{t.footer_disclaimer}</p>
        <nav className="flex flex-wrap items-center gap-4 sm:gap-6 font-bold uppercase tracking-wider">
          <Link
            className="hover:text-primary transition-colors cursor-pointer"
            href={locale === "pl" ? "/polityka-prywatnosci" : "/privacy"}
          >
            {t.privacy_policy}
          </Link>
          <span className="text-muted-foreground">/</span>
          <Link
            className="hover:text-primary transition-colors cursor-pointer"
            href={locale === "pl" ? "/warunki-korzystania" : "/terms"}
          >
            {t.terms_of_service}
          </Link>
          <span className="text-muted-foreground">/</span>
          <button
            type="button"
            onClick={openCookiePreferences}
            className="hover:text-primary transition-colors uppercase cursor-pointer underline decoration-primary/50 underline-offset-4"
          >
            {t.cookie_settings}
          </button>
        </nav>
      </div>
    </footer>
  );
}
