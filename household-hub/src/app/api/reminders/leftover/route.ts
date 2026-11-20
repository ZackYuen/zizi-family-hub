import { NextResponse } from "next/server";
import { getContentWithSource } from "@/lib/data";
import { buildLeftoverReminderFeed } from "@/lib/leftover-reminders";

export const dynamic = "force-dynamic";

/**
 * Daily leftover-ingredient ask (10:00–16:00 HKT on work days).
 * Used by the always-on Baileys bot (same reminder group as outing pings).
 *
 * Does not read dinner_recipes — `due` only needs leftoverRemindersEnabled,
 * the reminder group JIDs, and the clock. Cached getContent() avoids a full
 * Supabase document download on every 60s poll when Admin data is unchanged.
 */
export async function GET() {
  const { content, source, cache } = await getContentWithSource();
  const feed = buildLeftoverReminderFeed(content);

  return NextResponse.json(
    {
      source,
      ...feed,
    },
    {
      headers: {
        "Cache-Control": "no-store",
        "X-Data-Source": source,
        "X-App-Data-Cache": cache,
      },
    }
  );
}
