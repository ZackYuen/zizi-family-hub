import { NextResponse } from "next/server";
import type { Lang } from "@/lib/types";
import { hongKongDateKey } from "@/lib/dinner";

export const dynamic = "force-dynamic";

const FALLBACKS: Record<Lang, string[]> = {
  en: [
    "Have a calm day with the family.",
    "Wishing you a smooth morning with Zizi.",
    "You’re part of our family — take it one step at a time.",
    "Hope today feels light and kind.",
    "A warm hello from the Zizi Family.",
  ],
  fil: [
    "Magandang araw — isa-isa lang, kaya mo yan.",
    "Sana maging magaan ang umaga kasama si Zizi.",
    "Bahagi ka ng pamilya — thank you for today.",
    "Maligayang pagdating — mag-ingat at ngumiti.",
    "Isang mainit na hello mula sa Zizi Family.",
  ],
  zh: [
    "願你今天平穩順利。",
    "祝你和 Zizi 有個溫柔的早上。",
    "你是我們的家人 — 一步一步就好。",
    "願今天輕鬆又溫暖。",
    "Zizi 一家向你問好。",
  ],
};

function pickFallback(lang: Lang, seed: string): string {
  const list = FALLBACKS[lang] || FALLBACKS.en;
  let h = 0;
  for (let i = 0; i < seed.length; i++) h = (h * 31 + seed.charCodeAt(i)) >>> 0;
  return list[h % list.length];
}

function parseLang(raw: string | null): Lang {
  if (raw === "fil" || raw === "zh") return raw;
  return "en";
}

async function llmGreeting(
  name: string,
  lang: Lang
): Promise<string | null> {
  const openRouterKey = process.env.OPENROUTER_API_KEY;
  const openAiKey = process.env.OPENAI_API_KEY;
  const key = openRouterKey || openAiKey;
  if (!key) return null;

  const langName =
    lang === "fil" ? "Filipino (Tagalog)" : lang === "zh" ? "Traditional Chinese (Hong Kong)" : "English";
  const endpoint = openRouterKey
    ? "https://openrouter.ai/api/v1/chat/completions"
    : "https://api.openai.com/v1/chat/completions";
  const model = openRouterKey
    ? process.env.OPENROUTER_MODEL || "openrouter/free"
    : process.env.OPENAI_MODEL || "gpt-4o-mini";

  const headers: Record<string, string> = {
    Authorization: `Bearer ${key}`,
    "Content-Type": "application/json",
  };
  if (openRouterKey) {
    headers["HTTP-Referer"] =
      process.env.OPENROUTER_SITE_URL || "https://zizi-family-hub.vercel.app";
    headers["X-Title"] = process.env.OPENROUTER_APP_NAME || "Zizi Family Hub";
  }

  try {
    const res = await fetch(endpoint, {
      method: "POST",
      headers,
      body: JSON.stringify({
        model,
        temperature: 0.9,
        max_tokens: 60,
        messages: [
          {
            role: "system",
            content: `You write ONE short warm greeting line for ${name}, a family member in a Hong Kong household (caring for child Zizi with Sir and Mum).
Reply ONLY in ${langName}.
Rules: one sentence, max 12 words (or equivalent short Chinese), friendly, no emoji, no quotes, no name of AI, do not call her helper/katulong/姐姐. Vary the wording each time.`,
          },
          {
            role: "user",
            content: `Write a fresh random greeting for ${name} today.`,
          },
        ],
      }),
      signal: AbortSignal.timeout(12000),
    });
    if (!res.ok) return null;
    const data = (await res.json()) as {
      choices?: { message?: { content?: string } }[];
    };
    const text = data.choices?.[0]?.message?.content?.trim() || "";
    if (!text || text.length > 120) return null;
    return text.replace(/^["“]|["”]$/g, "").trim();
  } catch {
    return null;
  }
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const lang = parseLang(searchParams.get("lang"));
  const name = (searchParams.get("name") || "Charlene").trim().slice(0, 40);
  const date = searchParams.get("date") || hongKongDateKey();
  const seed = `${date}:${lang}:${name}`;

  const llm = await llmGreeting(name, lang);
  const line = llm || pickFallback(lang, seed);

  return NextResponse.json({
    welcome:
      lang === "fil"
        ? `Maligayang pagdating, ${name}`
        : lang === "zh"
          ? `歡迎，${name}`
          : `Welcome, ${name}`,
    greeting: line,
    source: llm ? "llm" : "fallback",
    date,
    lang,
  });
}
