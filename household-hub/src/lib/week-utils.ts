import { getHongKongDateKey } from "./hk-holidays";

export const WEEK_DAY_KEYS = [
  "monday",
  "tuesday",
  "wednesday",
  "thursday",
  "friday",
  "saturday",
  "sunday",
] as const;

export type WeekDayKey = (typeof WEEK_DAY_KEYS)[number];

export interface WeekDayInfo {
  dayKey: WeekDayKey;
  /** YYYY-MM-DD in Asia/Hong_Kong */
  dateKey: string;
  date: Date;
}

/** Parse HK date key to a Date at noon HKT */
export function dateFromHongKongKey(dateKey: string): Date {
  return new Date(`${dateKey}T12:00:00+08:00`);
}

function addDaysHongKong(dateKey: string, days: number): string {
  const ms = dateFromHongKongKey(dateKey).getTime() + days * 86_400_000;
  return getHongKongDateKey(new Date(ms));
}

/**
 * Monday-start week containing today (HK), shifted by `weekOffset` weeks.
 * weekOffset 0 = this week, 1 = next week, -1 = previous week.
 */
export function getWeekDays(weekOffset = 0, now = new Date()): WeekDayInfo[] {
  const todayKey = getHongKongDateKey(now);
  const weekdayLong = new Intl.DateTimeFormat("en-US", {
    timeZone: "Asia/Hong_Kong",
    weekday: "long",
  })
    .format(now)
    .toLowerCase() as WeekDayKey;

  const todayIndex = WEEK_DAY_KEYS.indexOf(weekdayLong);
  const mondayKey = addDaysHongKong(todayKey, -todayIndex + weekOffset * 7);

  return WEEK_DAY_KEYS.map((dayKey, i) => {
    const dateKey = addDaysHongKong(mondayKey, i);
    return { dayKey, dateKey, date: dateFromHongKongKey(dateKey) };
  });
}

/** Rotate day list so `startKey` is first (wrap around). */
export function rotateDaysFrom<T extends { dayKey: string }>(
  days: T[],
  startKey: string
): T[] {
  const idx = days.findIndex((d) => d.dayKey === startKey);
  if (idx <= 0) return days;
  return [...days.slice(idx), ...days.slice(0, idx)];
}

export function formatDayMonth(
  date: Date,
  lang: "en" | "fil" | "zh"
): string {
  const locale = lang === "zh" ? "zh-HK" : lang === "fil" ? "fil-PH" : "en-HK";
  return new Intl.DateTimeFormat(locale, {
    timeZone: "Asia/Hong_Kong",
    month: "short",
    day: "numeric",
  }).format(date);
}

export function formatWeekRangeLabel(
  days: WeekDayInfo[],
  lang: "en" | "fil" | "zh"
): string {
  if (!days.length) return "";
  const locale = lang === "zh" ? "zh-HK" : lang === "fil" ? "fil-PH" : "en-HK";
  const opts: Intl.DateTimeFormatOptions = {
    timeZone: "Asia/Hong_Kong",
    month: "short",
    day: "numeric",
  };
  return `${new Intl.DateTimeFormat(locale, opts).format(days[0].date)} – ${new Intl.DateTimeFormat(locale, opts).format(days[days.length - 1].date)}`;
}

export function getTodayHongKongKey(date = new Date()): string {
  return getHongKongDateKey(date);
}
