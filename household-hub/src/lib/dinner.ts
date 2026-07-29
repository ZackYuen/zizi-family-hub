import type {
  DinnerMenuOverride,
  DinnerRecipe,
  TonightMenu,
} from "./types";

function hashSeed(input: string): number {
  let h = 2166136261;
  for (let i = 0; i < input.length; i++) {
    h ^= input.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

function pickByDate(
  recipes: DinnerRecipe[],
  dateKey: string,
  salt: string
): DinnerRecipe {
  const pool = [...recipes].sort((a, b) => a.index - b.index);
  if (!pool.length) {
    throw new Error(`No recipes for salt=${salt}`);
  }
  const idx = hashSeed(`${dateKey}:${salt}`) % pool.length;
  return pool[idx];
}

/** Hong Kong calendar date YYYY-MM-DD */
export function hongKongDateKey(date = new Date()): string {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Hong_Kong",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(date);
}

/** Add/subtract calendar days from a YYYY-MM-DD key (Hong Kong date math). */
export function addHongKongDays(dateKey: string, days: number): string {
  const base = new Date(`${dateKey}T12:00:00+08:00`);
  base.setTime(base.getTime() + days * 24 * 60 * 60 * 1000);
  return hongKongDateKey(base);
}

/** Flatten tonight dishes in Meat → Vegetable → Soup order. */
export function tonightDishes(menu: TonightMenu | null | undefined): DinnerRecipe[] {
  if (!menu) return [];
  return [...(menu.meat ?? []), ...(menu.vegetable ?? []), ...(menu.soup ?? [])];
}

function asIdList(
  ids: string[] | undefined,
  legacy: string | undefined
): string[] {
  if (Array.isArray(ids)) {
    return ids.map((id) => String(id || "").trim()).filter(Boolean);
  }
  const one = String(legacy || "").trim();
  return one ? [one] : [];
}

/** Migrate legacy meatId/vegetableId/soupId → *Ids arrays. */
export function normalizeDinnerOverride(
  raw: Partial<DinnerMenuOverride> | null | undefined,
  dateFallback?: string
): DinnerMenuOverride | null {
  if (!raw) return null;
  const date = String(raw.date || dateFallback || "").trim();
  if (!date) return null;
  return {
    date,
    meatIds: asIdList(raw.meatIds, raw.meatId),
    vegetableIds: asIdList(raw.vegetableIds, raw.vegetableId),
    soupIds: asIdList(raw.soupIds, raw.soupId),
    updatedAt: raw.updatedAt,
  };
}

export function generateTonightMenu(
  recipes: DinnerRecipe[],
  dateKey = hongKongDateKey()
): TonightMenu {
  const meats = recipes.filter((r) => r.category === "Meat");
  const vegetables = recipes.filter((r) => r.category === "Vegetable");
  const soups = recipes.filter((r) => r.category === "Soup");

  return {
    date: dateKey,
    meat: [pickByDate(meats, dateKey, "meat")],
    vegetable: [pickByDate(vegetables, dateKey, "vegetable")],
    soup: [pickByDate(soups, dateKey, "soup")],
    overridden: false,
  };
}

function resolveCategory(
  recipes: DinnerRecipe[],
  ids: string[],
  category: DinnerRecipe["category"],
  fallback: DinnerRecipe[]
): DinnerRecipe[] {
  // Explicit empty array in override = intentionally no dish in this category
  if (ids.length === 0) return [];
  const found: DinnerRecipe[] = [];
  const seen = new Set<string>();
  for (const id of ids) {
    if (seen.has(id)) continue;
    const recipe = recipes.find((r) => r.id === id && r.category === category);
    if (recipe) {
      found.push(recipe);
      seen.add(id);
    }
  }
  // If all IDs were invalid, fall back to default random picks
  return found.length ? found : fallback;
}

/**
 * Random-by-date menu (1 meat + 1 veg + 1 soup), unless Admin saved an override.
 * Override may include 0..n dishes per category.
 */
export function resolveTonightMenu(
  recipes: DinnerRecipe[],
  dateKey = hongKongDateKey(),
  override?: DinnerMenuOverride | Partial<DinnerMenuOverride> | null
): TonightMenu {
  const base = generateTonightMenu(recipes, dateKey);
  const normalized = normalizeDinnerOverride(override, dateKey);
  if (!normalized) return base;

  return {
    date: dateKey,
    meat: resolveCategory(recipes, normalized.meatIds, "Meat", base.meat),
    vegetable: resolveCategory(
      recipes,
      normalized.vegetableIds,
      "Vegetable",
      base.vegetable
    ),
    soup: resolveCategory(recipes, normalized.soupIds, "Soup", base.soup),
    overridden: true,
  };
}
