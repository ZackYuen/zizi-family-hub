import { getHongKongDateKey } from "./hk-holidays";
import { getTaskEndTime, getTaskStartTime } from "./schedule-utils";
import type {
  AppContent,
  BilingualText,
  DaySchedule,
  ScheduleTask,
  SchoolCalendar,
} from "./types";

/** Default: summer through 1 Sep 2026; K3 term from 2 Sep 2026 */
export const DEFAULT_SCHOOL_CALENDAR: SchoolCalendar = {
  summerEndsOn: "2026-09-01",
  termStartsOn: "2026-09-02",
  grade: "K3",
  classSession: "PM",
};

export type ScheduleSeason = "summer" | "term";

export function getSchoolCalendar(content?: Pick<AppContent, "schoolCalendar"> | null): SchoolCalendar {
  const c = content?.schoolCalendar;
  return {
    summerEndsOn: c?.summerEndsOn || DEFAULT_SCHOOL_CALENDAR.summerEndsOn,
    termStartsOn: c?.termStartsOn || DEFAULT_SCHOOL_CALENDAR.termStartsOn,
    grade: c?.grade || DEFAULT_SCHOOL_CALENDAR.grade,
    classSession: c?.classSession || DEFAULT_SCHOOL_CALENDAR.classSession,
  };
}

/** Summer holiday = HK date on or before summerEndsOn (and before termStartsOn). */
export function isSummerHoliday(
  date = new Date(),
  calendar: SchoolCalendar = DEFAULT_SCHOOL_CALENDAR
): boolean {
  const key = getHongKongDateKey(date);
  return key <= calendar.summerEndsOn && key < calendar.termStartsOn;
}

export function getScheduleSeason(
  date = new Date(),
  calendar: SchoolCalendar = DEFAULT_SCHOOL_CALENDAR
): ScheduleSeason {
  return isSummerHoliday(date, calendar) ? "summer" : "term";
}

export const SUMMER_SCHOOL_BANNER: BilingualText = {
  en: "Summer holiday until 1 Sep — no kindergarten. School resumes 2 Sep (K3 PM).",
  fil: "Summer holiday hanggang 1 Sep — walang kindergarten. Balik-eskwela 2 Sep (K3 PM).",
  zh: "暑假至 9月1日 — 無幼稚園。9月2日復課（K3 下午班）。",
};

/** Full venue — kept on Wed/Fri calendar task notes */
export const DRAWING_CLASS_NOTES: BilingualText = {
  en: "One Point Studio · Kwun Tong Industrial Centre Phase 1, 12/F Room B（觀塘工業中心一期12樓B室）",
  fil: "One Point Studio · Kwun Tong Industrial Centre Phase 1, 12/F Room B（觀塘工業中心一期12樓B室）",
  zh: "One Point Studio · 觀塘工業中心一期12樓B室",
};

/** Fallback label only — prefer times from live weeklyScheduleSummer */
export const DRAWING_CLASS_TASK: BilingualText = {
  en: "Drawing class (12:00–13:00)",
  fil: "Drawing class (12:00–13:00)",
  zh: "繪畫班（12:00–13:00）",
};

export interface SummerDrawingClassInfo {
  dayKeys: string[];
  /** e.g. "Wed & Fri" / localized short labels */
  daysEn: string;
  daysFil: string;
  daysZh: string;
  classStart: string;
  classEnd: string;
  leaveStart: string;
  leaveEnd: string;
  venue: BilingualText;
  classTask: BilingualText;
}

function isDrawingClassTask(task: ScheduleTask): boolean {
  const en = task.task?.en || "";
  const zh = task.task?.zh || "";
  return /^drawing\s*class\b/i.test(en.trim()) || /^繪畫班/.test(zh.trim());
}

function isLeaveForDrawingTask(task: ScheduleTask): boolean {
  const blob = `${task.task?.en || ""} ${task.task?.fil || ""} ${task.task?.zh || ""}`;
  return /leave.*drawing|umalis.*drawing|出門.*繪畫/i.test(blob);
}

