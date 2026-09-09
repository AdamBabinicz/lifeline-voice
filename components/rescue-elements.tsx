"use client";

import React, { useEffect, useState } from "react";
import {
  Zap,
  Languages,
  Sun,
  Moon,
  HeartPulse,
  Hand,
  Wind,
  Droplets,
  CircleHelp,
} from "lucide-react";
import { Button } from "@/components/ui/button";

// --- DEFINICJE TYPÓW ---
export interface Protocol {
  id: string;
  label: string;
  instruction: string;
  protocol: string;
  icon: React.ElementType;
}

// --- WIZUALIZACJA PROCEDURY RATUNKOWEJ Z OBSŁUGĄ JĘZYKÓW (PL / EN) ---
export function ProtocolAnimation({
  id,
  active,
  locale = "pl",
}: {
  id: string | null;
  active: boolean;
  locale?: "pl" | "en";
}) {
  if (!id) return null;

  const isPl = locale === "pl";

  return (
    <div className="flex items-center justify-center p-4 sm:p-8 bg-muted/10 border-b border-border">
      <div
        className={`relative transition-transform duration-100 ${
          active ? "scale-105 sm:scale-110" : "scale-100"
        }`}
      >
        {id === "cpr" && (
          <div className="flex flex-col items-center gap-3 sm:gap-4">
            <div className="relative">
              <HeartPulse
                className={`size-16 sm:size-24 text-primary ${
                  active ? "opacity-100" : "opacity-40"
                }`}
              />
              <Hand
                className={`absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 size-10 sm:size-16 text-white transition-all ${
                  active ? "scale-75" : "scale-100"
                }`}
              />
            </div>
            <p className="font-mono text-[11px] sm:text-xs font-bold animate-pulse uppercase tracking-wider text-primary text-center">
              {isPl
                ? "Ciągły ucisk na środku klatki"
                : "Continuous chest compressions"}
            </p>
          </div>
        )}
        {id === "choking" && (
          <div className="flex flex-col items-center gap-3 sm:gap-4">
            <Wind
              className={`size-16 sm:size-24 text-blue-500 transition-all ${
                active
                  ? "translate-y-[-6px] sm:translate-y-[-10px]"
                  : "translate-y-0"
              }`}
            />
            <p className="font-mono text-[11px] sm:text-xs font-bold uppercase tracking-wider text-blue-500 text-center">
              {isPl
                ? "5 uderzeń w plecy / 5 uciśnięć"
                : "5 back blows / 5 thrusts"}
            </p>
          </div>
        )}
        {id === "bleeding" && (
          <div className="flex flex-col items-center gap-3 sm:gap-4">
            <div className="relative">
              <Droplets
                className={`size-16 sm:size-24 text-destructive ${
                  active
                    ? "scale-110 sm:scale-125 opacity-100"
                    : "scale-100 opacity-60"
                }`}
              />
            </div>
            <p className="font-mono text-[11px] sm:text-xs font-bold uppercase tracking-wider text-destructive text-center">
              {isPl ? "Ciągły, mocny ucisk rany" : "Direct continuous pressure"}
            </p>
          </div>
        )}
        {id === "unconscious" && (
          <div className="flex flex-col items-center gap-3 sm:gap-4">
            <CircleHelp
              className={`size-16 sm:size-24 text-yellow-500 ${
                active ? "rotate-12" : "rotate-0"
              }`}
            />
            <p className="font-mono text-[11px] sm:text-xs font-bold uppercase tracking-wider text-yellow-500 text-center">
              {isPl
                ? "Sprawdź oddech przez 10 sekund"
                : "Check breathing for 10 seconds"}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

// --- WIZUALIZACJA GŁOSU ---
export function VoiceVisualizer({ active }: { active: boolean }) {
  return (
    <div
      aria-hidden="true"
      className={`flex h-14 sm:h-20 w-full items-center justify-center gap-1 sm:gap-1.5 border border-primary/30 bg-primary/5 px-2 sm:px-6 overflow-hidden ${
        active ? "shadow-[0_0_42px_var(--primary)]" : "opacity-40"
      }`}
    >
      {Array.from({ length: 24 }).map((_, i) => (
        <span
          key={i}
          className={`w-1 rounded-full bg-primary transition-all duration-150 shrink-0 ${
            active ? "animate-bounce" : "h-2"
          }`}
          style={{
            animationDelay: `${i * 0.05}s`,
            height: active ? `${Math.random() * 80 + 20}%` : "6px",
          }}
        />
      ))}
    </div>
  );
}

// --- NAGŁÓWEK ZE STANEM I PRZEŁĄCZNIKIEM JĘZYKA ---
export function StatusHeader({
  t,
  locale,
  theme,
  onLocale,
  onTheme,
  isListening,
}: any) {
  // Bezpiecznik hydracji: sprawdzamy, czy komponent zamontował się w przeglądarce
  const [hasMounted, setHasMounted] = useState(false);

  useEffect(() => {
    setHasMounted(true);
  }, []);

  return (
    <header className="border-b border-border/70 bg-background/95 sticky top-0 z-50">
      <div className="mx-auto flex max-w-7xl items-center justify-between gap-2 px-3 py-3 sm:px-6 sm:py-4 lg:px-8">
        <div className="flex items-center gap-2 sm:gap-3 min-w-0">
          <div className="flex size-8 sm:size-10 shrink-0 items-center justify-center bg-primary text-primary-foreground">
            <Zap className="size-4 sm:size-5" />
          </div>
          <div className="min-w-0">
            <p className="truncate font-mono text-xs sm:text-sm font-bold tracking-[0.14em] sm:tracking-[0.18em]">
              {t.app_name}
            </p>
            <p className="hidden truncate text-xs text-muted-foreground sm:block">
              {t.app_subtitle}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
          <div
            className={`flex items-center gap-1.5 font-mono text-[10px] sm:text-xs font-bold tracking-wider whitespace-nowrap shrink-0 transition-opacity ${
              isListening ? "opacity-100" : "opacity-30"
            }`}
          >
            <span className="relative flex size-2 sm:size-2.5 shrink-0">
              {isListening && (
                <span className="absolute inline-flex size-full animate-ping bg-primary opacity-70" />
              )}
              <span className="relative inline-flex size-2 sm:size-2.5 bg-primary" />
            </span>
            <span className="hidden xs:inline sm:inline uppercase">
              {t.status_listening}
            </span>
          </div>

          <Button
            onClick={onLocale}
            variant="outline"
            size="sm"
            className="h-8 sm:h-9 px-2 sm:px-3 gap-1 sm:gap-2 font-mono text-xs font-bold shrink-0"
            title="Przełącz język / Change language"
          >
            <Languages className="size-3.5 sm:size-4" />
            <span>{locale.toUpperCase()}</span>
          </Button>

          <Button
            onClick={onTheme}
            variant="outline"
            size="icon"
            className="size-8 sm:size-9 shrink-0"
            aria-label="Przełącz motyw"
          >
            {/* Ochrona przed błędem hydracji serwer-klient */}
            {!hasMounted ? (
              <span className="size-3.5 sm:size-4 inline-block" />
            ) : theme === "dark" ? (
              <Sun className="size-3.5 sm:size-4" />
            ) : (
              <Moon className="size-3.5 sm:size-4" />
            )}
          </Button>
        </div>
      </div>
    </header>
  );
}

// --- KARTA PROTOKOŁU ---
export function ProtocolCard({ protocol, selected, label, onSelect }: any) {
  const Icon = protocol.icon;
  return (
    <Button
      onClick={onSelect}
      variant={selected ? "default" : "outline"}
      className={`h-auto min-h-[6.5rem] sm:min-h-[10rem] w-full justify-between items-start rounded-none border-2 p-3 sm:p-5 text-left font-mono transition-all ${
        selected
          ? "border-primary shadow-[0_0_15px_rgba(255,0,0,0.3)]"
          : "border-border bg-card hover:border-primary"
      }`}
    >
      <div className="flex h-full w-full flex-col justify-between gap-3 sm:gap-6">
        <div className="flex w-full items-center justify-between">
          <Icon className="size-6 sm:size-8 shrink-0" />
          <span className="text-xl sm:text-3xl font-light leading-none shrink-0">
            +
          </span>
        </div>
        <span className="text-xs sm:text-lg lg:text-xl font-black uppercase tracking-wide leading-tight break-words">
          {label}
        </span>
      </div>
    </Button>
  );
}

// --- METRONOM ---
export function Metronome({ active, beat, t, onToggle }: any) {
  return (
    <div className="border border-border bg-card p-4 sm:p-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="font-mono text-[10px] sm:text-xs font-bold tracking-[0.2em] text-muted-foreground uppercase">
            {t.metronome}
          </p>
          <p className="mt-1 sm:mt-2 font-mono text-2xl sm:text-3xl font-black leading-normal flex items-baseline gap-1.5">
            <span>110</span>
            <span className="text-xs sm:text-sm font-bold text-muted-foreground uppercase">
              {t.bpm}
            </span>
          </p>
        </div>
        <div
          className={`flex size-9 sm:size-10 shrink-0 items-center justify-center border transition-colors ${
            active
              ? "border-primary text-primary"
              : "border-border text-muted-foreground"
          }`}
        >
          <HeartPulse
            className={`size-4 sm:size-5 ${active ? "animate-pulse" : ""}`}
          />
        </div>
      </div>

      <div
        className={`mt-4 sm:mt-6 flex h-14 sm:h-20 items-center justify-center border-2 transition-all duration-100 ${
          active
            ? `border-primary ${beat ? "bg-primary/15 shadow-[0_0_28px_var(--primary)]" : "bg-transparent"}`
            : "border-border bg-background"
        }`}
      >
        <span className="font-mono text-[11px] sm:text-xs font-bold tracking-widest uppercase">
          {active ? t.metronome_on : t.metronome_off}
        </span>
      </div>

      <Button
        onClick={onToggle}
        variant={active ? "destructive" : "default"}
        className="mt-3 sm:mt-4 h-11 sm:h-12 w-full rounded-none font-mono font-black tracking-widest uppercase text-xs sm:text-sm"
      >
        {active ? t.btn_stop : t.btn_start}
      </Button>
    </div>
  );
}
