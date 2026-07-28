import type { BilingualText, DinnerRecipe, RecipeCookSettings } from "./types";

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
  recipe: Pick<DinnerRecipe, "name" | "nameEn" | "nameFil" | "subCategory" | "category" | "cookDevice">
): boolean {
  if (recipe.cookDevice === COOK_DEVICE_EPC17) return true;
  if (recipe.category !== "Soup") return false;
  const t = dishText(recipe);
  // Egg-drop / very quick stove soups can stay untagged unless Mum picks EPC17
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

/** Starter cookSettings when tagging a device (Mum can edit times). */
export function starterCookSettings(cookDevice: string): RecipeCookSettings | null {
  if (cookDevice === COOK_DEVICE_EASY_FRY) {
    return {
      mode: t("Air Fry", "Air Fry", "氣炸 Air Fry"),
      tempC: "180–200",
      minutes: "12–20",
      steps: t(
        "1) Pat food dry; light oil spray only.\n2) Single layer in Easy Fry basket — don’t overcrowd.\n3) Air Fry 180–200°C, about 12–20 min (adjust for thickness); shake/flip halfway.\n4) Check cooked through. Soft/cut small for Zizi.\n5) Panel map: Tools → Cooking → Easy Fry.",
        "1) Patuyuin; light oil spray lang.\n2) Isang layer sa Easy Fry — huwag siksikin.\n3) Air Fry 180–200°C, ~12–20 min; iling/baliktarin sa gitna.\n4) Tiyaking luto. Cut maliit para kay Zizi.\n5) Panel map: Tools → Cooking → Easy Fry.",
        "1) 抹乾；薄噴油即可。\n2) Easy Fry 單層，不要過滿。\n3) 氣炸 180–200°C，約 12–20 分鐘（視厚薄）；中途搖／翻。\n4) 確認熟透；給 Zizi 切小。\n5) 面板：家電 → 煮食 → Easy Fry。"
      ),
    };
  }
  if (cookDevice === COOK_DEVICE_EPC17) {
    return {
      mode: t("HI-P", "HI-P", "高壓 HI-P"),
      minutes: "20–35",
      steps: t(
        "1) Bowl in first. Add ingredients + liquid ≥ ~250 ml (under MAX).\n2) Valve down, lock lid.\n3) Pressure cook HI-P about 20–35 min (softer meat/bones toward 30–35).\n4) Natural release ≥5–10 min, then open safely.\n5) Season. Remove bones for Zizi.\n6) Panel map: Tools → Cooking → EPC17.",
        "1) Bowl muna. Ingredients + liquid ≥ ~250 ml (under MAX).\n2) Valve down, lock lid.\n3) HI-P ~20–35 min (mas matagal kung buto/matigas).\n4) Natural release ≥5–10 min, tapos buksan nang safe.\n5) Timplahan. Alisin buto para kay Zizi.\n6) Panel map: Tools → Cooking → EPC17.",
        "1) 先放內鍋；食材＋液體 ≥約 250 ml（勿超 MAX）。\n2) 閥下壓並鎖蓋。\n3) 高壓 HI-P 約 20–35 分鐘（連骨／韌肉偏長）。\n4) 自然洩壓 ≥5–10 分鐘再開蓋。\n5) 調味；給 Zizi 去骨。\n6) 面板：家電 → 煮食 → EPC17。"
      ),
    };
  }
  return null;
}

export function cookSettingsToPrepNotes(settings: RecipeCookSettings): BilingualText {
  const line = (lang: "en" | "fil" | "zh") => {
    const mode = settings.mode[lang] || settings.mode.en;
    const temp =
      settings.tempC && lang === "zh"
        ? ` ${settings.tempC}°C`
        : settings.tempC
          ? ` ${settings.tempC}°C`
          : "";
    const mins =
      lang === "zh"
        ? `，${settings.minutes} 分鐘`
        : `, ${settings.minutes} min`;
    const steps = settings.steps[lang] || settings.steps.en;
    return `${mode}${temp}${mins}.\n${steps}`;
  };
  return { en: line("en"), fil: line("fil"), zh: line("zh") };
}

/**
 * Apply suggested/chosen cook device onto a recipe.
 * Fills cookSettings + prepNotes only when those fields are empty (unless forcePrep).
 */
export function applyCookDevice(
  recipe: DinnerRecipe,
  cookDevice: string,
  options?: { forcePrep?: boolean }
): DinnerRecipe {
  const settings = starterCookSettings(cookDevice);
  const hasPrep = Boolean(
    recipe.prepNotes?.en?.trim() ||
      recipe.prepNotes?.fil?.trim() ||
      recipe.prepNotes?.zh?.trim()
  );
  const hasSettings = Boolean(recipe.cookSettings?.steps?.en?.trim());
  const force = options?.forcePrep === true;

  const next: DinnerRecipe = { ...recipe, cookDevice };
  if (settings && (!hasSettings || force)) {
    next.cookSettings = settings;
  }
  if (settings && (!hasPrep || force)) {
    next.prepNotes = cookSettingsToPrepNotes(settings);
  }
  return next;
}

/** Bulk-tag recipes that clearly match soup→EPC17 or air-fry→Easy Fry. */
export function autoTagCookDevices(recipes: DinnerRecipe[]): {
  recipes: DinnerRecipe[];
  tagged: number;
} {
  let tagged = 0;
  const next = recipes.map((r) => {
    if (r.cookDevice) return r;
    const suggestion = suggestCookDevice(r);
    if (!suggestion) return r;
    tagged += 1;
    return applyCookDevice(r, suggestion.cookDevice);
  });
  return { recipes: next, tagged };
}
