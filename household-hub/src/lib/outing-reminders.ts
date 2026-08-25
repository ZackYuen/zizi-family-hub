import { getHongKongTimeParts } from "./i18n";
import { getHongKongDateKey, isHelperDayOff } from "./hk-holidays";
import { resolveTasksForDate } from "./school-calendar";
import { getTaskStartTime, parseTimeToMinutes } from "./schedule-utils";
import type { AppContent, BilingualText, ScheduleTask } from "./types";

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

function taskBlob(task: ScheduleTask): string {
  return [
    task.task?.en,
    task.task?.zh,
    task.task?.fil,
    task.notes?.en,
    task.notes?.zh,
    task.notes?.fil,
  ]
    .filter(Boolean)
    .join("\n");
}

/** True when this task is “take Zizi out to class” (leave-home), not return/travel/class-block/pick-up. */
export function isOutingLeaveTask(task: ScheduleTask): boolean {
  if (task.outingReminder === false) return false;
  if (task.outingReminder === true) return true;
  if (task.fullDay) return false;

  const blob = taskBlob(task);
  const lower = blob.toLowerCase();
  const en = (task.task?.en || "").trim();
  const zh = (task.task?.zh || "").trim();

  if (/^drawing\s*class\b/i.test(en) || /^繪畫班/.test(zh)) return false;
  if (/travel\s*\/\s*arrive|前往／到達|biyahe\s*\/\s*dumating/i.test(lower))
    return false;
  if (/\breturn home\b|umuwi mula|結束回家/.test(lower)) return false;
  if (
    /\bpick-?up\b|\bpick up\b|sunduin|sundo\b|接回/.test(lower) &&
    !/drop off|ihatid|送到|afternoon class|繪畫/.test(lower)
  ) {
    return false;
  }

  if (/prepare\s*&\s*leave home/i.test(blob)) return true;
  if (/準備出門/.test(blob)) return true;
  if (/maghanda at umalis papuntang drawing/i.test(lower)) return true;
  if (/leave home for afternoon class/i.test(lower)) return true;
  if (/出門上下午班|出門前往繪畫/.test(blob)) return true;
  if (/umalis papuntang afternoon class|ihatid si zizi/i.test(lower)) return true;
  if (
    /leave home/.test(lower) &&
    /(drop off|kindergarten|drawing class|afternoon class)/i.test(blob)
  ) {
    return true;
  }
  return false;
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
  const zh = item.task.zh || item.task.en;
  const en = item.task.en;
  const note = item.notes?.zh || item.notes?.en || item.notes?.fil || "";
  const lines = [
    "⏰ Charlene — 1 hour / 1小時",
    "",
    `FIL: Sa 1 oras (alis ${time}): ${fil}`,
    `中文：1小時後出門（${time}）：${zh}`,
    `EN: Leave in 1 hour (${time}): ${en}`,
  ];
  if (note.trim()) {
    lines.push("", note.trim());
  }
  return lines.join("\n");
}
