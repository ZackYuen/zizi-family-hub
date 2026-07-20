import type { DinnerRecipe, Lang } from "./types";
import { hasCjk } from "./localized-text";

const subCategoryFil: Record<string, string> = {
  Pork: "Baboy",
  Beef: "Baka",
  Chicken: "Manok",
  "Chicken Wing": "Pakpak ng Manok",
  Fish: "Isda",
  Salmon: "Salmon",
  Shrimp: "Hipon",
  Egg: "Itlog",
  Tofu: "Tofu",
  Mushrooms: "Kabute",
  Tomato: "Kamatis",
  Broccoli: "Broccoli",
  "Green Beans": "Sitaw",
  Pumpkin: "Kalabasa",
  Potato: "Patatas",
  Mutton: "Kambing",
  Mussels: "Tahong",
  Onion: "Sibuyas",
  Banana: "Saging",
  Corn: "Mais",
  Spinach: "Spinach",
  Kale: "Kale",
  Cabbage: "Repolyo",
  Cauliflower: "Cauliflower",
  Eggplant: "Talong",
  Edamame: "Edamame",
  "Bean Sprouts": "Toge",
  "Water Morning Glory": "Kangkong",
};

function isMostlyLatin(text: string): boolean {
  if (!text) return false;
  if (hasCjk(text)) return false;
  const latin = (text.match(/[a-zA-Z0-9\s\-',.&()]/g) ?? []).length;
  return latin / text.length > 0.6;
}

const categoryFil: Record<DinnerRecipe["category"], string> = {
  Meat: "Ulam na Karne",
  Vegetable: "Gulay",
  Soup: "Sabaw",
};

const categoryEn: Record<DinnerRecipe["category"], string> = {
  Meat: "Meat dish",
  Vegetable: "Vegetable dish",
  Soup: "Soup",
};

const categoryZh: Record<DinnerRecipe["category"], string> = {
  Meat: "肉類",
  Vegetable: "蔬菜",
  Soup: "湯",
};

export function getRecipeDisplayName(recipe: DinnerRecipe, lang: Lang): string {
  if (lang === "zh") {
    if (recipe.name?.trim() && hasCjk(recipe.name)) return recipe.name;
    if (recipe.nameEn?.trim() && isMostlyLatin(recipe.nameEn)) return recipe.nameEn;
    return categoryZh[recipe.category];
  }

  if (lang === "fil") {
    if (recipe.nameFil?.trim() && !hasCjk(recipe.nameFil)) return recipe.nameFil;
    if (recipe.nameEn?.trim() && isMostlyLatin(recipe.nameEn)) return recipe.nameEn;
    if (recipe.subCategory && subCategoryFil[recipe.subCategory]) {
      return `${subCategoryFil[recipe.subCategory]} — ${categoryFil[recipe.category]}`;
    }
    return categoryFil[recipe.category];
  }

  if (recipe.nameEn?.trim() && isMostlyLatin(recipe.nameEn)) return recipe.nameEn;
  if (recipe.subCategory) return `${recipe.subCategory} ${categoryEn[recipe.category].toLowerCase()}`;
  return categoryEn[recipe.category];
}

export function getRecipeSubtitle(recipe: DinnerRecipe, lang: Lang): string | null {
  const display = getRecipeDisplayName(recipe, lang);

  if (lang === "zh") {
    if (recipe.nameEn?.trim() && isMostlyLatin(recipe.nameEn) && recipe.nameEn !== display) {
      return recipe.nameEn;
    }
    if (recipe.nameFil?.trim() && !hasCjk(recipe.nameFil)) return recipe.nameFil;
    return null;
  }

  if (!recipe.name?.trim() || !hasCjk(recipe.name)) return null;
  if (recipe.name.trim() === display.trim()) return null;
  return recipe.name;
}
