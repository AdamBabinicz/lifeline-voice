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
  const activeUtteranceRef = useRef<SpeechSynthesisUtterance | null>(null);
  const lastSpokenNormalizedTextRef = useRef<string | null>(null);
  const lastRawInstructionTextRef = useRef<string | null>(null);
  const lastActionKeyRef = useRef<string | null>(null);
  const lastActionTimeRef = useRef<number>(0);
  const speechStartTimeRef = useRef<number>(0);
  const isSpeakingRef = useRef<boolean>(false);
  const speakTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Ochrona przed zduplikowanym wywołaniem komendy
  const lastProcessedTranscriptRef = useRef<string>("");
  const lastProcessedTimeRef = useRef<number>(0);

  // Ochrona przed równoległymi zapytaniami do AI
  const isQueryingAiRef = useRef<boolean>(false);
  const aiAbortControllerRef = useRef<AbortController | null>(null);

  // Timer ciszy do zakończenia wielowyrazowego zdania
  const silenceTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Trwała flaga intencji użytkownika
  const userWantsListeningRef = useRef<boolean>(false);

  // Stabilna referencja do wywoływania komend
  const handleVoiceCommandRef = useRef<(transcript: string) => void>(() => {});

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
    } catch {
      // Ignoruj
    }
  }, []);

  /**
   * Filtr Self-Echo: Odrzuca dźwięk z głośnika tylko wtedy, gdy całe wypowiedziane zdanie
   * to dosłowne powtórzenie lektora.
   */
  const isSelfEcho = useCallback(
    (transcript: string, spokenNormalizedText: string | null): boolean => {
      if (!spokenNormalizedText || !transcript) return false;
      const cleanTranscript = transcript
        .toLowerCase()
        .replace(/[^a-z0-9ąćęłńóśźż\s]/gi, "")
        .trim();
      const cleanSpoken = spokenNormalizedText
        .toLowerCase()
        .replace(/[^a-z0-9ąćęłńóśźż\s]/gi, "")
        .trim();

      if (!cleanTranscript || !cleanSpoken) return false;

      // Jeśli transkrypcja w 85% dosłownie pokrywa się z czytanym tekstem -> to echo
      return (
        cleanSpoken.includes(cleanTranscript) && cleanTranscript.length > 8
      );
    },
    [],
  );

  const speakInstruction = useCallback(
    (text: string, forceBargeIn: boolean = false) => {
      if (typeof window === "undefined" || !("speechSynthesis" in window))
        return;

      if (!text || !text.trim()) return;

      const now = Date.now();

      // Zamiana formatu "Krok 1:", "Krok 2:" oraz oczyszczenie zduplikowanych liczników
      let cleanText = text
        .replace(/\bKrok\s*1\s*:\s*/gi, "1. ")
        .replace(/\bKrok\s*2\s*:\s*/gi, "2. ")
        .replace(/\bKrok\s*3\s*:\s*/gi, "3. ")
        .replace(/\bKrok\s*4\s*:\s*/gi, "4. ")
        .replace(/\bKrok\s*5\s*:\s*/gi, "5. ")
        .replace(/\bStep\s*1\s*:\s*/gi, "1. ")
        .replace(/\bStep\s*2\s*:\s*/gi, "2. ")
        .replace(/\bStep\s*3\s*:\s*/gi, "3. ")
        .replace(/\bStep\s*4\s*:\s*/gi, "4. ")
        .replace(/1\.\s*Po pierwsze,?/gi, "Po pierwsze,")
        .replace(/(Po pierwsze,?\s*){2,}/gi, "Po pierwsze, ")
        .replace(/2\.\s*Po drugie,?/gi, "Po drugie,")
        .replace(/(Po drugie,?\s*){2,}/gi, "Po drugie, ")
        .replace(/3\.\s*Po trzecie,?/gi, "Po trzecie,")
        .replace(/(Po trzecie,?\s*){2,}/gi, "Po trzecie, ");

      let speechText = normalizeSpeechForTTS(cleanText, locale)
        .replace(/(Po pierwsze,?\s*){2,}/gi, "Po pierwsze, ")
        .replace(/(Po drugie,?\s*){2,}/gi, "Po drugie, ")
        .replace(/(Po trzecie,?\s*){2,}/gi, "Po trzecie, ")
        .replace(/(Step one:?\s*){2,}/gi, "Step one: ")
        .replace(/(Step two:?\s*){2,}/gi, "Step two: ")
        .trim();

      // Blokada przed zapętlaniem dokładnie tego samego komunikatu
      if (
        !forceBargeIn &&
        lastSpokenNormalizedTextRef.current === speechText &&
        (isSpeakingRef.current || now - speechStartTimeRef.current < 2500)
      ) {
        return;
      }

      if (speakTimeoutRef.current) {
        clearTimeout(speakTimeoutRef.current);
        speakTimeoutRef.current = null;
      }

      // Natychmiast zatrzymaj poprzednią mowę lektora
      try {
        window.speechSynthesis.cancel();
      } catch {
        // Ignoruj
      }

      speechStartTimeRef.current = now;
      isSpeakingRef.current = true;
      lastRawInstructionTextRef.current = text;
      lastSpokenNormalizedTextRef.current = speechText;

      // Bufor 45ms na zresetowanie kolejki syntezatora
      speakTimeoutRef.current = setTimeout(() => {
        try {
          const safeSpeechText = speechText.startsWith(",")
            ? speechText
            : ", " + speechText;
          const utterance = new SpeechSynthesisUtterance(safeSpeechText);
          activeUtteranceRef.current = utterance;
          (window as any).__lifelineActiveUtterance = utterance;

          utterance.lang = locale === "pl" ? "pl-PL" : "en-US";
          utterance.rate = 1.0;
          utterance.pitch = 1.0;

          try {
            const voices = window.speechSynthesis.getVoices();
            const targetLang = locale === "pl" ? "pl" : "en";
            const matchedVoice =
              voices.find(
                (v) =>
                  v.lang.toLowerCase().startsWith(targetLang) &&
                  (v.localService || v.default),
              ) ||
              voices.find((v) => v.lang.toLowerCase().startsWith(targetLang));

            if (matchedVoice) {
              utterance.voice = matchedVoice;
            }
          } catch {
            // Ignoruj
          }

          utterance.onstart = () => {
            isSpeakingRef.current = true;
          };

          utterance.onend = () => {
            if (activeUtteranceRef.current === utterance) {
              isSpeakingRef.current = false;
              activeUtteranceRef.current = null;
              (window as any).__lifelineActiveUtterance = null;
            }
          };

          utterance.onerror = () => {
            if (activeUtteranceRef.current === utterance) {
              isSpeakingRef.current = false;
              activeUtteranceRef.current = null;
              (window as any).__lifelineActiveUtterance = null;
            }
          };

          window.speechSynthesis.speak(utterance);
        } catch {
          isSpeakingRef.current = false;
          activeUtteranceRef.current = null;
          (window as any).__lifelineActiveUtterance = null;
        }
      }, 45);
    },
    [locale],
  );

  const repeatLastGuidance = useCallback(() => {
    if (lastRawInstructionTextRef.current) {
      lastActionTimeRef.current = Date.now();
      speechStartTimeRef.current = 0;
      speakInstruction(lastRawInstructionTextRef.current, true);
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

  // Odpytanie serwerowego AI gdy zapytanie nie pasuje do lokalnego katalogu
  const queryAiGuidance = useCallback(
    async (queryText: string) => {
      if (isQueryingAiRef.current) {
        return;
      }

      if (aiAbortControllerRef.current) {
        aiAbortControllerRef.current.abort();
      }

      const controller = new AbortController();
      aiAbortControllerRef.current = controller;
      isQueryingAiRef.current = true;

      setIsThinking(true);
      setErrorMessage(null);

      try {
        const response = await fetch("/api/guidance", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            query: queryText,
            locale,
          }),
          signal: controller.signal,
        });

        const data = await response.json().catch(() => null);

        if (response.ok && data?.ok && data?.guidance) {
          setSelected(null);
          setMetronomeActive(false);
          setAiGuidance(data.guidance);
          setActiveTitleKey(null);
          speakInstruction(data.guidance, true);
        } else {
          setErrorMessage(data?.message || t.voice_error);
        }
      } catch (err: any) {
        if (err?.name === "AbortError") {
          return;
        }
        console.error("Failed to query AI guidance:", err);
        setErrorMessage(t.voice_error);
      } finally {
        isQueryingAiRef.current = false;
        setIsThinking(false);
      }
    },
    [locale, speakInstruction, t.voice_error],
  );

  const handleVoiceCommand = useCallback(
    (transcript: string) => {
      const lower = transcript.toLowerCase().trim();
      if (!lower || lower.length < 3) return;

      const now = Date.now();
      const currentlySpeaking = isSpeakingRef.current;

      const result = analyzeRescueQuery(transcript, locale, t);

      // JEŚLI NIE ROZPOZNANO W LOKALNYM KATALOGU -> ODPYTANIE SERWERA AI (z filtrem echa)
      if (result.type === "unknown") {
        if (
          currentlySpeaking &&
          isSelfEcho(lower, lastSpokenNormalizedTextRef.current)
        ) {
          return;
        }

        if (
          lastProcessedTranscriptRef.current === lower &&
          now - lastProcessedTimeRef.current < 2000
        ) {
          return;
        }

        lastProcessedTranscriptRef.current = lower;
        lastProcessedTimeRef.current = now;
        setLastUserQuery(transcript);

        if (currentlySpeaking) {
          try {
            window.speechSynthesis.cancel();
          } catch {}
          isSpeakingRef.current = false;
        }
        queryAiGuidance(transcript);
        return;
      }

      // JEŚLI ROZPOZNANO KONKRETNĄ PROCEDURĘ RATUNKOWĄ (CPR, CHOKING, UNCONSCIOUS itp.):
      // Nigdy nie blokujemy jej filtrem echa! Komenda ratunkowa ma zawsze 100% priorytet!
      const currentActionKey =
        result.command ||
        result.protocolId ||
        result.guidanceKey ||
        result.displayText;

      const isSameAction =
        currentActionKey === lastActionKeyRef.current ||
        (currentActionKey === "cpr" &&
          lastActionKeyRef.current === "start_cpr") ||
        (currentActionKey === "start_cpr" &&
          lastActionKeyRef.current === "cpr");

      // Blokada zapętlania dokładnie tej samej procedury, jeśli trwa już jej odtwarzanie
      const timeSinceLastAction = now - lastActionTimeRef.current;
      if (isSameAction && currentlySpeaking && timeSinceLastAction < 2500) {
        return;
      }

      // VOICE BARGE-IN: Nowa procedura ratunkowa w trakcie trwania mowy poprzedniej -> NATYCHMIAST PRZERWIJ LEKTORA!
      const isBargeIn = currentlySpeaking && !isSameAction;
      if (currentlySpeaking) {
        try {
          window.speechSynthesis.cancel();
        } catch {
          // Ignoruj
        }
        isSpeakingRef.current = false;
        activeUtteranceRef.current = null;
      }

      if (aiAbortControllerRef.current) {
        aiAbortControllerRef.current.abort();
        aiAbortControllerRef.current = null;
      }
      isQueryingAiRef.current = false;
      setIsThinking(false);

      lastProcessedTranscriptRef.current = lower;
      lastProcessedTimeRef.current = now;
      lastActionKeyRef.current = currentActionKey;
      lastActionTimeRef.current = now;
      setLastUserQuery(transcript);
      setErrorMessage(null);

      if (result.type === "command") {
        if (result.command === "start_cpr") {
          setSelected("cpr");
          setAiGuidance(null);
          setActiveTitleKey("title_cpr");
          setMetronomeActive(true);
          speakInstruction(result.spokenText, isBargeIn);
          return;
        }
        if (result.command === "stop_metronome") {
          setMetronomeActive(false);
          speakInstruction(result.spokenText, isBargeIn);
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
        speakInstruction(result.spokenText, isBargeIn);
        return;
      }

      if (result.type === "guidance") {
        setSelected(null);
        setMetronomeActive(false);
        setAiGuidance(result.displayText);
        setActiveTitleKey(result.titleKey || null);
        speakInstruction(result.spokenText, isBargeIn);
        return;
      }
    },
    [
      isSelfEcho,
      locale,
      queryAiGuidance,
      speakInstruction,
      t,
      toggleLocaleFromProvider,
    ],
  );

  useEffect(() => {
    handleVoiceCommandRef.current = handleVoiceCommand;
  }, [handleVoiceCommand]);

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
      let finalTranscript = "";
      let currentTranscript = "";

      for (let i = event.resultIndex; i < event.results.length; i++) {
        const item = event.results[i];
        const text = item?.[0]?.transcript;
        if (text) {
          if (item.isFinal) {
            finalTranscript += text + " ";
          } else {
            currentTranscript = text;
          }
        }
      }

      const activeText = finalTranscript.trim() || currentTranscript.trim();
      if (!activeText) return;

      // Zawsze na bieżąco pokazujemy tekst w wizualizerze
      setLastUserQuery(activeText);

      // Błyskawiczny Barge-In na komendy ratunkowe i procedury (nie czekamy na pauzę)
      const quickLower = activeText.toLowerCase().trim();
      const isUrgent =
        ["stop", "pauza", "pause", "rko", "cpr"].includes(quickLower) ||
        quickLower.includes("przytomn") ||
        quickLower.includes("nie oddycha") ||
        quickLower.includes("zemdla");

      if (isUrgent) {
        if (silenceTimerRef.current) {
          clearTimeout(silenceTimerRef.current);
          silenceTimerRef.current = null;
        }
        handleVoiceCommandRef.current(activeText);
        return;
      }

      // Jeśli przeglądarka oznaczyła frazę jako ostateczną (isFinal) -> wykonaj od razu
      if (finalTranscript.trim()) {
        if (silenceTimerRef.current) {
          clearTimeout(silenceTimerRef.current);
          silenceTimerRef.current = null;
        }
        handleVoiceCommandRef.current(finalTranscript.trim());
        return;
      }

      // Dla zdań wielowyrazowych czekamy na 450ms ciszy
      if (silenceTimerRef.current) {
        clearTimeout(silenceTimerRef.current);
      }

      silenceTimerRef.current = setTimeout(() => {
        handleVoiceCommandRef.current(activeText);
      }, 450);
    };

    recognition.onerror = (event: any) => {
      if (event.error === "no-speech" || event.error === "aborted") {
        return;
      }
      if (event.error === "not-allowed") {
        userWantsListeningRef.current = false;
        setIsListening(false);
      }
    };

    recognition.onend = () => {
      // HANDS-FREE: Smartfon czuwa ciągle w tle
      if (userWantsListeningRef.current) {
        try {
          recognition.start();
          setIsListening(true);
        } catch {
          // Ignoruj
        }
      } else {
        setIsListening(false);
      }
    };

    recognitionRef.current = recognition;

    return () => {
      if (silenceTimerRef.current) {
        clearTimeout(silenceTimerRef.current);
      }
      try {
        recognition.stop();
      } catch {
        // Ignoruj
      }
    };
  }, [locale]);

  const toggleListening = useCallback(() => {
    primeAudioContext();

    if (!recognitionRef.current) {
      setErrorMessage(t.voice_error);
      return;
    }

    if (userWantsListeningRef.current) {
      userWantsListeningRef.current = false;
      setIsListening(false);
      if (silenceTimerRef.current) {
        clearTimeout(silenceTimerRef.current);
      }
      try {
        recognitionRef.current.stop();
      } catch {
        // Ignoruj
      }
      if (speakTimeoutRef.current) {
        clearTimeout(speakTimeoutRef.current);
        speakTimeoutRef.current = null;
      }
      if (typeof window !== "undefined" && "speechSynthesis" in window) {
        window.speechSynthesis.cancel();
      }
      isSpeakingRef.current = false;
    } else {
      userWantsListeningRef.current = true;
      setErrorMessage(null);
      try {
        recognitionRef.current.start();
        setIsListening(true);
      } catch {
        userWantsListeningRef.current = false;
        setIsListening(false);
      }
    }
  }, [primeAudioContext, t.voice_error]);

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
      if (speakTimeoutRef.current) {
        clearTimeout(speakTimeoutRef.current);
        speakTimeoutRef.current = null;
      }
      if (typeof window !== "undefined" && "speechSynthesis" in window) {
        window.speechSynthesis.cancel();
      }
      isSpeakingRef.current = false;
      speechStartTimeRef.current = 0;
      lastActionKeyRef.current = null;
    } else {
      setSelected(id);
      setAiGuidance(null);
      setActiveTitleKey(`title_${id}`);
      lastActionKeyRef.current = id;
      lastActionTimeRef.current = Date.now();

      if (id === "cpr") {
        setMetronomeActive(true);
      } else {
        setMetronomeActive(false);
      }

      const proto = protocols.find((p) => p.id === id);
      if (proto) {
        const spokenKey =
          id === "cpr" ? "cpr_full_guidance_spoken" : `${id}_desc_spoken`;
        speakInstruction(t[spokenKey] || proto.instruction, true);
      }
    }
  };

  const handleMetronomeToggle = () => {
    primeAudioContext();
    if (!isCprContext && !metronomeActive) {
      setSelected("cpr");
      setAiGuidance(null);
      setActiveTitleKey("title_cpr");
      lastActionKeyRef.current = "cpr";
      lastActionTimeRef.current = Date.now();
      setMetronomeActive(true);
      speakInstruction(
        t.cpr_full_guidance_spoken || t.cpr_full_guidance || t.cpr_desc,
        true,
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
                  <span
                    role="status"
                    aria-live="polite"
                    className="inline-block font-mono text-[10px] sm:text-xs font-bold tracking-[0.15em] sm:tracking-[0.2em] text-primary uppercase"
                  >
                    {currentBadgeTitle}
                  </span>
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

        <section aria-labelledby="protocols-heading" className="w-full">
          <h2 id="protocols-heading" className="sr-only">
            {t.protocol_cpr
              ? `${t.protocol_cpr}, ${t.protocol_choking}, ${t.protocol_bleeding}`
              : t.select_protocol}
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
            className={`rounded-none font-mono text-xs sm:text-sm font-bold cursor-pointer transition-all border-2 ${
              wakeLockActive
                ? "border-primary bg-primary/10 text-primary shadow-sm"
                : "border-border text-foreground hover:border-primary"
            }`}
          >
            <ShieldCheck
              className={`mr-2 size-4 ${
                wakeLockActive
                  ? "text-primary animate-pulse"
                  : "text-muted-foreground"
              }`}
            />
            {wakeLockActive
              ? locale === "pl"
                ? "EKRAN ZAWSZE AKTYWNY (NIE WYGAŚNIE)"
                : "SCREEN KEPT AWAKE (ALWAYS ON)"
              : t.keep_screen_on}
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
