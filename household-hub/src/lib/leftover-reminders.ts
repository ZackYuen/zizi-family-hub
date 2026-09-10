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

/** FIL + EN only (same as outing reminders). Friendly check-in — no bot reply needed. */
export function formatLeftoverReminderMessage(): string {
  return [
    "Hi Charlene 😊",
    "",
    "FIL:",
    "Pwede bang tingnan ang fridge kung anong natitira na pwedeng lutuin tonight?",
    "Mag-suggest ka lang ng ulam (Zizi: meat + gulay, walang spicy).",
    "Kung wala kang idea, okay lang — tanong kay Mum.",
    "",
    "EN:",
    "Could you check the fridge for leftover ingredients that can be cooked tonight?",
    "Please suggest a few dishes (Zizi: meat + veg, no spicy).",
    "If you have no idea, that’s fine — just ask Mum.",
  ].join("\n");
}
