import { NextResponse } from "next/server";
import { inboxAuthorized } from "@/lib/inbox-auth";
import { isSupabaseConfigured } from "@/lib/supabase";
import { getWhatsAppBotRuntime } from "@/lib/whatsapp-bot-pause";
import {
  applyFamilyLogIngest,
  buildFamilyLogDigest,
  familyLogAllowlistFromRuntime,
  listFamilyLogMessages,
  publicFamilyLogMessage,
  publicFamilyLogOpenItem,
} from "@/lib/whatsapp-family-log";
import {
  loadFamilyLogStore,
  saveFamilyLogStore,
} from "@/lib/whatsapp-family-log-store";

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

async function allowlist() {
  const runtime = await getWhatsAppBotRuntime();
  return familyLogAllowlistFromRuntime(runtime);
}

/**
 * Family-group message log for Grok bots + the always-on Baileys bot.
 * POST stores one allowlisted-group message. GET lists recent messages and
 * a compact digest of unfinished follow-ups. Secret-gated. Never broadcasts.
 */
export async function POST(request: Request) {
  if (!inboxAuthorized(request)) return unauthorized();
  if (!isSupabaseConfigured()) return unavailable();

  try {
    const body = (await request.json()) as Record<string, unknown>;
    const groups = await allowlist();
    const store = await loadFamilyLogStore();
    const result = applyFamilyLogIngest(store, body, groups);
    if (!result.ok) {
      return NextResponse.json(
        {
          error: result.error,
          autoReply: false,
          enqueued: false,
        },
        { status: 400, headers: noStoreHeaders() }
      );
    }
    if (result.stored && !result.duplicate) {
      await saveFamilyLogStore(result.store);
    }
    if (!result.stored) {
      return NextResponse.json(
        {
          ok: true,
          stored: false,
          reason: result.reason,
          autoReply: false,
          enqueued: false,
        },
        { headers: noStoreHeaders() }
      );
    }
    return NextResponse.json(
      {
        ok: true,
        stored: true,
        duplicate: result.duplicate,
        autoReply: false,
        enqueued: false,
        message: publicFamilyLogMessage(result.message),
      },
      { headers: noStoreHeaders() }
    );
  } catch (err) {
    const message = err instanceof Error ? err.message : "family log ingest failed";
    console.error("whatsapp family-log ingest error", err);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function GET(request: Request) {
  if (!inboxAuthorized(request)) return unauthorized();
  if (!isSupabaseConfigured()) return unavailable();

  try {
    const url = new URL(request.url);
    const digestOff = url.searchParams.get("digest") === "0";
    const jid = url.searchParams.get("jid");
    const since = url.searchParams.get("since");
    const limitRaw = Number(url.searchParams.get("limit") || 50);
    const limit = Number.isFinite(limitRaw) ? limitRaw : 50;
    const lookbackRaw = Number(url.searchParams.get("lookbackHours") || 72);
    const lookbackHours = Number.isFinite(lookbackRaw) ? lookbackRaw : 72;
    const groups = await allowlist();
    const store = await loadFamilyLogStore();
    const messages = listFamilyLogMessages(store, {
      allowlist: groups,
      jid,
      since,
      limit,
    });
    const payload: Record<string, unknown> = {
      ok: true,
      messages: messages.map(publicFamilyLogMessage),
    };
    if (!digestOff) {
      const digest = buildFamilyLogDigest(store, {
        allowlist: groups,
        lookbackMs: lookbackHours * 60 * 60 * 1000,
      });
      payload.digest = {
        open: digest.open.map(publicFamilyLogOpenItem),
        lookbackHours: digest.lookbackHours,
        scanned: digest.scanned,
        note: digest.note,
      };
    }
    return NextResponse.json(payload, { headers: noStoreHeaders() });
  } catch (err) {
    const message = err instanceof Error ? err.message : "family log list failed";
    console.error("whatsapp family-log list error", err);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
