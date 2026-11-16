import { NextResponse } from "next/server";
import { inboxAuthorized } from "@/lib/inbox-auth";
import { isSupabaseConfigured } from "@/lib/supabase";
import { getWhatsAppBotRuntime } from "@/lib/whatsapp-bot-pause";
import {
  applyAckFamilyLogNudge,
  applyClaimDueFamilyLogNudges,
  familyLogAllowlistFromRuntime,
  publicFamilyLogNudge,
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
 * Claim (GET) or ack (POST) proactive family-group follow-up nudges.
 * Destinations are always allowlisted group JIDs — never DMs or other chats.
 */
export async function GET(request: Request) {
  if (!inboxAuthorized(request)) return unauthorized();
  if (!isSupabaseConfigured()) return unavailable();

  try {
    const url = new URL(request.url);
    const claim = url.searchParams.get("claim") === "1";
    const limitRaw = Number(url.searchParams.get("limit") || 1);
    const limit = Number.isFinite(limitRaw) ? limitRaw : 1;
    const groups = await allowlist();
    const store = await loadFamilyLogStore();

    if (!claim) {
      const preview = applyClaimDueFamilyLogNudges(store, groups, { limit });
      return NextResponse.json(
        {
          ok: true,
          claimed: false,
          nudges: preview.claimed.map(publicFamilyLogNudge),
        },
        { headers: noStoreHeaders() }
      );
    }

    const claimed = applyClaimDueFamilyLogNudges(store, groups, { limit });
    if (claimed.claimed.length) {
      await saveFamilyLogStore(claimed.store);
    }
    return NextResponse.json(
      {
        ok: true,
        claimed: true,
        nudges: claimed.claimed.map(publicFamilyLogNudge),
      },
      { headers: noStoreHeaders() }
    );
  } catch (err) {
    const message = err instanceof Error ? err.message : "family log nudge list failed";
    console.error("whatsapp family-log nudge list error", err);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  if (!inboxAuthorized(request)) return unauthorized();
  if (!isSupabaseConfigured()) return unavailable();

  try {
    const body = (await request.json()) as Record<string, unknown>;
    const store = await loadFamilyLogStore();
    const result = applyAckFamilyLogNudge(store, body);
    if ("error" in result) {
      const status = result.error === "nudge not found" ? 404 : 400;
      return NextResponse.json(
        { error: result.error },
        { status, headers: noStoreHeaders() }
      );
    }
    if (!result.duplicate) {
      await saveFamilyLogStore(result.store);
    }
    return NextResponse.json(
      {
        ok: true,
        duplicate: result.duplicate,
        nudge: publicFamilyLogNudge(result.nudge),
      },
      { headers: noStoreHeaders() }
    );
  } catch (err) {
    const message = err instanceof Error ? err.message : "family log nudge ack failed";
    console.error("whatsapp family-log nudge ack error", err);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
