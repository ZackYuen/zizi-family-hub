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

function isMostlyLatin(text: string): boolean {
  if (!text) return false;
  const latin = (text.match(/[a-zA-Z0-9\s\-',.&()]/g) ?? []).length;
  return latin / text.length > 0.6;
}

export function getRecipeDisplayName(recipe: DinnerRecipe, lang: Lang): string {
  if (lang === "fil") {
    if (recipe.nameFil?.trim()) return recipe.nameFil;
    if (recipe.nameEn?.trim() && isMostlyLatin(recipe.nameEn)) return recipe.nameEn;
    if (recipe.subCategory && subCategoryFil[recipe.subCategory]) {
      return `${subCategoryFil[recipe.subCategory]} (${recipe.subCategory})`;
    }
    return recipe.nameEn?.trim() || recipe.subCategory || recipe.category;
  }

  if (recipe.nameEn?.trim() && isMostlyLatin(recipe.nameEn)) return recipe.nameEn;
  if (recipe.nameEn?.trim()) return recipe.nameEn;
  if (recipe.subCategory) return `${recipe.subCategory} dish`;
  return recipe.category;
}

export function getRecipeSubtitle(recipe: DinnerRecipe, lang: Lang): string | null {
  const display = getRecipeDisplayName(recipe, lang);
  if (recipe.name && recipe.name !== display && /[\u4e00-\u9fff]/.test(recipe.name)) {
    return recipe.name;
  }
  return null;
}
