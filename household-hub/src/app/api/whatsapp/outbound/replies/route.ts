import { NextResponse } from "next/server";
import { inboxAuthorized } from "@/lib/inbox-auth";
import { isSupabaseConfigured } from "@/lib/supabase";
import {
  applyRecordReply,
  listOutboundReplies,
  publicOutboundReply,
} from "@/lib/whatsapp-outbound";
import {
  loadOutboundStore,
  saveOutboundStore,
} from "@/lib/whatsapp-outbound-store";

export const dynamic = "force-dynamic";

function noStoreHeaders() {
  return { "Cache-Control": "no-store" };
}

/**
 * Capture / fetch 1:1 replies to user-approved outbound WhatsApp messages.
 * Family-group ? / @CharleneBot asks are not stored here.
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
    const result = applyRecordReply(store, body);
    if (result.stored) {
      if (!result.duplicate) {
        await saveOutboundStore(result.store);
      }
      return NextResponse.json(
        {
          ok: true,
          stored: true,
          duplicate: result.duplicate,
          reply: publicOutboundReply(result.reply),
        },
        { headers: noStoreHeaders() }
      );
    }
    if (result.reason === "invalid_jid" || result.reason === "empty_text") {
      return NextResponse.json(
        { ok: false, stored: false, reason: result.reason, error: result.error },
        { status: 400, headers: noStoreHeaders() }
      );
    }
    return NextResponse.json(
      { ok: true, stored: false, reason: result.reason },
      { headers: noStoreHeaders() }
    );
  } catch (err) {
    const message = err instanceof Error ? err.message : "reply capture failed";
    console.error("whatsapp outbound reply error", err);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function GET(request: Request) {
  if (!inboxAuthorized(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  if (!isSupabaseConfigured()) {
    return NextResponse.json(
      { error: "Live database is not configured" },
      { status: 503, headers: noStoreHeaders() }
    );
  }

  try {
    const url = new URL(request.url);
    const store = await loadOutboundStore();
    const replies = listOutboundReplies(store, {
      conversationId: url.searchParams.get("conversationId"),
      jid: url.searchParams.get("jid") || url.searchParams.get("to"),
      since: url.searchParams.get("since"),
      limit: Number(url.searchParams.get("limit") || 50) || 50,
    });
    return NextResponse.json(
      { ok: true, replies: replies.map(publicOutboundReply) },
      { headers: noStoreHeaders() }
    );
  } catch (err) {
    const message = err instanceof Error ? err.message : "reply list failed";
    console.error("whatsapp outbound replies list error", err);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
