/**
 * AI Service - LifeLine Voice
 * Logika inteligentnych odpowiedzi ratunkowych przy użyciu Groq Cloud.
 */

const GROQ_API_KEY = process.env.NEXT_PUBLIC_GROQ_API_KEY;
const CHAT_URL = "https://api.groq.com/openai/v1/chat/completions";
const MODELS_URL = "https://api.groq.com/openai/v1/models";

const PREFERRED_MODELS = [
  "llama-3.1-8b-instant",
  "mixtral-8x7b-32768",
  "gemma2-9b-it",
];

let cachedWorkingModel: string | null = null;

async function getAvailableModel(apiKey: string): Promise<string> {
  if (cachedWorkingModel) return cachedWorkingModel;

  try {
    const res = await fetch(MODELS_URL, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
    });

    if (res.ok) {
      const data = await res.json();
      const serverModelIds: string[] = (data.data || []).map((m: any) => m.id);

      const matched = PREFERRED_MODELS.find((m) => serverModelIds.includes(m));
      if (matched) {
        cachedWorkingModel = matched;
        return matched;
      }

      const fallback = serverModelIds.find(
        (id) =>
          !id.includes("whisper") &&
          !id.includes("vision") &&
          !id.includes("deepseek") &&
          !id.includes("r1"),
      );
      if (fallback) {
        cachedWorkingModel = fallback;
        return fallback;
      }
    }
  } catch {
    // fallback
  }

  cachedWorkingModel = "llama-3.1-8b-instant";
  return cachedWorkingModel;
}

// Uniwersalna funkcja czyszcząca - bez zaszytych na stałe tekstów w jakimkolwiek języku
function extractFinalAnswer(text: string): string | null {
  if (!text) return null;

  let cleaned = text;

  // 1. Odetnij cały blok myślenia <think>...</think>, jeśli istnieje
  if (cleaned.includes("</think>")) {
    cleaned = cleaned.split("</think>").pop() || "";
  } else if (cleaned.includes("<think>")) {
    // Jeśli model nie zamknął tagu <think>, usuń wszystko co w nim jest
    cleaned = cleaned.replace(/<think>[\s\S]*?$/gi, "");
  }

  // 2. Wyczyść znaczniki formatowania Markdown (*, #, _, itp.)
  cleaned = cleaned.replace(/[*#_`]/g, "").trim();

  // 3. Jeśli po wyczyszczeniu nic nie zostało, zwróć null (nie wymyślamy sztucznych zdań)
  return cleaned.length > 0 ? cleaned : null;
}

export async function getEmergencyGuidance(
  userQuery: string,
  locale: "pl" | "en",
): Promise<string | null> {
  if (!GROQ_API_KEY) {
    console.warn("NEXT_PUBLIC_GROQ_API_KEY is missing in .env.local");
    return null;
  }

  const cleanQuery = userQuery?.trim();
  if (!cleanQuery) return null;

  const apiKey = GROQ_API_KEY.trim();

  // Dynamiczny prompt ściśle dopasowany do wybranego locale (pl / en)
  const systemPrompt =
    locale === "pl"
      ? "Jesteś polskim ratownikiem medycznym. Używaj nienagannej polszczyzny. Odpowiedz DOKŁADNIE w maksymalnie 2 krótkich zdaniach z konkretnymi instrukcjami ratującymi zdrowie. Tylko czyste polecenia, bez powitań i analizy."
      : "You are an emergency paramedic. Respond STRICTLY in English with maximum 2 short sentences containing actionable first aid instructions. Do not add greetings or analysis.";

  try {
    const selectedModel = await getAvailableModel(apiKey);

    const response = await fetch(CHAT_URL, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: selectedModel,
        messages: [
          {
            role: "system",
            content: systemPrompt,
          },
          {
            role: "user",
            content: cleanQuery,
          },
        ],
        temperature: 0.1,
        max_tokens: 300,
        stream: false,
      }),
    });

    if (!response.ok) {
      cachedWorkingModel = null;
      return null;
    }

    const data = await response.json();
    const rawAnswer = data.choices?.[0]?.message?.content || "";

    // Zwraca czystą, wygenerowaną przez AI odpowiedź w wybranym języku (lub null)
    return extractFinalAnswer(rawAnswer);
  } catch {
    return null;
  }
}
