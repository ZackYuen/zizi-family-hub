import { NextResponse } from "next/server";
import { getWhatsAppBotRuntime } from "@/lib/whatsapp-bot-pause";

export const dynamic = "force-dynamic";

/** Public — Baileys bot polls this before replying. */
export async function GET() {
  const runtime = await getWhatsAppBotRuntime();
  return NextResponse.json({
    paused: runtime.paused,
    replyGroupJids: runtime.replyGroupJids,
    reminderGroupJids: runtime.reminderGroupJids,
    ok: true,
  });
}
