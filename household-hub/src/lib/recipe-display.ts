import type { DinnerRecipe, Lang } from "./types";

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

function hasCjk(text: string): boolean {
  return /[\u4e00-\u9fff\u3400-\u4dbf]/.test(text);
}

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

export function getRecipeDisplayName(recipe: DinnerRecipe, lang: Lang): string {
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
  // Hide Chinese subtitle when we have a proper translation
  if (recipe.nameFil?.trim() && !hasCjk(recipe.nameFil) && lang === "fil") return null;
  if (recipe.nameEn?.trim() && isMostlyLatin(recipe.nameEn) && lang === "en") return null;
  if (recipe.name && recipe.name !== display && hasCjk(recipe.name)) {
    return recipe.name;
  }
  return null;
}
