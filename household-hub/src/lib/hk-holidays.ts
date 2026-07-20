/** Hong Kong general public holidays (2026–2027). Labour Day / 勞工假 = May 1. */
const HK_PUBLIC_HOLIDAYS = new Set([
  // 2026
  "2026-01-01",
  "2026-02-17",
  "2026-02-18",
  "2026-02-19",
  "2026-04-03",
  "2026-04-04",
  "2026-04-06",
  "2026-05-01", // 香港勞工節
  "2026-05-24",
  "2026-07-01",
  "2026-10-01",
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

export function isZiziDayOff(date = new Date()): boolean {
  const day = new Intl.DateTimeFormat("en-US", {
    timeZone: "Asia/Hong_Kong",
    weekday: "long",
  })
    .format(date)
    .toLowerCase();
  return day === "sunday" || isHongKongPublicHoliday(date);
}
