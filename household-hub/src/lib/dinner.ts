import type {
  DinnerMenuOverride,
  DinnerMenuOverrides,
  DinnerRecipe,
  TonightMenu,
} from "./types";

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

/** Fill missing dates from seed; live Admin picks always win. */
export function mergeSeedDinnerOverrides(
  liveByDate: DinnerMenuOverrides["byDate"],
  seedByDate: DinnerMenuOverrides["byDate"]
): DinnerMenuOverrides["byDate"] {
  const out = { ...liveByDate };
  for (const [date, raw] of Object.entries(seedByDate || {})) {
    if (out[date]) continue;
    const normalized = normalizeDinnerOverride(raw, date);
    if (normalized) out[date] = normalized;
  }
  return out;
}

export function emptyTonightMenu(dateKey = hongKongDateKey()): TonightMenu {
  return {
    date: dateKey,
    meat: [],
    vegetable: [],
    soup: [],
    overridden: false,
  };
}

function resolveCategory(
  recipes: DinnerRecipe[],
  ids: string[],
  category: DinnerRecipe["category"]
): DinnerRecipe[] {
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
  return found;
}

/**
 * Saved Admin/WhatsApp pick only. No date-hash random menu.
 * Missing override → empty (ask Charlene leftovers, then Mum).
 */
export function resolveTonightMenu(
  recipes: DinnerRecipe[],
  dateKey = hongKongDateKey(),
  override?: DinnerMenuOverride | Partial<DinnerMenuOverride> | null
): TonightMenu {
  const normalized = normalizeDinnerOverride(override, dateKey);
  if (!normalized) return emptyTonightMenu(dateKey);

  return {
    date: dateKey,
    meat: resolveCategory(recipes, normalized.meatIds, "Meat"),
    vegetable: resolveCategory(recipes, normalized.vegetableIds, "Vegetable"),
    soup: resolveCategory(recipes, normalized.soupIds, "Soup"),
    overridden: true,
  };
}

