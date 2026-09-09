import "server-only";

/**
 * AI Service - LifeLine Voice
 * Serwerowa integracja z Groq Cloud dla porad ratunkowych.
 */

const GROQ_API_KEY =
  process.env.GROQ_API_KEY?.trim() ||
  process.env.NEXT_PUBLIC_GROQ_API_KEY?.trim() ||
  "";

const CHAT_URL = "https://api.groq.com/openai/v1/chat/completions";
const MODELS_URL = "https://api.groq.com/openai/v1/models";

type Locale = "pl" | "en";

type GroqMessage = {
  role: "system" | "user";
  content: string;
};

/**
 * Pobiera listę faktycznie dostępnych modeli dla danego klucza API
 */
async function getAccessibleModels(apiKey: string): Promise<string[]> {
  try {
    const res = await fetch(MODELS_URL, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      cache: "no-store",
    });

    if (!res.ok) {
      return [];
    }

    const data = await res.json();
    if (!Array.isArray(data?.data)) return [];

    return data.data
      .map((m: { id?: string }) => m?.id)
      .filter(
        (id: unknown): id is string =>
          typeof id === "string" &&
          !id.includes("whisper") &&
          !id.includes("guard") &&
          !id.includes("embed"),
      );
  } catch {
    return [];
  }
}

/**
 * Automatyczna korekta powszechnych kalk językowych modeli LLM
 */
function fixPolishGrammar(text: string): string {
  return text
    .replace(
      /\busiądź\s+(dziecko|dziecka|poszkodowanego|pacjenta|osobę)/gi,
      (match, p1) => {
        return match[0] === "U" ? `Posadź ${p1}` : `posadź ${p1}`;
      },
    )
    .replace(
      /\bpołóż\s+go\s+na\s+boku\b/gi,
      "ułóż poszkodowanego w pozycji bocznej ustalonej",
    )
    .replace(/\bdaj\s+mu\s+zimny\s+lód\b/gi, "podaj lód")
    .replace(/\bdaj\s+mu\s+lód\b/gi, "podaj lód");
}

