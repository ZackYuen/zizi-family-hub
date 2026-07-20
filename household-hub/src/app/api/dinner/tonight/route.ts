import { NextResponse } from "next/server";
import { getTonightMenu, getDinnerRecipes } from "@/lib/dinner";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const date = searchParams.get("date") ?? undefined;

  const [tonight, recipes] = await Promise.all([
    getTonightMenu(date),
    getDinnerRecipes(),
  ]);

  return NextResponse.json({ tonight, recipeCount: recipes.length });
}
