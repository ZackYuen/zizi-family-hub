import { NextResponse } from "next/server";
import { handleWhatsAppMenu } from "@/lib/wa-menu";
import { looksLikeMenuCommand } from "@/lib/wa-menu-parse";

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
    const body = (await request.json()) as { question?: string };
    const question = body.question?.trim();
    if (!question) {
      return NextResponse.json({ error: "question required" }, { status: 400 });
    }
    if (!looksLikeMenuCommand(question)) {
      return NextResponse.json({ error: "not a menu command" }, { status: 400 });
    }
    const result = await handleWhatsAppMenu(question);
    return NextResponse.json({
      ok: true,
      handled: result.handled,
      answer: result.answer,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "menu failed";
    console.error("meals/menu error", err);
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
