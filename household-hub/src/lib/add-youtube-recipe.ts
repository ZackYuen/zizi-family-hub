import { inferRecipeCategory, instagramShortcode, canonicalInstagramUrl } from "./add-youtube-parse";
import { applyCookDevice, suggestCookDevice } from "./cook-device-suggest";
import { cookDeviceMeta } from "./cook-devices";
import { getDinnerRecipes, saveDinnerRecipes } from "./data";
import { getRecipeDisplayName } from "./recipe-display";
import type { DinnerRecipe } from "./types";
import { enrichYoutubeRecipe, youtubeVideoId } from "./youtube-recipe";

export { inferRecipeCategory, parseAddCommand } from "./add-youtube-parse";

function toolLabel(cookDevice?: string): string {
  if (!cookDevice) return "stove / wok";
  const meta = cookDeviceMeta(cookDevice);
  if (cookDevice.includes("epc17")) return "EPC17";
  if (cookDevice.includes("easy-fry")) return "Easy Fry";
  return meta?.shortName.en || cookDevice;
}

export function formatAddMealReply(result: {
  duplicate: boolean;
  recipe: DinnerRecipe;
}): string {
  const name =
    result.recipe.name ||
    result.recipe.nameEn ||
    getRecipeDisplayName(result.recipe, "en");
  const tool = toolLabel(result.recipe.cookDevice);
  const ings = result.recipe.ingredients?.length || 0;
  if (result.duplicate) {
    return [
      `Already in Meals: ${name}`,
      `${result.recipe.category} · ${tool}`,
      result.recipe.link,
    ].join("\n");
  }
  return [
    `Added to Meals (live): ${name}`,
    `${result.recipe.category} · ${tool}`,
    ings ? `${ings} ingredients` : "Ingredients: check Admin if empty",
    result.recipe.link,
  ].join("\n");
}

export async function addYoutubeDinnerRecipe(url: string): Promise<{
  recipe: DinnerRecipe;
  duplicate: boolean;
}> {
  const videoId = youtubeVideoId(url);
  const igId = instagramShortcode(url);
  if (!videoId && !igId) {
    throw new Error("Need a YouTube or Instagram link");
  }
  const canonical = videoId
    ? `https://www.youtube.com/watch?v=${videoId}`
    : canonicalInstagramUrl(igId!);
  const recipes = await getDinnerRecipes();
  const existing = recipes.find((r) => {
    if (videoId) {
      return r.id === `d-yt-${videoId}` || youtubeVideoId(r.link || "") === videoId;
    }
    return r.id === `d-ig-${igId}` || instagramShortcode(r.link || "") === igId;
  });
  if (existing) {
    return { recipe: existing, duplicate: true };
  }

  const enriched = await enrichYoutubeRecipe({ url: canonical });
  const blob = [
    enriched.title,
    enriched.nameZh,
    enriched.nameEn,
    enriched.nameFil,
    enriched.prepNotes?.en,
    enriched.prepNotes?.zh,
    ...(enriched.ingredients || []).map((i) => `${i.en} ${i.zh || ""}`),
  ]
    .filter(Boolean)
    .join(" ");
  const category = inferRecipeCategory(blob);
  const index = recipes.length
    ? Math.max(...recipes.map((r) => r.index || 0)) + 1
    : 1;

  let recipe: DinnerRecipe = {
    id: videoId ? `d-yt-${videoId}` : `d-ig-${igId}`,
    index,
    name: enriched.nameZh || enriched.title || (videoId ? "YouTube recipe" : "Instagram recipe"),
    nameEn: enriched.nameEn || enriched.title,
    nameFil: enriched.nameFil || enriched.nameEn || enriched.title,
    category,
    link: canonical,
    ingredients: enriched.ingredients || [],
    prepNotes: enriched.prepNotes,
  };
  const suggestion = suggestCookDevice(recipe);
  if (suggestion) {
    recipe = applyCookDevice(recipe, suggestion.cookDevice);
  }

  await saveDinnerRecipes([...recipes, recipe]);
  return { recipe, duplicate: false };
}
