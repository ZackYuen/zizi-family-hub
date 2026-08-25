import { NextResponse } from "next/server";
import {
  addYoutubeDinnerRecipe,
  formatAddMealReply,
} from "@/lib/add-youtube-recipe";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

function authorized(request: Request): boolean {
  const secret = process.env.INBOX_SECRET || process.env.BOT_INBOX_SECRET;
  if (!secret) return false;
  const header = request.headers.get("x-inbox-secret");
  return Boolean(header && header === secret);
}

export async function POST(request: Request) {
  if (!authorized(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = (await request.json()) as { url?: string };
    const url = body.url?.trim();
    if (!url) {
      return NextResponse.json({ error: "url required" }, { status: 400 });
    }
    const result = await addYoutubeDinnerRecipe(url);
    return NextResponse.json({
      ok: true,
      duplicate: result.duplicate,
      recipe: {
        id: result.recipe.id,
        name: result.recipe.name,
        nameEn: result.recipe.nameEn,
        category: result.recipe.category,
        cookDevice: result.recipe.cookDevice,
        link: result.recipe.link,
        ingredientCount: result.recipe.ingredients?.length || 0,
      },
      answer: formatAddMealReply(result),
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "add meal failed";
    console.error("meals/add error", err);
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
