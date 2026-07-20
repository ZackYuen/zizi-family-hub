import type { Lang, ScheduleTask } from "./types";

export function getTaskStartTime(task: ScheduleTask): string {
  return task.startTime ?? task.time ?? "00:00";
}

export function getTaskEndTime(task: ScheduleTask): string | null {
  if (task.fullDay) return null;
  return task.endTime ?? null;
}

export function parseTimeToMinutes(time: string): number {
  const [h, m] = time.split(":").map(Number);
  return h * 60 + (m || 0);
}

export function formatTime12h(time: string, locale: string): string {
  const [h, m] = time.split(":").map(Number);
  const d = new Date();
  d.setHours(h, m, 0, 0);
  return d.toLocaleTimeString(locale, { hour: "numeric", minute: "2-digit", hour12: true });
}

export function formatTaskTimeRange(task: ScheduleTask, lang: Lang): string {
  if (task.fullDay) {
    return lang === "fil" ? "Buong araw" : lang === "zh" ? "全日" : "All day";
  }

  const locale = lang === "fil" ? "fil-PH" : lang === "zh" ? "zh-HK" : "en-HK";
  const start = getTaskStartTime(task);
  const end = getTaskEndTime(task);

  if (end && end !== start) {
    return `${formatTime12h(start, locale)} – ${formatTime12h(end, locale)}`;
  }

  return formatTime12h(start, locale);
}

export function sortTasksByTime(tasks: ScheduleTask[]): ScheduleTask[] {
  return [...tasks].sort((a, b) =>
    getTaskStartTime(a).localeCompare(getTaskStartTime(b))
  );
}

export function isTaskActiveNow(task: ScheduleTask, minutesSinceMidnight: number): boolean {
  if (task.fullDay) return true;

  const start = parseTimeToMinutes(getTaskStartTime(task));
  const end = getTaskEndTime(task)
    ? parseTimeToMinutes(getTaskEndTime(task)!)
    : start + 30;

  return minutesSinceMidnight >= start && minutesSinceMidnight < end;
}

export function getActiveTaskId(
  tasks: ScheduleTask[],
  minutesSinceMidnight: number
): string | null {
  const sorted = sortTasksByTime(tasks);
  const active = sorted.find((t) => isTaskActiveNow(t, minutesSinceMidnight));
  if (active) return active.id;

  let fallback: ScheduleTask | null = null;
  for (const task of sorted) {
    if (parseTimeToMinutes(getTaskStartTime(task)) <= minutesSinceMidnight) {
      fallback = task;
    } else {
      break;
    }
  }
  return fallback?.id ?? sorted[0]?.id ?? null;
}

export function normalizeScheduleTask(task: ScheduleTask): ScheduleTask {
  const startTime = task.startTime ?? task.time ?? "09:00";
  return {
    ...task,
    time: startTime,
    startTime,
  };
}
