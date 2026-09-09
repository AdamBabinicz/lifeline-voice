/**
 * LifeLine Voice — Cookie Consent & Google Consent Mode v2 Engine
 */

export interface CookieConsentData {
  essential: boolean;
  analytics: boolean;
  marketing: boolean;
  timestamp: number;
}

declare global {
  interface Window {
    dataLayer: any[];
    gtag?: (...args: any[]) => void;
  }
}

export const COOKIE_CONSENT_KEY = "lifeline_cookie_consent_v1";

/**
 * Odczytuje zapisany stan zgód użytkownika z localStorage
 */
export function getStoredCookieConsent(): CookieConsentData | null {
  if (typeof window === "undefined") {
    return null;
  }

  try {
    const raw = localStorage.getItem(COOKIE_CONSENT_KEY);
    if (!raw) return null;

    const parsed = JSON.parse(raw);
    if (typeof parsed === "object" && parsed !== null) {
      return {
        essential: true,
        analytics: Boolean(parsed.analytics),
        marketing: Boolean(parsed.marketing ?? parsed.analytics),
        timestamp:
          typeof parsed.timestamp === "number" ? parsed.timestamp : Date.now(),
      };
    }
    return null;
  } catch {
    return null;
  }
}

/**
 * Aktualizuje Google Consent Mode v2 w GTM/GA4
 * Gdy analytics jest true, włącza pełne zgody (analytics + marketing) dla GA4
 */
export function updateGtagConsent(options: {
  analytics: boolean;
  marketing?: boolean;
}): void {
  if (typeof window === "undefined") return;

  window.dataLayer = window.dataLayer || [];
  if (!window.gtag) {
    window.gtag = function () {
      window.dataLayer.push(arguments);
    };
  }

  const isAnalyticsGranted = Boolean(options.analytics);
  const isMarketingGranted = Boolean(options.marketing ?? options.analytics);

  const analyticsState = isAnalyticsGranted ? "granted" : "denied";
  const marketingState = isMarketingGranted ? "granted" : "denied";

  // Google Consent Mode v2 API call
  window.gtag("consent", "update", {
    analytics_storage: analyticsState,
    ad_storage: marketingState,
    ad_user_data: marketingState,
    ad_personalization: marketingState,
  });

  // Wysłanie zdarzenia do warstwy danych GTM
  window.dataLayer.push({
    event: "consent_update",
    consent_analytics: isAnalyticsGranted,
    consent_marketing: isMarketingGranted,
  });
}

/**
 * Zapisuje decyzję użytkownika i natychmiast aktualizuje Google Consent Mode
 * Obsługuje wywołanie boolean: saveCookieConsent(true / false)
 */
export function saveCookieConsent(
  analyticsGranted: boolean,
): CookieConsentData {
  const data: CookieConsentData = {
    essential: true,
    analytics: Boolean(analyticsGranted),
    marketing: Boolean(analyticsGranted),
    timestamp: Date.now(),
  };

  if (typeof window !== "undefined") {
    try {
      localStorage.setItem(COOKIE_CONSENT_KEY, JSON.stringify(data));
    } catch {}
  }

  // Automatyczna aktualizacja tagów analitycznych i marketingowych
  updateGtagConsent({
    analytics: data.analytics,
    marketing: data.marketing,
  });

  return data;
}
