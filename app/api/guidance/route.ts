import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    const { query, locale } = await req.json();

    const apiKey =
      process.env.GROQ_API_KEY || process.env.NEXT_PUBLIC_GROQ_API_KEY;
    if (!apiKey) {
      return NextResponse.json(
        { error: "Brak klucza GROQ_API_KEY w .env.local" },
        { status: 500 },
      );
    }

    const systemPrompt =
      locale === "pl"
        ? "Jesteś dyspozytorem medycznym pierwszej pomocy. Odpowiedz maksymalnie w 2 krótkich, prostych zdaniach. Skup się wyłącznie na natychmiastowym ratowaniu życia. Jeśli sytuacja jest krytyczna, przypomnij o 112."
        : "You are an emergency medical dispatcher. Respond in max 2 short, simple sentences. Focus solely on immediate life-saving actions. If critical, remind to call 112.";

    // Oficjalny, stabilny endpoint i model produkcyjny Groq
    const groqRes = await fetch(
      "https://api.groq.com/openai/v1/chat/completions",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${apiKey.trim()}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "llama-3.1-8b-instant",
          messages: [
            { role: "system", content: systemPrompt },
            { role: "user", content: query },
          ],
          temperature: 0.2,
          max_tokens: 100,
        }),
      },
    );

    if (!groqRes.ok) {
      const errText = await groqRes.text();
      console.error("Groq Server Error:", errText);
      return NextResponse.json(
        { error: "Groq error" },
        { status: groqRes.status },
      );
    }

    const data = await groqRes.json();
    const answer = data.choices?.[0]?.message?.content?.trim() || null;

    return NextResponse.json({ answer });
  } catch (error) {
    console.error("Route error:", error);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}
