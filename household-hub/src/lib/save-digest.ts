import type { DinnerRecipe, WhatsAppInboxKind } from "./types";

export interface DigestedSave {
  kind: Exclude<WhatsAppInboxKind, "ask">;
  /** Clean text for Admin / promote */
  text: string;
  /** Short one-line summary for WhatsApp reply */
  summary: string;
  link?: string;
  category?: DinnerRecipe["category"];
  /** Original raw message */
  original: string;
}

function openRouterKey(): string | undefined {
  const raw = process.env.OPENROUTER_API_KEY?.trim();
  if (!raw) return undefined;
  return raw.replace(/^Bearer\s+/i, "");
}

function heuristicDigest(raw: string): DigestedSave {
  const link = raw.match(/https?:\/\/\S+/i)?.[0];
  const hasRecipeCue =
    /youtube|youtu\.be|instagram\.com\/reel|recipe|煮|食譜|ulam|lutuin|dumpling|soup|炒|湯/i.test(
      raw
    ) || Boolean(link);
  let category: DinnerRecipe["category"] | undefined;
  if (/soup|湯|sabaw/i.test(raw)) category = "Soup";
  else if (/veg|菜|gulay|vegetable/i.test(raw)) category = "Vegetable";
  else if (/meat|肉|karne|pork|chicken|beef|魚|fish/i.test(raw)) category = "Meat";
  else if (link) category = "Meat";

  if (hasRecipeCue) {
    return {
      kind: "recipe_candidate",
      text: raw.trim(),
      summary: link
        ? `Recipe candidate (${category || "Meat"}) with link`
        : `Recipe / cooking note (${category || "Meat"})`,
      link,
      category: category || "Meat",
      original: raw,
    };
  }

  if (/rule|tip|gabay|octopus|typhoon|rest day|school|zizi|charlene|hk life|borrow/i.test(raw)) {
    return {
      kind: "tip_candidate",
      text: raw.trim(),
      summary: "HK Life / family tip candidate",
      original: raw,
    };
  }

  return {
    kind: "note",
    text: raw.trim(),
    summary: "Saved note for Admin review",
    original: raw,
  };
}

async function llmDigest(raw: string): Promise<DigestedSave | null> {
  const key = openRouterKey() || process.env.OPENAI_API_KEY?.trim();
  if (!key) return null;

  const useOpenRouter = Boolean(openRouterKey());
  const endpoint = useOpenRouter
    ? "https://openrouter.ai/api/v1/chat/completions"
    : "https://api.openai.com/v1/chat/completions";
  const model = useOpenRouter
    ? process.env.OPENROUTER_MODEL || "google/gemini-2.0-flash-001"
    : process.env.OPENAI_MODEL || "gpt-4o-mini";

  const headers: Record<string, string> = {
    Authorization: `Bearer ${useOpenRouter ? openRouterKey() : key}`,
    "Content-Type": "application/json",
  };
  if (useOpenRouter) {
    headers["HTTP-Referer"] =
      process.env.OPENROUTER_SITE_URL || "https://zizi-family-hub.vercel.app";
    headers["X-Title"] = process.env.OPENROUTER_APP_NAME || "Zizi Family Hub";
  }

  const system = `You digest WhatsApp "?save …" messages for Zizi Family Hub Admin inbox.
Return ONLY valid JSON (no markdown) with keys:
- kind: "tip_candidate" | "recipe_candidate" | "note"
- text: cleaned useful content for Admin (English preferred; keep Filipino/Chinese names if needed)
- summary: one short line for WhatsApp confirmation
- link: YouTube/Instagram URL if present, else null
- category: "Meat" | "Vegetable" | "Soup" | null (only for recipe_candidate)

Rules:
- recipe_candidate: cooking / dish / youtube recipe / ingredients
- tip_candidate: HK life tip, house rule idea, schedule note for Charlene
- note: anything else to remember
Do not invent URLs.`;

  try {
    const res = await fetch(endpoint, {
      method: "POST",
      headers,
      body: JSON.stringify({
        model,
        temperature: 0,
        max_tokens: 400,
        messages: [
          { role: "system", content: system },
          { role: "user", content: raw },
        ],
      }),
      signal: AbortSignal.timeout(25000),
    });
    if (!res.ok) {
      console.error("save digest LLM", res.status, await res.text().catch(() => ""));
      return null;
    }
    const data = (await res.json()) as {
      choices?: { message?: { content?: string } }[];
    };
    let content = data.choices?.[0]?.message?.content?.trim() || "";
    content = content.replace(/^```json\s*/i, "").replace(/^```\s*/i, "").replace(/\s*```$/, "");
    const parsed = JSON.parse(content) as {
      kind?: string;
      text?: string;
      summary?: string;
      link?: string | null;
      category?: string | null;
    };

    const kind =
      parsed.kind === "recipe_candidate" || parsed.kind === "tip_candidate"
        ? parsed.kind
        : "note";
    const category =
      parsed.category === "Meat" ||
      parsed.category === "Vegetable" ||
      parsed.category === "Soup"
        ? parsed.category
        : undefined;
    const link =
      (parsed.link && /^https?:\/\//i.test(parsed.link) ? parsed.link : undefined) ||
      raw.match(/https?:\/\/\S+/i)?.[0];

    return {
      kind,
      text: (parsed.text || raw).trim(),
      summary: (parsed.summary || `Saved as ${kind}`).trim(),
      link,
      category: kind === "recipe_candidate" ? category || "Meat" : undefined,
      original: raw,
    };
  } catch (err) {
    console.error("save digest failed", err);
    return null;
  }
}

/** Digests free-form WhatsApp save text into an inbox candidate */
export async function digestWhatsAppSave(raw: string): Promise<DigestedSave> {
  const text = raw.trim();
  if (!text) {
    return {
      kind: "note",
      text: "",
      summary: "Empty save",
      original: raw,
    };
  }
  const llm = await llmDigest(text);
  return llm || heuristicDigest(text);
}
