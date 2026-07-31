import type { BilingualText, DinnerRecipe, RecipeCookSettings } from "./types";
import { ensureTraditionalZh } from "./translate";

export const COOK_DEVICE_EPC17 = "app-tefal-epc17";
export const COOK_DEVICE_EASY_FRY = "app-tefal-easy-fry-xxl";

export interface CookDeviceSuggestion {
  cookDevice: string;
  reason: BilingualText;
}

function dishText(
  recipe: Pick<
    DinnerRecipe,
    "name" | "nameEn" | "nameFil" | "subCategory" | "category"
  > | Pick<DinnerRecipe, "name" | "nameEn" | "nameFil" | "subCategory">
): string {
  const r = recipe as Partial<DinnerRecipe>;
  return [r.name, r.nameEn, r.nameFil, r.subCategory, r.category]
    .filter(Boolean)
    .join(" ");
}

/** Explicit air-fry cues (not stir-fry / 炒). */
export function looksLikeAirFryDish(
  recipe: Pick<DinnerRecipe, "name" | "nameEn" | "nameFil" | "subCategory" | "cookDevice">
): boolean {
  if (recipe.cookDevice === COOK_DEVICE_EASY_FRY) return true;
  const t = dishText(recipe);
  if (/stir[\s-]?fry|炒|wok/i.test(t) && !/air[\s-]?fry|氣炸|easy\s*fry/i.test(t)) {
    return false;
  }
  return /air[\s-]?fry(?:ed)?|氣炸|easy\s*fry|reheat leftovers/i.test(t);
}

/** Soup / stew that fits EPC17 (skip clear “stove only” cues). */
export function looksLikePressureSoup(
  recipe: Pick<
    DinnerRecipe,
    "name" | "nameEn" | "nameFil" | "subCategory" | "category" | "cookDevice"
  >
): boolean {
  if (recipe.cookDevice === COOK_DEVICE_EPC17) return true;
  if (recipe.category !== "Soup") return false;
  const t = dishText(recipe);
  if (/egg[\s-]?drop|蛋花|miso only|instant noodle/i.test(t)) return false;
  return true;
}

/**
 * Suggest Tools cook device from category / dish name.
 * Soup → EPC17; air-fry / 氣炸 → Easy Fry. Stir-fry stays none.
 */
export function suggestCookDevice(
  recipe: Pick<
    DinnerRecipe,
    "name" | "nameEn" | "nameFil" | "subCategory" | "category" | "cookDevice"
  >
): CookDeviceSuggestion | null {
  if (looksLikeAirFryDish(recipe)) {
    return {
      cookDevice: COOK_DEVICE_EASY_FRY,
      reason: {
        en: "Name looks like air-fry / 氣炸 → Easy Fry",
        fil: "Mukhang air-fry / 氣炸 → Easy Fry",
        zh: "名稱像氣炸菜 → Easy Fry",
      },
    };
  }
  if (looksLikePressureSoup(recipe)) {
    return {
      cookDevice: COOK_DEVICE_EPC17,
      reason: {
        en: "Soup category → EPC17 pressure cooker",
        fil: "Soup category → EPC17 pressure cooker",
        zh: "湯類 → EPC17 壓力鍋",
      },
    };
  }
  return null;
}

function t(en: string, fil: string, zh: string): BilingualText {
  return { en, fil, zh };
}

/**
 * Compact COOK-PHASE tip only (not a full recipe).
 * Wash / cut / blanch stay in prepNotes — device only helps the simmer/fry step.
 */
