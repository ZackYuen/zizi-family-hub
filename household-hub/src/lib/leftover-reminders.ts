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
  dayOff: boolean;
  menuSaved: boolean;
  due: boolean;
}

export function getLeftoverReminderState(input: {
  dateKey: string;
  nowMinutes: number;
  dayOff: boolean;
  tonightDishCount: number;
}): LeftoverReminderState {
  const menuSaved = input.tonightDishCount > 0;
  const inWindow =
    input.nowMinutes >= LEFTOVER_REMIND_AT_MINUTES &&
    input.nowMinutes < LEFTOVER_REMIND_UNTIL_MINUTES;
  return {
    id: LEFTOVER_REMIND_ID,
    dateKey: input.dateKey,
    remindAtMinutes: LEFTOVER_REMIND_AT_MINUTES,
    untilMinutes: LEFTOVER_REMIND_UNTIL_MINUTES,
    dayOff: input.dayOff,
    menuSaved,
    due: !input.dayOff && !menuSaved && inWindow,
  };
}

/** FIL + EN only (same as outing reminders). */
export function formatLeftoverReminderMessage(): string {
  return [
    "Charlene — tonight’s dinner is not saved yet.",
    "",
    "FIL:",
    "Anong natitira sa fridge na pwedeng lutuin?",
    "Reply: ?leftover eggs tomato pork",
    "Tapos ?1 para i-save sa tonight.",
    "Kung wala kang idea, tanong kay Mum.",
    "(Zizi: meat + gulay, walang spicy.)",
    "",
    "EN:",
    "What leftover fridge ingredients can be cooked?",
    "Reply: ?leftover eggs tomato pork",
    "Then ?1 to save tonight.",
    "If no idea, ask Mum.",
    "(Zizi needs meat + veg, no spicy.)",
  ].join("\n");
}
