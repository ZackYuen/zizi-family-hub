import { getHongKongDateKey } from "./hk-holidays";
import type { AppContent, BilingualText, DaySchedule, SchoolCalendar } from "./types";

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

export const DRAWING_CLASS_TASK: BilingualText = {
  en: "Drawing class (14:00–15:00)",
  fil: "Drawing class (14:00–15:00)",
  zh: "繪畫班（14:00–15:00）",
};

export const TERM_K3_SCHOOL_BANNER: BilingualText = {
  en: "Lam Tin Ling Liang Kindergarten — K3 PM, Mon–Fri (drop-off by 13:00, pick-up 16:30).",
  fil: "Lam Tin Ling Liang Kindergarten — K3 PM, Lunes–Biyernes (drop-off bago 13:00, sundo 16:30).",
  zh: "藍田靈糧幼稚園 — K3 下午班，周一至五（13:00 前送到，16:30 接）。",
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