const DAY_SHORT: Record<string, { en: string; fil: string; zh: string }> = {
  monday: { en: "Mon", fil: "Lunes", zh: "一" },
  tuesday: { en: "Tue", fil: "Martes", zh: "二" },
  wednesday: { en: "Wed", fil: "Miyerkules", zh: "三" },
  thursday: { en: "Thu", fil: "Huwebes", zh: "四" },
  friday: { en: "Fri", fil: "Biyernes", zh: "五" },
  saturday: { en: "Sat", fil: "Sabado", zh: "六" },
  sunday: { en: "Sun", fil: "Linggo", zh: "日" },
};

/** Read Wed/Fri (or whichever) drawing class times from summer schedule. */
export function extractSummerDrawingClass(
  schedule: DaySchedule[] | undefined | null
): SummerDrawingClassInfo | null {
  if (!schedule?.length) return null;

  const drawingDays = schedule.filter((d) =>
    d.tasks.some((t) => isDrawingClassTask(t))
  );
  if (!drawingDays.length) return null;

  const sample = drawingDays[0];
  const classTask =
    sample.tasks.find((t) => isDrawingClassTask(t)) ?? null;
  const leaveTask =
    sample.tasks.find((t) => isLeaveForDrawingTask(t)) ?? null;
  if (!classTask) return null;

  const classStart = getTaskStartTime(classTask);
  const classEnd = getTaskEndTime(classTask) || classStart;
  const leaveStart = leaveTask ? getTaskStartTime(leaveTask) : "11:15";
  const leaveEnd = leaveTask
    ? getTaskEndTime(leaveTask) || leaveStart
    : "11:30";

  const dayKeys = drawingDays.map((d) => d.dayKey);
  const shorts = dayKeys.map(
    (k) => DAY_SHORT[k] || { en: k, fil: k, zh: k }
  );

  const venue: BilingualText = classTask.notes?.en
    ? {
        en: classTask.notes.en,
        fil: classTask.notes.fil || classTask.notes.en,
        zh: classTask.notes.zh || DRAWING_CLASS_NOTES.zh,
      }
    : { ...DRAWING_CLASS_NOTES };

  return {
    dayKeys,
    daysEn: shorts.map((s) => s.en).join(" & "),
    daysFil: shorts.map((s) => s.fil).join(" at "),
    daysZh: shorts.map((s) => s.zh).join("、"),
    classStart,
    classEnd,
    leaveStart,
    leaveEnd,
    venue,
    classTask: {
      en: classTask.task.en,
      fil: classTask.task.fil || classTask.task.en,
      zh: classTask.task.zh || classTask.task.en,
    },
  };
}

export const TERM_K3_SCHOOL_BANNER: BilingualText = {
  en: "Lam Tin Ling Liang Kindergarten — K3 PM, Mon–Fri (drop-off by 13:00, pick-up 16:30).",
  fil: "Lam Tin Ling Liang Kindergarten — K3 PM, Lunes–Biyernes (drop-off bago 13:00, sundo 16:30).",
  zh: "藍田靈糧幼稚園 — K3 下午班，週一至五（13:00 前送到，16:30 接）。",
};

export function resolveActiveSchedule(
  content: AppContent,
  date = new Date()
): {
  season: ScheduleSeason;
  schedule: DaySchedule[];
  ziziSchool: BilingualText;
  calendar: SchoolCalendar;
} {
  const calendar = getSchoolCalendar(content);
  const season = getScheduleSeason(date, calendar);

  if (season === "summer" && content.weeklyScheduleSummer?.length) {
    return {
      season,
      schedule: content.weeklyScheduleSummer,
      ziziSchool: content.ziziSchoolSummer ?? SUMMER_SCHOOL_BANNER,
      calendar,
    };
  }

  return {
    season: "term",
    schedule: content.weeklySchedule,
    ziziSchool: content.ziziSchool || TERM_K3_SCHOOL_BANNER,
    calendar,
  };
}
