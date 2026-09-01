import type { DinnerRecipe } from "./types";

export type MenuDay = "today" | "tomorrow";

export type ParsedMenuCommand =
  | { action: "show"; days: MenuDay[] }
  | { action: "clear"; days: MenuDay[] }
  | { action: "set"; assignments: { day: MenuDay; dishes: string[] }[] }
  | { action: "pick"; day: MenuDay | "pending"; numbers: number[] };

const DAY_WORD: Record<string, MenuDay> = {
  today: "today",
  tonight: "today",
  tomorrow: "tomorrow",
  bukas: "tomorrow",
};

export function looksLikeMenuCommand(question: string): boolean {
  const q = question.trim();
  if (/^(today|tonight|tomorrow|bukas|menu)\b/i.test(q)) return true;
  if (/^(pick|choose)\b/i.test(q)) return true;
  return parsePickNumbers(q) != null;
}

export function parsePickNumbers(rest: string): number[] | null {
  const t = rest
    .trim()
    .replace(/^(pick|choose)\s+/i, "")
    .replace(/[.。]+$/g, "")
    .trim();
  if (!t) return null;
  if (!/^\d+(\s*[,，、]\s*\d+|\s+\d+)*$/.test(t)) return null;
  const nums = t
    .split(/[,，、\s]+/)
    .map((s) => Number(s))
    .filter((n) => Number.isInteger(n) && n >= 1 && n <= 99);
  return nums.length ? [...new Set(nums)] : null;
}

export function isYoutubeDishToken(token: string): boolean {
  return isRecipeMediaToken(token);
}

export function isRecipeMediaToken(token: string): boolean {
  return /youtu\.?be|youtube\.com|instagram\.com|instagr\.am/i.test(token);
}

