import { NextRequest, NextResponse } from "next/server";

import { getEmergencyGuidance } from "@/lib/ai-service";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type Locale = "pl" | "en";

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json().catch(() => null)) as {
      query?: string;
      locale?: Locale;
    } | null;

    const query = body?.query?.trim();
    const locale: Locale = body?.locale === "en" ? "en" : "pl";

    if (!query) {
      return NextResponse.json(
        {
          ok: false,
          error: "EMPTY_QUERY",
          message:
            locale === "pl"
              ? "Brak treści zapytania."
              : "Missing query text.",
        },
        { status: 400 },
      );
    }

    const guidance = await getEmergencyGuidance(query, locale);

    if (!guidance) {
      return NextResponse.json(
        {
          ok: false,
          error: "AI_UNAVAILABLE",
          message:
            locale === "pl"
              ? "Usługa AI jest chwilowo niedostępna."
              : "AI service is temporarily unavailable.",
        },
        { status: 503 },
      );
    }

    return NextResponse.json({
      ok: true,
      guidance,
    });
  } catch (error) {
    console.error("Emergency guidance route failed:", error);

    return NextResponse.json(
      {
        ok: false,
        error: "INTERNAL_ERROR",
        message: "Request failed.",
      },
      { status: 500 },
    );
  }
}
