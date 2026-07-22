import { NextResponse } from "next/server";
import { appendWhatsAppInboxItem } from "@/lib/data";
import type { DinnerRecipe, WhatsAppInboxKind } from "@/lib/types";

export const dynamic = "force-dynamic";

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
    const body = (await request.json()) as {
      kind?: WhatsAppInboxKind;
      text?: string;
      answer?: string;
      jid?: string;
      fromName?: string;
      link?: string;
      category?: DinnerRecipe["category"];
    };

    const text = body.text?.trim();
    if (!text) {
      return NextResponse.json({ error: "text required" }, { status: 400 });
    }

    const kind = body.kind || "ask";
    const item = await appendWhatsAppInboxItem({
      kind,
      text,
      answer: body.answer,
      jid: body.jid,
      fromName: body.fromName,
      link: body.link,
      category: body.category,
    });

    return NextResponse.json({ ok: true, item });
  } catch (err) {
    const message = err instanceof Error ? err.message : "inbox failed";
    console.error("inbox error", err);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
