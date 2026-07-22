import type { Lang } from "./types";

/** MyMemory language codes — zh uses Traditional Chinese (zh-TW) for Hong Kong */
const MYMEMORY: Record<Lang, string> = {
  en: "en",
  fil: "tl",
  zh: "zh-TW",
};

const LANG_NAME: Record<Lang, string> = {
  en: "English",
  fil: "Filipino (Tagalog)",
  zh: "Traditional Chinese",
};

/** MyMemory often returns ads / emails when quota is hit — reject these */
export function isBadTranslation(text: string, source?: string): boolean {
  const t = text?.trim() || "";
  if (!t) return true;
  if (/@|https?:\/\/|www\./i.test(t)) return true;
  if (/email\s*:|sportbenzin|salmo\.ee|my?memory|quota|INVALID/i.test(t)) return true;
  if (/PLEASE SELECT|SUBSCRIBE|CLICK HERE|FREE TRIAL/i.test(t)) return true;
  // Garbage Latin for food names
  if (/deformities|orchid|ratio of garlic|winter shade|pampublikong/i.test(t))
    return true;
  if (source && t.toUpperCase() === source.toUpperCase() && /[\u4e00-\u9fff]/.test(source)) {
    // Unchanged CJK when targeting Latin is usually a failed translate
    return false; // allow caller to decide; not always "bad"
  }
  // Too many digits / weird tokens for a dish name
  if ((t.match(/\d/g) || []).length > t.length / 2) return true;
  return false;
}

async function translateWithLlm(
  text: string,
  from: Lang,
  to: Lang
): Promise<string | null> {
  const openRouterKey = process.env.OPENROUTER_API_KEY;
  const openAiKey = process.env.OPENAI_API_KEY;
  const key = openRouterKey || openAiKey;
  if (!key) return null;

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
        temperature: 0,
        max_tokens: 200,
        messages: [
          {
            role: "system",
            content: `You translate short household / recipe / food labels for a Hong Kong family app.
Reply with ONLY the translation in ${LANG_NAME[to]}. No quotes, no email, no URL, no explanation.
Keep dish names natural (Filipino Tagalog when target is Filipino). Never invent emails or ads.`,
          },
          {
            role: "user",
            content: `From ${LANG_NAME[from]}:\n${text}`,
          },
        ],
      }),
      signal: AbortSignal.timeout(20000),
    });
    if (!res.ok) return null;
    const data = (await res.json()) as {
      choices?: { message?: { content?: string } }[];
    };
    const out = data.choices?.[0]?.message?.content?.trim() || "";
    if (!out || isBadTranslation(out, text)) return null;
    return out.replace(/^["']|["']$/g, "").trim();
  } catch {
    return null;
  }
}

async function translateWithMyMemory(
  text: string,
  from: Lang,
  to: Lang
): Promise<string | null> {
  try {
    const res = await fetch(
      `https://api.mymemory.translated.net/get?q=${encodeURIComponent(text)}&langpair=${MYMEMORY[from]}|${MYMEMORY[to]}`,
      { signal: AbortSignal.timeout(10000) }
    );
    if (!res.ok) return null;
    const data = (await res.json()) as {
      responseData?: { translatedText?: string };
      responseStatus?: number | string;
    };
    // MyMemory returns 429 / EMAIL WARNING in text when over quota
    const translated = data.responseData?.translatedText?.trim() || "";
    if (!translated || isBadTranslation(translated, text)) return null;
    if (translated.toUpperCase() === text.toUpperCase()) return null;
    return translated;
  } catch {
    return null;
  }
}

/**
 * Translate between EN / FIL / ZH.
 * Prefers LLM (OpenRouter/OpenAI) when configured; MyMemory as fallback.
 * Rejects spam results like "Email: info@sportbenzin.ch".
 */
export async function translateText(
  text: string,
  from: Lang,
  to: Lang
): Promise<string> {
  const trimmed = text.trim();
  if (!trimmed || from === to) return trimmed;

  // 1) LLM first when available (much better for food names)
  const llm = await translateWithLlm(trimmed, from, to);
  if (llm) return llm;

  // 2) Direct MyMemory
  const direct = await translateWithMyMemory(trimmed, from, to);
  if (direct) return direct;

  // 3) Pivot via English for zh↔fil (MyMemory is weak on that pair)
  if (from !== "en" && to !== "en") {
    const mid = (await translateWithLlm(trimmed, from, "en")) ||
      (await translateWithMyMemory(trimmed, from, "en"));
    if (mid && !isBadTranslation(mid, trimmed)) {
      const final =
        (await translateWithLlm(mid, "en", to)) ||
        (await translateWithMyMemory(mid, "en", to));
      if (final) return final;
    }
  }

  throw new Error(
    "Translation failed or returned spam. Try again later, or set OPENROUTER_API_KEY on Vercel for reliable food-name translation."
  );
}

/** @deprecated use translateText(text, "en", "fil") */
export async function translateEnToFil(text: string): Promise<string> {
  return translateText(text, "en", "fil");
}
