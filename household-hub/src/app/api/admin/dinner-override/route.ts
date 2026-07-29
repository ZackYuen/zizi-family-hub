import { NextResponse } from "next/server";
import { isAuthenticated } from "@/lib/auth";
import {
  clearDinnerMenuOverride,
  getDinnerMenuOverrides,
  getDinnerRecipes,
  upsertDinnerMenuOverride,
} from "@/lib/data";
import {
  hongKongDateKey,
  normalizeDinnerOverride,
  resolveTonightMenu,
} from "@/lib/dinner";
import type { DinnerMenuOverride, DinnerRecipe } from "@/lib/types";

export const dynamic = "force-dynamic";

function asIds(
  ids: string[] | undefined,
  legacy: string | undefined
): string[] {
  if (Array.isArray(ids)) {
    return ids.map((id) => String(id || "").trim()).filter(Boolean);
  }
  const one = String(legacy || "").trim();
  return one ? [one] : [];
}

function resolveIds(
  recipes: DinnerRecipe[],
  ids: string[],
  category: DinnerRecipe["category"]
): { ok: DinnerRecipe[]; missing: string[] } {
  const ok: DinnerRecipe[] = [];
  const missing: string[] = [];
  const seen = new Set<string>();
  for (const id of ids) {
    if (seen.has(id)) continue;
    seen.add(id);
    const recipe = recipes.find((r) => r.id === id && r.category === category);
    if (recipe) ok.push(recipe);
    else missing.push(id);
  }
  return { ok, missing };
}

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
      meatIds?: string[];
      vegetableIds?: string[];
      soupIds?: string[];
      /** @deprecated singular */
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

    const meatIds = asIds(body.meatIds, body.meatId);
    const vegetableIds = asIds(body.vegetableIds, body.vegetableId);
    const soupIds = asIds(body.soupIds, body.soupId);

    if (meatIds.length + vegetableIds.length + soupIds.length === 0) {
      return NextResponse.json(
        { error: "Add at least one dish (meat, vegetable, or soup)" },
        { status: 400 }
      );
    }

    const recipes = await getDinnerRecipes();
    const meat = resolveIds(recipes, meatIds, "Meat");
    const vegetable = resolveIds(recipes, vegetableIds, "Vegetable");
    const soup = resolveIds(recipes, soupIds, "Soup");

    if (meat.missing.length || vegetable.missing.length || soup.missing.length) {
      return NextResponse.json(
        {
          error:
            "Each pick must match the right category (Meat / Vegetable / Soup)",
          missing: {
            meat: meat.missing,
            vegetable: vegetable.missing,
            soup: soup.missing,
          },
        },
        { status: 400 }
      );
    }

    const override: DinnerMenuOverride = normalizeDinnerOverride({
      date,
      meatIds: meat.ok.map((r) => r.id),
      vegetableIds: vegetable.ok.map((r) => r.id),
      soupIds: soup.ok.map((r) => r.id),
    })!;

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
