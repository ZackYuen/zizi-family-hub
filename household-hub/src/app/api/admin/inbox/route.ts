import { NextResponse } from "next/server";
import { isAuthenticated } from "@/lib/auth";
import {
  getContent,
  getDinnerRecipes,
  getWhatsAppInbox,
  saveContent,
  saveDinnerRecipes,
  saveWhatsAppInbox,
} from "@/lib/data";
import { emptyBilingual } from "@/lib/localized-text";
import type { DinnerRecipe, WhatsAppInboxItem } from "@/lib/types";

export const dynamic = "force-dynamic";

export async function GET() {
  const authed = await isAuthenticated();
  if (!authed) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const inbox = await getWhatsAppInbox();
  return NextResponse.json(inbox);
}

export async function PUT(request: Request) {
  const authed = await isAuthenticated();
  if (!authed) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = (await request.json()) as {
      action?: "dismiss" | "promote_tip" | "promote_recipe" | "save";
      id?: string;
      items?: WhatsAppInboxItem[];
      category?: DinnerRecipe["category"];
    };

    const inbox = await getWhatsAppInbox();

    if (body.action === "save" && Array.isArray(body.items)) {
      const saved = await saveWhatsAppInbox({
        items: body.items,
        updatedAt: new Date().toISOString(),
      });
      return NextResponse.json({ ok: true, inbox: saved });
    }

    if (!body.id) {
      return NextResponse.json({ error: "id required" }, { status: 400 });
    }

    const idx = inbox.items.findIndex((i) => i.id === body.id);
    if (idx < 0) {
      return NextResponse.json({ error: "not found" }, { status: 404 });
    }

    const item = inbox.items[idx];

    if (body.action === "dismiss") {
      inbox.items[idx] = { ...item, status: "dismissed" };
      const saved = await saveWhatsAppInbox(inbox);
      return NextResponse.json({ ok: true, inbox: saved });
    }

    if (body.action === "promote_tip") {
      const content = await getContent();
      const guides = content.hkLifeGuides ?? [];
      const titleEn = item.text.slice(0, 80);
      guides.push({
        id: `life-wa-${Date.now()}`,
        category: "culture",
        priority: guides.length + 50,
        area: "kwun-tong",
        title: {
          en: titleEn,
          fil: titleEn,
          zh: titleEn,
        },
        body: {
          en: item.text,
          fil: item.text,
          zh: item.text,
        },
        lastReviewed: new Date().toISOString().slice(0, 10),
      });
      await saveContent({ ...content, hkLifeGuides: guides });
      inbox.items[idx] = { ...item, status: "promoted" };
      const saved = await saveWhatsAppInbox(inbox);
      return NextResponse.json({
        ok: true,
        inbox: saved,
        message: "Promoted to HK Life tip — edit translations in Admin → HK Life",
      });
    }

    if (body.action === "promote_recipe") {
      const recipes = await getDinnerRecipes();
      const link =
        item.link ||
        item.text.match(/https?:\/\/\S+/i)?.[0] ||
        "";
      if (!link) {
        return NextResponse.json(
          { error: "No YouTube/recipe link in this message" },
          { status: 400 }
        );
      }
      const category = body.category || item.category || "Meat";
      const nameGuess = item.text
        .replace(link, "")
        .replace(/save\s*recipe/i, "")
        .trim()
        .slice(0, 80);
      const recipe: DinnerRecipe = {
        id: `d-wa-${Date.now()}`,
        index: recipes.length ? Math.max(...recipes.map((r) => r.index)) + 1 : 1,
        name: nameGuess || "WhatsApp recipe",
        nameEn: nameGuess || "WhatsApp recipe",
        nameFil: nameGuess || "WhatsApp recipe",
        category,
        link,
        ingredients: [],
        prepNotes: emptyBilingual(),
      };
      await saveDinnerRecipes([...recipes, recipe]);
      inbox.items[idx] = { ...item, status: "promoted", link, category };
      const saved = await saveWhatsAppInbox(inbox);
      return NextResponse.json({
        ok: true,
        inbox: saved,
        message: "Added to dinner recipes — edit names/ingredients in Admin → Meals",
      });
    }

    return NextResponse.json({ error: "unknown action" }, { status: 400 });
  } catch (err) {
    const message = err instanceof Error ? err.message : "failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
