import { NextResponse } from "next/server";
import { isAuthenticated } from "@/lib/auth";
import { enrichYoutubeRecipe } from "@/lib/youtube-recipe";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

/**
 * Admin: fetch YouTube or Instagram title + LLM enrichment for prep notes & ingredients.
 * Body: { url, enrich?: boolean, category?: "Meat"|"Vegetable"|"Soup" }
 */
export async function POST(request: Request) {
  const authed = await isAuthenticated();
  if (!authed) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = (await request.json()) as {
      url?: string;
      enrich?: boolean;
      category?: string;
    };
    const url = body.url?.trim();
    if (!url) {
      return NextResponse.json({ error: "url required" }, { status: 400 });
    }
    if (!/youtu\.?be|youtube\.com|instagram\.com|instagr\.am/i.test(url)) {
      return NextResponse.json(
        { error: "Need a YouTube or Instagram link" },
        { status: 400 }
      );
    }

    // Legacy / fast path — title only (YouTube oEmbed). Instagram always goes through enrich.
    if (!body.enrich && /youtu\.?be|youtube\.com/i.test(url)) {
      const oembed = `https://www.youtube.com/oembed?url=${encodeURIComponent(url)}&format=json`;
      const res = await fetch(oembed, {
        headers: { "User-Agent": "ZiziFamilyHub/1.0" },
        signal: AbortSignal.timeout(8000),
      });
      if (!res.ok) {
        return NextResponse.json(
          { error: "Could not fetch video title" },
          { status: 502 }
        );
      }
      const data = (await res.json()) as { title?: string; author_name?: string };
      return NextResponse.json({
        title: data.title || "",
        author: data.author_name || "",
      });
    }

    const data = await enrichYoutubeRecipe({
      url,
      categoryHint: body.category,
    });

    if (!data.used.llm) {
      return NextResponse.json({
        title: data.title,
        author: data.author,
        nameZh: data.nameZh,
        nameEn: data.nameEn,
        nameFil: data.nameFil,
        ingredients: [],
        prepNotes: data.prepNotes,
        used: data.used,
        warning:
          "Got the title, but LLM enrichment failed (check OPENROUTER_API_KEY / model). Add prep notes manually or retry.",
      });
    }

    return NextResponse.json({
      title: data.title,
      author: data.author,
      nameZh: data.nameZh,
      nameEn: data.nameEn,
      nameFil: data.nameFil,
      ingredients: data.ingredients,
      prepNotes: data.prepNotes,
      used: data.used,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
