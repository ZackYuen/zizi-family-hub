import { getHongKongDateKey, isHongKongPublicHoliday } from "./hk-holidays";
import { localized } from "./localized-text";
import type {
  BilingualText,
  Lang,
  SchoolCalendar,
  SchoolCalendarEvent,
} from "./types";

/** 2026–2027 上學期行事曆 — 藍田靈糧幼稚園 / 藍田靈糧幼兒園 (K3). */
export const DEFAULT_FIRST_TERM_EVENTS: SchoolCalendarEvent[] = [
  {
    id: "orient-2026-09-01",
    date: "2026-09-01",
    kind: "activity",
    title: {
      en: "Orientation day",
      fil: "Orientation day",
      zh: "迎新日",
    },
  },
  {
    id: "k3-start-2026-09-09",
    date: "2026-09-09",
    kind: "activity",
    title: {
      en: "K3 official class start (school bus begins)",
      fil: "Opisyal na simula ng K3 (nagsisimula ang school bus)",
      zh: "高班正式上課（開幼稚園校車服務）",
    },
  },
  {
    id: "english-brief-k3-2026-09-16",
    date: "2026-09-16",
    kind: "activity",
    title: {
      en: "Online English class briefing (K3)",
      fil: "Online English class briefing (K3)",
      zh: "線上英文課簡介會（高班）",
    },
  },
  {
    id: "mid-autumn-2026",
    date: "2026-09-25",
    endDate: "2026-09-26",
    kind: "public",
    title: {
      en: "Mid-Autumn Festival holiday",
      fil: "Mid-Autumn Festival holiday",
      zh: "中秋節假期",
    },
  },
  {
    id: "national-day-2026",
    date: "2026-10-01",
    endDate: "2026-10-02",
    kind: "school-holiday",
    title: {
      en: "National Day holiday",
      fil: "National Day holiday",
      zh: "國慶假期",
    },
  },
  {
    id: "flu-vax-1-2026-10-10",
    date: "2026-10-10",
    kind: "activity",
    title: {
      en: "Flu vaccine — first dose",
      fil: "Flu vaccine — unang dose",
      zh: "注射流感疫苗（第一針）",
    },
  },
  {
    id: "special-day-2026-10-17",
    date: "2026-10-17",
    kind: "activity",
    title: {
      en: "Special activity day",
      fil: "Special activity day",
      zh: "特別活動日",
    },
  },
  {
    id: "chung-yeung-2026",
    date: "2026-10-19",
    kind: "public",
    title: {
      en: "Chung Yeung Festival",
      fil: "Chung Yeung Festival",
      zh: "重陽節假期",
    },
  },
  {
    id: "pta-kids-2026-10-26",
    date: "2026-10-26",
    kind: "activity",
    title: {
      en: "PTA through children’s eyes",
      fil: "PTA through children’s eyes",
      zh: "童眼中的 PTA",
    },
  },
  {
    id: "pta-agm-2026-10-30",
    date: "2026-10-30",
    kind: "activity",
    title: {
      en: "PTA annual general meeting / election",
      fil: "PTA annual general meeting / election",
      zh: "家長會周年選舉大會",
    },
  },
  {
    id: "new-student-off-2026-11-13",
    date: "2026-11-13",
    kind: "school-holiday",
    title: {
      en: "No class — new-student meeting day",
      fil: "Walang klase — new-student meeting day",
      zh: "新生見面日停課",
    },
  },
  {
    id: "new-student-meet-2026-11",
    date: "2026-11-13",
    endDate: "2026-11-14",
    kind: "activity",
    title: {
      en: "New-student meeting days",
      fil: "New-student meeting days",
      zh: "新生見面",
    },
  },
  {
    id: "flu-vax-2-2026-11-20",
    date: "2026-11-20",
    kind: "activity",
    title: {
      en: "Flu vaccine — second dose",
      fil: "Flu vaccine — pangalawang dose",
      zh: "注射流感疫苗（第二針）",
    },
  },
  {
    id: "christmas-party-2026-12-12",
    date: "2026-12-12",
    kind: "activity",
    title: {
      en: "Christmas party",
      fil: "Christmas party",
      zh: "聖誕晚會",
    },
  },
  {
    id: "christmas-party-makeup-2026-12-18",
    date: "2026-12-18",
    kind: "school-holiday",
    title: {
      en: "No class — Christmas party makeup holiday",
      fil: "Walang klase — Christmas party makeup holiday",
      zh: "聖誕晚會補假",
    },
  },
  {
    id: "christmas-break-2026",
    date: "2026-12-21",
    endDate: "2026-12-31",
    kind: "school-holiday",
    title: {
      en: "Christmas holiday (31 Dec: special activity day makeup)",
      fil: "Christmas holiday (31 Dec: special activity day makeup)",
      zh: "聖誕假期（31/12 學生特別活動日補假）",
    },
  },
  {
    id: "new-year-2027",
    date: "2027-01-01",
    kind: "public",
    title: {
      en: "New Year’s Day",
      fil: "New Year’s Day",
      zh: "元旦假期",
    },
  },
  {
    id: "teacher-dev-2027-01-04",
    date: "2027-01-04",
    kind: "school-holiday",
    title: {
      en: "No class — teacher development day",
      fil: "Walang klase — teacher development day",
      zh: "教師發展日",
    },
  },
  {
    id: "students-in-2027-01-05",
    date: "2027-01-05",
    kind: "activity",
    title: {
      en: "Students in class",
      fil: "May pasok ang mga estudyante",
      zh: "學生上課",
    },
  },
  {
    id: "unified-reg-2027-01",
    date: "2027-01-07",
    endDate: "2027-01-09",
    kind: "activity",
    title: {
      en: "Unified registration days",
      fil: "Unified registration days",
      zh: "統一註冊日",
    },
  },
  {
    id: "pta-makeup-2027-01-08",
    date: "2027-01-08",
    kind: "school-holiday",
    title: {
      en: "No class — PTA family activity makeup",
      fil: "Walang klase — PTA family activity makeup",
      zh: "PTA 親子活動補假",
    },
    tentative: true,
  },
  {
    id: "pta-trip-2027-01-16",
    date: "2027-01-16",
    kind: "activity",
    title: {
      en: "PTA family outing",
      fil: "PTA family outing",
      zh: "PTA 親子旅行",
    },
    tentative: true,
  },
  {
    id: "parents-day-2027-01-23",
    date: "2027-01-23",
    kind: "activity",
    title: {
      en: "Parents’ day",
      fil: "Parents’ day",
      zh: "家長日",
    },
    tentative: true,
  },
];

