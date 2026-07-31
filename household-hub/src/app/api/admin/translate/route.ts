import { NextResponse } from "next/server";
import { isAuthenticated } from "@/lib/auth";
import { isBadTranslation, translateTextDetailed } from "@/lib/translate";
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
    const { text: translation, engine } = await translateTextDetailed(
      text,
      from,
      to
    );
    if (isBadTranslation(translation, text)) {
      return NextResponse.json(
        {
          error:
            "Translation looked invalid. Not applied. Try again, or check network / Vercel egress.",
        },
        { status: 502 }
      );
    }
    return NextResponse.json({
      translation,
      engine,
    });
  } catch (err) {
    const message =
      err instanceof Error ? err.message : "Translation failed";
    console.error("translate route", message);
    return NextResponse.json({ error: message }, { status: 502 });
  }
}
