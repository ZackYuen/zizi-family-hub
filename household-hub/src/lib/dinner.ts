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

export function generateTonightMenu(
  recipes: DinnerRecipe[],
  dateKey = hongKongDateKey()
): TonightMenu {
  const meats = recipes.filter((r) => r.category === "Meat");
  const vegetables = recipes.filter((r) => r.category === "Vegetable");
  const soups = recipes.filter((r) => r.category === "Soup");

  return {
    date: dateKey,
    meat: pickByDate(meats, dateKey, "meat"),
    vegetable: pickByDate(vegetables, dateKey, "vegetable"),
    soup: pickByDate(soups, dateKey, "soup"),
    overridden: false,
  };
}

function findRecipe(
  recipes: DinnerRecipe[],
  id: string,
  category: DinnerRecipe["category"]
): DinnerRecipe | undefined {
  return recipes.find((r) => r.id === id && r.category === category);
}

/**
 * Random-by-date menu, unless Admin saved an override for that date.
 */
export function resolveTonightMenu(
  recipes: DinnerRecipe[],
  dateKey = hongKongDateKey(),
  override?: DinnerMenuOverride | null
): TonightMenu {
  const base = generateTonightMenu(recipes, dateKey);
  if (!override) return base;

  const meat =
    findRecipe(recipes, override.meatId, "Meat") || base.meat;
  const vegetable =
    findRecipe(recipes, override.vegetableId, "Vegetable") || base.vegetable;
  const soup = findRecipe(recipes, override.soupId, "Soup") || base.soup;

  return {
    date: dateKey,
    meat,
    vegetable,
    soup,
    overridden: true,
  };
}
