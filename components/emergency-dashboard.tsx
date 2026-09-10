"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { useTheme } from "next-themes";
import { Button } from "@/components/ui/button";
import { ScrollToTop } from "./scroll-to-top";
import { Footer } from "./footer";
import {
  StatusHeader,
  ProtocolCard,
  Metronome,
  VoiceVisualizer,
  ProtocolAnimation,
  Protocol,
} from "@/components/rescue-elements";
import {
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
import { useLanguage } from "@/components/language-provider";
import {
  analyzeRescueQuery,
  normalizeSpeechForTTS,
  ProtocolId,
} from "@/lib/rescue-engine";

export type Locale = "pl" | "en";

export const translations = {
  pl: plDict,
  en: enDict,
};

/**
 * Zapobiega wiszącym spójnikom i przyimkom na końcu linii (twarda spacja NBSP)
 */
function preventOrphans(text: string): string {
  if (!text) return "";
  return text.replace(
    /(\b(?:[a-zA-Z]|w|z|i|o|u|a|do|na|od|po|we|ze|nie|albo|oraz)\b)\s+/gi,
    "$1\u00A0",
  );
}

export function EmergencyDashboard() {
  const [selected, setSelected] = useState<ProtocolId | null>(null);
  const [metronomeActive, setMetronomeActive] = useState(false);
  const [beat, setBeat] = useState(false);
  const { locale, toggleLocale: toggleLocaleFromProvider } = useLanguage();
  const [isListening, setIsListening] = useState(false);
  const [isThinking, setIsThinking] = useState(false);
  const [wakeLockActive, setWakeLockActive] = useState(false);
  const [wakeLockSupported, setWakeLockSupported] = useState(false);
  const [aiGuidance, setAiGuidance] = useState<string | null>(null);
  const [activeTitleKey, setActiveTitleKey] = useState<string | null>(null);
  const [lastUserQuery, setLastUserQuery] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const { theme, setTheme } = useTheme();
  const recognitionRef = useRef<any>(null);
  const wakeLockRef = useRef<any>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const lastSpokenTextRef = useRef<string | null>(null);
  const lastHandledIndexRef = useRef<number>(-1);
  const isSpeakingRef = useRef<boolean>(false);
  const isThinkingRef = useRef<boolean>(false);
  const isCprContext = selected === "cpr";

  const t = translations[locale] as Record<string, string>;

  const protocols: Protocol[] = [
    {
      id: "cpr",
      label: t.protocol_cpr,
      instruction: t.cpr_full_guidance || t.cpr_desc,
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

  const speakInstruction = useCallback(
    (text: string) => {
      if (typeof window === "undefined" || !("speechSynthesis" in window))
        return;

      isSpeakingRef.current = true;
      window.speechSynthesis.cancel();
      lastSpokenTextRef.current = text;

      const speechText = normalizeSpeechForTTS(text, locale);

      const utterance = new SpeechSynthesisUtterance(speechText);
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

        osc.type = "triangle";
        osc.frequency.setValueAtTime(800, ctx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(400, ctx.currentTime + 0.05);

        gain.gain.setValueAtTime(0.7, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.06);

        osc.connect(gain);
        gain.connect(ctx.destination);

        osc.start(ctx.currentTime);
        osc.stop(ctx.currentTime + 0.06);
      }

      if (typeof window !== "undefined" && "vibrate" in navigator) {
        try {
          navigator.vibrate(45);
        } catch {
          // Ignoruj
        }
      }
    } catch {
      // Ignoruj
    }
  }, []);

  useEffect(() => {
    let interval: NodeJS.Timeout | null = null;
    if (metronomeActive) {
      interval = setInterval(() => {
        setBeat((prev) => !prev);
        playMetronomeBeep();
      }, 545); // 110 BPM
    } else {
      setBeat(false);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [metronomeActive, playMetronomeBeep]);

  useEffect(() => {
    if (!isCprContext && metronomeActive) {
      setMetronomeActive(false);
    }
  }, [selected, isCprContext, metronomeActive]);

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

  const handleVoiceCommand = useCallback(
    (transcript: string, resultIndex: number) => {
      const lower = transcript.toLowerCase().trim();
      if (!lower || lower.length < 3) return;

      // Jeśli to samo zdanie wywołało już procedurę, zignoruj kolejne części (brak podwójnego czytania)
      if (resultIndex === lastHandledIndexRef.current) {
        return;
      }

      const result = analyzeRescueQuery(transcript, locale, t);

      // Jeśli zapytanie nie pasuje do bazy ratunkowej
      if (result.type === "unknown") {
        if (
          typeof window !== "undefined" &&
          window.speechSynthesis &&
          window.speechSynthesis.speaking
        ) {
          return;
        }
        setLastUserQuery(transcript);
        return;
      }

      // Oznacz ten indeks jako zrealizowany – dane zdanie odpali się tylko raz!
      lastHandledIndexRef.current = resultIndex;

      // BARGE-IN: Natychmiast uciszamy trwającą wypowiedź!
      if (typeof window !== "undefined" && "speechSynthesis" in window) {
        window.speechSynthesis.cancel();
      }
      isSpeakingRef.current = false;

      setLastUserQuery(transcript);
      setErrorMessage(null);

      if (result.type === "command") {
        if (result.command === "start_cpr") {
          setSelected("cpr");
          setAiGuidance(null);
          setActiveTitleKey("title_cpr");
          setMetronomeActive(true);
          speakInstruction(result.spokenText);
          return;
        }
        if (result.command === "stop_metronome") {
          setMetronomeActive(false);
          speakInstruction(result.spokenText);
          return;
        }
        if (result.command === "toggle_language") {
          toggleLocaleFromProvider();
          return;
        }
      }

      if (result.type === "protocol" && result.protocolId) {
        setSelected(result.protocolId);
        setAiGuidance(null);
        setActiveTitleKey(result.titleKey || null);
        if (result.protocolId === "cpr") {
          setMetronomeActive(true);
        } else {
          setMetronomeActive(false);
        }
        speakInstruction(result.spokenText);
        return;
      }

      if (result.type === "guidance") {
        setSelected(null);
        setMetronomeActive(false);
        setAiGuidance(result.displayText);
        setActiveTitleKey(result.titleKey || null);
        speakInstruction(result.spokenText);
        return;
      }
    },
    [locale, speakInstruction, t, toggleLocaleFromProvider],
  );

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
    recognition.interimResults = true;
    recognition.lang = locale === "pl" ? "pl-PL" : "en-US";

    recognition.onresult = (event: any) => {
      for (let i = event.resultIndex; i < event.results.length; i++) {
        const transcript = event.results[i]?.[0]?.transcript;
        if (transcript) {
          handleVoiceCommand(transcript, i);
        }
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
      setErrorMessage(t.voice_error);
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
  }, [isListening, primeAudioContext, t.voice_error]);

  const toggleLocale = () => {
    toggleLocaleFromProvider();
  };

  const toggleTheme = () => {
    setTheme(theme === "dark" ? "light" : "dark");
  };

  const handleProtocolSelect = (id: ProtocolId) => {
    primeAudioContext();
    if (selected === id) {
      setSelected(null);
      setAiGuidance(null);
      setActiveTitleKey(null);
      setMetronomeActive(false);
    } else {
      setSelected(id);
      setAiGuidance(null);
      setActiveTitleKey(`title_${id}`);

      if (id === "cpr") {
        setMetronomeActive(true);
      } else {
        setMetronomeActive(false);
      }

      const proto = protocols.find((p) => p.id === id);
      if (proto) {
        const spokenKey =
          id === "cpr" ? "cpr_full_guidance_spoken" : `${id}_desc_spoken`;
        speakInstruction(t[spokenKey] || proto.instruction);
      }
    }
  };

  const handleMetronomeToggle = () => {
    primeAudioContext();
    if (!isCprContext && !metronomeActive) {
      setSelected("cpr");
      setAiGuidance(null);
      setActiveTitleKey("title_cpr");
      setMetronomeActive(true);
      speakInstruction(
        t.cpr_full_guidance_spoken || t.cpr_full_guidance || t.cpr_desc,
      );
      return;
    }
    setMetronomeActive((prev) => !prev);
  };

  const currentInstruction = isThinking
    ? t.voice_processing
    : aiGuidance
      ? aiGuidance
      : selected
        ? protocols.find((p) => p.id === selected)?.instruction ||
          t.select_protocol
        : t.select_protocol;

  const currentBadgeTitle = isThinking
    ? t.voice_processing
    : activeTitleKey && t[activeTitleKey]
      ? t[activeTitleKey]
      : t.system_ready;

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col font-mono selection:bg-primary selection:text-primary-foreground">
      <StatusHeader
        t={t}
        locale={locale}
        theme={theme}
        onLocale={toggleLocale}
        onTheme={toggleTheme}
        isListening={isListening}
      />

      <main className="mx-auto flex max-w-7xl flex-col gap-4 sm:gap-6 px-3 sm:px-6 py-4 sm:py-8 pb-8 sm:pb-12 lg:px-8 flex-1 w-full">
        <section
          aria-label={t.app_name}
          className="relative overflow-hidden border border-border bg-card"
        >
          <div className="absolute inset-y-0 left-0 w-1 bg-primary z-10" />

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
                  <h2 className="font-mono text-[10px] sm:text-xs font-bold tracking-[0.15em] sm:tracking-[0.2em] text-primary uppercase">
                    {currentBadgeTitle}
                  </h2>
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

                <h1 className="font-mono text-xl sm:text-3xl lg:text-5xl font-black uppercase tracking-tight text-foreground leading-[1.15] break-words text-pretty">
                  {preventOrphans(currentInstruction)}
                </h1>
              </div>
            </div>
          </div>
        </section>

        {/* Sekcja wyboru protokołów ratunkowych */}
        <section aria-labelledby="protocols-heading" className="w-full">
          <h2 id="protocols-heading" className="sr-only">
            {t.select_protocol}
          </h2>
          <div className="grid grid-cols-2 gap-3 sm:gap-4 md:grid-cols-4">
            {protocols.map((protocol) => (
              <ProtocolCard
                key={protocol.id}
                protocol={protocol}
                selected={selected === protocol.id && !aiGuidance}
                label={protocol.label}
                onSelect={() => handleProtocolSelect(protocol.id as ProtocolId)}
              />
            ))}
          </div>
        </section>

        <section
          aria-labelledby="tools-heading"
          className="grid grid-cols-1 gap-4 sm:gap-6 md:grid-cols-3"
        >
          <h2 id="tools-heading" className="sr-only">
            {t.app_subtitle}
          </h2>

          <div className="space-y-4">
            <Metronome
              active={metronomeActive}
              beat={beat}
              t={t}
              onToggle={handleMetronomeToggle}
            />
          </div>

          <div className="border border-border bg-card p-4 sm:p-6 md:col-span-2 flex flex-col justify-between">
            <div className="space-y-3 sm:space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="font-mono text-[10px] sm:text-xs font-bold tracking-[0.2em] text-primary uppercase flex items-center gap-2">
                  <span className="relative flex size-2">
                    {isListening && (
                      <span className="absolute inline-flex size-full animate-ping rounded-full bg-primary opacity-75" />
                    )}
                    <span className="relative inline-flex size-2 rounded-full bg-primary" />
                  </span>
                  <span>{lastUserQuery || t.voice_ready}</span>
                </h3>
              </div>

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
              className={`mt-4 h-14 sm:h-20 w-full rounded-none font-mono font-black tracking-wider sm:tracking-widest text-sm sm:text-base md:text-lg flex items-center justify-center text-center px-4 cursor-pointer bg-red-700 hover:bg-red-800 text-white dark:bg-red-700 dark:hover:bg-red-800 dark:text-white shadow-md ${
                isListening
                  ? "!bg-red-950 hover:!bg-red-950 !text-white shadow-[0_0_20px_rgba(255,0,0,0.6)]"
                  : ""
              }`}
            >
              <Mic
                className={`mr-2 sm:mr-3 size-5 sm:size-6 shrink-0 text-white ${
                  isListening ? "animate-pulse" : ""
                }`}
              />
              <span className="truncate text-white">
                {isListening ? t.status_listening : t.btn_listen_start}
              </span>
            </Button>
          </div>
        </section>

        <div className="flex flex-wrap gap-4">
          <Button
            variant="outline"
            onClick={() => setWakeLockActive(!wakeLockActive)}
            className="rounded-none font-mono text-xs sm:text-sm font-bold cursor-pointer"
          >
            <ShieldCheck className="mr-2 size-4 text-primary" />
            {wakeLockActive ? t.keep_screen_on : t.keep_screen_on}
          </Button>
        </div>
      </main>

      <Footer />

      <a
        href="tel:112"
        className="fixed bottom-3 right-3 sm:bottom-6 sm:right-6 z-[100] flex items-center gap-2.5 sm:gap-4 bg-red-700 hover:bg-red-800 text-white px-4 py-3 sm:px-6 sm:py-4 shadow-2xl transition-transform hover:scale-105 active:scale-95 cursor-pointer"
      >
        <PhoneCall className="size-5 sm:size-7 animate-bounce shrink-0 text-white" />
        <span>
          <span className="block font-mono text-xl sm:text-3xl font-black leading-none text-white">
            {t.call_112}
          </span>
          <span className="mt-0.5 sm:mt-1 block text-[10px] sm:text-xs font-bold uppercase tracking-widest text-white">
            {t.call_112_sub}
          </span>
        </span>
      </a>

      <ScrollToTop />
    </div>
  );
}
