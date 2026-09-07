"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { useTheme } from "next-themes";
import { Button } from "@/components/ui/button";
import { getEmergencyGuidance } from "@/lib/ai-service";
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
  const { theme, setTheme } = useTheme();

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

  // Inicjalizacja języka z pamięci podręcznej
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

  // Bezpieczeństwo medyczne: zatrzymaj metronom poza RKO
  useEffect(() => {
    if (!isCprContext && metronomeActive) {
      setMetronomeActive(false);
      setBeat(false);
    }
  }, [selected, isCprContext, metronomeActive]);

  // Metronom 110 BPM
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

  // Mobilne zarządzanie Wake Lock z automatycznym wznawianiem (visibilitychange)
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

  // Odtwarzanie mowy (z obsługą iOS i mobilnego doboru głosów)
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

  // Odblokowanie uprawnień audio dla urządzeń iOS (Safari User-Gesture Requirement)
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

      const isComplexQuery = words.length > 2;

      if (isComplexQuery) {
        setIsThinking(true);
        try {
          const guidance = await getEmergencyGuidance(cleanText, locale);
          if (guidance) {
            setAiGuidance(guidance);
            speakResponse(guidance);

            const lowerGuidance = guidance.toLowerCase();
            if (
              lowerGuidance.includes("uciskaj") ||
              lowerGuidance.includes("rko") ||
              lowerGuidance.includes("masaż") ||
              lowerGuidance.includes("compress") ||
              lowerGuidance.includes("cpr")
            ) {
              setSelected("cpr");
            }
          }
        } catch {
          // ignore
        } finally {
          setIsThinking(false);
        }
        return;
      }

      if (
        cmd.includes("rko") ||
        cmd.includes("cpr") ||
        cmd.includes("reanimacj")
      ) {
        selectProtocol("cpr");
      } else if (cmd.includes("zadławienie") || cmd.includes("choking")) {
        selectProtocol("choking");
      } else if (
        cmd.includes("krwawienie") ||
        cmd.includes("krwotok") ||
        cmd.includes("bleeding")
      ) {
        selectProtocol("bleeding");
      } else if (cmd.includes("nieprzytomny") || cmd.includes("unconscious")) {
        selectProtocol("unconscious");
      }
    },
    [locale, toggleLocale, speakResponse, selectProtocol],
  );

  // Mobilne rozpoznawanie mowy (z podziałem na Desktop / Mobile)
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
    // Na telefonach: discrete single-window (brak zawieszania się systemu audio)
    // Na desktopie: continuous listening
    recognition.continuous = !isMobile;
    recognition.interimResults = true;
    recognition.lang = locale === "pl" ? "pl-PL" : "en-US";

    recognition.onstart = () => {
      setIsListening(true);
      setAiGuidance(null);
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
      // Błędy 'no-speech' na mobile są normalne przy ciszy - resetujemy stan bez alarmowania
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
      className={`min-h-screen bg-background text-foreground transition-colors duration-300 ${isCprContext && metronomeActive && beat ? "ring-inset ring-[12px] ring-primary/20" : ""}`}
    >
      <StatusHeader
        t={t}
        locale={locale}
        theme={theme}
        onLocale={toggleLocale}
        onTheme={() => setTheme(theme === "dark" ? "light" : "dark")}
        isListening={isListening}
      />

      <main className="mx-auto flex max-w-7xl flex-col gap-6 px-4 py-6 pb-40 sm:px-6 sm:py-8 lg:px-8">
        <section className="relative overflow-hidden border border-border bg-card">
          <div className="absolute inset-y-0 left-0 w-1 bg-primary z-10" />

          <ProtocolAnimation
            id={selected}
            active={isCprContext && metronomeActive ? beat : false}
            locale={locale}
          />

          <div className="p-6 sm:p-10 lg:p-12">
            <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
              <div className="max-w-4xl">
                <div className="mb-3 flex items-center gap-3">
                  <p className="font-mono text-xs font-bold tracking-[0.2em] text-primary uppercase">
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
                      className="inline-flex items-center gap-1.5 font-mono text-xs text-muted-foreground hover:text-primary transition-colors uppercase font-bold"
                    >
                      <Volume2 className="size-3.5 text-primary" />
                      {t.repeat_voice}
                    </button>
                  )}
                </div>

                <h1
                  className={`text-balance font-extrabold tracking-tight ${
                    aiGuidance
                      ? "text-2xl sm:text-3xl lg:text-4xl leading-snug normal-case text-foreground/95"
                      : "text-3xl sm:text-5xl lg:text-6xl leading-[1.05] uppercase"
                  }`}
                >
                  {currentInstruction}
                </h1>
              </div>

              {activeProtocol && !aiGuidance && (
                <div className="shrink-0 font-mono text-sm font-bold tracking-wider text-muted-foreground uppercase border-l pl-4 border-border hidden lg:block">
                  {t[activeProtocol.protocol as keyof typeof t]}
                </div>
              )}
            </div>
          </div>
        </section>

        <section className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
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

        <section className="grid gap-6 lg:grid-cols-[1fr_2fr]">
          {isCprContext ? (
            <Metronome
              active={metronomeActive}
              beat={beat}
              t={t}
              onToggle={() => setMetronomeActive(!metronomeActive)}
            />
          ) : (
            <div className="flex flex-col justify-between border border-border bg-muted/10 p-6 sm:p-8 opacity-60">
              <div>
                <div className="flex items-center gap-2 font-mono text-xs font-bold tracking-widest text-muted-foreground uppercase">
                  <ShieldAlert className="size-4 text-muted-foreground" />
                  {t.metronome_paused_title}
                </div>
                <p className="mt-4 text-xs font-medium leading-relaxed text-muted-foreground">
                  {t.metronome_cpr_only_desc}
                </p>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => selectProtocol("cpr")}
                className="mt-6 rounded-none font-mono text-xs font-bold uppercase tracking-wider"
              >
                {t.switch_to_cpr}
              </Button>
            </div>
          )}

          <div className="flex min-h-48 flex-col justify-between gap-6 border border-border bg-muted/20 p-6 sm:p-8 relative">
            <div className="flex items-center gap-3 font-mono text-xs font-bold tracking-[0.2em] text-muted-foreground uppercase">
              <AlertTriangle className="size-4 text-primary" />
              {transcript || t.voice_hint}
            </div>

            <VoiceVisualizer active={isListening || isThinking} />

            <Button
              onClick={toggleListening}
              size="lg"
              className={`touch-action-manipulation h-20 rounded-none font-mono font-black tracking-widest text-lg ${isListening ? "bg-destructive hover:bg-destructive shadow-[0_0_20px_rgba(255,0,0,0.4)]" : ""}`}
            >
              <Mic
                className={`mr-3 size-6 ${isListening ? "animate-pulse" : ""}`}
              />
              {isListening ? t.status_listening : t.btn_voice_start}
            </Button>
          </div>
        </section>

        <div className="flex flex-wrap gap-4">
          <Button
            variant="outline"
            onClick={() => setWakeLockActive(!wakeLockActive)}
            className="touch-action-manipulation rounded-none font-mono font-bold"
          >
            <ShieldCheck className="mr-2 size-4 text-primary" />
            {wakeLockActive ? t.wake_lock_on : t.wake_lock}
          </Button>
        </div>
      </main>

      <footer className="border-t border-border bg-background pb-20 sm:pb-0">
        <div className="mx-auto flex max-w-7xl flex-col gap-4 px-4 py-8 text-xs text-muted-foreground sm:flex-row sm:items-center sm:justify-between sm:px-6 lg:px-8">
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

      <a
        href="tel:112"
        className="touch-action-manipulation fixed bottom-5 right-5 z-[100] flex items-center gap-4 bg-primary px-6 py-5 text-primary-foreground shadow-2xl transition-transform hover:scale-105 active:scale-95 sm:bottom-8 sm:right-8"
      >
        <PhoneCall className="size-7 animate-bounce" />
        <span>
          <span className="block font-mono text-2xl font-black leading-none sm:text-3xl">
            {t.emergency_call}
          </span>
          <span className="mt-1 block text-[10px] font-bold uppercase tracking-widest opacity-90">
            {t.emergency_call_subtitle}
          </span>
        </span>
      </a>

      <style jsx global>{`
        .touch-action-manipulation {
          touch-action: manipulation;
        }
      `}</style>
    </div>
  );
}
