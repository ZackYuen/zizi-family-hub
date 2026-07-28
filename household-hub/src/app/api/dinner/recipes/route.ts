import { NextResponse } from "next/server";
import { getDinnerRecipes } from "@/lib/data";
import type { DinnerRecipe } from "@/lib/types";

export const dynamic = "force-dynamic";

/**
 * Public read-only recipe catalog for Meals search
 * (Mum asks Charlene to cook a specific dish instead of tonight’s random pick).
 */
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const q = (searchParams.get("q") ?? "").trim().toLowerCase();
  const category = searchParams.get("category") as
    | DinnerRecipe["category"]
    | "All"
    | null;

  const recipes = await getDinnerRecipes();
  const filtered = recipes
    .filter((r) => {
      if (category && category !== "All" && r.category !== category) return false;
      if (!q) return true;
      return [r.name, r.nameEn, r.nameFil, r.subCategory, r.category]
        .filter(Boolean)
        .some((s) => s!.toLowerCase().includes(q));
    })
    .sort((a, b) => a.index - b.index);

  return NextResponse.json({
    recipes: filtered,
    total: recipes.length,
    matched: filtered.length,
  });
}