export function starterCookSettings(cookDevice: string): RecipeCookSettings | null {
  if (cookDevice === COOK_DEVICE_EASY_FRY) {
    return {
      mode: t("Air Fry", "Air Fry", "氣炸 Air Fry"),
      tempC: "180–200",
      minutes: "12–20",
      steps: t(
        "Device cook step only (keep wash/cut/marinate from prep notes):\n• Single layer, light oil spray.\n• Air Fry ~180–200°C for ~12–20 min (adjust); shake/flip halfway.\n• Panel: Tools → Cooking → Easy Fry.",
        "Cook step lang sa device (panatilihin ang hugasan/hiwa/marinate sa prep notes):\n• Isang layer, light oil spray.\n• Air Fry ~180–200°C ~12–20 min; iling/baliktarin sa gitna.\n• Panel: Tools → Cooking → Easy Fry.",
        "僅代替「炸／焗」步驟（洗切醃仍跟準備說明）：\n• 單層，薄噴油。\n• 氣炸約 180–200°C、12–20 分鐘（視厚薄）；中途搖／翻。\n• 面板：家電 → 煮食 → Easy Fry。"
      ),
    };
  }
  if (cookDevice === COOK_DEVICE_EPC17) {
    return {
      mode: t("HI-P", "HI-P", "高壓 HI-P"),
      minutes: "20–35",
      steps: t(
        "Device cook step only (keep wash / blanch / cut from prep notes):\n• After prep, bowl + food + liquid ≥250 ml (under MAX).\n• Lock → HI-P ~20–35 min (instead of long stove simmer).\n• Natural release ≥5–10 min, then season.\n• Panel: Tools → Cooking → EPC17.",
        "Cook step lang sa device (panatilihin ang hugasan / blanch / hiwa sa prep notes):\n• Pagkatapos ng prep: bowl + pagkain + liquid ≥250 ml (under MAX).\n• Lock → HI-P ~20–35 min (imbes na mahabang simmer sa stove).\n• Natural release ≥5–10 min, tapos timplahan.\n• Panel: Tools → Cooking → EPC17.",
        "僅代替「炆／煮」步驟（洗切飛水仍跟準備說明）：\n• 準備好後：內鍋＋食材＋液體 ≥250 ml（勿超 MAX）。\n• 鎖蓋 → 高壓 HI-P 約 20–35 分鐘（代替爐上長時間炆煮）。\n• 自然洩壓 ≥5–10 分鐘，再調味。\n• 面板：家電 → 煮食 → EPC17。"
      ),
    };
  }
  return null;
}

/** True if prepNotes look like the old generic device dump (should not replace dish steps). */
export function isGenericDevicePrepNotes(
  prep: BilingualText | undefined,
  cookDevice?: string
): boolean {
  if (!prep) return false;
  const blob = `${prep.en || ""}\n${prep.fil || ""}\n${prep.zh || ""}`;
  const epcDump =
    /Bowl in first|先放內鍋|Valve down|閥下壓|Panel map: Tools|面板：家電.*EPC17/i.test(
      blob
    ) && /HI-P|高壓/i.test(blob);
  const fryDump =
    /Pat food dry|抹乾|Single layer in Easy Fry|Easy Fry 單層|Panel map: Tools.*Easy Fry|面板：家電.*Easy Fry/i.test(
      blob
    ) && /Air Fry|氣炸/i.test(blob);
  if (cookDevice === COOK_DEVICE_EPC17) return epcDump;
  if (cookDevice === COOK_DEVICE_EASY_FRY) return fryDump;
  return epcDump || fryDump;
}

export function isGenericDeviceCookSettings(
  settings: RecipeCookSettings | undefined
): boolean {
  if (!settings?.steps?.en) return false;
  return /Device cook step only|僅代替|Cook step lang sa device|Bowl in first\. Add ingredients|Pat food dry; light oil spray only/i.test(
    settings.steps.en + (settings.steps.zh || "")
  );
}

/**
 * Apply cook device tag for Tools badge.
 * NEVER overwrites dish prepNotes. Only sets a short cook-phase tip in cookSettings
 * when missing (or when forceSettings).
 */
export function applyCookDevice(
  recipe: DinnerRecipe,
  cookDevice: string,
  options?: { forceSettings?: boolean; clearGenericPrep?: boolean }
): DinnerRecipe {
  const settings = starterCookSettings(cookDevice);
  const hasSettings = Boolean(recipe.cookSettings?.steps?.en?.trim());
  const force = options?.forceSettings === true;

  const next: DinnerRecipe = { ...recipe, cookDevice };

  if (settings && (!hasSettings || force || isGenericDeviceCookSettings(recipe.cookSettings))) {
    next.cookSettings = settings;
  }

  // If a previous bug replaced dish prep with a generic device dump, clear it
  // so Charlene sees real steps again once Mum re-pastes / re-fetches.
  if (
    options?.clearGenericPrep !== false &&
    isGenericDevicePrepNotes(recipe.prepNotes, cookDevice)
  ) {
    next.prepNotes = { en: "", fil: "", zh: "" };
  }

  return next;
}

/** Bulk-tag recipes — device badge only; never rewrite prep notes. */
export function autoTagCookDevices(recipes: DinnerRecipe[]): {
  recipes: DinnerRecipe[];
  tagged: number;
  clearedGenericPrep: number;
} {
  let tagged = 0;
  let clearedGenericPrep = 0;
  const next = recipes.map((r) => {
    // Clear generic dumps even on already-tagged dishes
    if (r.cookDevice && isGenericDevicePrepNotes(r.prepNotes, r.cookDevice)) {
      clearedGenericPrep += 1;
      return applyCookDevice(r, r.cookDevice, { clearGenericPrep: true });
    }
    if (r.cookDevice) return r;
    const suggestion = suggestCookDevice(r);
    if (!suggestion) return r;
    tagged += 1;
    return applyCookDevice(r, suggestion.cookDevice);
  });
  return { recipes: next, tagged, clearedGenericPrep };
}

