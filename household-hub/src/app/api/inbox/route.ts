import { NextResponse } from "next/server";
import { appendWhatsAppInboxItem } from "@/lib/data";
import { digestWhatsAppSave } from "@/lib/save-digest";
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
      kind?: WhatsAppInboxKind | "save";
      text?: string;
      answer?: string;
      jid?: string;
      fromName?: string;
      link?: string;
      category?: DinnerRecipe["category"];
      /** When true (or kind=save), LLM digests free-form content */
      digest?: boolean;
    };

    const text = body.text?.trim();
    if (!text) {
      return NextResponse.json({ error: "text required" }, { status: 400 });
    }

    const shouldDigest =
      body.digest === true || body.kind === "save" || body.kind === undefined;

    if (shouldDigest && body.kind !== "ask") {
      const digested = await digestWhatsAppSave(text);
      const item = await appendWhatsAppInboxItem({
        kind: digested.kind,
        text: digested.text,
        answer: [
          digested.summary,
          digested.original !== digested.text
            ? `Original: ${digested.original}`
            : null,
        ]
          .filter(Boolean)
          .join("\n"),
        jid: body.jid,
        fromName: body.fromName,
        link: digested.link || body.link,
        category: digested.category || body.category,
      });
      return NextResponse.json({
        ok: true,
        item,
        digest: {
          kind: digested.kind,
          summary: digested.summary,
          link: digested.link,
          category: digested.category,
        },
      });
    }

    const kind = (body.kind === "save" ? "note" : body.kind) || "ask";
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