export function getFirstTermEvents(
  calendar?: Pick<SchoolCalendar, "events"> | null
): SchoolCalendarEvent[] {
  return calendar?.events?.length
    ? calendar.events
    : DEFAULT_FIRST_TERM_EVENTS;
}

export function eventCoversDate(
  event: SchoolCalendarEvent,
  dateKey: string
): boolean {
  const end = event.endDate || event.date;
  return dateKey >= event.date && dateKey <= end;
}

export function schoolEventsOn(
  dateKey: string,
  calendar?: Pick<SchoolCalendar, "events"> | null
): SchoolCalendarEvent[] {
  return getFirstTermEvents(calendar).filter((e) =>
    eventCoversDate(e, dateKey)
  );
}

function dateFromKey(dateKey: string): Date {
  return new Date(`${dateKey}T12:00:00+08:00`);
}

export function isClosingEvent(event: SchoolCalendarEvent): boolean {
  return event.kind === "public" || event.kind === "school-holiday";
}

/** Kindergarten closed: official public holiday or first-term 停課／補假／學校假期. */
export function isKindergartenClosed(
  dateKey: string,
  calendar?: Pick<SchoolCalendar, "events"> | null
): boolean {
  if (isHongKongPublicHoliday(dateFromKey(dateKey))) return true;
  return schoolEventsOn(dateKey, calendar).some(isClosingEvent);
}

export function kindergartenClosedEvent(
  dateKey: string,
  calendar?: Pick<SchoolCalendar, "events"> | null
): SchoolCalendarEvent | null {
  return schoolEventsOn(dateKey, calendar).find(isClosingEvent) ?? null;
}

export function formatEventRange(event: SchoolCalendarEvent): string {
  return event.endDate && event.endDate !== event.date
    ? `${event.date}–${event.endDate}`
    : event.date;
}

export function formatEventLabel(
  event: SchoolCalendarEvent,
  lang: Lang
): string {
  const tentative = event.tentative
    ? lang === "fil"
      ? " (tentatibo)"
      : lang === "zh"
        ? "（暫定）"
        : " (tentative)"
    : "";
  return `${localized(event.title, lang)}${tentative}`;
}

export function upcomingSchoolNotices(
  fromDateKey: string,
  calendar?: Pick<SchoolCalendar, "events"> | null,
  withinDays = 45
): SchoolCalendarEvent[] {
  const until = getHongKongDateKey(
    new Date(dateFromKey(fromDateKey).getTime() + withinDays * 86_400_000)
  );
  return getFirstTermEvents(calendar)
    .filter((e) => {
      const end = e.endDate || e.date;
      return end >= fromDateKey && e.date <= until;
    })
    .sort((a, b) => a.date.localeCompare(b.date) || a.id.localeCompare(b.id));
}

export function schoolClosedBanner(
  event: SchoolCalendarEvent | null
): BilingualText {
  return {
    en: event
      ? `No kindergarten today — ${formatEventLabel(event, "en")}. Stay home with Zizi; no drop-off or pick-up.`
      : "No kindergarten today. Stay home with Zizi; no drop-off or pick-up.",
    fil: event
      ? `Walang kindergarten ngayon — ${formatEventLabel(event, "fil")}. Sa bahay kasama si Zizi; walang hatid / sundo.`
      : "Walang kindergarten ngayon. Sa bahay kasama si Zizi; walang hatid / sundo.",
    zh: event
      ? `今日幼稚園停課 — ${formatEventLabel(event, "zh")}。在家照顧 Zizi；不用接送。`
      : "今日幼稚園停課。在家照顧 Zizi；不用接送。",
  };
}

export function weekdaySchoolClosedNote(reason: BilingualText): BilingualText {
  return {
    en: `No kindergarten — ${reason.en}`,
    fil: `Walang kindergarten — ${reason.fil}`,
    zh: `幼稚園停課 — ${reason.zh || reason.en}`,
  };
}