function openRouterKey(): string | undefined {
  const raw = process.env.OPENROUTER_API_KEY?.trim();
  if (!raw) return undefined;
  return raw.replace(/^Bearer\s+/i, "");
}

/**
 * LLM: rewrite prep notes so only the long cook/simmer/fry step uses the device.
 * Keep wash / peel / cut / blanch / season steps.
 */
export async function adaptPrepNotesCookStep(options: {
  prepNotes: BilingualText;
  cookDevice: string;
  dishName?: string;
  category?: string;
}): Promise<BilingualText | null> {
  const key = openRouterKey() || process.env.OPENAI_API_KEY?.trim();
  if (!key) return null;

  const useOpenRouter = Boolean(openRouterKey());
  const endpoint = useOpenRouter
    ? "https://openrouter.ai/api/v1/chat/completions"
    : "https://api.openai.com/v1/chat/completions";
  const model = useOpenRouter
    ? process.env.OPENROUTER_MODEL || "google/gemini-2.0-flash-001"
    : process.env.OPENAI_MODEL || "gpt-4o-mini";

  const deviceLabel =
    options.cookDevice === COOK_DEVICE_EASY_FRY
      ? "Tefal Easy Fry & Grill XXL (air fryer)"
      : options.cookDevice === COOK_DEVICE_EPC17
        ? "Tefal EPC17 electric pressure cooker"
        : options.cookDevice;

  const system = `You adapt home-cooking prep notes for Charlene (Hong Kong family helper).
Return ONLY valid JSON:
{ "en": "...", "fil": "...", "zh": "..." }

CRITICAL RULES:
- Keep ALL prep steps: wash, peel, cut, blanch/飛水, assemble ingredients, season at the end.
- Change ONLY the long cook / simmer / deep-fry / oven step to use the device.
- Pressure cooker (EPC17): replace stove simmer like "boil then medium heat 1.5–2 hours" with HI-P about 20–35 min + natural release ≥5–10 min. Keep liquid under MAX, ≥250 ml.
- Air fryer (Easy Fry): replace deep-fry/oven cook with Air Fry °C + minutes; keep marinade/coating steps.
- Do NOT delete the recipe and replace it with a generic device manual.
- Do NOT invent unrelated ingredients.
- Output Traditional Chinese in zh, natural Tagalog in fil, clear English in en.
- Short numbered steps.`;

  const user = `Dish: ${options.dishName || "(unknown)"}
Category: ${options.category || "(unknown)"}
Device: ${deviceLabel}

Current prep notes EN:
${options.prepNotes.en || "(empty)"}

Current prep notes FIL:
${options.prepNotes.fil || "(empty)"}

Current prep notes ZH:
${options.prepNotes.zh || "(empty)"}

Rewrite so only the cook step uses the device.`;

  const headers: Record<string, string> = {
    Authorization: `Bearer ${useOpenRouter ? openRouterKey() : key}`,
    "Content-Type": "application/json",
  };
  if (useOpenRouter) {
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
        temperature: 0.2,
        max_tokens: 1600,
        messages: [
          { role: "system", content: system },
          { role: "user", content: user },
        ],
      }),
      signal: AbortSignal.timeout(45000),
    });
    if (!res.ok) {
      console.error("adapt prep LLM", res.status, await res.text().catch(() => ""));
      return null;
    }
    const data = (await res.json()) as {
      choices?: { message?: { content?: string } }[];
    };
    let raw = data.choices?.[0]?.message?.content?.trim() || "";
    raw = raw.replace(/^```json\s*/i, "").replace(/^```\s*/i, "").replace(/\s*```$/, "");
    const parsed = JSON.parse(raw) as { en?: string; fil?: string; zh?: string };
    const out: BilingualText = {
      en: (parsed.en || "").trim(),
      fil: (parsed.fil || "").trim(),
      zh: (parsed.zh || "").trim(),
    };
    if (!out.en && !out.fil && !out.zh) return null;
    if (isGenericDevicePrepNotes(out, options.cookDevice)) return null;
    if (out.zh) out.zh = await ensureTraditionalZh(out.zh);
    return out;
  } catch (err) {
    console.error("adapt prep failed", err);
    return null;
  }
}
