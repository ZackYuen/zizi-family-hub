import { getHongKongTimeParts } from "./i18n";
import { getHongKongDateKey, isHelperDayOff } from "./hk-holidays";
import { resolveTasksForDate } from "./school-calendar";
import { getTaskStartTime, parseTimeToMinutes } from "./schedule-utils";
import type { AppContent, BilingualText, DaySchedule, ScheduleTask } from "./types";

export const OUTING_REMIND_MINUTES = 60;

export interface OutingReminderItem {
  id: string;
  dateKey: string;
  startTime: string;
  remindAtMinutes: number;
  due: boolean;
  task: BilingualText;
  notes?: BilingualText;
}

/** Only tasks with Admin → Schedule → “Remind 1h on WhatsApp” checked. */
export function isOutingLeaveTask(task: ScheduleTask): boolean {
  return task.outingReminder === true;
}

function seedOutingFlags(seed: AppContent): Map<string, boolean> {
  const flags = new Map<string, boolean>();
  const collect = (days?: DaySchedule[]) => {
    for (const day of days || []) {
      for (const task of day.tasks || []) {
        if (typeof task.outingReminder === "boolean") {
          flags.set(task.id, task.outingReminder);
        }
      }
    }
  };
  collect(seed.weeklySchedule);
  collect(seed.weeklyScheduleSummer);
  for (const tasks of Object.values(seed.scheduleDateOverrides || {})) {
    for (const task of tasks) {
      if (typeof task.outingReminder === "boolean") {
        flags.set(task.id, task.outingReminder);
      }
    }
  }
  return flags;
}

function applyFlagsToDays(
  days: DaySchedule[] | undefined,
  flags: Map<string, boolean>
): DaySchedule[] | undefined {
  if (!days) return days;
  return days.map((day) => ({
    ...day,
    tasks: (day.tasks || []).map((task) => {
      if (typeof task.outingReminder === "boolean") return task;
      if (!flags.has(task.id)) return task;
      return { ...task, outingReminder: flags.get(task.id) };
    }),
  }));
}

/** Copy seed outingReminder onto live tasks that have no flag yet (do not overwrite Admin). */
export function overlayOutingReminderFlags(
  live: AppContent,
  seed: AppContent
): AppContent {
  const flags = seedOutingFlags(seed);
  if (!flags.size) return live;
  const overrides = { ...(live.scheduleDateOverrides || {}) };
  for (const [date, tasks] of Object.entries(overrides)) {
    overrides[date] = (tasks || []).map((task) => {
      if (typeof task.outingReminder === "boolean") return task;
      if (!flags.has(task.id)) return task;
      return { ...task, outingReminder: flags.get(task.id) };
    });
  }
  return {
    ...live,
    weeklySchedule: applyFlagsToDays(live.weeklySchedule, flags) ?? live.weeklySchedule,
    weeklyScheduleSummer: applyFlagsToDays(live.weeklyScheduleSummer, flags),
    scheduleDateOverrides: Object.keys(overrides).length
      ? overrides
      : live.scheduleDateOverrides,
  };
}

export function parseWhatsAppGroupJids(raw?: string | null): string[] {
  if (!raw?.trim()) return [];
  return raw
    .split(/[\s,;]+/)
    .map((s) => s.trim())
    .filter((s) => /@g\.us$/i.test(s));
}

export function getOutingRemindersForDate(
  content: AppContent,
  now = new Date(),
  remindMinutesBefore = OUTING_REMIND_MINUTES
): {
  dateKey: string;
  dayOff: boolean;
  nowMinutes: number;
  items: OutingReminderItem[];
} {
  const dateKey = getHongKongDateKey(now);
  const { minutesSinceMidnight } = getHongKongTimeParts(now);
  if (isHelperDayOff(now)) {
    return {
      dateKey,
      dayOff: true,
      nowMinutes: minutesSinceMidnight,
      items: [],
    };
  }

  const resolved = resolveTasksForDate(content, dateKey);
  const items = resolved.tasks.filter(isOutingLeaveTask).map((task) => {
    const startTime = getTaskStartTime(task);
    const startMin = parseTimeToMinutes(startTime);
    const remindAtMinutes = startMin - remindMinutesBefore;
    const due =
      remindAtMinutes >= 0 &&
      minutesSinceMidnight >= remindAtMinutes &&
      minutesSinceMidnight < startMin;
    return {
      id: task.id,
      dateKey,
      startTime,
      remindAtMinutes,
      due,
      task: task.task,
      notes: task.notes,
    };
  });

  return {
    dateKey,
    dayOff: false,
    nowMinutes: minutesSinceMidnight,
    items,
  };
}

export function formatOutingReminderMessage(item: OutingReminderItem): string {
  const time = item.startTime;
  const fil = item.task.fil || item.task.en;
  const en = item.task.en;
  const noteFil = item.notes?.fil?.trim() || "";
  const noteEn = item.notes?.en?.trim() || "";
  const lines = [
    "⏰ Charlene — in 1 hour",
    "",
    `FIL: Sa 1 oras (${time}): ${fil}`,
    `EN: In 1 hour (${time}): ${en}`,
  ];
  if (noteFil) {
    lines.push("", noteFil);
  }
  if (noteEn && noteEn !== noteFil) {
    lines.push(noteFil ? "" : "", noteEn);
  }
  return lines.join("\n");
}
