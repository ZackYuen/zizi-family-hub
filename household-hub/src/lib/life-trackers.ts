import type {
  BilingualText,
  SalaryPaymentItem,
  StatutoryHolidayItem,
} from "./types";

/** Labour Department statutory holidays 2026 (15 days). */
const STAT_2026: {
  date: string;
  en: string;
  zh: string;
  fil: string;
  notes?: BilingualText;
}[] = [
  {
    date: "2026-01-01",
    en: "The first day of January",
    zh: "一月一日",
    fil: "Unang araw ng Enero",
  },
  {
    date: "2026-02-17",
    en: "Lunar New Year's Day",
    zh: "農曆年初一",
    fil: "Unang araw ng Lunar New Year",
  },
  {
    date: "2026-02-18",
    en: "The second day of Lunar New Year",
    zh: "農曆年初二",
    fil: "Ikalawang araw ng Lunar New Year",
  },
  {
    date: "2026-02-19",
    en: "The third day of Lunar New Year",
    zh: "農曆年初三",
    fil: "Ikatlong araw ng Lunar New Year",
  },
  {
    date: "2026-04-05",
    en: "Ching Ming Festival",
    zh: "清明節",
    fil: "Ching Ming Festival",
  },
  {
    date: "2026-04-06",
    en: "Easter Monday",
    zh: "復活節星期一",
    fil: "Easter Monday",
  },
  {
    date: "2026-05-01",
    en: "Labour Day",
    zh: "勞動節",
    fil: "Labour Day (Araw ng Manggagawa)",
  },
  {
    date: "2026-05-24",
    en: "The Birthday of the Buddha",
    zh: "佛誕",
    fil: "Kaarawan ni Buddha",
  },
  {
    date: "2026-06-19",
    en: "Tuen Ng Festival",
    zh: "端午節",
    fil: "Tuen Ng (Dragon Boat) Festival",
  },
  {
    date: "2026-07-01",
    en: "HKSAR Establishment Day",
    zh: "香港特別行政區成立紀念日",
    fil: "HKSAR Establishment Day",
  },
  {
    date: "2026-09-26",
    en: "The day following the Chinese Mid-Autumn Festival",
    zh: "中秋節翌日",
    fil: "Araw pagkatapos ng Mid-Autumn Festival",
  },
  {
    date: "2026-10-01",
    en: "National Day",
    zh: "國慶日",
    fil: "National Day",
  },
  {
    date: "2026-10-18",
    en: "Chung Yeung Festival",
    zh: "重陽節",
    fil: "Chung Yeung Festival",
    notes: {
      en: "Falls on Sunday — if Sunday is your rest day, Sir/Mum should grant the next day (19 Oct) as holiday.",
      zh: "適逢星期日 — 若星期日是休息日，Sir/Mum 應另放翌日（10月19日）。",
      fil: "Pumapatak sa Linggo — kung Linggo ang rest day, dapat magbigay sina Sir/Mum ng holiday sa susunod na araw (19 Okt).",
    },
  },
  {
    date: "2026-12-25",
    en: "Christmas Day (or Winter Solstice — Sir/Mum choose)",
    zh: "聖誕節（或冬至 — 由僱主選擇）",
    fil: "Christmas Day (o Winter Solstice — pipili si Sir/Mum)",
    notes: {
      en: "Employer chooses Winter Solstice (22 Dec) or Christmas Day (25 Dec). This list defaults to Christmas — change in Admin if needed.",
      zh: "僱主可選冬至（12月22日）或聖誕節（12月25日）。此清單預設聖誕 — 如需更改請在 Admin 修改。",
      fil: "Pipili ang employer ng Winter Solstice (22 Dis) o Christmas (25 Dis). Default dito ay Christmas — baguhin sa Admin kung kailangan.",
    },
  },
  {
    date: "2026-12-26",
    en: "The first weekday after Christmas Day",
    zh: "聖誕節後第一個周日",
    fil: "Unang weekday pagkatapos ng Christmas Day",
  },
];

const MONTH_NAMES: { en: string; zh: string; fil: string }[] = [
  { en: "January", zh: "一月", fil: "Enero" },
  { en: "February", zh: "二月", fil: "Pebrero" },
  { en: "March", zh: "三月", fil: "Marso" },
  { en: "April", zh: "四月", fil: "Abril" },
  { en: "May", zh: "五月", fil: "Mayo" },
  { en: "June", zh: "六月", fil: "Hunyo" },
  { en: "July", zh: "七月", fil: "Hulyo" },
  { en: "August", zh: "八月", fil: "Agosto" },
  { en: "September", zh: "九月", fil: "Setyembre" },
  { en: "October", zh: "十月", fil: "Oktubre" },
  { en: "November", zh: "十一月", fil: "Nobyembre" },
  { en: "December", zh: "十二月", fil: "Disyembre" },
];

/** Charlene just arrived — family tracks entitlement from this HK date. */
export const STATUTORY_HOLIDAY_ENTITLED_FROM_2026 = "2026-10-27";

export function buildStatutoryHolidays2026(
  entitledFrom = STATUTORY_HOLIDAY_ENTITLED_FROM_2026
): StatutoryHolidayItem[] {
  const notEntitledNote: BilingualText = {
    en: `Not entitled yet — Charlene’s entitlement starts ${entitledFrom} (after arrival).`,
    zh: `尚未享有 — Charlene 由 ${entitledFrom} 起才開始享有法定假（剛到港）。`,
    fil: `Hindi pa entitled — magsisimula ang entitlement ni Charlene sa ${entitledFrom} (pagkatapos dumating).`,
  };

  return STAT_2026.map((h) => {
    const compact = h.date.replace(/-/g, "").slice(4); // MMDD
    const entitled = h.date >= entitledFrom;
    return {
      id: `sh-2026-${compact}`,
      year: 2026,
      date: h.date,
      name: { en: h.en, zh: h.zh, fil: h.fil },
      entitled,
      taken: false,
      notes: entitled
        ? h.notes
        : h.notes
          ? {
              en: `${notEntitledNote.en}\n${h.notes.en}`,
              zh: `${notEntitledNote.zh}\n${h.notes.zh || h.notes.en}`,
              fil: `${notEntitledNote.fil}\n${h.notes.fil || h.notes.en}`,
            }
          : notEntitledNote,
    };
  });
}

export function isHolidayEntitled(item: StatutoryHolidayItem): boolean {
  return item.entitled !== false;
}

/** Default monthly salary rows (MAW reference HK$5,100 — confirm contract). */
export function buildSalaryPayments2026(
  amountHkd = 5100
): SalaryPaymentItem[] {
  return MONTH_NAMES.map((m, i) => {
    const month = String(i + 1).padStart(2, "0");
    const period = `2026-${month}`;
    return {
      id: `sal-2026-${month}`,
      year: 2026,
      period,
      label: {
        en: `${m.en} 2026 salary`,
        zh: `2026年${m.zh}薪金`,
        fil: `Sahod ${m.fil} 2026`,
      },
      amountHkd,
      received: false,
    };
  });
}

export function hongKongDateLabel(dateKey: string, lang: string): string {
  const [y, m, d] = dateKey.split("-").map(Number);
  if (!y || !m || !d) return dateKey;
  if (lang === "zh") return `${y}年${m}月${d}日`;
  if (lang === "fil") return `${d}/${m}/${y}`;
  return `${d} ${MONTH_NAMES[m - 1]?.en?.slice(0, 3) ?? m} ${y}`;
}
