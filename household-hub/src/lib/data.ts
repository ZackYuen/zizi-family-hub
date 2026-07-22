import fs from "fs/promises";
import path from "path";
import { getSupabaseAdmin, isSupabaseConfigured } from "./supabase";
import type { AppContent, DinnerRecipe } from "./types";

const CONTENT_KEY = "content";
const RECIPES_KEY = "dinner_recipes";

export type DataSource = "supabase" | "local";

function isGoodTranslation(text?: string): boolean {
  if (!text?.trim()) return false;
  if (/@|Email|sportbenzin|salmo\.ee/i.test(text)) return false;
  if (/orchid|ratio of garlic|rotten|Chiton/i.test(text)) return false;
  if (/[\u4e00-\u9fff]/.test(text)) return false;
  return true;
}

/** Merge nameEn/nameFil from local seed when Supabase entries are missing or bad */
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
      nameEn: isGoodTranslation(r.nameEn)
        ? r.nameEn
        : isGoodTranslation(seed.nameEn)
          ? seed.nameEn
          : r.nameEn,
      nameFil: isGoodTranslation(r.nameFil)
        ? r.nameFil
        : isGoodTranslation(seed.nameFil)
          ? seed.nameFil
          : r.nameFil,
      ingredients: r.ingredients?.length ? r.ingredients : seed.ingredients,
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

/** Only for one-time bootstrap of broken pre-Admin rows — never overrides newer Admin saves */
function isBrokenLegacyContent(content: AppContent): boolean {
  const monday = content.weeklySchedule?.find((d) => d.dayKey === "monday");
  const wake = monday?.tasks?.find((t) =>
    t.task.en.toLowerCase().includes("wake")
  );
  const wakeTime = wake?.startTime ?? wake?.time;
  if (wakeTime === "07:30") return true;
  if (!content.groundRules?.length) return true;
  if (content.groundRules.some((r) => !r.consequences?.en?.trim())) return true;
  return false;
}

function bootstrapFromLocal(remote: AppContent, local: AppContent): AppContent {
  return {
    ...remote,
    weeklySchedule: local.weeklySchedule,
    ziziSchool: local.ziziSchool,
    groundRules: local.groundRules,
    lastUpdated: new Date().toISOString(),
  };
}

/**
 * Live source of truth:
 * - With Supabase: Admin-saved rows win. Repo JSON is seed/fallback only.
 * - Without Supabase: local content.json.
 * - FORCE_SEED_FROM_LOCAL=1: force push local JSON into Supabase (intentional reset).
 */
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
  const forceSeed = process.env.FORCE_SEED_FROM_LOCAL === "1";

  if (!data) {
    if (forceSeed) {
      await saveContent(local);
    }
    return local;
  }

  const remote = data.data as AppContent;

  if (forceSeed) {
    const seeded = { ...local, lastUpdated: new Date().toISOString() };
    await saveContent(seeded);
    return seeded;
  }

  // One-time repair of legacy broken rows only — Admin saves always win after that
  if (isBrokenLegacyContent(remote)) {
    const fixed = bootstrapFromLocal(remote, local);
    saveContent(fixed).catch(() => {});
    return fixed;
  }

  return remote;
}

export async function getContentWithSource(): Promise<{
  content: AppContent;
  source: DataSource;
}> {
  const source: DataSource = isSupabaseConfigured() ? "supabase" : "local";
  const content = await getContent();
  return { content, source };
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
