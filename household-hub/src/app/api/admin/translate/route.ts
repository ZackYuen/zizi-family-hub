import { NextResponse } from "next/server";
import { isAuthenticated } from "@/lib/auth";
import { isBadTranslation, translateText } from "@/lib/translate";
import type { Lang } from "@/lib/types";

const LANGS: Lang[] = ["en", "fil", "zh"];

export async function POST(request: Request) {
  const authed = await isAuthenticated();
  if (!authed) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = (await request.json()) as {
    text?: string;
    from?: Lang;
    to?: Lang;
  };

  const text = body.text?.trim() ?? "";
  if (!text) {
    return NextResponse.json({ translation: "" });
  }

  let from = body.from;
  let to = body.to;

  if (!from || !to || !LANGS.includes(from) || !LANGS.includes(to)) {
    from = "en";
    to = "fil";
  }

  try {
    const translation = await translateText(text, from, to);
    if (isBadTranslation(translation, text)) {
      return NextResponse.json(
        {
          error:
            "Translation looked like spam (e.g. email ad). Not applied. Add OPENROUTER_API_KEY on Vercel for better results.",
        },
        { status: 502 }
      );
    }
    return NextResponse.json({ translation });
  } catch (err) {
    const message =
      err instanceof Error ? err.message : "Translation failed";
    return NextResponse.json({ error: message }, { status: 502 });
  }
}
