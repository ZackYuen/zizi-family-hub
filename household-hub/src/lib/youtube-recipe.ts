import type { BilingualText, RecipeIngredient } from "./types";
import { ensureTraditionalZh } from "./translate";

export interface YoutubeRecipeEnrichment {
  title: string;
  author: string;
  videoId: string | null;
  nameZh?: string;
  nameEn?: string;
  nameFil?: string;
  ingredients: RecipeIngredient[];
  prepNotes: BilingualText;
  /** What context the model used (for Admin message) */
  used: {
    description: boolean;
    captions: boolean;
    web: boolean;
    llm: boolean;
  };
}

function openRouterKey(): string | undefined {
  const raw = process.env.OPENROUTER_API_KEY?.trim();
  if (!raw) return undefined;
  return raw.replace(/^Bearer\s+/i, "");
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

/** Extract YouTube video id from common URL shapes */
export function youtubeVideoId(url: string): string | null {
  const u = url.trim();
  const m =
    u.match(/youtu\.be\/([A-Za-z0-9_-]{6,})/i) ||
    u.match(/[?&]v=([A-Za-z0-9_-]{6,})/i) ||
    u.match(/\/shorts\/([A-Za-z0-9_-]{6,})/i) ||
    u.match(/\/embed\/([A-Za-z0-9_-]{6,})/i);
  return m?.[1] ?? null;
}

async function fetchOEmbed(url: string): Promise<{ title: string; author: string }> {
  const oembed = `https://www.youtube.com/oembed?url=${encodeURIComponent(url)}&format=json`;
  const res = await fetch(oembed, {
    headers: { "User-Agent": "ZiziFamilyHub/1.0" },
    signal: AbortSignal.timeout(8000),
  });
  if (!res.ok) throw new Error("Could not fetch video title");
  const data = (await res.json()) as { title?: string; author_name?: string };
  return { title: data.title || "", author: data.author_name || "" };
}

/** Best-effort watch-page description (no API key). */
async function fetchVideoDescription(videoId: string): Promise<string> {
  try {
    const res = await fetch(`https://www.youtube.com/watch?v=${videoId}&hl=zh-HK`, {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (compatible; ZiziFamilyHub/1.0; +https://zizi-family-hub.vercel.app)",
        "Accept-Language": "zh-HK,zh,en;q=0.8",
      },
      signal: AbortSignal.timeout(12000),
    });
    if (!res.ok) return "";
    const html = await res.text();
    const short = html.match(/"shortDescription":"(.*?)"/);
    if (short?.[1]) {
      return short[1]
        .replace(/\\n/g, "\n")
        .replace(/\\"/g, '"')
        .replace(/\\u([0-9a-fA-F]{4})/g, (_, h) =>
          String.fromCharCode(parseInt(h, 16))
        )
        .slice(0, 3500);
    }
    const meta = html.match(
      /<meta[^>]+name="description"[^>]+content="([^"]*)"/i
    );
    return (meta?.[1] || "").slice(0, 1500);
  } catch {
    return "";
  }
}

