import { NextResponse } from "next/server";
import { getContentWithSource } from "@/lib/data";
import {
  formatOutingReminderMessage,
  getOutingRemindersForDate,
  OUTING_REMIND_MINUTES,
  parseWhatsAppGroupJids,
} from "@/lib/outing-reminders";

export const dynamic = "force-dynamic";

/**
 * Today's Zizi outing leave-home tasks and which are due for a 1-hour WhatsApp ping.
 * Used by the always-on Baileys bot (same live schedule as Schedule / Ask).
 *
 * Response stays tiny; the schedule document is served from a short-lived
 * server cache so unchanged Admin content is not re-fetched from Supabase
 * on every 60s poll. `due` is still computed from the current HK clock.
 */
export async function GET() {
  const { content, source, cache } = await getContentWithSource();
  const snapshot = getOutingRemindersForDate(content);
  const due = snapshot.items.filter((item) => item.due);

  return NextResponse.json(
    {
      source,
      remindMinutesBefore: OUTING_REMIND_MINUTES,
      date: snapshot.dateKey,
      dayOff: snapshot.dayOff,
      nowMinutes: snapshot.nowMinutes,
      groupJids: parseWhatsAppGroupJids(content.whatsappReminderGroupJids),
      due: due.map((item) => ({
        ...item,
        text: formatOutingReminderMessage(item),
      })),
      upcoming: snapshot.items.filter((item) => !item.due),
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
