import type { AppContent, BilingualText, ScheduleTask } from "./types";

/** Mon/Thu WhatsApp ping: Charlene checks Octopus + cash and tells Sir/Mum if low. */

export const OCTOPUS_CASH_REMIND_ID = "octopus-cash-check";

/** Same id on the weekly schedule so the check is visible those mornings. */
export const OCTOPUS_CASH_TASK_ID = OCTOPUS_CASH_REMIND_ID;

/** 09:00 Hong Kong — before leftover dinner ping (10:00) and Zizi wake-up. */
export const OCTOPUS_CASH_REMIND_AT_MINUTES = 9 * 60;

/** Keep due until 16:00 so a late-starting bot still sends once that day. */
export const OCTOPUS_CASH_REMIND_UNTIL_MINUTES = 16 * 60;

export const OCTOPUS_CASH_REMIND_DAY_KEYS = ["monday", "thursday"] as const;

export interface OctopusCashReminderState {
  id: string;
  dateKey: string;
  dayKey: string;
  remindAtMinutes: number;
  untilMinutes: number;
  enabled: boolean;
  dayOff: boolean;
  checkDay: boolean;
  due: boolean;
}

/** Missing setting = on (same as leftover dinner ping). */
export function octopusRemindersSettingOn(
  enabled: boolean | undefined | null
): boolean {
  return enabled !== false;
}

export function isOctopusCashCheckDay(dayKey: string): boolean {
  return (OCTOPUS_CASH_REMIND_DAY_KEYS as readonly string[]).includes(dayKey);
}

export function getOctopusCashReminderState(input: {
  dateKey: string;
  dayKey: string;
  nowMinutes: number;
  dayOff: boolean;
  enabled?: boolean | null;
}): OctopusCashReminderState {
  const settingOn = octopusRemindersSettingOn(input.enabled);
  const checkDay = isOctopusCashCheckDay(input.dayKey);
  const inWindow =
    input.nowMinutes >= OCTOPUS_CASH_REMIND_AT_MINUTES &&
    input.nowMinutes < OCTOPUS_CASH_REMIND_UNTIL_MINUTES;
  return {
    id: OCTOPUS_CASH_REMIND_ID,
    dateKey: input.dateKey,
    dayKey: input.dayKey,
    remindAtMinutes: OCTOPUS_CASH_REMIND_AT_MINUTES,
    untilMinutes: OCTOPUS_CASH_REMIND_UNTIL_MINUTES,
    enabled: settingOn,
    dayOff: input.dayOff,
    checkDay,
    due: settingOn && !input.dayOff && checkDay && inWindow,
  };
}

/**
 * Kind but firm FIL + EN (same as leftover / outing). She may reply in the group.
 * Do not invent a dollar or top-up threshold.
 */
export function formatOctopusCashReminderMessage(): string {
  return [
    "Hi Charlene 😊",
    "",
    "FIL:",
    "Pakitingnan ngayon ang Octopus (八達通) card at cash mo.",
    "Kung kulang na ang alinman, sabihin kina Sir/Mum ngayong araw — huwag hintayin bukas.",
    "Ito ay regular nating check tuwing Lunes at Huwebes. Puwede kang mag-reply sa group.",
    "",
    "EN:",
    "Please check your Octopus (八達通) card and cash today.",
    "If either is running low, tell Sir/Mum the same day — do not wait until tomorrow.",
    "This is our regular Monday and Thursday check. You may reply in this group.",
  ].join("\n");
}

export const OCTOPUS_CASH_TASK: BilingualText = {
  en: "Check Octopus (八達通) and cash — tell Sir/Mum today if either is running low",
  fil: "Tingnan ang Octopus (八達通) at cash — sabihin kina Sir/Mum ngayong araw kung kulang na ang alinman",
  zh: "檢查八達通和現金 — 若其中一項不足，當天告訴 Sir/Mum",
};

export const OCTOPUS_CASH_TASK_NOTES: BilingualText = {
  en: "Standing family instruction. Check both Octopus and cash. If either is running low, message Sir/Mum the same day. You may reply in the WhatsApp reminder group.",
  fil: "Palaging instruction ng pamilya. Tingnan ang Octopus at cash. Kung kulang na ang alinman, mag-message kina Sir/Mum sa araw ding iyon. Puwedeng mag-reply sa WhatsApp reminder group.",
  zh: "家庭固定指示。請檢查八達通和現金。若其中一項不足，當天用 WhatsApp 告訴 Sir/Mum。可在提醒群回覆。",
};

