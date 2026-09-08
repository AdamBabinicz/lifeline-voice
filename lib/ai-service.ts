import "server-only";

/**
 * AI Service - LifeLine Voice
 * Serwerowa integracja z Groq Cloud dla krótkich porad ratunkowych.
 */

const GROQ_API_KEY =
  process.env.GROQ_API_KEY?.trim() ||
  process.env.NEXT_PUBLIC_GROQ_API_KEY?.trim() ||
  "";

const CHAT_URL = "https://api.groq.com/openai/v1/chat/completions";
const MODELS_URL = "https://api.groq.com/openai/v1/models";

const PREFERRED_MODELS = [
  "llama-3.3-70b-versatile",
  "llama-3.1-8b-instant",
  "mixtral-8x7b-32768",
  "gemma2-9b-it",
];

let cachedWorkingModel: string | null = null;

type Locale = "pl" | "en";

type GroqMessage = {
  role: "system" | "user";
  content: string;
};

async function getAvailableModels(apiKey: string): Promise<string[]> {
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
    const ids = Array.isArray(data?.data)
      ? data.data
          .map((model: { id?: string }) => model?.id)
          .filter((id: unknown): id is string => typeof id === "string")
      : [];

    return ids;
  } catch (error) {
    console.warn("Groq model discovery failed:", error);
    return [];
  }
}

async function getModelCandidates(apiKey: string): Promise<string[]> {
  const candidates: string[] = [];

  if (cachedWorkingModel) {
    candidates.push(cachedWorkingModel);
  }

  const availableModels = await getAvailableModels(apiKey);

  for (const model of PREFERRED_MODELS) {
    if (availableModels.includes(model) && !candidates.includes(model)) {
      candidates.push(model);
    }
  }

  for (const model of PREFERRED_MODELS) {
    if (!candidates.includes(model)) {
      candidates.push(model);
    }
  }

  for (const model of availableModels) {
    if (!candidates.includes(model)) {
      candidates.push(model);
    }
  }

  return candidates;
}

function extractFinalAnswer(text: string): string | null {
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

  return cleaned || null;
}

function buildMessages(userQuery: string, locale: Locale): GroqMessage[] {
  const systemInstructions =
    locale === "pl"
      ? [
          "Jesteś doświadczonym ratownikiem medycznym.",
          "Udziel wyłącznie doraźnych wskazówek pierwszej pomocy.",
          "Odpowiedz maksymalnie w 3 krótkich zdaniach.",
          "Używaj trybu rozkazującego.",
          "Jeżeli stan brzmi na zagrożenie życia, każ natychmiast wezwać 112.",
          "Nie dodawaj wstępów, ostrzeżeń marketingowych ani markdownu.",
        ].join(" ")
      : [
          "You are an experienced paramedic.",
          "Give only immediate first-aid instructions.",
          "Answer in at most 3 short sentences.",
          "Use the imperative mood.",
          "If the situation sounds life-threatening, instruct the user to call 112 immediately.",
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
      max_completion_tokens: 160,
      top_p: 0.9,
      stream: false,
    }),
    cache: "no-store",
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Groq API Error ${response.status}: ${errorText}`);
  }

  const data = await response.json();
  const rawAnswer = data?.choices?.[0]?.message?.content;

  return typeof rawAnswer === "string" ? extractFinalAnswer(rawAnswer) : null;
}

export async function getEmergencyGuidance(
  userQuery: string,
  locale: Locale,
): Promise<string | null> {
  if (!GROQ_API_KEY) {
    console.error("Missing GROQ_API_KEY");
    return null;
  }

  const cleanQuery = userQuery?.trim();
  if (!cleanQuery) return null;

  const messages = buildMessages(cleanQuery, locale);
  const candidates = await getModelCandidates(GROQ_API_KEY);
  let lastError: unknown = null;

  for (const model of candidates) {
    try {
      const answer = await requestChatCompletion(GROQ_API_KEY, model, messages);
      if (answer) {
        cachedWorkingModel = model;
        return answer;
      }
    } catch (error) {
      lastError = error;
      console.warn(`Groq request failed for model ${model}:`, error);
      if (cachedWorkingModel === model) {
        cachedWorkingModel = null;
      }
    }
  }

  if (lastError) {
    console.error("All Groq model attempts failed:", lastError);
  }

  return null;
}
