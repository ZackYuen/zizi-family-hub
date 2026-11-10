import { NextResponse } from "next/server";
import { getContentWithSource } from "@/lib/data";
import { getHongKongTimeParts } from "@/lib/i18n";
import { isHelperDayOff } from "@/lib/hk-holidays";
import {
  formatOctopusCashReminderMessage,
  getOctopusCashReminderState,
} from "@/lib/octopus-reminders";
import { parseWhatsAppGroupJids } from "@/lib/outing-reminders";
import { dayKeyFromHongKongDate } from "@/lib/school-calendar";
import { hongKongDateKey } from "@/lib/dinner";

export const dynamic = "force-dynamic";

/**
 * Monday / Thursday 09:00 HKT Octopus + cash check.
 * Used by the always-on Baileys bot (same reminder group as leftover / outing pings).
 */
export async function GET() {
  const now = new Date();
  const { content, source } = await getContentWithSource();
  const dateKey = hongKongDateKey(now);
  const state = getOctopusCashReminderState({
    dateKey,
    dayKey: dayKeyFromHongKongDate(now),
    nowMinutes: getHongKongTimeParts(now).minutesSinceMidnight,
    dayOff: isHelperDayOff(now),
    enabled: content.octopusRemindersEnabled,
  });
  const due = state.due
    ? [{ ...state, text: formatOctopusCashReminderMessage() }]
    : [];

  return NextResponse.json(
    {
      source,
      date: dateKey,
      enabled: state.enabled,
      dayOff: state.dayOff,
      checkDay: state.checkDay,
      nowMinutes: getHongKongTimeParts(now).minutesSinceMidnight,
      groupJids: parseWhatsAppGroupJids(content.whatsappReminderGroupJids),
      due,
    },
    {
      headers: {
        "Cache-Control": "no-store",
        "X-Data-Source": source,
      },
    }
  );
}