export function octopusCashScheduleTask(): ScheduleTask {
  return {
    id: OCTOPUS_CASH_TASK_ID,
    time: "09:00",
    startTime: "09:00",
    endTime: "09:15",
    outingReminder: false,
    task: OCTOPUS_CASH_TASK,
    notes: OCTOPUS_CASH_TASK_NOTES,
  };
}

/** Show on Schedule for Mon/Thu workdays when the Admin toggle is on. */
export function shouldShowOctopusCashOnSchedule(input: {
  dayKey: string;
  dayOff: boolean;
  enabled?: boolean | null;
}): boolean {
  return (
    octopusRemindersSettingOn(input.enabled) &&
    !input.dayOff &&
    isOctopusCashCheckDay(input.dayKey)
  );
}

export function withOctopusCashScheduleTask(
  tasks: ScheduleTask[],
  input: { dayKey: string; dayOff: boolean; enabled?: boolean | null }
): ScheduleTask[] {
  if (!shouldShowOctopusCashOnSchedule(input)) return tasks;
  if (tasks.some((task) => task.id === OCTOPUS_CASH_TASK_ID)) return tasks;
  return [...tasks, octopusCashScheduleTask()];
}

const SPEAK_UP_EN =
  "Check both Octopus and cash regularly. The same day, tell Sir/Mum if either is running low — do not wait.";
const SPEAK_UP_FIL =
  "Regular na tingnan ang Octopus at cash. Sa araw ding iyon, sabihin kina Sir/Mum kung kulang na ang alinman — huwag maghintay.";
const SPEAK_UP_ZH =
  "請定期檢查八達通和現金。若其中一項不足，當天告訴 Sir/Mum，不要拖延。";

export function octopusTipMentionsSpeakUp(
  body?: BilingualText | null
): boolean {
  const blob = `${body?.en || ""} ${body?.fil || ""} ${body?.zh || ""}`;
  return /running low|kulang na ang alinman|不足，當天|不足，当天|speak up when low/i.test(
    blob
  );
}

function appendSpeakUp(body: BilingualText): BilingualText {
  const join = (text: string | undefined, extra: string) => {
    const base = (text || "").trim();
    if (!base) return extra;
    if (/[.!?。]$/.test(base)) return `${base} ${extra}`;
    return `${base}. ${extra}`;
  };
  return {
    en: join(body.en, SPEAK_UP_EN),
    fil: join(body.fil, SPEAK_UP_FIL),
    zh: body.zh ? join(body.zh, SPEAK_UP_ZH) : SPEAK_UP_ZH,
  };
}

/** Previous seed wording — safe to replace with the updated seed body. */
const LEGACY_OCTOPUS_TIP_EN =
  "Get an Octopus card early. Use it on MTR, buses, and many shops (7-Eleven, some supermarkets). Top up at MTR machines or 7-Eleven. Keep enough balance for school walks / shopping days. Never borrow money for top-up — ask Sir/Mum.";

/**
 * In-memory only: add “speak up when low” to the existing Octopus HK Life tip.
 * Replaces the body only when it still matches the old seed text.
 * Otherwise appends a sentence so Admin edits are kept. Does not persist to Supabase.
 */
export function overlayOctopusSpeakUpGuide(
  live: AppContent,
  seed: AppContent
): AppContent {
  const liveGuides = live.hkLifeGuides;
  if (!liveGuides?.length) return live;
  const idx = liveGuides.findIndex((g) => g.id === "life-octopus");
  if (idx < 0) return live;
  const current = liveGuides[idx];
  if (octopusTipMentionsSpeakUp(current.body)) return live;

  const seedGuide = seed.hkLifeGuides?.find((g) => g.id === "life-octopus");
  const nextBody =
    current.body.en?.trim() === LEGACY_OCTOPUS_TIP_EN &&
    seedGuide &&
    octopusTipMentionsSpeakUp(seedGuide.body)
      ? seedGuide.body
      : appendSpeakUp(current.body);

  const next = liveGuides.slice();
  next[idx] = {
    ...current,
    body: nextBody,
  };
  return { ...live, hkLifeGuides: next };
}
