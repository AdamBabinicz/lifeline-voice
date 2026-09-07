"use client";

import React from "react";
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
    <div className="flex items-center justify-center p-8 bg-muted/10 border-b border-border">
      <div
        className={`relative transition-transform duration-100 ${active ? "scale-110" : "scale-100"}`}
      >
        {id === "cpr" && (
          <div className="flex flex-col items-center gap-4">
            <div className="relative">
              <HeartPulse
                className={`size-24 text-primary ${active ? "opacity-100" : "opacity-40"}`}
              />
              <Hand
                className={`absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 size-16 text-white transition-all ${active ? "scale-75" : "scale-100"}`}
              />
            </div>
            <p className="font-mono text-xs font-bold animate-pulse uppercase tracking-wider text-primary">
              {isPl
                ? "Ciągły ucisk na środku klatki"
                : "Continuous chest compressions"}
            </p>
          </div>
        )}
        {id === "choking" && (
          <div className="flex flex-col items-center gap-4">
            <Wind
              className={`size-24 text-blue-500 transition-all ${active ? "translate-y-[-10px]" : "translate-y-0"}`}
            />
            <p className="font-mono text-xs font-bold uppercase tracking-wider text-blue-500">
              {isPl
                ? "5 uderzeń w plecy / 5 uciśnięć"
                : "5 back blows / 5 thrusts"}
            </p>
          </div>
        )}
        {id === "bleeding" && (
          <div className="flex flex-col items-center gap-4">
            <div className="relative">
              <Droplets
                className={`size-24 text-destructive ${active ? "scale-125 opacity-100" : "scale-100 opacity-60"}`}
              />
            </div>
            <p className="font-mono text-xs font-bold uppercase tracking-wider text-destructive">
              {isPl ? "Ciągły, mocny ucisk rany" : "Direct continuous pressure"}
            </p>
          </div>
        )}
        {id === "unconscious" && (
          <div className="flex flex-col items-center gap-4">
            <CircleHelp
              className={`size-24 text-yellow-500 ${active ? "rotate-12" : "rotate-0"}`}
            />
            <p className="font-mono text-xs font-bold uppercase tracking-wider text-yellow-500">
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
      className={`flex h-20 items-center justify-center gap-1.5 border border-primary/30 bg-primary/5 px-6 ${active ? "shadow-[0_0_42px_var(--primary)]" : "opacity-40"}`}
    >
      {Array.from({ length: 28 }).map((_, i) => (
        <span
          key={i}
          className={`w-1 rounded-full bg-primary transition-all duration-150 ${active ? "animate-bounce" : "h-2"}`}
          style={{
            animationDelay: `${i * 0.05}s`,
            height: active ? `${Math.random() * 80 + 20}%` : "8px",
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
  return (
    <header className="border-b border-border/70 bg-background/95 sticky top-0 z-50">
      <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-4 sm:px-6 lg:px-8">
        <div className="flex items-center gap-3">
          <div className="flex size-10 items-center justify-center bg-primary text-primary-foreground">
            <Zap className="size-5" />
          </div>
          <div>
            <p className="truncate font-mono text-sm font-bold tracking-[0.18em]">
              {t.app_name}
            </p>
            <p className="hidden truncate text-xs text-muted-foreground sm:block">
              {t.app_subtitle}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <div
            className={`flex items-center gap-2 font-mono text-xs font-bold tracking-wider transition-opacity ${isListening ? "opacity-100" : "opacity-30"}`}
          >
            <span className="relative flex size-2.5">
              {isListening && (
                <span className="absolute inline-flex size-full animate-ping bg-primary opacity-70" />
              )}
              <span className="relative inline-flex size-2.5 bg-primary" />
            </span>
            {t.status_listening}
          </div>
          <Button
            onClick={onLocale}
            variant="outline"
            size="sm"
            className="gap-2 font-mono font-bold"
            title="Przełącz język / Change language"
          >
            <Languages className="size-4" />
            {locale.toUpperCase()}
          </Button>
          <Button
            onClick={onTheme}
            variant="outline"
            size="icon"
            className="size-9"
          >
            {theme === "dark" ? (
              <Sun className="size-4" />
            ) : (
              <Moon className="size-4" />
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
      variant="outline"
      className={`touch-action-manipulation h-36 justify-between rounded-none border-2 p-5 text-left font-mono text-xl font-black transition-all sm:h-44 sm:text-2xl ${selected ? "border-primary bg-primary text-primary-foreground hover:bg-primary/90" : "border-border bg-card hover:border-primary"}`}
    >
      <span className="flex h-full flex-col items-start justify-between gap-5">
        <Icon className="size-8" />
        <span>{label}</span>
      </span>
      <span className="text-3xl">+</span>
    </Button>
  );
}

// --- METRONOM ---
export function Metronome({ active, beat, t, onToggle }: any) {
  return (
    <div className="border border-border bg-card p-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="font-mono text-xs font-bold tracking-[0.2em] text-muted-foreground">
            {t.metronome}
          </p>
          <p className="mt-2 font-mono text-3xl font-black">
            110{" "}
            <span className="text-sm font-bold text-muted-foreground">
              {t.bpm}
            </span>
          </p>
        </div>
        <div
          className={`flex size-10 items-center justify-center border transition-colors ${active ? "border-primary text-primary" : "border-border text-muted-foreground"}`}
        >
          <HeartPulse className={`size-5 ${active ? "animate-pulse" : ""}`} />
        </div>
      </div>
      <div
        className={`mt-6 flex h-20 items-center justify-center border-2 transition-all duration-100 ${active ? `border-primary ${beat ? "bg-primary/15 shadow-[0_0_28px_var(--primary)]" : "bg-transparent"}` : "border-border bg-background"}`}
      >
        <span className="font-mono text-xs font-bold tracking-widest">
          {active ? t.metronome_on : t.metronome_off}
        </span>
      </div>
      <Button
        onClick={onToggle}
        variant={active ? "destructive" : "default"}
        className="mt-4 h-12 w-full rounded-none font-mono font-black tracking-widest"
      >
        {active ? t.btn_stop : t.btn_start}
      </Button>
    </div>
  );
}
