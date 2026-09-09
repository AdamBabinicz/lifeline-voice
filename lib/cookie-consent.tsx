"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { ShieldCheck, Settings2, X } from "lucide-react";
import { useLanguage } from "@/components/language-provider";

interface CookiePreferences {
  essential: boolean;
  analytics: boolean;
  marketing: boolean;
}

declare global {
  interface Window {
    dataLayer: any[];
    gtag?: (...args: any[]) => void;
  }
}

const COOKIE_STORAGE_KEY = "lifeline_cookie_consent_v1";

const fallbackTranslations = {
  cookies_title: "PRYWATNOŚĆ I PLIKI COOKIES",
  cookies_description:
    "Używamy niezbędnych plików cookies do działania systemu oraz opcjonalnych narzędzi analitycznych (Google Analytics 4 / GTM) w celu analizy stabilności i optymalizacji czasu reakcji interfejsu. Wybierz, na co wyrażasz zgodę.",
  cookies_necessary_title: "Niezbędne (Wymagane)",
  cookies_necessary_desc:
    "Kluczowe dla działania interfejsu ratunkowego, preferencji językowych i zapamiętania decyzji o prywatności. Zawsze aktywne.",
  cookies_analytics_title: "Analityczne (Google Analytics / GTM)",
  cookies_analytics_desc:
    "Anonimowe dane telemetryczne pomagające mierzyć wydajność i stabilność działania aplikacji w sytuacjach awaryjnych.",
  cookies_always_active: "ZAWSZE AKTYWNE",
  cookies_accept_all: "AKCEPTUJ WSZYSTKIE",
  cookies_reject_optional: "ODRZUĆ OPCJONALNE",
  cookies_customize: "USTAWIENIA",
  cookies_save: "ZAPISZ WYBÓR",
  cookies_close: "ZAMKNIJ",
};

