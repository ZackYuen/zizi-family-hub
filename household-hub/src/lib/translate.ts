import type { Lang } from "./types";

const LANG_NAME: Record<Lang, string> = {
  en: "English",
  fil: "Filipino (Tagalog)",
  zh: "Traditional Chinese",
};

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

function openRouterKey(): string | undefined {
  const raw = process.env.OPENROUTER_API_KEY?.trim();
  if (!raw) return undefined;
  return raw.replace(/^Bearer\s+/i, "");
}

function openAiKey(): string | undefined {
  return process.env.OPENAI_API_KEY?.trim() || undefined;
}

/** Models to try in order when using OpenRouter */
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
For Filipino use natural Tagalog food names when possible (e.g. "pritong dumpling" not literal garbage).`;

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
    system: `Translate to ${LANG_NAME[to]} only. No quotes or explanation.`,
    user: `From ${LANG_NAME[from]}:\n${text}`,
  });
}

/**
 * Translate EN / FIL / ZH for Admin.
 * When OPENROUTER_API_KEY is set: OpenRouter ONLY (never MyMemory spam).
 */
export async function translateText(
  text: string,
  from: Lang,
  to: Lang
): Promise<string> {
  const trimmed = text.trim();
  if (!trimmed || from === to) return trimmed;

  if (openRouterKey()) {
    // Direct OpenRouter — no MyMemory fallback (avoids sportbenzin email ads)
    try {
      return await translateWithOpenRouter(trimmed, from, to);
    } catch (directErr) {
      // Pivot via English for zh↔fil if direct fails
      if (from !== "en" && to !== "en") {
        const mid = await translateWithOpenRouter(trimmed, from, "en");
        return translateWithOpenRouter(mid, "en", to);
      }
      throw directErr;
    }
  }

  const openAi = await translateWithOpenAI(trimmed, from, to);
  if (openAi) return openAi;

  throw new Error(
    "No OPENROUTER_API_KEY on this server. Add it in Vercel → Settings → Environment Variables (Production) and redeploy."
  );
}

/** @deprecated use translateText(text, "en", "fil") */
export async function translateEnToFil(text: string): Promise<string> {
  return translateText(text, "en", "fil");
}

/**
 * Free no-key Tagalog fallback (Google gtx). Used only for weather forecasts
 * when OpenRouter / OpenAI are unavailable, so FIL mode is not stuck in English.
 */
async function translateEnToFilViaGoogle(text: string): Promise<string | null> {
  try {
    const url =
      "https://translate.googleapis.com/translate_a/single?client=gtx&sl=en&tl=tl&dt=t&q=" +
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
    // Light weather wording polish for helpers
    return out
      .replace(/\bshower(s)?\b/gi, "ambon")
      .replace(/\bdegrees\b/gi, "digri")
      .replace(/\burban areas\b/gi, "lungsod")
      .replace(/\bNew Territories\b/g, "New Territories")
      .trim();
  } catch (err) {
    console.error("Google weather fil translate", err);
    return null;
  }
}

/**
 * Translate HKO English forecast into natural Filipino for the weather banner.
 * Uses a weather-specific prompt and a higher token limit than dish-name translate.
 */
export async function translateWeatherForecastToFil(
  englishForecast: string
): Promise<string> {
  const trimmed = englishForecast.trim();
  if (!trimmed) return trimmed;

  const system = `You translate Hong Kong Observatory weather forecasts for a Filipino domestic helper in Hong Kong.
Reply with ONLY natural Filipino (Tagalog) text.
Keep numbers, °C, signal numbers (T8, Signal No. 8), and place names.
No quotes, no email, no URL, no ads, no explanation.`;
  const user = `Translate this HK weather forecast to Filipino:\n${trimmed}`;

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
          maxTokens: 500,
        });
        if (out) return out;
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
      maxTokens: 500,
    });
    if (out) return out;
  }

  const google = await translateEnToFilViaGoogle(trimmed);
  if (google) return google;

  try {
    return await translateText(trimmed, "en", "fil");
  } catch {
    return trimmed;
  }
}