/** Best-effort captions / auto captions (no API key). */
async function fetchCaptionsSnippet(videoId: string): Promise<string> {
  const attempts: { lang: string; kind?: string }[] = [
    { lang: "zh-HK" },
    { lang: "zh-Hant" },
    { lang: "zh-TW" },
    { lang: "yue" },
    // Skip bare "zh" — YouTube often serves Simplified there
    { lang: "en" },
    { lang: "en", kind: "asr" },
    { lang: "fil" },
    { lang: "tl" },
  ];
  for (const attempt of attempts) {
    try {
      const params = new URLSearchParams({ v: videoId, lang: attempt.lang });
      if (attempt.kind) params.set("kind", attempt.kind);
      const url = `https://www.youtube.com/api/timedtext?${params.toString()}`;
      const res = await fetch(url, {
        headers: { "User-Agent": "ZiziFamilyHub/1.0" },
        signal: AbortSignal.timeout(6000),
      });
      if (!res.ok) continue;
      const xml = await res.text();
      if (!xml || xml.length < 40 || !/<text/i.test(xml)) continue;
      const texts = [...xml.matchAll(/<text[^>]*>([\s\S]*?)<\/text>/gi)].map((m) =>
        m[1]
          .replace(/&amp;/g, "&")
          .replace(/&lt;/g, "<")
          .replace(/&gt;/g, ">")
          .replace(/&quot;/g, '"')
          .replace(/&#39;/g, "'")
          .replace(/<[^>]+>/g, "")
          .trim()
      );
      const joined = texts.filter(Boolean).join(" ").replace(/\s+/g, " ").trim();
      if (joined.length > 40) return joined.slice(0, 4000);
    } catch {
      /* try next lang */
    }
  }
  return "";
}

async function fetchWebSnippets(query: string): Promise<string> {
  try {
    const url = `https://api.duckduckgo.com/?q=${encodeURIComponent(query)}&format=json&no_html=1&skip_disambig=1`;
    const res = await fetch(url, {
      headers: { "User-Agent": "ZiziFamilyHub/1.0" },
      signal: AbortSignal.timeout(5000),
    });
    if (!res.ok) return "";
    const data = (await res.json()) as {
      AbstractText?: string;
      Answer?: string;
      RelatedTopics?: { Text?: string }[];
    };
    const bits: string[] = [];
    if (data.Answer) bits.push(data.Answer);
    if (data.AbstractText) bits.push(data.AbstractText);
    for (const t of data.RelatedTopics?.slice(0, 4) ?? []) {
      if (t.Text) bits.push(t.Text);
    }
    return bits.join("\n").slice(0, 1500);
  } catch {
    return "";
  }
}

function stripJsonFence(content: string): string {
  return content
    .replace(/^```json\s*/i, "")
    .replace(/^```\s*/i, "")
    .replace(/\s*```$/, "")
    .trim();
}

async function llmEnrichRecipe(input: {
  title: string;
  author: string;
  url: string;
  description: string;
  captions: string;
  web: string;
  categoryHint?: string;
}): Promise<{
  nameZh?: string;
  nameEn?: string;
  nameFil?: string;
  ingredients: RecipeIngredient[];
  prepNotes: BilingualText;
} | null> {
  const key = openRouterKey() || process.env.OPENAI_API_KEY?.trim();
  if (!key) return null;

  const useOpenRouter = Boolean(openRouterKey());
  const endpoint = useOpenRouter
    ? "https://openrouter.ai/api/v1/chat/completions"
    : "https://api.openai.com/v1/chat/completions";
  const models = useOpenRouter
    ? openRouterModels()
    : [process.env.OPENAI_MODEL || "gpt-4o-mini"];

  const system = `You extract a home-cooking recipe for Zizi Family Hub (Hong Kong household helper Charlene).
Return ONLY valid JSON (no markdown) with keys:
{
  "nameZh": "香港繁體中文 dish name (short)",
  "nameEn": "English dish name (short)",
  "nameFil": "Filipino/Tagalog dish name (short, natural food words)",
  "ingredients": [{ "en": "", "fil": "", "zh": "", "qty": "" }],
  "prepNotes": { "en": "", "fil": "", "zh": "" }
}

Rules:
- Video may be Cantonese / Mandarin / English / Filipino — always output EN + FIL + ZH.
- ALL Chinese fields (nameZh, ingredients[].zh, prepNotes.zh) MUST be 香港繁體中文 (Traditional Chinese).
  Never use Simplified Chinese. Examples: 雞蛋 not 鸡蛋; 麵 not 面; 醬 not 酱; 裡 not 里; 體 not 体; 萬 not 万.
- ingredients: shopping/prep list for ONE family dinner; include qty when known (e.g. "2 pcs", "1 tbsp"). Prefer 4–14 items.
- prepNotes: SHORT numbered steps Charlene can follow WITHOUT understanding video audio (max ~8 steps). Not a transcript.
- Soft for a child (Zizi) when relevant (cut small, mild, de-bone).
- If cook device is pressure cooker / air fryer and sources mention mode/time/°C, include those in prepNotes.
- Do NOT invent brand panel button maps. Do NOT invent unsafe times.
- If sources are thin, still give a reasonable family version from the dish title, and keep steps conservative ("ask Sir/Mum if unsure").
- No URLs, no ads, no email.`;

  const user = `YouTube URL: ${input.url}
Title: ${input.title}
Channel: ${input.author}
Category hint: ${input.categoryHint || "(none)"}

VIDEO DESCRIPTION:
${input.description || "(none)"}

CAPTIONS / TRANSCRIPT SNIPPET:
${input.captions || "(none)"}

WEB NOTES:
${input.web || "(none)"}

Extract ingredients + prep notes now.`;

  const headers: Record<string, string> = {
    Authorization: `Bearer ${useOpenRouter ? openRouterKey() : key}`,
    "Content-Type": "application/json",
  };
  if (useOpenRouter) {
    headers["HTTP-Referer"] =
      process.env.OPENROUTER_SITE_URL || "https://zizi-family-hub.vercel.app";
    headers["X-Title"] = process.env.OPENROUTER_APP_NAME || "Zizi Family Hub";
  }

  for (const model of models) {
    try {
      const res = await fetch(endpoint, {
        method: "POST",
        headers,
        body: JSON.stringify({
          model,
          temperature: 0.2,
          max_tokens: 1800,
          messages: [
            { role: "system", content: system },
            { role: "user", content: user },
          ],
        }),
        signal: AbortSignal.timeout(45000),
      });
      if (!res.ok) {
        console.error("youtube-recipe LLM", model, res.status, await res.text().catch(() => ""));
        continue;
      }
      const data = (await res.json()) as {
        choices?: { message?: { content?: string } }[];
      };
      const raw = stripJsonFence(data.choices?.[0]?.message?.content?.trim() || "");
      if (!raw) continue;
      const parsed = JSON.parse(raw) as {
        nameZh?: string;
        nameEn?: string;
        nameFil?: string;
        ingredients?: {
          en?: string;
          fil?: string;
          zh?: string;
          qty?: string;
        }[];
        prepNotes?: { en?: string; fil?: string; zh?: string };
      };

      const ingredients: RecipeIngredient[] = (parsed.ingredients || [])
        .map((ing) => ({
          en: (ing.en || "").trim(),
          fil: (ing.fil || "").trim() || undefined,
          zh: (ing.zh || "").trim() || undefined,
          qty: (ing.qty || "").trim() || undefined,
        }))
        .filter((ing) => ing.en || ing.zh || ing.fil);

      const prepNotes: BilingualText = {
        en: (parsed.prepNotes?.en || "").trim(),
        fil: (parsed.prepNotes?.fil || "").trim(),
        zh: (parsed.prepNotes?.zh || "").trim(),
      };

      if (!ingredients.length && !prepNotes.en && !prepNotes.fil && !prepNotes.zh) {
        continue;
      }

      // Force Traditional Chinese on every zh field (LLM often emits Simplified)
      const [nameZh, prepZh, ...ingZh] = await Promise.all([
        parsed.nameZh?.trim()
          ? ensureTraditionalZh(parsed.nameZh.trim())
          : Promise.resolve(undefined as string | undefined),
        prepNotes.zh
          ? ensureTraditionalZh(prepNotes.zh)
          : Promise.resolve(""),
        ...ingredients.map((ing) =>
          ing.zh ? ensureTraditionalZh(ing.zh) : Promise.resolve(undefined as string | undefined)
        ),
      ]);

      return {
        nameZh: nameZh || undefined,
        nameEn: parsed.nameEn?.trim() || undefined,
        nameFil: parsed.nameFil?.trim() || undefined,
        ingredients: ingredients.map((ing, i) => ({
          ...ing,
          zh: ingZh[i] || undefined,
        })),
        prepNotes: {
          ...prepNotes,
          zh: prepZh || "",
        },
      };
    } catch (err) {
      console.error("youtube-recipe LLM fail", model, err);
    }
  }
  return null;
}

/**
 * Fetch YouTube title + best-effort description/captions/web, then LLM →
 * trilingual prep notes + ingredients for Admin Meals.
 */
export async function enrichYoutubeRecipe(options: {
  url: string;
  categoryHint?: string;
}): Promise<YoutubeRecipeEnrichment> {
  const url = options.url.trim();
  if (!/youtu\.?be|youtube\.com/i.test(url)) {
    throw new Error("Not a YouTube URL");
  }

  const videoId = youtubeVideoId(url);
  const { title, author } = await fetchOEmbed(url);

  const [description, captions] = await Promise.all([
    videoId ? fetchVideoDescription(videoId) : Promise.resolve(""),
    videoId ? fetchCaptionsSnippet(videoId) : Promise.resolve(""),
  ]);

  const webQueries = [
    `${title} 食譜 材料 做法`,
    `${title} recipe ingredients steps`,
    `${title} ingredients how to cook`,
  ];
  let web = "";
  for (const q of webQueries) {
    web = await fetchWebSnippets(q);
    if (web.length > 80) break;
  }

  const llm = await llmEnrichRecipe({
    title,
    author,
    url,
    description,
    captions,
    web,
    categoryHint: options.categoryHint,
  });

  if (!llm) {
    return {
      title,
      author,
      videoId,
      ingredients: [],
      prepNotes: { en: "", fil: "", zh: "" },
      used: {
        description: Boolean(description),
        captions: Boolean(captions),
        web: Boolean(web),
        llm: false,
      },
    };
  }

  return {
    title,
    author,
    videoId,
    nameZh: llm.nameZh,
    nameEn: llm.nameEn,
    nameFil: llm.nameFil,
    ingredients: llm.ingredients,
    prepNotes: llm.prepNotes,
    used: {
      description: Boolean(description),
      captions: Boolean(captions),
      web: Boolean(web),
      llm: true,
    },
  };
}
