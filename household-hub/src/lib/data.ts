import fs from "fs/promises";
import path from "path";
import { getSupabaseAdmin, isSupabaseConfigured } from "./supabase";
import type { AppContent, DinnerRecipe } from "./types";

const CONTENT_KEY = "content";
const RECIPES_KEY = "dinner_recipes";

async function readLocalContent(): Promise<AppContent> {
  const raw = await fs.readFile(
    path.join(process.cwd(), "data", "content.json"),
    "utf-8"
  );
  return JSON.parse(raw) as AppContent;
}

async function readLocalRecipes(): Promise<DinnerRecipe[]> {
  const raw = await fs.readFile(
    path.join(process.cwd(), "data", "dinner-recipes.json"),
    "utf-8"
  );
  const parsed = JSON.parse(raw) as { recipes: DinnerRecipe[] };
  return parsed.recipes;
}

export async function getContent(): Promise<AppContent> {
  if (!isSupabaseConfigured()) {
    return readLocalContent();
  }

  const supabase = getSupabaseAdmin();
  const { data, error } = await supabase
    .from("app_data")
    .select("data")
    .eq("key", CONTENT_KEY)
    .maybeSingle();

  if (error) throw error;
  if (!data) return readLocalContent();
  return data.data as AppContent;
}

export async function saveContent(content: AppContent): Promise<AppContent> {
  const updated = { ...content, lastUpdated: new Date().toISOString() };

  if (!isSupabaseConfigured()) {
    throw new Error("Supabase is not configured — cannot save in production");
  }

  const supabase = getSupabaseAdmin();
  const { error } = await supabase.from("app_data").upsert({
    key: CONTENT_KEY,
    data: updated,
    updated_at: new Date().toISOString(),
  });

  if (error) throw error;
  return updated;
}

export async function getDinnerRecipes(): Promise<DinnerRecipe[]> {
  if (!isSupabaseConfigured()) {
    return readLocalRecipes();
  }

  const supabase = getSupabaseAdmin();
  const { data, error } = await supabase
    .from("app_data")
    .select("data")
    .eq("key", RECIPES_KEY)
    .maybeSingle();

  if (error) throw error;
  if (!data) return readLocalRecipes();
  const parsed = data.data as { recipes: DinnerRecipe[] };
  return parsed.recipes;
}

export async function saveDinnerRecipes(recipes: DinnerRecipe[]): Promise<void> {
  if (!isSupabaseConfigured()) {
    throw new Error("Supabase is not configured");
  }

  const supabase = getSupabaseAdmin();
  const { error } = await supabase.from("app_data").upsert({
    key: RECIPES_KEY,
    data: { recipes },
    updated_at: new Date().toISOString(),
  });

  if (error) throw error;
}
