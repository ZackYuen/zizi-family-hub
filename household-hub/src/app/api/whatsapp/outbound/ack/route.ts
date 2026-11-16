import { NextResponse } from "next/server";
import { inboxAuthorized } from "@/lib/inbox-auth";
import { isSupabaseConfigured } from "@/lib/supabase";
import {
  applyAck,
  publicOutboundMessage,
} from "@/lib/whatsapp-outbound";
import {
  loadOutboundStore,
  saveOutboundStore,
} from "@/lib/whatsapp-outbound-store";

export const dynamic = "force-dynamic";

/**
 * Mark a queued outbound WhatsApp message sent or failed (idempotent).
 */
export async function POST(request: Request) {
  if (!inboxAuthorized(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  if (!isSupabaseConfigured()) {
    return NextResponse.json(
      { error: "Live database is not configured" },
      { status: 503 }
    );
  }

  try {
    const body = (await request.json()) as Record<string, unknown>;
    const store = await loadOutboundStore();
    const result = applyAck(store, body);
    if ("error" in result) {
      const status = result.error === "message not found" ? 404 : 400;
      return NextResponse.json({ error: result.error }, { status });
    }
    if (!result.duplicate) {
      await saveOutboundStore(result.store);
    }
    return NextResponse.json({
      ok: true,
      duplicate: result.duplicate,
      message: publicOutboundMessage(result.message),
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "ack failed";
    console.error("whatsapp outbound ack error", err);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
