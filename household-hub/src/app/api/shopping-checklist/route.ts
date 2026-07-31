import { NextResponse } from "next/server";
import {
  getShoppingChecklist,
  setShoppingChecklistForDate,
} from "@/lib/data";

export const dynamic = "force-dynamic";

/** Shared shopping / prep checklist — family app (all devices). */
export async function GET(request: Request) {
  try {
    const url = new URL(request.url);
    const date = url.searchParams.get("date")?.trim() || "";
    const state = await getShoppingChecklist();
    if (date) {
      return NextResponse.json({
        date,
        checked: state.byDate[date] || {},
        updatedAt: state.updatedAt,
      });
    }
    return NextResponse.json(state);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Load failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  try {
    const body = (await request.json()) as {
      date?: string;
      checked?: Record<string, boolean>;
    };
    const date = body.date?.trim() || "";
    if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
      return NextResponse.json(
        { error: "date required (YYYY-MM-DD)" },
        { status: 400 }
      );
    }
    if (!body.checked || typeof body.checked !== "object") {
      return NextResponse.json({ error: "checked map required" }, { status: 400 });
    }

    const state = await setShoppingChecklistForDate(date, body.checked);
    return NextResponse.json({
      ok: true,
      date,
      checked: state.byDate[date] || {},
      updatedAt: state.updatedAt,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Save failed";
    console.error("shopping checklist save", err);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
