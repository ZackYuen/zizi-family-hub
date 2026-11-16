import { NextResponse } from "next/server";
import { inboxAuthorized } from "@/lib/inbox-auth";
import { isSupabaseConfigured } from "@/lib/supabase";
import {
  applyClaimPending,
  applyEnqueue,
  listOutboundMessages,
  publicOutboundMessage,
} from "@/lib/whatsapp-outbound";
import {
  loadOutboundStore,
  saveOutboundStore,
} from "@/lib/whatsapp-outbound-store";

export const dynamic = "force-dynamic";

function unauthorized() {
  return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
}

function noStoreHeaders() {
  return { "Cache-Control": "no-store" };
}

function unavailable() {
  return NextResponse.json(
    { error: "Live database is not configured" },
    { status: 503, headers: noStoreHeaders() }
  );
}

/**
 * Authenticated user-approved WhatsApp outbound queue.
 * POST enqueues one message; GET lists / claims pending items for the Baileys bot.
 */
export async function POST(request: Request) {
  if (!inboxAuthorized(request)) return unauthorized();
  if (!isSupabaseConfigured()) return unavailable();

  try {
    const body = (await request.json()) as Record<string, unknown>;
    const store = await loadOutboundStore();
    const result = applyEnqueue(store, body);
    if (!result.ok) {
      return NextResponse.json({ error: result.error }, { status: 400 });
    }
    if (!result.duplicate) {
      await saveOutboundStore(result.store);
    }
    return NextResponse.json(
      {
        ok: true,
        duplicate: result.duplicate,
        message: publicOutboundMessage(result.message),
      },
      { status: result.duplicate ? 200 : 201, headers: noStoreHeaders() }
    );
  } catch (err) {
    const message = err instanceof Error ? err.message : "enqueue failed";
    console.error("whatsapp outbound enqueue error", err);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function GET(request: Request) {
  if (!inboxAuthorized(request)) return unauthorized();
  if (!isSupabaseConfigured()) return unavailable();

  try {
    const url = new URL(request.url);
    const claim = url.searchParams.get("claim") === "1";
    const status = url.searchParams.get("status");
    const id = url.searchParams.get("id");
    const conversationId = url.searchParams.get("conversationId");
    const jid = url.searchParams.get("jid") || url.searchParams.get("to");
    const limitRaw = Number(url.searchParams.get("limit") || (claim ? 5 : 10));
    const limit = Number.isFinite(limitRaw) ? limitRaw : claim ? 5 : 10;
    const store = await loadOutboundStore();

    if (claim) {
      const claimed = applyClaimPending(store, { limit });
      if (claimed.claimed.length) {
        await saveOutboundStore(claimed.store);
      }
      return NextResponse.json(
        {
          ok: true,
          claimed: true,
          messages: claimed.claimed.map(publicOutboundMessage),
        },
        { headers: noStoreHeaders() }
      );
    }

    const messages = listOutboundMessages(store, {
      status: status || (id || conversationId || jid ? "all" : "pending"),
      id,
      conversationId,
      jid,
      limit,
    });
    return NextResponse.json(
      {
        ok: true,
        claimed: false,
        messages: messages.map(publicOutboundMessage),
      },
      { headers: noStoreHeaders() }
    );
  } catch (err) {
    const message = err instanceof Error ? err.message : "outbound list failed";
    console.error("whatsapp outbound list error", err);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
