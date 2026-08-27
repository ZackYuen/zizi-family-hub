import { addYoutubeDinnerRecipe } from "./add-youtube-recipe";
import {
  clearDinnerMenuOverride,
  getDinnerMenuOverrides,
  getDinnerRecipes,
  upsertDinnerMenuOverride,
} from "./data";
import {
  addHongKongDays,
  hongKongDateKey,
  resolveTonightMenu,
  tonightDishes,
} from "./dinner";
import { getRecipeDisplayName } from "./recipe-display";
import type { DinnerRecipe, TonightMenu } from "./types";
import {
  isYoutubeDishToken,
  matchRecipe,
  parseMenuCommand,
  recipeLabel,
  type MenuDay,
} from "./wa-menu-parse";

export { looksLikeMenuCommand, parseMenuCommand } from "./wa-menu-parse";

function dateForDay(day: MenuDay, now = new Date()): string {
  const today = hongKongDateKey(now);
  return day === "tomorrow" ? addHongKongDays(today, 1) : today;
}

function dayTitle(day: MenuDay, dateKey: string): string {
  return day === "tomorrow" ? `Tomorrow (${dateKey})` : `Tonight (${dateKey})`;
}

function dishLine(recipe: DinnerRecipe): string {
  const en = getRecipeDisplayName(recipe, "en");
  const fil = getRecipeDisplayName(recipe, "fil");
  const extra = fil && fil !== en ? ` / ${fil}` : "";
  return `• ${recipe.category}: ${en}${extra}`;
}

function formatMenu(day: MenuDay, menu: TonightMenu | null): string {
  const title = dayTitle(day, menu?.date || dateForDay(day));
  if (!menu) return `${title}: no dishes yet`;
  const dishes = tonightDishes(menu);
  const kind = menu.overridden ? "saved pick" : "random";
  if (!dishes.length) return `${title} — ${kind}: (none)`;
  return [`${title} — ${kind}:`, ...dishes.map(dishLine)].join("\n");
}

async function resolveTokens(
  tokens: string[],
  recipes: DinnerRecipe[]
): Promise<{
  recipes: DinnerRecipe[];
  unmatched: string[];
  ambiguous: { query: string; options: DinnerRecipe[] }[];
  addedFromYoutube: string[];
}> {
  let pool = recipes;
  const found: DinnerRecipe[] = [];
  const unmatched: string[] = [];
  const ambiguous: { query: string; options: DinnerRecipe[] }[] = [];
  const addedFromYoutube: string[] = [];
  const seen = new Set<string>();

  for (const token of tokens) {
    if (isYoutubeDishToken(token)) {
      const added = await addYoutubeDinnerRecipe(token);
      pool = await getDinnerRecipes();
      if (!seen.has(added.recipe.id)) {
        found.push(added.recipe);
        seen.add(added.recipe.id);
      }
      if (!added.duplicate) addedFromYoutube.push(recipeLabel(added.recipe));
      continue;
    }
    const hit = matchRecipe(token, pool);
    if ("unmatched" in hit) {
      unmatched.push(token);
      continue;
    }
    if ("ambiguous" in hit) {
      ambiguous.push({ query: token, options: hit.ambiguous });
      continue;
    }
    if (!seen.has(hit.recipe.id)) {
      found.push(hit.recipe);
      seen.add(hit.recipe.id);
    }
  }

  return { recipes: found, unmatched, ambiguous, addedFromYoutube };
}

function formatMatchProblems(
  unmatched: string[],
  ambiguous: { query: string; options: DinnerRecipe[] }[]
): string {
  const lines: string[] = [];
  if (unmatched.length) {
    lines.push("Not in Meals:");
    for (const q of unmatched) lines.push(`• ${q}`);
    lines.push("Use a closer name, or paste a YouTube link:");
    lines.push("?today https://youtube.com/…");
  }
  if (ambiguous.length) {
    lines.push("Which one?");
    for (const row of ambiguous) {
      lines.push(`• “${row.query}” could be:`);
      for (const opt of row.options) {
        lines.push(`  - ${recipeLabel(opt)} (${opt.category})`);
      }
    }
  }
  return lines.join("\n");
}

export function formatMenuReply(parts: string[]): string {
  return parts.filter(Boolean).join("\n\n");
}

export async function handleWhatsAppMenu(question: string): Promise<{
  answer: string;
  handled: "menu";
}> {
  const parsed = parseMenuCommand(question);
  if (!parsed) {
    return {
      handled: "menu",
      answer:
        "Try:\n?today honey wings, garlic cabbage\n?tomorrow https://youtube.com/…\n?menu",
    };
  }

  const [recipes, overrides] = await Promise.all([
    getDinnerRecipes(),
    getDinnerMenuOverrides(),
  ]);

  if (parsed.action === "show") {
    const blocks = parsed.days.map((day) => {
      const date = dateForDay(day);
      const menu = recipes.length
        ? resolveTonightMenu(recipes, date, overrides.byDate[date] ?? null)
        : null;
      return formatMenu(day, menu);
    });
    return { handled: "menu", answer: formatMenuReply(blocks) };
  }

  if (parsed.action === "clear") {
    const blocks: string[] = [];
    for (const day of parsed.days) {
      const date = dateForDay(day);
      await clearDinnerMenuOverride(date);
      const menu = recipes.length ? resolveTonightMenu(recipes, date, null) : null;
      blocks.push(`${dayTitle(day, date)} back to random.`);
      if (menu) blocks.push(formatMenu(day, menu));
    }
    return { handled: "menu", answer: formatMenuReply(blocks) };
  }

  const blocks: string[] = [];
  for (const assignment of parsed.assignments) {
    const resolved = await resolveTokens(assignment.dishes, recipes);
    if (resolved.unmatched.length || resolved.ambiguous.length) {
      blocks.push(formatMatchProblems(resolved.unmatched, resolved.ambiguous));
      continue;
    }
    if (!resolved.recipes.length) {
      blocks.push("Add at least one dish.");
      continue;
    }
    const date = dateForDay(assignment.day);
    const meatIds = resolved.recipes.filter((r) => r.category === "Meat").map((r) => r.id);
    const vegetableIds = resolved.recipes
      .filter((r) => r.category === "Vegetable")
      .map((r) => r.id);
    const soupIds = resolved.recipes.filter((r) => r.category === "Soup").map((r) => r.id);
    await upsertDinnerMenuOverride({
      date,
      meatIds,
      vegetableIds,
      soupIds,
    });
    const latest = await getDinnerRecipes();
    const menu = resolveTonightMenu(latest, date, {
      date,
      meatIds,
      vegetableIds,
      soupIds,
    });
    const extra = resolved.addedFromYoutube.length
      ? `Also added to Meals: ${resolved.addedFromYoutube.join(", ")}`
      : "";
    blocks.push(
      formatMenuReply([`${dayTitle(assignment.day, date)} saved.`, formatMenu(assignment.day, menu), extra])
    );
  }

  return { handled: "menu", answer: formatMenuReply(blocks) };
}
