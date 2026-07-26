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
  en: "Summer holiday until 1 Sep 2026 — no kindergarten. Wed & Fri 14:00–15:00 drawing class at One Point Studio, Kwun Tong Industrial Centre Phase 1, 12/F Room B (觀塘工業中心一期12樓B室). School resumes 2 Sep — K3 PM class.",
  fil: "Summer holiday hanggang 1 Sep 2026 — walang kindergarten. Miyerkules at Biyernes 14:00–15:00 drawing class sa One Point Studio, Kwun Tong Industrial Centre Phase 1, 12/F Room B (觀塘工業中心一期12樓B室). Balik-eskwela 2 Sep — K3 PM class.",
  zh: "暑假至 2026-09-01 — 無幼稚園。逢星期三、五 14:00–15:00 繪畫班：One Point Studio，觀塘工業中心一期12樓B室。9月2日復課 — K3 下午班。",
};

export const TERM_K3_SCHOOL_BANNER: BilingualText = {
  en: "Lam Tin Ling Liang Kindergarten — K3 PM class Mon–Fri only (arrive by 1:00 PM, 30 min walk). Sundays & HK public holidays (香港勞工假): Charlene day off.",
  fil: "Lam Tin Ling Liang Kindergarten — K3 PM class Lunes–Biyernes lang (dumating bago 1:00 PM, 30 min lakad). Linggo at HK public holiday (香港勞工假): day off ni Charlene.",
  zh: "藍田靈糧幼稚園 — K3 星期一至五下午班（13:00 前到達，步行約 30 分鐘）。星期日及香港公眾假期（香港勞工假）：Charlene 放假。",
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
