import type { Lang } from "./types";

const LANG_NAME: Record<Lang, string> = {
  en: "English",
  fil: "Filipino (Tagalog)",
  zh: "Traditional Chinese (Hong Kong / Taiwan — 繁體)",
};

/** App Lang → Google Translate language code */
const GOOGLE_LANG: Record<Lang, string> = {
  en: "en",
  fil: "tl",
  /** Always Traditional — never zh-CN */
  zh: "zh-TW",
};

export type TranslateEngine = "google" | "openrouter" | "openai";

/** Reject spam / ads / emails from bad translators */
export function isBadTranslation(text: string, _source?: string): boolean {
  const t = text?.trim() || "";
  if (!t) return true;
  if (/@|https?:\/\/|www\./i.test(t)) return true;
  if (/email\s*:|sportbenzin|salmo\.ee|my?memory|quota|INVALID/i.test(t)) return true;
  if (/PLEASE SELECT|SUBSCRIBE|CLICK HERE|FREE TRIAL/i.test(t)) return true;
  if (/deformities|orchid|ratio of garlic|winter shade|pampublikong/i.test(t))
    return true;
  if ((t.match(/\d/g) || []).length > t.length / 2) return true;
  return false;
}

/**
 * Reject LLM “thinking” / English meta dumps that are not a usable Tagalog forecast.
 */
export function isBadWeatherFilTranslation(
  text: string,
  sourceEnglish: string
): boolean {
  const t = text?.trim() || "";
  if (!t || isBadTranslation(t, sourceEnglish)) return true;

  if (
    /the user wants|i need to follow|translate to tagalog|let'?s produce|constraints:|original (text|says)|combine into|however,? the user/i.test(
      t
    )
  ) {
    return true;
  }
  if (/^translate\b/i.test(t)) return true;

  if (t.length > Math.max(220, sourceEnglish.trim().length * 1.8)) return true;

  const filHits = (
    t.match(
      /\b(ang|mga|sa|ng|na|ay|at|mga|may|para|bukas|ulan|ambon|hangin|init|mainit|maulap|temperatura|digri|hanggang)\b/gi
    ) || []
  ).length;
  const engHits = (
    t.match(
      /\b(the|and|with|will|be|from|during|temperature|degrees|areas|winds|mainly|fine|apart|shower|forecast|translation|helper|filipino|tagalog)\b/gi
    ) || []
  ).length;
  if (engHits >= 8 && engHits > filHits * 2) return true;
  if (filHits === 0 && engHits >= 4) return true;

  return false;
}

function openRouterKey(): string | undefined {
  const raw = process.env.OPENROUTER_API_KEY?.trim();
  if (!raw) return undefined;
  return raw.replace(/^Bearer\s+/i, "");
}

function openAiKey(): string | undefined {
  return process.env.OPENAI_API_KEY?.trim() || undefined;
}

function openRouterModels(): string[] {
  const preferred = process.env.OPENROUTER_MODEL?.trim();
  const defaults = [
    "google/gemini-2.0-flash-001",
    "openai/gpt-4o-mini",
    "meta-llama/llama-3.3-70b-instruct",
    "openrouter/free",
  ];
  if (preferred) return [preferred, ...defaults.filter((m) => m !== preferred)];
  return defaults;
}

