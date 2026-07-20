import fs from "fs/promises";
import path from "path";
import type { DinnerRecipe, TonightMenu } from "./types";

const RECIPES_PATH = path.join(process.cwd(), "data", "dinner-recipes.json");

interface RecipesFile {
  recipes: DinnerRecipe[];
}

export async function getDinnerRecipes(): Promise<DinnerRecipe[]> {
  const raw = await fs.readFile(RECIPES_PATH, "utf-8");
  const data = JSON.parse(raw) as RecipesFile;
  return data.recipes;
}

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

export async function getTonightMenu(dateKey?: string): Promise<TonightMenu> {
  const recipes = await getDinnerRecipes();
  return generateTonightMenu(recipes, dateKey);
}
