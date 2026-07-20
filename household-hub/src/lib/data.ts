import fs from "fs/promises";
import path from "path";
import { getSupabaseAdmin, isSupabaseConfigured } from "./supabase";
import type { AppContent, DinnerRecipe } from "./types";

const CONTENT_KEY = "content";
const RECIPES_KEY = "dinner_recipes";

function isGoodTranslation(text?: string): boolean {
  if (!text?.trim()) return false;
  if (/@|Email|sportbenzin|salmo\.ee/i.test(text)) return false;
  if (/orchid|ratio of garlic|rotten|Chiton/i.test(text)) return false;
  if (/[\u4e00-\u9fff]/.test(text)) return false;
  return true;
}

/** Merge nameEn/nameFil from local seed file when Supabase entries are missing or bad */
function mergeRecipeTranslations(
  remote: DinnerRecipe[],
  local: DinnerRecipe[]
): DinnerRecipe[] {
  const localMap = new Map(local.map((r) => [r.id, r]));
  return remote.map((r) => {
    const seed = localMap.get(r.id);
    if (!seed) return r;
    return {
      ...r,
      nameEn: isGoodTranslation(seed.nameEn)
        ? seed.nameEn
        : isGoodTranslation(r.nameEn)
          ? r.nameEn
          : seed.nameEn,
      nameFil: isGoodTranslation(seed.nameFil)
        ? seed.nameFil
        : isGoodTranslation(r.nameFil)
          ? r.nameFil
          : seed.nameFil,
    };
  });
}

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

function isStaleSchedule(content: AppContent): boolean {
  const monday = content.weeklySchedule?.find((d) => d.dayKey === "monday");
  const wake = monday?.tasks?.find((t) =>
    t.task.en.toLowerCase().includes("wake")
  );
  const wakeTime = wake?.startTime ?? wake?.time;
  return wakeTime === "07:30";
}

/** Prefer local schedule when Supabase still has old 07:30 wake-up data */
function mergeContentFromLocal(
  remote: AppContent,
  local: AppContent
): AppContent {
  const remoteUpdated = remote.lastUpdated
    ? new Date(remote.lastUpdated).getTime()
    : 0;
  const localUpdated = local.lastUpdated
    ? new Date(local.lastUpdated).getTime()
    : 0;
  const useLocalSchedule =
    isStaleSchedule(remote) || localUpdated > remoteUpdated;

  if (!useLocalSchedule) return remote;

  return {
    ...remote,
    weeklySchedule: local.weeklySchedule,
    ziziSchool: local.ziziSchool,
    lastUpdated: local.lastUpdated,
  };
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

  const local = await readLocalContent();
  if (!data) return local;

  const merged = mergeContentFromLocal(data.data as AppContent, local);

  if (isStaleSchedule(data.data as AppContent)) {
    saveContent(merged).catch(() => {});
  }

  return merged;
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
  const local = await readLocalRecipes();
  return mergeRecipeTranslations(parsed.recipes, local);
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
