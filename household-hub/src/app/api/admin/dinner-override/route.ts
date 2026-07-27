import { NextResponse } from "next/server";
import { isAuthenticated } from "@/lib/auth";
import {
  clearDinnerMenuOverride,
  getDinnerMenuOverrides,
  getDinnerRecipes,
  upsertDinnerMenuOverride,
} from "@/lib/data";
import { hongKongDateKey, resolveTonightMenu } from "@/lib/dinner";
import type { DinnerMenuOverride } from "@/lib/types";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const authed = await isAuthenticated();
  if (!authed) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const date = searchParams.get("date") ?? hongKongDateKey();
  const [overrides, recipes] = await Promise.all([
    getDinnerMenuOverrides(),
    getDinnerRecipes(),
  ]);
  const override = overrides.byDate[date] ?? null;
  const tonight = resolveTonightMenu(recipes, date, override);

  return NextResponse.json({
    date,
    override,
    tonight,
    overrides: overrides.byDate,
  });
}

export async function PUT(request: Request) {
  const authed = await isAuthenticated();
  if (!authed) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = (await request.json()) as {
      date?: string;
      meatId?: string;
      vegetableId?: string;
      soupId?: string;
      clear?: boolean;
    };

    const date = body.date || hongKongDateKey();

    if (body.clear) {
      const overrides = await clearDinnerMenuOverride(date);
      const recipes = await getDinnerRecipes();
      const tonight = resolveTonightMenu(recipes, date, null);
      return NextResponse.json({
        ok: true,
        cleared: true,
        date,
        tonight,
        overrides: overrides.byDate,
      });
    }

    if (!body.meatId || !body.vegetableId || !body.soupId) {
      return NextResponse.json(
        { error: "meatId, vegetableId, and soupId are required" },
        { status: 400 }
      );
    }

    const recipes = await getDinnerRecipes();
    const meat = recipes.find((r) => r.id === body.meatId && r.category === "Meat");
    const vegetable = recipes.find(
      (r) => r.id === body.vegetableId && r.category === "Vegetable"
    );
    const soup = recipes.find((r) => r.id === body.soupId && r.category === "Soup");
    if (!meat || !vegetable || !soup) {
      return NextResponse.json(
        { error: "Each pick must match the right category (Meat / Vegetable / Soup)" },
        { status: 400 }
      );
    }

    const override: DinnerMenuOverride = {
      date,
      meatId: meat.id,
      vegetableId: vegetable.id,
      soupId: soup.id,
    };
    const overrides = await upsertDinnerMenuOverride(override);
    const tonight = resolveTonightMenu(recipes, date, override);

    return NextResponse.json({
      ok: true,
      date,
      override,
      tonight,
      overrides: overrides.byDate,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Save failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
