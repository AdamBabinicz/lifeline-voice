"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { useTheme } from "next-themes";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ScrollToTop } from "./scroll-to-top";
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
  Volume2,
} from "lucide-react";
import enDict from "@/locales/en.json";
import plDict from "@/locales/pl.json";

export type Locale = "pl" | "en";

export const translations = {
  pl: plDict,
  en: enDict,
};

/**
 * Zapobiega wiszącym spójnikom i przyimkom na końcu linii (twarda spacja)
 */
function preventOrphans(text: string): string {
  if (!text) return "";
  return text.replace(
    /(\b(?:[a-zA-Z]|w|z|i|o|u|a|do|na|od|po|we|ze|nie|albo|oraz)\b)\s+/gi,
    "$1\u00A0",
  );
}

export function EmergencyDashboard() {
  const [selected, setSelected] = useState<string | null>(null);
  const [metronomeActive, setMetronomeActive] = useState(false);
  const [beat, setBeat] = useState(false);
  const [locale, setLocale] = useState<Locale>("pl");
  const [isListening, setIsListening] = useState(false);
  const [isThinking, setIsThinking] = useState(false);
  const [wakeLockActive, setWakeLockActive] = useState(false);
  const [wakeLockSupported, setWakeLockSupported] = useState(false);
  const [aiGuidance, setAiGuidance] = useState<string | null>(null);
  const [lastUserQuery, setLastUserQuery] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const { theme, setTheme } = useTheme();
  const recognitionRef = useRef<any>(null);
  const wakeLockRef = useRef<any>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const lastSpokenTextRef = useRef<string | null>(null);
  const isSpeakingRef = useRef<boolean>(false);
  const isThinkingRef = useRef<boolean>(false);
  const isCprContext = selected === "cpr";

  const t = translations[locale];

  const protocols: Protocol[] = [
    {
      id: "cpr",
      label: t.protocol_cpr,
      instruction: t.cpr_desc,
      protocol: t.protocol_cpr,
      icon: HeartPulse,
    },
    {
      id: "choking",
      label: t.protocol_choking,
      instruction: t.choking_desc,
      protocol: t.protocol_choking,
      icon: Wind,
    },
    {
      id: "bleeding",
      label: t.protocol_bleeding,
      instruction: t.bleeding_desc,
      protocol: t.protocol_bleeding,
      icon: Droplets,
    },
    {
      id: "unconscious",
      label: t.protocol_unconscious,
      instruction: t.unconscious_desc,
      protocol: t.protocol_unconscious,
      icon: CircleHelp,
    },
  ];

  // Odblokowanie silnika audio na Safari / iOS
  const primeAudioContext = useCallback(() => {
    try {
      if (!audioContextRef.current) {
        const AudioContextClass =
          window.AudioContext || (window as any).webkitAudioContext;
        if (AudioContextClass) {
          audioContextRef.current = new AudioContextClass();
        }
      }
      if (
        audioContextRef.current &&
        audioContextRef.current.state === "suspended"
      ) {
        audioContextRef.current.resume();
      }
      if (typeof window !== "undefined" && "speechSynthesis" in window) {
        const silentUtterance = new SpeechSynthesisUtterance("");
        silentUtterance.volume = 0;
        window.speechSynthesis.speak(silentUtterance);
      }
    } catch {
      // Ignoruj
    }
  }, []);

  // Synteza mowy (TTS) z zabezpieczeniem przed sprzężeniem zwrotnym do mikrofonu
  const speakInstruction = useCallback(
    (text: string) => {
      if (typeof window === "undefined" || !("speechSynthesis" in window))
        return;

      window.speechSynthesis.cancel();
      lastSpokenTextRef.current = text;
      isSpeakingRef.current = true;

      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = locale === "pl" ? "pl-PL" : "en-US";
      utterance.rate = 1.0;
      utterance.pitch = 1.0;

      const voices = window.speechSynthesis.getVoices();
      const targetLang = locale === "pl" ? "pl" : "en";
      const matchedVoice = voices.find((v) =>
        v.lang.toLowerCase().startsWith(targetLang),
      );

      if (matchedVoice) {
        utterance.voice = matchedVoice;
      }

      utterance.onend = () => {
        // Krótki bufor bezpieczeństwa (300ms) po zakończeniu mowy na wyciszenie echa w pokoju
        setTimeout(() => {
          isSpeakingRef.current = false;
        }, 300);
      };

      utterance.onerror = () => {
        isSpeakingRef.current = false;
      };

      window.speechSynthesis.speak(utterance);
    },
    [locale],
  );

  const repeatLastGuidance = useCallback(() => {
    if (lastSpokenTextRef.current) {
      speakInstruction(lastSpokenTextRef.current);
    }
  }, [speakInstruction]);

  // Dźwięk metronomu (110 BPM)
  const playMetronomeBeep = useCallback(() => {
    try {
      if (!audioContextRef.current) {
        const AudioContextClass =
          window.AudioContext || (window as any).webkitAudioContext;
        if (AudioContextClass) {
          audioContextRef.current = new AudioContextClass();
        }
      }

      const ctx = audioContextRef.current;
      if (ctx && ctx.state === "suspended") {
        ctx.resume();
      }

      if (ctx) {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();

        osc.type = "sine";
        osc.frequency.setValueAtTime(880, ctx.currentTime);
        gain.gain.setValueAtTime(0.2, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.04);

        osc.connect(gain);
        gain.connect(ctx.destination);

        osc.start();
        osc.stop(ctx.currentTime + 0.04);
      }
    } catch {
      // Ignoruj
    }
  }, []);

  // Metronom 110 BPM (interwał 545ms)
  useEffect(() => {
    let interval: NodeJS.Timeout | null = null;
    if (metronomeActive) {
      interval = setInterval(() => {
        setBeat((prev) => !prev);
        playMetronomeBeep();
      }, 545);
    } else {
      setBeat(false);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [metronomeActive, playMetronomeBeep]);

  // Context lock: Zatrzymanie metronomu poza procedurą RKO
  useEffect(() => {
    if (!isCprContext && metronomeActive) {
      setMetronomeActive(false);
    }
  }, [selected, isCprContext, metronomeActive]);

  // Screen Wake Lock API
  useEffect(() => {
    if (typeof window !== "undefined" && "wakeLock" in navigator) {
      setWakeLockSupported(true);
    }
  }, []);

  useEffect(() => {
    let isCancelled = false;

    async function manageWakeLock() {
      if (!wakeLockSupported) return;

      if (wakeLockActive && !wakeLockRef.current) {
        try {
          const sentinel = await navigator.wakeLock.request("screen");
          if (isCancelled) {
            await sentinel.release();
            return;
          }
          wakeLockRef.current = sentinel;
          sentinel.addEventListener("release", () => {
            wakeLockRef.current = null;
            if (!isCancelled) setWakeLockActive(false);
          });
        } catch {
          if (!isCancelled) setWakeLockActive(false);
        }
      } else if (!wakeLockActive && wakeLockRef.current) {
        try {
          await wakeLockRef.current.release();
        } catch {
          // Ignoruj
        }
        wakeLockRef.current = null;
      }
    }

    manageWakeLock();

    return () => {
      isCancelled = true;
      if (wakeLockRef.current) {
        wakeLockRef.current.release().catch(() => {});
        wakeLockRef.current = null;
      }
    };
  }, [wakeLockActive, wakeLockSupported]);

  // Dynamiczne zapytanie do serwerowego asystenta AI
  const requestAiGuidance = useCallback(
    async (queryText: string) => {
      if (isThinkingRef.current) return;

      setIsThinking(true);
      isThinkingRef.current = true;
      setErrorMessage(null);
      setSelected(null);

      try {
        const response = await fetch("/api/rescue-ai", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ query: queryText, locale }),
        });

        const data = await response.json();

        if (data?.ok && data?.guidance) {
          setAiGuidance(data.guidance);
          speakInstruction(data.guidance);
        } else {
          const fallback =
            locale === "pl"
              ? "1. Zadbaj o bezpieczeństwo. 2. W razie wątpliwości natychmiast wezwij 112."
              : "1. Ensure the scene is safe. 2. When in doubt, call 112 immediately.";
          setAiGuidance(fallback);
          speakInstruction(fallback);
        }
      } catch {
        const fallback =
          locale === "pl"
            ? "1. Brak połączenia z siecią. 2. W sytuacji zagrożenia życia natychmiast wezwij 112."
            : "1. No network connection. 2. In life-threatening emergencies, call 112 immediately.";
        setAiGuidance(fallback);
        speakInstruction(fallback);
      } finally {
        setIsThinking(false);
        isThinkingRef.current = false;
      }
    },
    [locale, speakInstruction],
  );

  // Inteligentna obsługa komend głosowych
  const handleVoiceCommand = useCallback(
    (transcript: string) => {
      // Ignoruj, gdy asystent właśnie mówi na głos przez głośnik lub przetwarza zapytanie
      if (isSpeakingRef.current || isThinkingRef.current) {
        return;
      }

      const lower = transcript.toLowerCase().trim();
      if (!lower || lower.length < 3) return;

      setLastUserQuery(transcript);

      // Czy to jest prosta, krótka komenda wyboru protokołu (do 3 słów)?
      const words = lower.split(/\s+/).filter(Boolean);
      const isShortCommand = words.length <= 3;

      if (isShortCommand) {
        if (
          lower === "rko" ||
          lower === "cpr" ||
          lower === "protokół rko" ||
          lower === "masaż serca"
        ) {
          setSelected("cpr");
          setAiGuidance(null);
          setMetronomeActive(true);
          speakInstruction(t.cpr_full_guidance || t.cpr_desc);
          return;
        }

        if (
          lower === "zadławienie" ||
          lower === "choking" ||
          lower === "protokół zadławienie" ||
          lower === "krztuszenie"
        ) {
          setSelected("choking");
          setAiGuidance(null);
          setMetronomeActive(false);
          speakInstruction(t.choking_desc);
          return;
        }

        if (
          lower === "krwawienie" ||
          lower === "bleeding" ||
          lower === "protokół krwawienie" ||
          lower === "krwotok"
        ) {
          setSelected("bleeding");
          setAiGuidance(null);
          setMetronomeActive(false);
          speakInstruction(t.bleeding_desc);
          return;
        }

        if (
          lower === "nieprzytomny" ||
          lower === "unconscious" ||
          lower === "protokół nieprzytomny"
        ) {
          setSelected("unconscious");
          setAiGuidance(null);
          setMetronomeActive(false);
          speakInstruction(t.unconscious_desc);
          return;
        }
      }

      // Wszystkie inne zdania i pytania trafiają do asystenta AI
      requestAiGuidance(transcript);
    },
    [requestAiGuidance, speakInstruction, t],
  );

  // Web Speech API: Inicjalizacja nasłuchu
  useEffect(() => {
    if (typeof window === "undefined") return;

    const SpeechRecognitionClass =
      (window as any).SpeechRecognition ||
      (window as any).webkitSpeechRecognition;

    if (!SpeechRecognitionClass) {
      return;
    }

    const recognition = new SpeechRecognitionClass();
    recognition.continuous = true;
    recognition.interimResults = false;
    recognition.lang = locale === "pl" ? "pl-PL" : "en-US";

    recognition.onresult = (event: any) => {
      // Ignoruj wyniki wywołane podczas mówienia syntezatora
      if (isSpeakingRef.current || isThinkingRef.current) {
        return;
      }

      const current = event.resultIndex;
      const transcript = event.results[current]?.[0]?.transcript;
      if (transcript) {
        handleVoiceCommand(transcript);
      }
    };

    recognition.onerror = (event: any) => {
      if (event.error !== "no-speech") {
        setIsListening(false);
      }
    };

    recognition.onend = () => {
      setIsListening(false);
    };

    recognitionRef.current = recognition;

    return () => {
      try {
        recognition.stop();
      } catch {
        // Ignoruj
      }
    };
  }, [locale, handleVoiceCommand]);

  const toggleListening = useCallback(() => {
    primeAudioContext();

    if (!recognitionRef.current) {
      setErrorMessage(
        locale === "pl"
          ? "Twoja przeglądarka nie obsługuje rozpoznawania mowy."
          : "Your browser does not support Speech Recognition.",
      );
      return;
    }

    if (isListening) {
      try {
        recognitionRef.current.stop();
      } catch {
        // Ignoruj
      }
      setIsListening(false);
    } else {
      setErrorMessage(null);
      try {
        recognitionRef.current.start();
        setIsListening(true);
      } catch {
        setIsListening(false);
      }
    }
  }, [isListening, locale, primeAudioContext]);

  const toggleLocale = () => {
    setLocale((prev) => (prev === "pl" ? "en" : "pl"));
  };

  const toggleTheme = () => {
    setTheme(theme === "dark" ? "light" : "dark");
  };

  const handleProtocolSelect = (id: string) => {
    primeAudioContext();
    if (selected === id) {
      setSelected(null);
      setAiGuidance(null);
    } else {
      setSelected(id);
      setAiGuidance(null);
      const proto = protocols.find((p) => p.id === id);
      if (proto) {
        speakInstruction(proto.instruction);
      }
    }
  };

  const handleMetronomeToggle = () => {
    primeAudioContext();
    if (!isCprContext && !metronomeActive) {
      setSelected("cpr");
      setAiGuidance(null);
      setMetronomeActive(true);
      speakInstruction(t.cpr_full_guidance || t.cpr_desc);
      return;
    }
    setMetronomeActive((prev) => !prev);
  };

  const openCookiePreferences = () => {
    if (typeof window !== "undefined") {
      window.dispatchEvent(new Event("open-cookie-settings"));
    }
  };

  // DYNAMICZNY GŁÓWNY KOMUNIKAT
  const currentInstruction = isThinking
    ? t.voice_processing
    : aiGuidance
      ? aiGuidance
      : selected
        ? protocols.find((p) => p.id === selected)?.instruction ||
          t.select_protocol
        : t.select_protocol;

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col font-mono selection:bg-primary selection:text-primary-foreground">
      {/* PASEK STATUSU */}
      <StatusHeader
        t={t}
        locale={locale}
        theme={theme}
        onLocale={toggleLocale}
        onTheme={toggleTheme}
        isListening={isListening}
      />

      <main className="mx-auto flex max-w-7xl flex-col gap-4 sm:gap-6 px-3 sm:px-6 py-4 sm:py-8 pb-8 sm:pb-12 lg:px-8 flex-1 w-full">
        {/* GŁÓWNY HERO BOKS INSTRUKCYJNY */}
        <section className="relative overflow-hidden border border-border bg-card">
          <div className="absolute inset-y-0 left-0 w-1 bg-primary z-10" />

          {/* Animacja procedury - TYLKO gdy wybrany jest konkretny protokół i NIE MA porady AI */}
          {selected && !aiGuidance && (
            <ProtocolAnimation
              id={selected}
              active={isCprContext && metronomeActive ? beat : false}
              locale={locale}
            />
          )}

          <div className="p-4 sm:p-8 lg:p-12">
            <div className="flex flex-col gap-4 sm:gap-6 lg:flex-row lg:items-end lg:justify-between">
              <div className="max-w-4xl">
                <div className="mb-2 sm:mb-3 flex flex-wrap items-center gap-2 sm:gap-3">
                  <p className="font-mono text-[10px] sm:text-xs font-bold tracking-[0.15em] sm:tracking-[0.2em] text-primary uppercase">
                    {isThinking
                      ? t.voice_processing
                      : aiGuidance
                        ? locale === "pl"
                          ? "PORADA ASYSTENTA AI"
                          : "AI ASSISTANT GUIDANCE"
                        : selected
                          ? locale === "pl"
                            ? "AKTYWNY PROTOKÓŁ"
                            : "ACTIVE PROTOCOL"
                          : t.system_ready}
                  </p>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={repeatLastGuidance}
                    className="h-6 gap-1 px-2 font-mono text-[10px] sm:text-xs text-muted-foreground hover:text-foreground uppercase cursor-pointer"
                  >
                    <Volume2 className="size-3" />
                    <span>{t.repeat_voice}</span>
                  </Button>
                </div>

                {/* WIELKI TEKST PORADY RATUNKOWEJ */}
                <h1 className="font-mono text-xl sm:text-3xl lg:text-5xl font-black uppercase tracking-tight text-foreground leading-[1.15] break-words text-pretty">
                  {preventOrphans(currentInstruction)}
                </h1>
              </div>
            </div>
          </div>
        </section>

        {/* SIATKA 4 PROTOKOŁÓW */}
        <div className="grid grid-cols-2 gap-3 sm:gap-4 md:grid-cols-4">
          {protocols.map((protocol) => (
            <ProtocolCard
              key={protocol.id}
              protocol={protocol}
              selected={selected === protocol.id && !aiGuidance}
              label={protocol.label}
              onSelect={() => handleProtocolSelect(protocol.id)}
            />
          ))}
        </div>

        {/* MODUŁ METRONOMU + KONTROLI GŁOSOWEJ */}
        <section className="grid grid-cols-1 gap-4 sm:gap-6 md:grid-cols-3">
          {/* METRONOM */}
          <div className="space-y-4">
            <Metronome
              active={metronomeActive}
              beat={beat}
              t={t}
              onToggle={handleMetronomeToggle}
            />
          </div>

          {/* MODUŁ GŁOSOWY */}
          <div className="border border-border bg-card p-4 sm:p-6 md:col-span-2 flex flex-col justify-between">
            <div className="space-y-3 sm:space-y-4">
              <div className="flex items-center justify-between">
                <p className="font-mono text-[10px] sm:text-xs font-bold tracking-[0.2em] text-primary uppercase flex items-center gap-2">
                  <span className="relative flex size-2">
                    {isListening && (
                      <span className="absolute inline-flex size-full animate-ping rounded-full bg-primary opacity-75" />
                    )}
                    <span className="relative inline-flex size-2 rounded-full bg-primary" />
                  </span>
                  <span>{lastUserQuery || t.voice_ready}</span>
                </p>
              </div>

              {/* FALA DŹWIĘKOWA */}
              <div className="py-2">
                <VoiceVisualizer active={isListening || isThinking} />
              </div>

              {errorMessage && (
                <p className="text-xs text-destructive font-mono">
                  {errorMessage}
                </p>
              )}
            </div>

            <Button
              onClick={toggleListening}
              className={`mt-4 h-14 sm:h-20 w-full rounded-none font-mono font-black tracking-wider sm:tracking-widest text-sm sm:text-base md:text-lg flex items-center justify-center text-center px-4 cursor-pointer ${
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
                {isListening ? t.status_listening : t.btn_listen_start}
              </span>
            </Button>
          </div>
        </section>

        {/* PRZEŁĄCZNIK WAKE LOCK */}
        <div className="flex flex-wrap gap-4">
          <Button
            variant="outline"
            onClick={() => setWakeLockActive(!wakeLockActive)}
            className="rounded-none font-mono text-xs sm:text-sm font-bold cursor-pointer"
          >
            <ShieldCheck className="mr-2 size-4 text-primary" />
            {wakeLockActive
              ? locale === "pl"
                ? "EKRAN AKTYWNY"
                : "SCREEN ACTIVE"
              : t.keep_screen_on}
          </Button>
        </div>
      </main>

      {/* STOPKA */}
      <footer className="border-t border-border bg-background pb-16 sm:pb-6">
        <div className="mx-auto flex max-w-7xl flex-col gap-3 px-4 py-6 text-xs text-muted-foreground sm:flex-row sm:items-center sm:justify-between sm:px-6 lg:px-8">
          <p className="max-w-xl leading-relaxed">{t.footer_disclaimer}</p>
          <nav className="flex flex-wrap items-center gap-4 sm:gap-6 font-bold uppercase tracking-wider">
            <Link
              className="hover:text-primary transition-colors cursor-pointer"
              href="/privacy"
            >
              {t.privacy_policy}
            </Link>
            <span className="text-muted-foreground">/</span>
            <Link
              className="hover:text-primary transition-colors cursor-pointer"
              href="/terms"
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

      {/* STAŁY PRZYCISK 112 */}
      <a
        href="tel:112"
        className="fixed bottom-3 right-3 sm:bottom-6 sm:right-6 z-[100] flex items-center gap-2.5 sm:gap-4 bg-primary px-4 py-3 sm:px-6 sm:py-4 text-primary-foreground shadow-2xl transition-transform hover:scale-105 active:scale-95 cursor-pointer"
      >
        <PhoneCall className="size-5 sm:size-7 animate-bounce shrink-0" />
        <span>
          <span className="block font-mono text-xl sm:text-3xl font-black leading-none">
            {t.call_112}
          </span>
          <span className="mt-0.5 sm:mt-1 block text-[9px] sm:text-[10px] font-bold uppercase tracking-widest opacity-90">
            {t.call_112_sub}
          </span>
        </span>
      </a>

      <ScrollToTop />
    </div>
  );
}
