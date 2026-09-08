"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { useTheme } from "next-themes";
import { Button } from "@/components/ui/button";
import { ScrollToTop } from "./scroll-to-top"; // IMPORT NOWEGO KOMPONENTU
import {
  StatusHeader,
  ProtocolCard,
  Metronome,
  VoiceVisualizer,
  ProtocolAnimation,
  Protocol,
} from "@/components/rescue-elements";
import {
  AlertTriangle,
  CircleHelp,
  Droplets,
  HeartPulse,
  PhoneCall,
  ShieldCheck,
  Wind,
  Mic,
  ShieldAlert,
  Volume2,
} from "lucide-react";

import enDict from "@/locales/en.json";
import plDict from "@/locales/pl.json";

export type Locale = "pl" | "en";

export const translations = {
  pl: plDict,
  en: enDict,
};

type EmergencyGuidanceResponse = {
  ok: boolean;
  guidance?: string;
  error?: string;
  message?: string;
};

async function requestEmergencyGuidance(
  query: string,
  locale: Locale,
): Promise<string | null> {
  const response = await fetch("/api/guidance", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ query, locale }),
  });

  const data = (await response
    .json()
    .catch(() => null)) as EmergencyGuidanceResponse | null;

  if (!response.ok || !data?.ok || !data.guidance) {
    return null;
  }

  return data.guidance;
}

const protocols: Protocol[] = [
  {
    id: "cpr",
    label: "btn_cpr",
    instruction: "instruction_cpr",
    protocol: "protocol_cpr",
    icon: HeartPulse,
  },
  {
    id: "choking",
    label: "btn_choking",
    instruction: "instruction_choking",
    protocol: "protocol_choking",
    icon: Wind,
  },
  {
    id: "bleeding",
    label: "btn_bleeding",
    instruction: "instruction_bleeding",
    protocol: "protocol_bleeding",
    icon: Droplets,
  },
  {
    id: "unconscious",
    label: "btn_unconscious",
    instruction: "instruction_unconscious",
    protocol: "protocol_unconscious",
    icon: CircleHelp,
  },
];

