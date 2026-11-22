import { NextResponse } from "next/server";
import { inboxAuthorized } from "@/lib/inbox-auth";
import { isSupabaseConfigured } from "@/lib/supabase";
import { isHelperDayOff } from "@/lib/hk-holidays";
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
    const runtime = await getWhatsAppBotRuntime();
    const enabled = runtime.familyLogNudgesEnabled;
    const dayOff = isHelperDayOff();
    // Opt-in + day-off gate before any claim/save. Missing/false enabled = no send.
    if (!enabled || dayOff) {
      return NextResponse.json(
        { ok: true, claimed: claim, enabled, dayOff, nudges: [] },
        { headers: noStoreHeaders() }
      );
    }
    const groups = familyLogAllowlistFromRuntime(runtime);
    const store = await loadFamilyLogStore();
    const claimOpts = { limit, enabled, dayOff };

    if (!claim) {
      const preview = applyClaimDueFamilyLogNudges(store, groups, claimOpts);
      return NextResponse.json(
        {
          ok: true,
          claimed: false,
          enabled,
          dayOff,
          nudges: preview.claimed.map(publicFamilyLogNudge),
        },
        { headers: noStoreHeaders() }
      );
    }

    const claimed = applyClaimDueFamilyLogNudges(store, groups, claimOpts);
    if (claimed.claimed.length) {
      await saveFamilyLogStore(claimed.store);
    }
    return NextResponse.json(
      {
        ok: true,
        claimed: true,
        enabled,
        dayOff,
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
