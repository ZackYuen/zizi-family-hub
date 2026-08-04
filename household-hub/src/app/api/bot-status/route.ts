import { NextResponse } from "next/server";
import { isWhatsAppBotPaused } from "@/lib/whatsapp-bot-pause";

export const dynamic = "force-dynamic";

/** Public — Baileys bot polls this before replying. */
export async function GET() {
  const paused = await isWhatsAppBotPaused();
  return NextResponse.json({
    paused,
    ok: true,
  });
}
