/** Hong Kong general public holidays + statutory holidays used as Charlene day-off. */
const HK_PUBLIC_HOLIDAYS = new Set([
  // 2026 — statutory + common general holidays
  "2026-01-01",
  "2026-02-17",
  "2026-02-18",
  "2026-02-19",
  "2026-04-03", // Good Friday (general)
  "2026-04-04", // Holy Saturday (general)
  "2026-04-05", // Ching Ming (statutory)
  "2026-04-06", // Easter Monday (statutory)
  "2026-05-01", // Labour Day
  "2026-05-24", // Buddha's Birthday
  "2026-06-19", // Tuen Ng
  "2026-07-01",
  "2026-09-26", // Day after Mid-Autumn
  "2026-10-01",
  "2026-10-18", // Chung Yeung (statutory; Sunday → alt 19 for rest-day workers)
  "2026-10-19",
  "2026-12-25",
  "2026-12-26",
  // 2027
  "2027-01-01",
  "2027-02-06",
  "2027-02-07",
  "2027-02-08",
  "2027-03-26",
  "2027-03-27",
  "2027-03-29",
  "2027-05-01",
  "2027-05-13",
  "2027-07-01",
  "2027-10-01",
  "2027-10-09",
  "2027-12-25",
  "2027-12-27",
]);

export function getHongKongDateKey(date = new Date()): string {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Hong_Kong",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(date);
}

export function isHongKongPublicHoliday(date = new Date()): boolean {
  return HK_PUBLIC_HOLIDAYS.has(getHongKongDateKey(date));
}

export function isHelperDayOff(date = new Date()): boolean {
  const day = new Intl.DateTimeFormat("en-US", {
    timeZone: "Asia/Hong_Kong",
    weekday: "long",
  })
    .format(date)
    .toLowerCase();
  return day === "sunday" || isHongKongPublicHoliday(date);
}

/** @deprecated Use isHelperDayOff — Sunday & HK holidays are Charlene's day off */
export const isZiziDayOff = isHelperDayOff;
