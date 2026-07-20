import { NextResponse } from "next/server";
import { getDinnerRecipes } from "@/lib/data";
import { generateTonightMenu } from "@/lib/dinner";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const date = searchParams.get("date") ?? undefined;

  const recipes = await getDinnerRecipes();
  const tonight = generateTonightMenu(recipes, date);

  return NextResponse.json({ tonight, recipeCount: recipes.length });
}
