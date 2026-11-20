import { NextResponse } from "next/server";
import { getContentWithSource } from "@/lib/data";
import { buildOctopusCashReminderFeed } from "@/lib/octopus-reminders";

export const dynamic = "force-dynamic";

/**
 * Monday / Thursday 09:00 HKT Octopus + cash check.
 * Used by the always-on Baileys bot (same reminder group as leftover / outing pings).
 *
 * Does not read dinner_recipes — `due` only needs octopusRemindersEnabled,
 * the reminder group JIDs, and the clock. Cached getContent() avoids a full
 * Supabase document download on every 60s poll when Admin data is unchanged.
 */
export async function GET() {
  const { content, source, cache } = await getContentWithSource();
  const feed = buildOctopusCashReminderFeed(content);

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