async function chatComplete(options: {
  key: string;
  endpoint: string;
  model: string;
  openRouter: boolean;
  system: string;
  user: string;
  maxTokens?: number;
}): Promise<string | null> {
  const headers: Record<string, string> = {
    Authorization: `Bearer ${options.key}`,
    "Content-Type": "application/json",
  };
  if (options.openRouter) {
    headers["HTTP-Referer"] =
      process.env.OPENROUTER_SITE_URL || "https://zizi-family-hub.vercel.app";
    headers["X-Title"] = process.env.OPENROUTER_APP_NAME || "Zizi Family Hub";
  }

  const res = await fetch(options.endpoint, {
    method: "POST",
    headers,
    body: JSON.stringify({
      model: options.model,
      temperature: 0,
      max_tokens: options.maxTokens ?? 200,
      messages: [
        { role: "system", content: options.system },
        { role: "user", content: options.user },
      ],
    }),
    signal: AbortSignal.timeout(25000),
  });

  if (!res.ok) {
    const errText = await res.text().catch(() => "");
    console.error("Translate LLM error", options.model, res.status, errText.slice(0, 300));
    return null;
  }

  const data = (await res.json()) as {
    choices?: { message?: { content?: string } }[];
  };
  const out = data.choices?.[0]?.message?.content?.trim() || "";
  if (!out || isBadTranslation(out)) return null;
  return out.replace(/^["'«»]|["'«»]$/g, "").trim();
}

/**
 * Free Google Translate (gtx) — no API key.
 * Use zh-TW for Chinese (Traditional), never zh-CN.
 */
export async function translateViaGoogle(
  text: string,
  sl: string,
  tl: string
): Promise<string | null> {
  try {
    const url =
      "https://translate.googleapis.com/translate_a/single?client=gtx&sl=" +
      encodeURIComponent(sl) +
      "&tl=" +
      encodeURIComponent(tl) +
      "&dt=t&q=" +
      encodeURIComponent(text);
    const res = await fetch(url, { signal: AbortSignal.timeout(12000) });
    if (!res.ok) return null;
    const data = (await res.json()) as unknown;
    if (!Array.isArray(data) || !Array.isArray(data[0])) return null;
    const parts = data[0] as unknown[];
    const out = parts
      .map((p) => (Array.isArray(p) && typeof p[0] === "string" ? p[0] : ""))
      .join("")
      .trim();
    if (!out || isBadTranslation(out, text)) return null;
    return out;
  } catch (err) {
    console.error("Google translate", sl, tl, err);
    return null;
  }
}

/**
 * Force Hong Kong / Taiwan Traditional Chinese.
 * Safe to call on already-Traditional text.
 */
export async function ensureTraditionalZh(text: string): Promise<string> {
  const trimmed = text?.trim() || "";
  if (!trimmed) return trimmed;
  // Skip if no CJK
  if (!/[\u4e00-\u9fff]/.test(trimmed)) return trimmed;
  const converted = await translateViaGoogle(trimmed, "zh-CN", "zh-TW");
  return converted || trimmed;
}

async function translateWithOpenRouter(
  text: string,
  from: Lang,
  to: Lang
): Promise<string> {
  const key = openRouterKey();
  if (!key) throw new Error("OPENROUTER_API_KEY missing");

  const system = `You translate short household / recipe / food dish names for a Hong Kong family app (Charlene).
Reply with ONLY the translation in ${LANG_NAME[to]}.
No quotes, no email, no URL, no ads, no explanation.
For Traditional Chinese use 香港繁體 (e.g. 雞蛋、麵、醬 — never Simplified 鸡蛋/面/酱).
For Filipino use natural Tagalog food names when possible.`;

  const user = `Translate from ${LANG_NAME[from]} to ${LANG_NAME[to]}:\n${text}`;

  const errors: string[] = [];
  for (const model of openRouterModels()) {
    try {
      const out = await chatComplete({
        key,
        endpoint: "https://openrouter.ai/api/v1/chat/completions",
        model,
        openRouter: true,
        system,
        user,
      });
      if (out) return out;
      errors.push(`${model}: empty/bad`);
    } catch (err) {
      errors.push(`${model}: ${err instanceof Error ? err.message : "fail"}`);
    }
  }

  throw new Error(
    `OpenRouter translation failed (${errors.slice(0, 2).join("; ")}). Check key / model / credits.`
  );
}

async function translateWithOpenAI(
  text: string,
  from: Lang,
  to: Lang
): Promise<string | null> {
  const key = openAiKey();
  if (!key) return null;
  const model = process.env.OPENAI_MODEL || "gpt-4o-mini";
  return chatComplete({
    key,
    endpoint: "https://api.openai.com/v1/chat/completions",
    model,
    openRouter: false,
    system: `Translate to ${LANG_NAME[to]} only. For Chinese use Traditional (繁體), never Simplified. No quotes or explanation.`,
    user: `From ${LANG_NAME[from]}:\n${text}`,
  });
}

/**
 * Admin / app translation.
 * Prefer Google Translate (zh → zh-TW). LLM is fallback only.
 */
export async function translateTextDetailed(
  text: string,
  from: Lang,
  to: Lang
): Promise<{ text: string; engine: TranslateEngine }> {
  const trimmed = text.trim();
  if (!trimmed || from === to) {
    const textOut = to === "zh" ? await ensureTraditionalZh(trimmed) : trimmed;
    return { text: textOut, engine: "google" };
  }

  // 1) Google first
  const google = await translateViaGoogle(
    trimmed,
    GOOGLE_LANG[from],
    GOOGLE_LANG[to]
  );
  if (google) {
    const textOut = to === "zh" ? await ensureTraditionalZh(google) : google;
    return { text: textOut, engine: "google" };
  }

  // Pivot via English for zh↔fil if direct Google failed
  if (from !== "en" && to !== "en") {
    const mid = await translateViaGoogle(trimmed, GOOGLE_LANG[from], "en");
    if (mid) {
      const out = await translateViaGoogle(mid, "en", GOOGLE_LANG[to]);
      if (out) {
        const textOut = to === "zh" ? await ensureTraditionalZh(out) : out;
        return { text: textOut, engine: "google" };
      }
    }
  }

  // 2) OpenRouter fallback
  if (openRouterKey()) {
    try {
      let out = await translateWithOpenRouter(trimmed, from, to);
      if (to === "zh") out = await ensureTraditionalZh(out);
      return { text: out, engine: "openrouter" };
    } catch (directErr) {
      if (from !== "en" && to !== "en") {
        const mid = await translateWithOpenRouter(trimmed, from, "en");
        let out = await translateWithOpenRouter(mid, "en", to);
        if (to === "zh") out = await ensureTraditionalZh(out);
        return { text: out, engine: "openrouter" };
      }
      throw directErr;
    }
  }

  // 3) OpenAI fallback
  const openAi = await translateWithOpenAI(trimmed, from, to);
  if (openAi) {
    const textOut = to === "zh" ? await ensureTraditionalZh(openAi) : openAi;
    return { text: textOut, engine: "openai" };
  }

  throw new Error(
    "Google Translate failed and no OPENROUTER_API_KEY / OPENAI_API_KEY fallback is configured."
  );
}

export async function translateText(
  text: string,
  from: Lang,
  to: Lang
): Promise<string> {
  return (await translateTextDetailed(text, from, to)).text;
}

/** @deprecated use translateText(text, "en", "fil") */
export async function translateEnToFil(text: string): Promise<string> {
  return translateText(text, "en", "fil");
}

async function translateEnToFilViaGoogle(text: string): Promise<string | null> {
  const out = await translateViaGoogle(text, "en", "tl");
  if (!out) return null;
  return out
    .replace(/\bshower(s)?\b/gi, "ambon")
    .replace(/\bdegrees\b/gi, "digri")
    .replace(/\burban areas\b/gi, "lungsod")
    .replace(/\bNew Territories\b/g, "New Territories")
    .trim();
}

/**
 * Translate HKO English forecast into natural Filipino for the weather banner.
 * Prefer Google Tagalog (reliable). Try LLM only if Google fails; reject CoT junk.
 */
export async function translateWeatherForecastToFil(
  englishForecast: string
): Promise<string> {
  const trimmed = englishForecast.trim();
  if (!trimmed) return trimmed;

  const google = await translateEnToFilViaGoogle(trimmed);
  if (google && !isBadWeatherFilTranslation(google, trimmed)) return google;

  const system = `You translate Hong Kong Observatory weather forecasts for a Filipino domestic helper in Hong Kong.
Reply with ONLY the Filipino (Tagalog) forecast sentence(s). No English. No reasoning.
Keep numbers, °C, signal numbers (T8, Signal No. 8), and place names.
No quotes, no email, no URL, no ads, no explanation.`;
  const user = trimmed;

  const key = openRouterKey();
  if (key) {
    for (const model of openRouterModels()) {
      try {
        const out = await chatComplete({
          key,
          endpoint: "https://openrouter.ai/api/v1/chat/completions",
          model,
          openRouter: true,
          system,
          user,
          maxTokens: 350,
        });
        if (out && !isBadWeatherFilTranslation(out, trimmed)) return out;
      } catch {
        /* try next model */
      }
    }
  }

  const openAiKeyVal = openAiKey();
  if (openAiKeyVal) {
    const out = await chatComplete({
      key: openAiKeyVal,
      endpoint: "https://api.openai.com/v1/chat/completions",
      model: process.env.OPENAI_MODEL || "gpt-4o-mini",
      openRouter: false,
      system,
      user,
      maxTokens: 350,
    });
    if (out && !isBadWeatherFilTranslation(out, trimmed)) return out;
  }

  try {
    const generic = await translateText(trimmed, "en", "fil");
    if (generic && !isBadWeatherFilTranslation(generic, trimmed)) return generic;
  } catch {
    /* keep English */
  }

  return trimmed;
}
