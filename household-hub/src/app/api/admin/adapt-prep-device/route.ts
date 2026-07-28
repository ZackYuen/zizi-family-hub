import { NextResponse } from "next/server";
import { isAuthenticated } from "@/lib/auth";
import { adaptPrepNotesCookStep } from "@/lib/cook-device-suggest";
import type { BilingualText } from "@/lib/types";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

/**
 * Admin: rewrite prep notes so only the cook/simmer/fry step uses EPC17 / Easy Fry.
 * Keeps wash / cut / blanch / season.
 */
export async function POST(request: Request) {
  const authed = await isAuthenticated();
  if (!authed) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = (await request.json()) as {
      cookDevice?: string;
      prepNotes?: BilingualText;
      dishName?: string;
      category?: string;
    };
    if (!body.cookDevice) {
      return NextResponse.json({ error: "cookDevice required" }, { status: 400 });
    }
    const prepNotes = body.prepNotes || { en: "", fil: "", zh: "" };
    if (!prepNotes.en?.trim() && !prepNotes.fil?.trim() && !prepNotes.zh?.trim()) {
      return NextResponse.json(
        { error: "Add dish prep notes first (wash/cut/cook), then adapt the cook step." },
        { status: 400 }
      );
    }

    const adapted = await adaptPrepNotesCookStep({
      prepNotes,
      cookDevice: body.cookDevice,
      dishName: body.dishName,
      category: body.category,
    });
    if (!adapted) {
      return NextResponse.json(
        {
          error:
            "Could not adapt prep notes (check OPENROUTER_API_KEY). Keep original steps and edit the cook step manually.",
        },
        { status: 502 }
      );
    }
    return NextResponse.json({ prepNotes: adapted });
  } catch (err) {
    const message = err instanceof Error ? err.message : "failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
