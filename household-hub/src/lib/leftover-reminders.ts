import type { Lang } from "./types";

/** Daily WhatsApp ping: ask Charlene leftover fridge ingredients when dinner is unset. */

export const LEFTOVER_REMIND_ID = "leftover-tonight";

/** 10:00 Hong Kong — after breakfast, before school prep / shopping window. */
export const LEFTOVER_REMIND_AT_MINUTES = 10 * 60;

/** Stop offering the ping after 16:00 (pickup / cook prep). */
export const LEFTOVER_REMIND_UNTIL_MINUTES = 16 * 60;

export interface LeftoverReminderState {
  id: string;
  dateKey: string;
  remindAtMinutes: number;
  untilMinutes: number;
  enabled: boolean;
  dayOff: boolean;
  menuSaved: boolean;
  due: boolean;
}

/** Missing setting = on (same as first deploy). */
export function leftoverRemindersSettingOn(
  enabled: boolean | undefined | null
): boolean {
  return enabled !== false;
}

export function getLeftoverReminderState(input: {
  dateKey: string;
  nowMinutes: number;
  dayOff: boolean;
  tonightDishCount: number;
  enabled?: boolean | null;
}): LeftoverReminderState {
  const menuSaved = input.tonightDishCount > 0;
  const settingOn = leftoverRemindersSettingOn(input.enabled);
  const inWindow =
    input.nowMinutes >= LEFTOVER_REMIND_AT_MINUTES &&
    input.nowMinutes < LEFTOVER_REMIND_UNTIL_MINUTES;
  return {
    id: LEFTOVER_REMIND_ID,
    dateKey: input.dateKey,
    remindAtMinutes: LEFTOVER_REMIND_AT_MINUTES,
    untilMinutes: LEFTOVER_REMIND_UNTIL_MINUTES,
    enabled: settingOn,
    dayOff: input.dayOff,
    menuSaved,
    due: settingOn && !input.dayOff && inWindow,
  };
}

/** FIL + EN only (same as outing reminders). Friendly check-in — no bot reply needed. */
export function formatLeftoverReminderMessage(): string {
  return [
    "Hi Charlene 😊",
    "",
    "FIL:",
    "Pwede bang tingnan ang fridge kung anong natitira na pwedeng lutuin tonight?",
    "Mag-suggest ka lang ng ulam (Zizi: meat + gulay, walang spicy).",
    "Kung wala kang idea, okay lang — tanong sa amin.",
    "",
    "EN:",
    "Could you check the fridge for leftover ingredients that can be cooked tonight?",
    "Please suggest a few dishes (Zizi: meat + veg, no spicy).",
    "If you have no idea, that’s fine — just ask us.",
  ].join("\n");
}

/** One-language leftover check-in (Meals / Ask). No planned today menu. */
export function leftoverTonightHint(lang: Lang): string {
  if (lang === "fil") {
    return "Walang today menu. Tingnan ang fridge kung anong natitira na pwedeng lutuin tonight, tapos mag-suggest ng ulam (Zizi: meat + gulay, walang spicy). Kung wala kang idea, tanong sa amin.";
  }
  if (lang === "zh") {
    return "沒有今日餐單。請看雪櫃剩下可煮的材料，再建議今晚菜式（孜孜要肉＋菜，不要辣）。沒主意就問我們。";
  }
  return "No today menu. Please check the fridge for leftover ingredients that can be cooked tonight, then suggest dishes (Zizi: meat + veg, no spicy). If you have no idea, ask us.";
}
