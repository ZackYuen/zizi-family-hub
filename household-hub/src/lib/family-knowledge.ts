import { getTodayDayKey } from "./i18n";
import { isHelperDayOff } from "./hk-holidays";
import { generateTonightMenu } from "./dinner";
import { getContentWithSource, getDinnerRecipes } from "./data";
import { getRecipeDisplayName } from "./recipe-display";
import type { AppContent, DinnerRecipe, TonightMenu } from "./types";

export interface LiveFamilySnapshot {
  source: "supabase" | "local";
  lastUpdated: string;
  helperName: string;
  familyName: string;
  isHelperDayOffToday: boolean;
  todayDayKey: string;
  ziziSchool: AppContent["ziziSchool"];
  todaySchedule: AppContent["weeklySchedule"][0] | null;
  groundRules: AppContent["groundRules"];
  monthlyTasks: AppContent["monthlyTasks"];
  tonight: TonightMenu | null;
  recipeCount: number;
}

function ingredientLine(recipe: DinnerRecipe, lang: "en" | "fil" = "en"): string[] {
  if (!recipe.ingredients?.length) return [];
  return recipe.ingredients.map((ing) => {
    const name =
      lang === "fil"
        ? ing.fil || ing.en || ing.zh || ""
        : ing.en || ing.fil || ing.zh || "";
    return ing.qty ? `${name} (${ing.qty})` : name;
  });
}

export async function buildLiveSnapshot(): Promise<LiveFamilySnapshot> {
  const { content, source } = await getContentWithSource();
  const recipes = await getDinnerRecipes();
  const tonight = recipes.length ? generateTonightMenu(recipes) : null;
  const dayOff = isHelperDayOff();
  const dayKey = dayOff ? "sunday" : getTodayDayKey();
  const todaySchedule =
    content.weeklySchedule.find((d) => d.dayKey === dayKey) ?? null;

  return {
    source,
    lastUpdated: content.lastUpdated,
    helperName: content.helperName,
    familyName: content.familyName,
    isHelperDayOffToday: dayOff,
    todayDayKey: dayKey,
    ziziSchool: content.ziziSchool,
    todaySchedule,
    groundRules: content.groundRules,
    monthlyTasks: content.monthlyTasks,
    tonight,
    recipeCount: recipes.length,
  };
}

/** Plain-text knowledge pack for the ask / WhatsApp agent */
export function snapshotToKnowledgeText(snap: LiveFamilySnapshot): string {
  const lines: string[] = [];
  lines.push(`Family: ${snap.familyName}`);
  lines.push(`Helper: ${snap.helperName}`);
  lines.push(`Data source: ${snap.source} (Admin live data when supabase)`);
  lines.push(`Last updated: ${snap.lastUpdated}`);
  lines.push(`Today key: ${snap.todayDayKey}`);
  lines.push(
    `Charlene day off today (Sunday / HK public holiday): ${snap.isHelperDayOffToday ? "YES" : "NO"}`
  );
  lines.push("");
  lines.push("Zizi school:");
  lines.push(`- EN: ${snap.ziziSchool.en}`);
  lines.push(`- FIL: ${snap.ziziSchool.fil}`);
  lines.push("");

  if (snap.todaySchedule) {
    lines.push(`Today's schedule (${snap.todaySchedule.day.en}):`);
    for (const t of snap.todaySchedule.tasks) {
      const range = t.fullDay
        ? "All day"
        : `${t.startTime ?? t.time}${t.endTime ? `–${t.endTime}` : ""}`;
      lines.push(`- ${range}: ${t.task.en}`);
      if (t.task.fil) lines.push(`  (FIL: ${t.task.fil})`);
    }
  }

  lines.push("");
  lines.push("Ground rules:");
  for (const r of snap.groundRules) {
    lines.push(`- ${r.title.en}: ${r.description.en}`);
    if (r.consequences?.en) lines.push(`  If Broken: ${r.consequences.en}`);
  }

  if (snap.monthlyTasks?.length) {
    lines.push("");
    lines.push("Monthly tasks:");
    for (const m of snap.monthlyTasks) lines.push(`- ${m.en}`);
  }

  if (snap.tonight) {
    lines.push("");
    lines.push(`Tonight's dinner (${snap.tonight.date}):`);
    for (const dish of [snap.tonight.meat, snap.tonight.vegetable, snap.tonight.soup]) {
      lines.push(
        `- ${dish.category}: ${getRecipeDisplayName(dish, "en")} / ${getRecipeDisplayName(dish, "fil")}`
      );
      const ings = ingredientLine(dish, "en");
      if (ings.length) lines.push(`  Ingredients: ${ings.join(", ")}`);
      else lines.push(`  Ingredients: (not listed yet — check recipe link ${dish.link})`);
      lines.push(`  Recipe: ${dish.link}`);
    }
  }

  lines.push("");
  lines.push("Important facts:");
  lines.push("- Zizi kindergarten: Mon–Fri PM class only. Walk from home is 30 minutes.");
  lines.push("- Drop-off by 13:00; pick up at 16:30.");
  lines.push("- Sunday and HK public holidays (香港勞工假) are Charlene day off — not about Zizi.");
  lines.push("- Zizi needs breakfast and lunch prepared by Charlene every morning on work days.");
  lines.push("- Do not invent rules. If unsure, tell Charlene to ask Sir or Mum.");

  return lines.join("\n");
}