export function splitDishTokens(rest: string): string[] {
  const urls: string[] = [];
  const withoutUrls = rest.replace(/https?:\/\/\S+/gi, (raw) => {
    const href = raw.replace(/[),.;]+$/g, "");
    if (/youtu\.?be|youtube\.com|instagram\.com|instagr\.am/i.test(href)) urls.push(href);
    return "\n";
  });
  const parts = withoutUrls
    .split(/\n|,|;|\s+\+\s+|\s+\/\s+/g)
    .map((s) =>
      s
        .replace(/^(?:meat|vegetable|veg|soup|karne|gulay|sabaw)\s*[:：]\s*/i, "")
        .replace(/^["“«]+/, "")
        .replace(/["”»]+$/, "")
        .trim()
    )
    .filter((s) => s.length > 1 && !/^(today|tonight|tomorrow|bukas|menu)$/i.test(s));
  return [...urls, ...parts];
}

function isShowRest(rest: string): boolean {
  return /^(show|list|dinner|menu|hapunan|\?)?$/i.test(rest.trim());
}

function isClearRest(rest: string): boolean {
  return /^(clear|reset|random|default)$/i.test(rest.trim());
}

function labeledChunk(
  rest: string,
  labels: string[]
): string | undefined {
  const re = new RegExp(
    `(?:${labels.join("|")})\\s*[:：]\\s*([\\s\\S]*?)(?=(?:today|tonight|tomorrow|bukas)\\s*[:：]|$)`,
    "i"
  );
  const m = rest.match(re);
  return m?.[1]?.trim() || undefined;
}

export function parseMenuCommand(question: string): ParsedMenuCommand | null {
  const q = question.trim();
  if (!looksLikeMenuCommand(q)) return null;

  const pickOnly = parsePickNumbers(q);
  if (pickOnly && !/^(today|tonight|tomorrow|bukas|menu)\b/i.test(q)) {
    return { action: "pick", day: "pending", numbers: pickOnly };
  }

  const first = q.match(/^(today|tonight|tomorrow|bukas|menu)\b/i)?.[1] || "";
  const rest = q.slice(first.length).trim();
  const restPick = parsePickNumbers(rest);

  if (/^menu$/i.test(first)) {
    const todayChunk = labeledChunk(rest, ["today", "tonight"]);
    const tomorrowChunk = labeledChunk(rest, ["tomorrow", "bukas"]);
    if (todayChunk != null || tomorrowChunk != null) {
      if (
        (todayChunk == null || isClearRest(todayChunk)) &&
        (tomorrowChunk == null || isClearRest(tomorrowChunk)) &&
        [todayChunk, tomorrowChunk].some((c) => c != null && isClearRest(c))
      ) {
        const days: MenuDay[] = [];
        if (todayChunk != null && isClearRest(todayChunk)) days.push("today");
        if (tomorrowChunk != null && isClearRest(tomorrowChunk)) days.push("tomorrow");
        return { action: "clear", days };
      }
      const assignments: { day: MenuDay; dishes: string[] }[] = [];
      if (todayChunk != null && !isClearRest(todayChunk) && !isShowRest(todayChunk)) {
        const dishes = splitDishTokens(todayChunk);
        if (dishes.length) assignments.push({ day: "today", dishes });
      }
      if (
        tomorrowChunk != null &&
        !isClearRest(tomorrowChunk) &&
        !isShowRest(tomorrowChunk)
      ) {
        const dishes = splitDishTokens(tomorrowChunk);
        if (dishes.length) assignments.push({ day: "tomorrow", dishes });
      }
      if (assignments.length) return { action: "set", assignments };
      const days: MenuDay[] = [];
      if (todayChunk != null) days.push("today");
      if (tomorrowChunk != null) days.push("tomorrow");
      return { action: "show", days: days.length ? days : ["today", "tomorrow"] };
    }

    if (isClearRest(rest)) return { action: "clear", days: ["today", "tomorrow"] };
    if (restPick) return { action: "pick", day: "pending", numbers: restPick };
    if (isShowRest(rest)) return { action: "show", days: ["today", "tomorrow"] };

    const loneDay = rest.match(/^(today|tonight|tomorrow|bukas)\b/i);
    if (loneDay) {
      const day = DAY_WORD[loneDay[1].toLowerCase()];
      const after = rest.slice(loneDay[0].length).trim();
      const afterPick = parsePickNumbers(after);
      if (afterPick) return { action: "pick", day, numbers: afterPick };
      if (isClearRest(after)) return { action: "clear", days: [day] };
      if (isShowRest(after)) return { action: "show", days: [day] };
      const dishes = splitDishTokens(after);
      if (dishes.length) return { action: "set", assignments: [{ day, dishes }] };
      return { action: "show", days: [day] };
    }

    const dishes = splitDishTokens(rest);
    if (dishes.length) return { action: "set", assignments: [{ day: "today", dishes }] };
    return { action: "show", days: ["today", "tomorrow"] };
  }

  const day = DAY_WORD[first.toLowerCase()];
  if (restPick) return { action: "pick", day, numbers: restPick };
  if (isClearRest(rest)) return { action: "clear", days: [day] };
  if (isShowRest(rest)) return { action: "show", days: [day] };
  const dishes = splitDishTokens(rest);
  if (!dishes.length) return { action: "show", days: [day] };
  return { action: "set", assignments: [{ day, dishes }] };
}

export function normalizeDishQuery(s: string): string {
  return s
    .toLowerCase()
    .replace(/https?:\/\/\S+/gi, " ")
    .replace(/[^\p{L}\p{N}\s]+/gu, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function recipeNeedles(recipe: DinnerRecipe): string[] {
  return [recipe.name, recipe.nameEn, recipe.nameFil, recipe.subCategory]
    .filter((s): s is string => Boolean(s && s.trim()))
    .map(normalizeDishQuery);
}

export function scoreRecipeMatch(query: string, recipe: DinnerRecipe): number {
  const nq = normalizeDishQuery(query);
  if (nq.length < 2) return 0;
  let best = 0;
  const qTokens = nq.split(" ").filter((t) => t.length > 1);
  for (const n of recipeNeedles(recipe)) {
    if (!n) continue;
    if (n === nq) {
      best = Math.max(best, 100);
      continue;
    }
    if (n.includes(nq) || nq.includes(n)) {
      const ratio = Math.min(n.length, nq.length) / Math.max(n.length, nq.length);
      best = Math.max(best, 72 + Math.round(ratio * 24));
    }
    if (!qTokens.length) continue;
    const rTokens = n.split(" ");
    let hit = 0;
    for (const t of qTokens) {
      if (rTokens.some((x) => x === t || x.includes(t) || t.includes(x))) hit += 1;
    }
    const overlap = hit / qTokens.length;
    if (overlap >= 0.66) best = Math.max(best, Math.round(52 + overlap * 42));
  }
  return best;
}

export function matchRecipe(
  query: string,
  recipes: DinnerRecipe[]
): { recipe: DinnerRecipe } | { ambiguous: DinnerRecipe[] } | { unmatched: true } {
  const scored = recipes
    .map((recipe) => ({ recipe, score: scoreRecipeMatch(query, recipe) }))
    .filter((x) => x.score >= 58)
    .sort((a, b) => b.score - a.score);
  if (!scored.length) return { unmatched: true };
  if (
    scored.length > 1 &&
    scored[0].score - scored[1].score < 8 &&
    scored[1].score >= 72
  ) {
    return { ambiguous: scored.slice(0, 4).map((s) => s.recipe) };
  }
  return { recipe: scored[0].recipe };
}

export function searchSimilarRecipes(
  query: string,
  recipes: DinnerRecipe[],
  limit = 6
): { recipe: DinnerRecipe; score: number }[] {
  return recipes
    .map((recipe) => ({ recipe, score: scoreRecipeMatch(query, recipe) }))
    .filter((x) => x.score >= 35)
    .sort((a, b) => b.score - a.score)
    .slice(0, limit);
}

export function numberedRecipeLine(n: number, recipe: DinnerRecipe): string {
  const zh = recipe.name?.trim() || "";
  const en = (recipe.nameEn || recipe.nameFil || "").trim();
  const name =
    zh && en && zh !== en ? `${zh} / ${en}` : en || zh || recipe.id;
  return `${n}. ${name} (${recipe.category})`;
}

export function recipeLabel(recipe: DinnerRecipe): string {
  return recipe.nameEn || recipe.name || recipe.nameFil || recipe.id;
}