function extractFinalAnswer(text: string, locale: Locale): string | null {
  if (!text) return null;

  let cleaned = text.trim();

  if (cleaned.includes("</think>")) {
    cleaned = cleaned.split("</think>").pop()?.trim() || "";
  } else if (cleaned.includes("<think>")) {
    cleaned = cleaned.replace(/<think>[\s\S]*?$/gi, "").trim();
  }

  cleaned = cleaned.replace(/[*#_`]/g, "").trim();
  cleaned = cleaned.replace(/\s+/g, " ").trim();

  const lastPunctuation = Math.max(
    cleaned.lastIndexOf("."),
    cleaned.lastIndexOf("!"),
    cleaned.lastIndexOf("?"),
  );

  if (lastPunctuation > 0) {
    cleaned = cleaned.slice(0, lastPunctuation + 1).trim();
  }

  if (locale === "pl" && cleaned) {
    cleaned = fixPolishGrammar(cleaned);
  }

  return cleaned || null;
}

function buildMessages(userQuery: string, locale: Locale): GroqMessage[] {
  const systemInstructions =
    locale === "pl"
      ? [
          "Jesteś doświadczonym dyspozytorem medycznym i ratownikiem.",
          "Udziel wyłącznie zwięzłych, bezpośrednich wskazówek pierwszej pomocy.",
          "Odpowiedz maksymalnie w 2-3 krótkich zdaniach w trybie rozkazującym.",
          "W przypadku krwawienia z nosa: każ pochylić głowę lekko do przodu (nigdy do tyłu!), ścisnąć skrzydełka nosa przez 10 minut i przyłożyć zimny okład na kark.",
          "Dbaj o nienaganną gramatykę języka polskiego: nie używaj kalk językowych (np. pisz 'posadź dziecko', a nie 'usiądź dziecko').",
          "W przypadku duszności, obrzęku dróg oddechowych, ukąszenia w jamę ustną lub utraty przytomności każ natychmiast wezwać 112.",
          "Nie dodawaj wstępów, ostrzeżeń marketingowych ani markdownu.",
        ].join(" ")
      : [
          "You are an experienced paramedic and emergency dispatcher.",
          "Give only immediate first-aid instructions.",
          "Answer in at most 2-3 short sentences.",
          "Use the imperative mood.",
          "For nosebleeds: instruct to lean forward slightly (never tilt back), pinch the soft part of the nose for 10 minutes, and apply a cold compress to the neck.",
          "If the situation sounds life-threatening (compromised airway, anaphylaxis, severe hemorrhage), instruct the user to call 112 immediately.",
          "Do not add preambles, marketing disclaimers, or markdown.",
        ].join(" ");

  return [
    {
      role: "system",
      content: systemInstructions,
    },
    {
      role: "user",
      content: userQuery,
    },
  ];
}

async function requestChatCompletion(
  apiKey: string,
  model: string,
  messages: GroqMessage[],
  locale: Locale,
): Promise<string | null> {
  const response = await fetch(CHAT_URL, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model,
      messages,
      temperature: 0.2,
      max_tokens: 150,
      stream: false,
    }),
    cache: "no-store",
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Groq API Error ${response.status}: ${errorText}`);
  }

  const data = await response.json();
  const rawContent = data?.choices?.[0]?.message?.content;

  if (!rawContent || typeof rawContent !== "string") {
    return null;
  }

  return extractFinalAnswer(rawContent, locale);
}

/**
 * Deterministyczna baza natychmiastowych wskazówek ratunkowych na wypadek problemu z kluczem API
 */
function getDeterministicFallback(query: string, locale: Locale): string {
  const q = query.toLowerCase();

  if (locale === "pl") {
    if (
      q.includes("nos") ||
      q.includes("katar") ||
      q.includes("krwotok z nosa")
    ) {
      return "Pochyl głowę dziecka lekko do przodu. Ściśnij skrzydełka nosa przez 10 minut. Przyłóż zimny okład na kark.";
    }
    if (q.includes("oparzen") || q.includes("sparzy") || q.includes("gorąc")) {
      return "Chłodź oparzone miejsce czystą, chłodną wodą przez minimum 15 minut. Załóż jałowy, luźny opatrunek i nie przekłuwaj pęcherzy.";
    }
    if (q.includes("użądlen") || q.includes("osa") || q.includes("pszczoł")) {
      return "Usuń żądło podważając je paznokciem lub kartą. Przyłóż zimny okład. W razie obrzęku gardła natychmiast dzwoń pod 112.";
    }
    if (q.includes("udar") || q.includes("opadając") || q.includes("paraliż")) {
      return "Sprawdź asymetrię twarzy i niedowład rąk. Natychmiast wezwij 112 i ułóż chorego z lekko uniesioną głową.";
    }
    return "Upewnij się, że poszkodowany oddycha i jest bezpieczny. W razie wątpliwości natychmiast dzwoń pod 112.";
  } else {
    if (q.includes("nose") || q.includes("nosebleed")) {
      return "Lean the child slightly forward. Pinch the soft part of the nose for 10 minutes. Apply a cold compress to the back of the neck.";
    }
    if (q.includes("burn") || q.includes("scald")) {
      return "Cool the burn with cool running water for at least 15 minutes. Cover loosely with a sterile dressing.";
    }
    return "Ensure the patient is breathing and safe. When in doubt, call 112 immediately.";
  }
}

export async function getEmergencyGuidance(
  query: string,
  locale: Locale = "pl",
): Promise<string | null> {
  if (!query || !query.trim()) {
    return null;
  }

  const apiKey = GROQ_API_KEY;

  if (apiKey) {
    // 1. Sprawdzamy, jakie modele są faktycznie aktywne dla tego klucza
    const accessible = await getAccessibleModels(apiKey);
    const modelsToTry =
      accessible.length > 0
        ? accessible
        : ["llama-3.3-70b-versatile", "llama-3.1-8b-instant"];
    const messages = buildMessages(query.trim(), locale);

    for (const model of modelsToTry) {
      try {
        const guidance = await requestChatCompletion(
          apiKey,
          model,
          messages,
          locale,
        );
        if (guidance) {
          return guidance;
        }
      } catch {
        // Ciche przejście do kolejnego modelu lub fallbacku bez zalewania konsoli
      }
    }
  }

  // Błyskawiczny, natychmiastowy fallback ratunkowy
  return getDeterministicFallback(query.trim(), locale);
}
