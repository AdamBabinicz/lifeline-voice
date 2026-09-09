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
      "Ułóż poszkodowanego w pozycji bocznej ustalonej",
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
          "Jesteś profesjonalnym dyspozytorem ratownictwa medycznego (numer 112).",
          "Twoim celem jest podanie natychmiastowych, bezpiecznych wytycznych ratujących życie.",
          "ODPOWIADAJ ZAWSZE W PUNKTACH: 1., 2., 3., maksymalnie 3-4 zwięzłe punkty w trybie rozkazującym.",
          "ZASADY DLA POŁKNIĘCIA CHEMII, KAPSUŁEK DO PRANIA, DETERGENTÓW LUB LEKÓW:",
          "1. KROK 1: BEZWZGLĘDNIE NIE WYWOŁUJ WYMIOTÓW (ryzyko chemicznego zalania płuc i poparzenia przełyku).",
          "2. KROK 2: NATYCHMIAST WEZWIJ 112 i przygotuj opakowanie środka.",
          "3. KROK 3: Wyjmij resztki z jamy ustnej i wypłucz usta wodą (nie zmuszaj do połykania płynów).",
          "4. KROK 4: Posadź poszkodowanego pionowo i kontroluj oddech.",
          "ZASADY DLA KRWOTOKU Z NOSA: Pochyl lekko głowę do przodu (nigdy do tyłu!), zaciśnij skrzydełka nosa na 10 minut, przyłóż zimny okład na kark.",
          "ZASADY DLA OPARZEŃ: Chłodź czystą, chłodną bieżącą wodą przez 15-20 minut. Nie przekłuwaj pęcherzy.",
          "Dbaj o nienaganną gramatykę: pisz 'posadź poszkodowanego', a nie 'usiądź'.",
          "Żadnych wstępów, powitań, pogrubień ani markdownu.",
        ].join(" ")
      : [
          "You are a professional emergency medical dispatcher (911/112).",
          "Provide immediate, life-saving instructions directly in ordered steps: 1., 2., 3.",
          "Maximum 3-4 crisp imperative sentences.",
          "INGESTION OF CHEMICALS / LAUNDRY PODS / DETERGENTS:",
          "1. STEP 1: DO NOT INDUCE VOMITING (severe risk of aspiration and esophagus chemical burn).",
          "2. STEP 2: CALL 112 IMMEDIATELY and keep the product packaging ready.",
          "3. STEP 3: Remove any remnants and rinse mouth with water (do not force large amounts of liquids).",
          "4. STEP 4: Keep the patient sitting upright and closely monitor airway and breathing.",
          "FOR NOSEBLEEDS: Lean slightly forward (never back), pinch soft part of nose for 10 minutes, apply cold compress to neck.",
          "FOR BURNS: Cool with cool running tap water for 15-20 minutes. Do not pop blisters.",
          "No conversational filler, greetings, bolding, or markdown.",
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
      temperature: 0.1,
      max_tokens: 180,
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
      q.includes("kulk") ||
      q.includes("kapsuł") ||
      q.includes("prani") ||
      q.includes("połkn") ||
      q.includes("chemia") ||
      q.includes("detergent") ||
      q.includes("płyn do naczyń") ||
      q.includes("kret")
    ) {
      return "1. Nie wywołuj wymiotów – grozi to spienieniem i poparzeniem dróg oddechowych. 2. Natychmiast zadzwoń pod 112 i zabezpiecz opakowanie. 3. Wypłucz usta wodą i usuń resztki żelu. 4. Posadź poszkodowanego pionowo i kontroluj oddech.";
    }
    if (
      q.includes("nos") ||
      q.includes("katar") ||
      q.includes("krwotok z nosa")
    ) {
      return "1. Pochyl głowę lekko do przodu, nie odchylaj do tyłu. 2. Ściśnij skrzydełka nosa przez 10 minut. 3. Przyłóż zimny okład na kark.";
    }
    if (q.includes("oparzen") || q.includes("sparzy") || q.includes("gorąc")) {
      return "1. Chłodź oparzenie czystą, chłodną bieżącą wodą przez 15-20 minut. 2. Załóż jałowy, luźny opatrunek. 3. Nie przekłuwaj pęcherzy. 4. Przy rozległych oparzeniach dzwoń pod 112.";
    }
    if (q.includes("użądlen") || q.includes("osa") || q.includes("pszczoł")) {
      return "1. Podważ i usuń żądło paznokciem lub kartą, nie ściskaj go. 2. Przyłóż zimny okład. 3. Przy użądleniu w jamę ustną lub duszności natychmiast dzwoń pod 112.";
    }
    if (q.includes("udar") || q.includes("opadając") || q.includes("paraliż")) {
      return "1. Sprawdź opadanie kącika ust, osłabienie ręki i bełkotliwą mowę. 2. Natychmiast wezwij 112. 3. Ułóż chorego z lekko uniesioną głową i nie podawaj płynów.";
    }
    return "1. Upewnij się, że miejsce jest bezpieczne. 2. Sprawdź przytomność i oddech. 3. W razie zagrożenia życia natychmiast dzwoń pod 112.";
  } else {
    if (
      q.includes("pod") ||
      q.includes("swallow") ||
      q.includes("laundry") ||
      q.includes("detergent") ||
      q.includes("chemical")
    ) {
      return "1. DO NOT induce vomiting to prevent airway burns and foaming. 2. Call 112 immediately and keep the packaging ready. 3. Rinse mouth with water and remove remnants. 4. Keep sitting upright and monitor breathing.";
    }
    if (q.includes("nose") || q.includes("nosebleed")) {
      return "1. Lean slightly forward, never tilt back. 2. Pinch the soft part of the nose for 10 minutes. 3. Apply a cold compress to the neck.";
    }
    if (q.includes("burn") || q.includes("scald")) {
      return "1. Cool with cool running water for 15-20 minutes. 2. Cover loosely with a sterile dressing. 3. Do not pop blisters. 4. Call 112 if severe.";
    }
    return "1. Ensure scene is safe. 2. Check responsiveness and breathing. 3. Call 112 immediately in life-threatening conditions.";
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
        // Ciche przejście do kolejnego modelu
      }
    }
  }

  return getDeterministicFallback(query.trim(), locale);
}