export function CookieConsent() {
  const langContext = useLanguage();
  const t = langContext?.t || fallbackTranslations;

  const [mounted, setMounted] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [showDetails, setShowDetails] = useState(false);
  const [preferences, setPreferences] = useState<CookiePreferences>({
    essential: true,
    analytics: false,
    marketing: false,
  });

  const sendGtagUpdate = (prefs: CookiePreferences) => {
    if (typeof window === "undefined") return;

    window.dataLayer = window.dataLayer || [];
    if (!window.gtag) {
      window.gtag = function () {
        window.dataLayer.push(arguments);
      };
    }

    const analyticsState = prefs.analytics ? "granted" : "denied";
    const marketingState = prefs.marketing ? "granted" : "denied";

    window.gtag("consent", "update", {
      analytics_storage: analyticsState,
      ad_storage: marketingState,
      ad_user_data: marketingState,
      ad_personalization: marketingState,
    });

    window.dataLayer.push({
      event: "consent_update",
      consent_analytics: prefs.analytics,
      consent_marketing: prefs.marketing,
    });
  };

  useEffect(() => {
    setMounted(true);
    try {
      const stored = localStorage.getItem(COOKIE_STORAGE_KEY);
      if (!stored) {
        setIsOpen(true);
      } else {
        const parsed: CookiePreferences = JSON.parse(stored);
        setPreferences(parsed);
        sendGtagUpdate(parsed);
      }
    } catch {
      setIsOpen(true);
    }

    const handleOpenSettings = () => {
      setIsOpen(true);
      setShowDetails(true);
    };

    window.addEventListener("open-cookie-settings", handleOpenSettings);
    return () => {
      window.removeEventListener("open-cookie-settings", handleOpenSettings);
    };
  }, []);

  const handleToggleAnalytics = (checked: boolean) => {
    setPreferences((prev) => ({
      ...prev,
      analytics: checked,
    }));
  };

  const handleAcceptAll = () => {
    const allGranted: CookiePreferences = {
      essential: true,
      analytics: true,
      marketing: true,
    };
    setPreferences(allGranted);
    try {
      localStorage.setItem(COOKIE_STORAGE_KEY, JSON.stringify(allGranted));
    } catch {}
    sendGtagUpdate(allGranted);
    setIsOpen(false);
  };

  const handleRejectNonEssential = () => {
    const minConsent: CookiePreferences = {
      essential: true,
      analytics: false,
      marketing: false,
    };
    setPreferences(minConsent);
    try {
      localStorage.setItem(COOKIE_STORAGE_KEY, JSON.stringify(minConsent));
    } catch {}
    sendGtagUpdate(minConsent);
    setIsOpen(false);
  };

  const handleSaveCustom = () => {
    try {
      localStorage.setItem(COOKIE_STORAGE_KEY, JSON.stringify(preferences));
    } catch {}
    sendGtagUpdate(preferences);
    setIsOpen(false);
  };

  if (!mounted || !isOpen) {
    return null;
  }

  return (
    <div
      role="region"
      aria-label={t.cookies_title}
      className="fixed bottom-0 inset-x-0 z-[9999] p-3 sm:p-4 bg-background/95 backdrop-blur border-t-2 border-primary shadow-2xl font-mono"
    >
      <div className="max-w-7xl mx-auto flex flex-col gap-3">
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-center gap-2 text-primary font-bold tracking-widest text-xs uppercase">
            <ShieldCheck className="size-4 shrink-0" />
            <span>{t.cookies_title}</span>
          </div>
          <button
            type="button"
            onClick={() => setIsOpen(false)}
            className="text-muted-foreground hover:text-foreground cursor-pointer"
            aria-label={t.cookies_close}
          >
            <X className="size-4" />
          </button>
        </div>

        <p className="text-xs text-foreground/80 leading-relaxed max-w-4xl">
          {t.cookies_description}
        </p>

        {showDetails && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 my-2 pt-2 border-t border-border/50 text-xs">
            <div className="p-2.5 border border-border bg-card/50">
              <div className="flex items-center justify-between mb-1">
                <span className="font-bold text-foreground">
                  {t.cookies_necessary_title}
                </span>
                <span className="text-[10px] text-primary font-bold uppercase">
                  {t.cookies_always_active}
                </span>
              </div>
              <p className="text-[11px] text-muted-foreground leading-snug">
                {t.cookies_necessary_desc}
              </p>
            </div>

            <div className="p-2.5 border border-border bg-card/50">
              <div className="flex items-center justify-between mb-1">
                <span className="font-bold text-foreground">
                  {t.cookies_analytics_title}
                </span>
                <input
                  type="checkbox"
                  checked={preferences.analytics}
                  onChange={(e) => {
                    const val = e.target.checked;
                    handleToggleAnalytics(val);
                  }}
                  className="cursor-pointer accent-primary"
                />
              </div>
              <p className="text-[11px] text-muted-foreground leading-snug">
                {t.cookies_analytics_desc}
              </p>
            </div>
          </div>
        )}

        <div className="flex flex-wrap items-center justify-between gap-2 pt-1">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setShowDetails(!showDetails)}
            className="h-8 text-xs font-mono gap-1 text-muted-foreground hover:text-foreground cursor-pointer p-0 hover:bg-transparent"
          >
            <Settings2 className="size-3.5" />
            <span>{showDetails ? t.cookies_close : t.cookies_customize}</span>
          </Button>

          <div className="flex flex-wrap items-center gap-2">
            {showDetails && (
              <Button
                variant="outline"
                size="sm"
                onClick={handleSaveCustom}
                className="h-8 text-xs font-mono rounded-none uppercase cursor-pointer border-primary text-primary"
              >
                {t.cookies_save}
              </Button>
            )}
            <Button
              variant="outline"
              size="sm"
              onClick={handleRejectNonEssential}
              className="h-8 text-xs font-mono rounded-none uppercase cursor-pointer"
            >
              {t.cookies_reject_optional}
            </Button>
            <Button
              size="sm"
              onClick={handleAcceptAll}
              className="h-8 text-xs font-mono rounded-none uppercase bg-primary text-primary-foreground font-bold cursor-pointer"
            >
              {t.cookies_accept_all}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
