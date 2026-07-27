import { NextResponse } from "next/server";
import {
  getDinnerMenuOverrides,
  getDinnerRecipes,
} from "@/lib/data";
import { hongKongDateKey, resolveTonightMenu } from "@/lib/dinner";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const date = searchParams.get("date") ?? hongKongDateKey();

  const [recipes, overrides] = await Promise.all([
    getDinnerRecipes(),
    getDinnerMenuOverrides(),
  ]);
  const override = overrides.byDate[date] ?? null;
  const tonight = resolveTonightMenu(recipes, date, override);

  return NextResponse.json({
    tonight,
    recipeCount: recipes.length,
    hasOverride: Boolean(override),
  });
}
