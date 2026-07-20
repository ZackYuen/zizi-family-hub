import { withBasePath } from "./base-path";
import type { DinnerRecipe, TonightMenu } from "./types";

function hashSeed(input: string): number {
  let h = 2166136261;
  for (let i = 0; i < input.length; i++) {
    h ^= input.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

function pickByDate(recipes: DinnerRecipe[], dateKey: string, salt: string): DinnerRecipe {
  const pool = [...recipes].sort((a, b) => a.index - b.index);
  const idx = hashSeed(`${dateKey}:${salt}`) % pool.length;
  return pool[idx];
}

export function generateTonightMenu(
  recipes: DinnerRecipe[],
  dateKey = new Date().toISOString().slice(0, 10)
): TonightMenu {
  const meats = recipes.filter((r) => r.category === "Meat");
  const vegetables = recipes.filter((r) => r.category === "Vegetable");
  const soups = recipes.filter((r) => r.category === "Soup");

  return {
    date: dateKey,
    meat: pickByDate(meats, dateKey, "meat"),
    vegetable: pickByDate(vegetables, dateKey, "vegetable"),
    soup: pickByDate(soups, dateKey, "soup"),
  };
}

export async function fetchDinnerRecipes(): Promise<DinnerRecipe[]> {
  const res = await fetch(withBasePath("/data/dinner-recipes.json"));
  if (!res.ok) throw new Error("Failed to load recipes");
  const data = (await res.json()) as { recipes: DinnerRecipe[] };
  return data.recipes;
}

export async function fetchTonightMenu(dateKey?: string): Promise<TonightMenu> {
  const recipes = await fetchDinnerRecipes();
  return generateTonightMenu(recipes, dateKey);
}
