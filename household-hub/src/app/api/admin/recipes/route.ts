import { NextResponse } from "next/server";
import { isAuthenticated } from "@/lib/auth";
import { getDinnerRecipes, saveDinnerRecipes } from "@/lib/data";
import type { DinnerRecipe } from "@/lib/types";

export const dynamic = "force-dynamic";

export async function GET() {
  const authed = await isAuthenticated();
  if (!authed) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const recipes = await getDinnerRecipes();
  return NextResponse.json({ recipes });
}

export async function PUT(request: Request) {
  const authed = await isAuthenticated();
  if (!authed) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = (await request.json()) as { recipes: DinnerRecipe[] };
    await saveDinnerRecipes(body.recipes);
    return NextResponse.json({ ok: true, count: body.recipes.length });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Save failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