export function EmergencyDashboard() {
  const [locale, setLocale] = useState<Locale>("pl");
  const [mounted, setMounted] = useState(false);
  const { resolvedTheme, setTheme } = useTheme();

  const t = locale === "en" ? enDict : plDict;

  const [selected, setSelected] = useState<string | null>(null);
  const [metronomeActive, setMetronomeActive] = useState(false);
  const [beat, setBeat] = useState(false);
  const [wakeLockActive, setWakeLockActive] = useState(false);

  const [isListening, setIsListening] = useState(false);
  const [isThinking, setIsThinking] = useState(false);
  const [transcript, setTranscript] = useState("");
  const [aiGuidance, setAiGuidance] = useState<string | null>(null);
  const recognitionRef = useRef<any>(null);
  const wakeLockRef = useRef<any>(null);

  useEffect(() => {
    try {
      const stored = window.localStorage.getItem("first-aid-locale") as Locale;
      if (stored === "pl" || stored === "en") {
        setLocale(stored);
        document.documentElement.lang = stored;
      } else {
        setLocale("pl");
        document.documentElement.lang = "pl";
      }
    } catch {
      setLocale("pl");
    }
    setMounted(true);
  }, []);

  const isCprContext = selected === "cpr" || selected === null;

  useEffect(() => {
    if (!isCprContext && metronomeActive) {
      setMetronomeActive(false);
      setBeat(false);
    }
  }, [selected, isCprContext, metronomeActive]);

  useEffect(() => {
    if (!metronomeActive || !isCprContext) {
      setBeat(false);
      return;
    }
    const interval = window.setInterval(
      () => setBeat((v) => !v),
      60000 / 110 / 2,
    );
    return () => window.clearInterval(interval);
  }, [metronomeActive, isCprContext]);

  useEffect(() => {
    if (!wakeLockActive || !("wakeLock" in navigator)) return;

    const requestLock = async () => {
      try {
        wakeLockRef.current = await (navigator as any).wakeLock.request(
          "screen",
        );
      } catch {
        setWakeLockActive(false);
      }
    };

    requestLock();

    const handleVisibilityChange = () => {
      if (document.visibilityState === "visible" && wakeLockActive) {
        requestLock();
      }
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);

    return () => {
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      wakeLockRef.current?.release().catch(() => {});
      wakeLockRef.current = null;
    };
  }, [wakeLockActive]);

  const speakResponse = useCallback(
    (text: string) => {
      if (typeof window === "undefined" || !("speechSynthesis" in window))
        return;

      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = locale === "pl" ? "pl-PL" : "en-US";
      utterance.rate = 1.0;
      utterance.pitch = 1.0;

      const voices = window.speechSynthesis.getVoices();
      const matchedVoice = voices.find((v) =>
        locale === "pl" ? v.lang.startsWith("pl") : v.lang.startsWith("en"),
      );
      if (matchedVoice) utterance.voice = matchedVoice;

      window.speechSynthesis.speak(utterance);
    },
    [locale],
  );

  const unlockAudioOnMobile = useCallback(() => {
    if (typeof window !== "undefined" && "speechSynthesis" in window) {
      const silent = new SpeechSynthesisUtterance("");
      window.speechSynthesis.speak(silent);
    }
  }, []);

  const toggleLocale = useCallback(() => {
    setLocale((prev) => {
      const next: Locale = prev === "pl" ? "en" : "pl";
      try {
        window.localStorage.setItem("first-aid-locale", next);
        document.documentElement.lang = next;
      } catch {
        // ignore
      }
      return next;
    });
    setAiGuidance(null);
  }, []);

  const selectProtocol = useCallback(
    (id: string | null, announceAudio = true) => {
      unlockAudioOnMobile();
      setSelected(id);
      setAiGuidance(null);

      if (id !== "cpr") {
        setMetronomeActive(false);
      }

      if (id && announceAudio) {
        const proto = protocols.find((p) => p.id === id);
        if (proto) {
          const instructionText = t[proto.instruction as keyof typeof t];
          if (instructionText) speakResponse(instructionText);
        }
      }
    },
    [t, speakResponse, unlockAudioOnMobile],
  );

  const processTextCommand = useCallback(
    async (text: string) => {
      const cleanText = text.trim();
      if (!cleanText) return;

      const cmd = cleanText.toLowerCase();
      const words = cmd.split(/\s+/);

      if (cmd === "start" || cmd === "zacznij") {
        setSelected("cpr");
        setMetronomeActive(true);
        return;
      }
      if (cmd === "stop" || cmd === "pauza") {
        setMetronomeActive(false);
        return;
      }
      if (cmd === "język" || cmd === "language") {
        toggleLocale();
        return;
      }

      const isComplexQuery = words.length >= 3;
      let aiSuccess = false;

      if (isComplexQuery) {
        setIsThinking(true);
        setAiGuidance(null);
        setSelected(null);
        try {
          const guidance = await requestEmergencyGuidance(cleanText, locale);
          if (guidance) {
            setAiGuidance(guidance);
            speakResponse(guidance);
            aiSuccess = true;
          }
        } catch (err) {
          console.error("AI Guidance failure:", err);
        } finally {
          setIsThinking(false);
        }
        if (aiSuccess) return;
      }

      if (
        cmd.includes("rko") ||
        cmd.includes("cpr") ||
        cmd.includes("reanimacj") ||
        cmd.includes("masaż")
      ) {
        selectProtocol("cpr");
      } else if (
        cmd.includes("zadławienie") ||
        cmd.includes("choking") ||
        cmd.includes("krztusi")
      ) {
        selectProtocol("choking");
      } else if (
        cmd.includes("krwawi") ||
        cmd.includes("krwotok") ||
        cmd.includes("bleeding") ||
        cmd.includes("krew")
      ) {
        selectProtocol("bleeding");
      } else if (
        cmd.includes("nieprzytomny") ||
        cmd.includes("unconscious") ||
        cmd.includes("oddech")
      ) {
        selectProtocol("unconscious");
      } else if (isComplexQuery && !aiSuccess) {
        const msg =
          locale === "pl"
            ? "Nie udało się uzyskać porady AI. Wezwij 112."
            : "Could not get AI advice. Call 112.";
        setAiGuidance(msg);
        speakResponse(msg);
      }
    },
    [locale, toggleLocale, speakResponse, selectProtocol],
  );

  const toggleListening = useCallback(() => {
    unlockAudioOnMobile();

    if (isListening) {
      recognitionRef.current?.stop();
      setIsListening(false);
      return;
    }

    const SR =
      (window as any).SpeechRecognition ||
      (window as any).webkitSpeechRecognition;

    if (!SR) {
      alert(
        locale === "pl"
          ? "Rozpoznawanie mowy nie jest obsługiwane w tej przeglądarce. Użyj Chrome lub Safari."
          : "Speech recognition is not supported in this browser. Please use Chrome or Safari.",
      );
      return;
    }

    const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);

    const recognition = new SR();
    recognition.continuous = !isMobile;
    recognition.interimResults = true;
    recognition.lang = locale === "pl" ? "pl-PL" : "en-US";

    recognition.onstart = () => {
      setIsListening(true);
      setAiGuidance(null);
      setTranscript("");
    };

    recognition.onresult = (e: any) => {
      const result = e.results[e.results.length - 1];
      const text = result[0].transcript;
      setTranscript(text);
      if (result.isFinal) {
        processTextCommand(text);
        if (isMobile) {
          recognition.stop();
        }
      }
    };

    recognition.onerror = (event: any) => {
      if (event.error === "no-speech") {
        setIsListening(false);
      } else {
        console.warn("Speech recognition error:", event.error);
        setIsListening(false);
      }
    };

    recognition.onend = () => {
      setIsListening(false);
    };

    recognitionRef.current = recognition;

    try {
      recognition.start();
    } catch {
      setIsListening(false);
    }
  }, [isListening, locale, processTextCommand, unlockAudioOnMobile]);

  const activeProtocol = protocols.find((p) => p.id === selected);

  const currentInstruction = isThinking
    ? t.status_thinking
    : aiGuidance ||
      (activeProtocol
        ? t[activeProtocol.instruction as keyof typeof t]
        : t.instruction_initial);

  if (!mounted) return <div className="min-h-screen bg-background" />;

  return (
    <div
      className={`min-h-screen bg-background text-foreground transition-colors duration-300 ${
        isCprContext && metronomeActive && beat
          ? "ring-inset ring-[8px] sm:ring-[12px] ring-primary/20"
          : ""
      }`}
    >
      <StatusHeader
        t={t}
        locale={locale}
        theme={resolvedTheme}
        onLocale={toggleLocale}
        onTheme={() => setTheme(resolvedTheme === "dark" ? "light" : "dark")}
        isListening={isListening}
      />

      <main className="mx-auto flex max-w-7xl flex-col gap-4 sm:gap-6 px-3 sm:px-6 py-4 sm:py-8 pb-8 sm:pb-12 lg:px-8">
        <section className="relative overflow-hidden border border-border bg-card">
          <div className="absolute inset-y-0 left-0 w-1 bg-primary z-10" />

          <ProtocolAnimation
            id={selected}
            active={isCprContext && metronomeActive ? beat : false}
            locale={locale}
          />

          <div className="p-4 sm:p-8 lg:p-12">
            <div className="flex flex-col gap-4 sm:gap-6 lg:flex-row lg:items-end lg:justify-between">
              <div className="max-w-4xl">
                <div className="mb-2 sm:mb-3 flex flex-wrap items-center gap-2 sm:gap-3">
                  <p className="font-mono text-[10px] sm:text-xs font-bold tracking-[0.15em] sm:tracking-[0.2em] text-primary uppercase">
                    {isThinking
                      ? t.status_thinking
                      : aiGuidance
                        ? t.ai_guidance_label
                        : activeProtocol
                          ? t.protocol_label
                          : t.status_ready}
                  </p>
                  {currentInstruction && !isThinking && (
                    <button
                      onClick={() => speakResponse(currentInstruction)}
                      title={t.repeat_voice}
                      className="inline-flex items-center gap-1 font-mono text-[10px] sm:text-xs text-muted-foreground hover:text-primary transition-colors uppercase font-bold"
                    >
                      <Volume2 className="size-3 sm:size-3.5 text-primary" />
                      {t.repeat_voice}
                    </button>
                  )}
                </div>

                <h1
                  className={`font-extrabold tracking-tight break-words ${
                    aiGuidance || isThinking
                      ? "text-lg sm:text-3xl lg:text-4xl leading-snug normal-case text-foreground/95"
                      : "text-2xl sm:text-4xl lg:text-6xl leading-[1.1] sm:leading-[1.05] uppercase"
                  }`}
                >
                  {currentInstruction}
                </h1>
              </div>

              {activeProtocol && !aiGuidance && (
                <div className="shrink-0 font-mono text-xs sm:text-sm font-bold tracking-wider text-muted-foreground uppercase border-l pl-3 sm:pl-4 border-border hidden lg:block">
                  {t[activeProtocol.protocol as keyof typeof t]}
                </div>
              )}
            </div>
          </div>
        </section>

        <section className="grid grid-cols-2 gap-2 sm:gap-3 lg:grid-cols-4">
          {protocols.map((p) => (
            <ProtocolCard
              key={p.id}
              protocol={p}
              selected={selected === p.id}
              label={t[p.label as keyof typeof t]}
              onSelect={() => selectProtocol(p.id)}
            />
          ))}
        </section>

        <section className="grid gap-4 sm:gap-6 lg:grid-cols-[1fr_2fr]">
          {isCprContext ? (
            <Metronome
              active={metronomeActive}
              beat={beat}
              t={t}
              onToggle={() => setMetronomeActive(!metronomeActive)}
            />
          ) : (
            <div className="flex flex-col justify-between border border-border bg-muted/10 p-4 sm:p-8 opacity-60">
              <div>
                <div className="flex items-center gap-2 font-mono text-[11px] sm:text-xs font-bold tracking-widest text-muted-foreground uppercase">
                  <ShieldAlert className="size-4 shrink-0 text-muted-foreground" />
                  <span>{t.metronome_paused_title}</span>
                </div>
                <p className="mt-3 text-xs font-medium leading-relaxed text-muted-foreground">
                  {t.metronome_cpr_only_desc}
                </p>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => selectProtocol("cpr")}
                className="mt-4 rounded-none font-mono text-xs font-bold uppercase tracking-wider"
              >
                {t.switch_to_cpr}
              </Button>
            </div>
          )}

          <div className="flex flex-col justify-between gap-4 sm:gap-6 border border-border bg-muted/20 p-4 sm:p-8 relative">
            <div className="flex items-center gap-2 font-mono text-[10px] sm:text-xs font-bold tracking-[0.1em] sm:tracking-[0.2em] text-muted-foreground uppercase">
              <AlertTriangle className="size-3.5 sm:size-4 shrink-0 text-primary" />
              <span className="truncate">{transcript || t.voice_hint}</span>
            </div>

            <div className="py-2">
              <VoiceVisualizer active={isListening || isThinking} />
            </div>

            <Button
              onClick={toggleListening}
              className={`h-14 sm:h-20 w-full rounded-none font-mono font-black tracking-wider sm:tracking-widest text-sm sm:text-base md:text-lg flex items-center justify-center text-center px-4 ${
                isListening
                  ? "bg-destructive hover:bg-destructive shadow-[0_0_20px_rgba(255,0,0,0.4)]"
                  : ""
              }`}
            >
              <Mic
                className={`mr-2 sm:mr-3 size-5 sm:size-6 shrink-0 ${
                  isListening ? "animate-pulse" : ""
                }`}
              />
              <span className="truncate">
                {isListening ? t.status_listening : t.btn_voice_start}
              </span>
            </Button>
          </div>
        </section>

        <div className="flex flex-wrap gap-4">
          <Button
            variant="outline"
            onClick={() => setWakeLockActive(!wakeLockActive)}
            className="rounded-none font-mono text-xs sm:text-sm font-bold"
          >
            <ShieldCheck className="mr-2 size-4 text-primary" />
            {wakeLockActive ? t.wake_lock_on : t.wake_lock}
          </Button>
        </div>
      </main>

      <footer className="border-t border-border bg-background pb-16 sm:pb-6">
        <div className="mx-auto flex max-w-7xl flex-col gap-3 px-4 py-6 text-xs text-muted-foreground sm:flex-row sm:items-center sm:justify-between sm:px-6 lg:px-8">
          <p className="max-w-xl leading-relaxed">{t.footer_note}</p>
          <nav className="flex gap-6 font-bold uppercase tracking-wider">
            <a className="hover:text-primary transition-colors" href="/privacy">
              {t.privacy}
            </a>
            <a className="hover:text-primary transition-colors" href="/terms">
              {t.terms}
            </a>
          </nav>
        </div>
      </footer>

      {/* ELEMENTY FIXED NA KOŃCU DLA PRAWIDŁOWEGO Z-INDEX */}
      <a
        href="tel:112"
        className="fixed bottom-3 right-3 sm:bottom-6 sm:right-6 z-[100] flex items-center gap-2.5 sm:gap-4 bg-primary px-4 py-3 sm:px-6 sm:py-4 text-primary-foreground shadow-2xl transition-transform hover:scale-105 active:scale-95"
      >
        <PhoneCall className="size-5 sm:size-7 animate-bounce shrink-0" />
        <span>
          <span className="block font-mono text-xl sm:text-3xl font-black leading-none">
            {t.emergency_call}
          </span>
          <span className="mt-0.5 sm:mt-1 block text-[9px] sm:text-[10px] font-bold uppercase tracking-widest opacity-90">
            {t.emergency_call_subtitle}
          </span>
        </span>
      </a>

      <ScrollToTop />
    </div>
  );
}
