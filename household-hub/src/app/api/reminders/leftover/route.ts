import { NextResponse } from "next/server";
import {
  getContentWithSource,
  getDinnerMenuOverrides,
  getDinnerRecipes,
} from "@/lib/data";
import { hongKongDateKey, resolveTonightMenu, tonightDishes } from "@/lib/dinner";
import { getHongKongTimeParts } from "@/lib/i18n";
import { isHelperDayOff } from "@/lib/hk-holidays";
import {
  formatLeftoverReminderMessage,
  getLeftoverReminderState,
} from "@/lib/leftover-reminders";
import { parseWhatsAppGroupJids } from "@/lib/outing-reminders";

export const dynamic = "force-dynamic";

/**
 * Daily leftover-ingredient ask when tonight’s dinner is not saved.
 * Used by the always-on Baileys bot (same reminder group as outing pings).
 */
export async function GET() {
  const now = new Date();
  const [{ content, source }, recipes, overrides] = await Promise.all([
    getContentWithSource(),
    getDinnerRecipes(),
    getDinnerMenuOverrides(),
  ]);
  const dateKey = hongKongDateKey(now);
  const menu = recipes.length
    ? resolveTonightMenu(recipes, dateKey, overrides.byDate[dateKey] ?? null)
    : null;
  const state = getLeftoverReminderState({
    dateKey,
    nowMinutes: getHongKongTimeParts(now).minutesSinceMidnight,
    dayOff: isHelperDayOff(now),
    tonightDishCount: tonightDishes(menu).length,
    enabled: content.leftoverRemindersEnabled,
  });
  const due = state.due
    ? [{ ...state, text: formatLeftoverReminderMessage() }]
    : [];

  return NextResponse.json(
    {
      source,
      date: dateKey,
      enabled: state.enabled,
      dayOff: state.dayOff,
      menuSaved: state.menuSaved,
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
