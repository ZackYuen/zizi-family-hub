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
 */
export async function GET() {
  const { content, source } = await getContentWithSource();
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
      },
    }
  );
}
