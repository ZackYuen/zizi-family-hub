import type { DinnerRecipe, Lang } from "./types";
import { getRecipeDisplayName } from "./recipe-display";

const STOP = new Set([
  "a",
  "an",
  "the",
  "and",
  "or",
  "with",
  "of",
  "in",
  "on",
  "for",
  "to",
  "from",
  "some",
  "any",
  "sa",
  "ng",
  "ang",
  "na",
  "mga",
  "may",
  "meron",
  "yung",
  "ung",
  "lang",
  "po",
  "pls",
  "please",
  "leftover",
  "leftovers",
  "remaining",
  "fridge",
  "refrigerator",
  "ref",
  "natitira",
  "tira",
  "ingredients",
  "ingredient",
  "material",
  "materials",
  "cook",
  "cooking",
  "dish",
  "dishes",
  "what",
  "can",
  "i",
  "we",
  "have",
  "has",
  "there",
  "using",
  "be",
  "been",
  "cooked",
  "cookable",
  "suggest",
  "suggestion",
  "idea",
  "ideas",
  "still",
  "left",
  "something",
  "anything",
]);

export function noSavedMenuHint(lang: Lang): string {
  if (lang === "fil") {
    return "Walang naka-save na menu. Tanong kay Charlene kung anong natitira sa fridge na pwedeng lutuin, tapos mag-suggest ng ulam (Zizi: meat + gulay, walang spicy). Kung wala siyang idea, tanong sa amin.";
  }
  if (lang === "zh") {
    return "尚未儲存今日餐單。先問 Charlene 雪櫃仲有咩可以煮，再建議菜式（孜孜要肉＋菜，不要辣）。如果她沒主意，問我們。";
  }
  return "No menu saved. Ask Charlene what leftover ingredients in the fridge can be cooked, then suggest dishes (Zizi needs meat + veg, no spicy). If she has no idea, ask us.";
}

export function leftoverWhatsAppHint(): string {
  return [
    noSavedMenuHint("en"),
    "",
    "Charlene can reply:",
    "?leftover eggs tomato pork",
    "Then pick a number, e.g. ?1",
    "If no idea, ask us.",
  ].join("\n");
}

/** Ingredient list after leftover/fridge wording, or null if not that kind of question. */
export function parseLeftoverQuery(question: string): string | null {
  const q = question.trim();
  if (!q) return null;

  const headed = q.match(
    /^(?:today|tonight|tomorrow|bukas)?\s*(?:leftovers?|remaining(?:\s+(?:food|ingredients?|materials?))?|fridge|refrigerator|natitira|tira|剩下|剩餘|雪櫃)\s*[:：,]?\s*(.*)$/i
  );
  if (headed) return headed[1].trim();

  const withPhrase = q.match(
    /(?:what can (?:i|we) cook with|meron(?:g)? sa (?:ref|fridge|refrigerator)|nasa fridge|sa fridge meron)\s*[:：,]?\s*(.+)$/i
  );
  if (withPhrase?.[1]?.trim()) return withPhrase[1].trim();

  if (
    /leftover|natitira|remaining (?:food|ingredient|material)|anong meron sa (?:ref|fridge)|剩下|剩餘|雪櫃仲有/i.test(
      q
    )
  ) {
    const stripped = q
      .replace(
        /^(?:today|tonight|tomorrow|bukas)\b/i,
        ""
      )
      .replace(
        /leftovers?|natitira|tira|remaining(?: food| ingredients?| materials?)?|anong meron sa (?:ref|fridge)|fridge|refrigerator|剩下|剩餘(?:材料)?|雪櫃/gi,
        " "
      )
      .replace(/\s+/g, " ")
      .trim();
    return stripped;
  }
  return null;
}

export function leftoverTokens(text: string): string[] {
  return text
    .toLowerCase()
    .replace(/[^\p{L}\p{N}\s]+/gu, " ")
    .split(/\s+/)
    .filter((t) => t.length > 1 && !STOP.has(t));
}

function recipeHaystack(recipe: DinnerRecipe): string {
  const ings = (recipe.ingredients ?? [])
    .map((i) => [i.en, i.fil, i.zh].filter(Boolean).join(" "))
    .join(" ");
  return [
    recipe.name,
    recipe.nameEn,
    recipe.nameFil,
    recipe.subCategory,
    ings,
  ]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();
}

export function scoreLeftoverRecipe(query: string, recipe: DinnerRecipe): number {
  const tokens = leftoverTokens(query);
  if (!tokens.length) return 0;
  const hay = recipeHaystack(recipe);
  let hit = 0;
  for (const t of tokens) {
    if (hay.includes(t)) hit += 1;
  }
  if (!hit) return 0;
  return Math.round((hit / tokens.length) * 80 + hit * 8);
}

export function suggestRecipesFromLeftovers(
  recipes: DinnerRecipe[],
  query: string,
  limit = 8
): DinnerRecipe[] {
  const scored = recipes
    .map((recipe) => ({ recipe, score: scoreLeftoverRecipe(query, recipe) }))
    .filter((x) => x.score >= 16)
    .sort((a, b) => b.score - a.score);
  const picked: DinnerRecipe[] = [];
  const seen = new Set<string>();
  const takeCat = (cat: DinnerRecipe["category"]) => {
    for (const row of scored) {
      if (row.recipe.category !== cat) continue;
      if (seen.has(row.recipe.id)) continue;
      picked.push(row.recipe);
      seen.add(row.recipe.id);
      if (picked.length >= limit) return;
    }
  };
  takeCat("Meat");
  takeCat("Vegetable");
  takeCat("Soup");
  for (const row of scored) {
    if (picked.length >= limit) break;
    if (seen.has(row.recipe.id)) continue;
    picked.push(row.recipe);
    seen.add(row.recipe.id);
  }
  return picked.slice(0, limit);
}

export function formatLeftoverSuggestions(
  recipes: DinnerRecipe[],
  query: string,
  lang: Lang
): string {
  const tokens = leftoverTokens(query);
  if (!tokens.length) {
    return noSavedMenuHint(lang);
  }
  const found = suggestRecipesFromLeftovers(recipes, query);
  const listed = tokens.join(", ");
  if (!found.length) {
    if (lang === "fil") {
      return `Walang tumugmang ulam sa Meals para sa: ${listed}.\nKung wala kang idea, tanong sa amin.\n(Zizi: meat + gulay, walang spicy.)`;
    }
    if (lang === "zh") {
      return `Meals 沒有對應「${listed}」的菜式。\n如果沒主意，問我們。\n（孜孜要肉＋菜，不要辣。）`;
    }
    return `No matching Meals dish for: ${listed}.\nIf no idea, ask us.\n(Zizi needs meat + veg, no spicy.)`;
  }
  const lines = found.map((r, i) => {
    const name = getRecipeDisplayName(r, lang === "fil" ? "fil" : lang === "zh" ? "zh" : "en");
    return `${i + 1}. ${name} (${r.category})`;
  });
  const head =
    lang === "fil"
      ? `Pwede sa natitira (${listed}). Zizi: meat + gulay, walang spicy. Kung unsure, tanong sa amin.`
      : lang === "zh"
        ? `用剩下的（${listed}）可以考慮。孜孜要肉＋菜、不要辣。不確定就問我們。`
        : `From leftovers (${listed}), you could cook. Zizi: meat + veg, no spicy. If unsure, ask us.`;
  return [head, ...lines].join("\n");
}
