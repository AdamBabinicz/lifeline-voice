/**
 * LifeLine Voice - Cookie Consent & Google Consent Mode v2 Manager
 * Standardized for Next.js App Router, GTM, and GA4 telemetry.
 */

export const COOKIE_CONSENT_STORAGE_KEY = "lifeline_cookie_consent_v1";

export interface CookieConsentState {
  necessary: true; // Always true
  analytics: boolean;
  timestamp: number;
}

declare global {
  interface Window {
    dataLayer?: unknown[];
    gtag?: (...args: unknown[]) => void;
  }
}

/**
 * Safely executes gtag command if available or queues it into dataLayer
 */
export function updateGtagConsent(consent: { analytics: boolean }) {
  if (typeof window === "undefined") return;

  const analyticsValue = consent.analytics ? "granted" : "denied";

  window.dataLayer = window.dataLayer || [];
  if (typeof window.gtag === "function") {
    window.gtag("consent", "update", {
      analytics_storage: analyticsValue,
      ad_storage: "denied",
      ad_user_data: "denied",
      ad_personalization: "denied",
    });
  } else {
    window.dataLayer.push([
      "consent",
      "update",
      {
        analytics_storage: analyticsValue,
        ad_storage: "denied",
        ad_user_data: "denied",
        ad_personalization: "denied",
      },
    ]);
  }

  // Push an event for GTM triggers
  window.dataLayer.push({
    event: "consent_update",
    consent_analytics: consent.analytics,
  });
}

/**
 * Reads user consent from localStorage safely
 */
export function getStoredCookieConsent(): CookieConsentState | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(COOKIE_CONSENT_STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (
      typeof parsed === "object" &&
      parsed !== null &&
      "analytics" in parsed
    ) {
      return {
        necessary: true,
        analytics: Boolean(parsed.analytics),
        timestamp: Number(parsed.timestamp) || Date.now(),
      };
    }
  } catch {
    // localStorage unavailable or invalid JSON
  }
  return null;
}

/**
 * Saves user consent to localStorage and updates Google Consent Mode v2
 */
export function saveCookieConsent(analytics: boolean): CookieConsentState {
  const state: CookieConsentState = {
    necessary: true,
    analytics,
    timestamp: Date.now(),
  };

  if (typeof window !== "undefined") {
    try {
      localStorage.setItem(COOKIE_CONSENT_STORAGE_KEY, JSON.stringify(state));
    } catch {
      // localStorage unavailable
    }
    updateGtagConsent({ analytics });
  }

  return state;
}
