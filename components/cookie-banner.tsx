"use client";

import React, { useState, useEffect, useRef } from "react";
import { useLanguage } from "@/components/language-provider";
import {
  getStoredCookieConsent,
  saveCookieConsent,
  updateGtagConsent,
} from "@/lib/cookie-consent";
import { Shield, Settings2, Check, X } from "lucide-react";

export function CookieBanner() {
  const { t } = useLanguage();
  const [mounted, setMounted] = useState(false);
  const [visible, setVisible] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [analyticsAllowed, setAnalyticsAllowed] = useState(false);

  const modalRef = useRef<HTMLDivElement>(null);

  // Initialize consent on mount
  useEffect(() => {
    setMounted(true);
    const existing = getStoredCookieConsent();

    if (existing) {
      setAnalyticsAllowed(existing.analytics);
      updateGtagConsent({ analytics: existing.analytics });
      setVisible(false);
    } else {
      // Show banner if no consent registered yet
      setVisible(true);
    }

    // Global listener allowing user to re-open settings from footer
    const handleOpenSettings = () => {
      const current = getStoredCookieConsent();
      setAnalyticsAllowed(current ? current.analytics : false);
      setModalOpen(true);
    };

    window.addEventListener("open-cookie-settings", handleOpenSettings);
    return () => {
      window.removeEventListener("open-cookie-settings", handleOpenSettings);
    };
  }, []);

  // Trap focus & ESC key handler for accessibility modal
  useEffect(() => {
    if (!modalOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setModalOpen(false);
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [modalOpen]);

  const handleAcceptAll = () => {
    saveCookieConsent(true);
    setAnalyticsAllowed(true);
    setVisible(false);
    setModalOpen(false);
  };

  const handleRejectOptional = () => {
    saveCookieConsent(false);
    setAnalyticsAllowed(false);
    setVisible(false);
    setModalOpen(false);
  };

  const handleSaveCustom = () => {
    saveCookieConsent(analyticsAllowed);
    setVisible(false);
    setModalOpen(false);
  };

  if (!mounted || (!visible && !modalOpen)) {
    return null;
  }

  return (
    <>
      {/* 1. COMPACT SWISS-BRUTALIST BANNER (BOTTOM-LEFT / RESPONSIVE) */}
      {visible && !modalOpen && (
        <aside
          role="region"
          aria-label={t.cookies_title}
          className="fixed bottom-3 left-3 sm:bottom-4 sm:left-4 z-40 max-w-sm sm:max-w-md w-[calc(100vw-1.5rem)] border-2 border-primary bg-background p-4 sm:p-5 shadow-[0_0_30px_rgba(0,0,0,0.4)] transition-all font-mono"
        >
          <div className="flex items-start gap-3">
            <div className="flex size-7 shrink-0 items-center justify-center bg-primary text-primary-foreground">
              <Shield className="size-4" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="font-mono text-xs sm:text-sm font-black uppercase tracking-wider text-foreground">
                {t.cookies_title}
              </p>
              <p className="mt-1.5 text-[11px] sm:text-xs leading-relaxed text-muted-foreground">
                {t.cookies_description}
              </p>
            </div>
          </div>

          <div className="mt-4 flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={handleAcceptAll}
              className="flex-1 min-w-[120px] bg-primary text-primary-foreground px-3 py-2 text-xs font-black uppercase tracking-wider border border-primary hover:bg-primary/90 transition-colors"
            >
              {t.cookies_accept_all}
            </button>
            <button
              type="button"
              onClick={handleRejectOptional}
              className="flex-1 min-w-[120px] bg-card text-foreground px-3 py-2 text-xs font-bold uppercase tracking-wider border border-border hover:border-foreground transition-colors"
            >
              {t.cookies_reject_optional}
            </button>
            <button
              type="button"
              onClick={() => setModalOpen(true)}
              className="w-full sm:w-auto px-3 py-2 text-xs font-bold uppercase tracking-wider text-muted-foreground hover:text-foreground border border-transparent hover:border-border transition-colors flex items-center justify-center gap-1.5"
            >
              <Settings2 className="size-3.5" />
              <span>{t.cookies_customize}</span>
            </button>
          </div>
        </aside>
      )}

      {/* 2. DETAILED PREFERENCES MODAL */}
      {modalOpen && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="cookie-modal-title"
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-3 sm:p-4 backdrop-blur-xs font-mono"
        >
          <div
            ref={modalRef}
            className="w-full max-w-lg border-2 border-primary bg-background p-5 sm:p-7 shadow-[0_0_40px_rgba(255,0,0,0.3)] max-h-[90vh] flex flex-col justify-between overflow-y-auto"
          >
            <div>
              <div className="flex items-center justify-between border-b border-border pb-3">
                <div className="flex items-center gap-2.5">
                  <div className="flex size-7 items-center justify-center bg-primary text-primary-foreground">
                    <Shield className="size-4" />
                  </div>
                  <h2
                    id="cookie-modal-title"
                    className="text-sm sm:text-base font-black uppercase tracking-wider text-foreground"
                  >
                    {t.cookies_title}
                  </h2>
                </div>
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  aria-label={t.cookies_close}
                  className="text-muted-foreground hover:text-foreground p-1"
                >
                  <X className="size-5" />
                </button>
              </div>

              <p className="mt-3 text-xs leading-relaxed text-muted-foreground">
                {t.cookies_description}
              </p>

              {/* CATEGORIES */}
              <div className="mt-5 space-y-4">
                {/* CATEGORY 1: NECESSARY */}
                <div className="border border-border bg-card p-3 sm:p-4">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-xs font-bold uppercase tracking-wider text-foreground">
                      {t.cookies_necessary_title}
                    </span>
                    <span className="bg-muted px-2 py-0.5 text-[10px] font-bold text-muted-foreground border border-border uppercase">
                      {t.cookies_always_active}
                    </span>
                  </div>
                  <p className="mt-1.5 text-[11px] leading-normal text-muted-foreground">
                    {t.cookies_necessary_desc}
                  </p>
                </div>

                {/* CATEGORY 2: ANALYTICS */}
                <div className="border border-border bg-card p-3 sm:p-4">
                  <div className="flex items-center justify-between gap-2">
                    <label
                      htmlFor="analytics-toggle"
                      className="text-xs font-bold uppercase tracking-wider text-foreground cursor-pointer"
                    >
                      {t.cookies_analytics_title}
                    </label>
                    <button
                      type="button"
                      id="analytics-toggle"
                      role="switch"
                      aria-checked={analyticsAllowed}
                      onClick={() => setAnalyticsAllowed(!analyticsAllowed)}
                      className={`flex h-6 w-12 items-center border p-0.5 transition-colors ${
                        analyticsAllowed
                          ? "border-primary bg-primary"
                          : "border-border bg-muted"
                      }`}
                    >
                      <span
                        className={`inline-block size-4.5 bg-white transition-transform ${
                          analyticsAllowed ? "translate-x-6" : "translate-x-0"
                        }`}
                      />
                    </button>
                  </div>
                  <p className="mt-1.5 text-[11px] leading-normal text-muted-foreground">
                    {t.cookies_analytics_desc}
                  </p>
                </div>
              </div>
            </div>

            {/* ACTION BUTTONS */}
            <div className="mt-6 pt-4 border-t border-border flex flex-col sm:flex-row items-center gap-2">
              <button
                type="button"
                onClick={handleSaveCustom}
                className="w-full sm:flex-1 bg-primary text-primary-foreground px-4 py-2.5 text-xs font-black uppercase tracking-wider border border-primary hover:bg-primary/90 transition-colors flex items-center justify-center gap-2"
              >
                <Check className="size-4" />
                <span>{t.cookies_save}</span>
              </button>
              <button
                type="button"
                onClick={handleAcceptAll}
                className="w-full sm:w-auto bg-card text-foreground px-4 py-2.5 text-xs font-bold uppercase tracking-wider border border-border hover:border-foreground transition-colors"
              >
                {t.cookies_accept_all}
              </button>
              <button
                type="button"
                onClick={handleRejectOptional}
                className="w-full sm:w-auto text-muted-foreground hover:text-foreground px-3 py-2.5 text-xs font-bold uppercase tracking-wider transition-colors"
              >
                {t.cookies_reject_optional}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
