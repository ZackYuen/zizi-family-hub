import type { Lang } from "./types";

type LabelSet = { en: string; fil: string; zh: string };

export const labels = {
  appTitle: { en: "Household Guide", fil: "Gabay sa Bahay", zh: "家庭指南" },
  welcome: { en: "Welcome", fil: "Maligayang pagdating", zh: "歡迎" },
  groundRules: { en: "Ground Rules", fil: "Mga Alituntunin", zh: "守則" },
  schedule: { en: "Task Schedule", fil: "Iskedyul ng Gawain", zh: "日程" },
  meals: { en: "Meals", fil: "Pagkain", zh: "膳食" },
  today: { en: "Today", fil: "Ngayon", zh: "今天" },
  allDays: { en: "All Days", fil: "Lahat ng Araw", zh: "全部" },
  breakfast: { en: "Breakfast", fil: "Almusal", zh: "早餐" },
  lunch: { en: "Lunch", fil: "Tanghalian", zh: "午餐" },
  dinner: { en: "Dinner", fil: "Hapunan", zh: "晚餐" },
  snack: { en: "Snack", fil: "Merienda", zh: "小食" },
  category: {
    general: { en: "General", fil: "Pangkalahatan", zh: "一般" },
    kitchen: { en: "Kitchen", fil: "Kusina", zh: "廚房" },
    childcare: { en: "Childcare", fil: "Pag-aalaga kay Zizi", zh: "照顧 Zizi" },
    safety: { en: "Safety", fil: "Kaligtasan", zh: "安全" },
  },
  lastUpdated: { en: "Last updated", fil: "Huling update", zh: "最後更新" },
  admin: { en: "Admin", fil: "Admin", zh: "管理" },
  language: { en: "Language", fil: "Wika", zh: "語言" },
  english: { en: "English", fil: "English", zh: "English" },
  chinese: { en: "繁體中文", fil: "繁體中文", zh: "繁體中文" },
  filipino: { en: "Filipino", fil: "Filipino", zh: "Filipino" },
  forHelper: {
    en: "Helper guide for Hong Kong",
    fil: "Gabay para sa katulong sa Hong Kong",
    zh: "香港家務助理指南",
  },
} as const satisfies Record<string, LabelSet | Record<string, LabelSet>>;

function pickLabel(val: LabelSet, lang: Lang): string {
  return val[lang] ?? val.en;
}

export function t(key: keyof typeof labels, lang: Lang): string {
  const val = labels[key];
  if (val && typeof val === "object" && "en" in val) {
    return pickLabel(val as LabelSet, lang);
  }
  return String(val);
}

export function categoryLabel(
  category: keyof typeof labels.category,
  lang: Lang
): string {
  return pickLabel(labels.category[category], lang);
}

export function mealLabel(
  meal: "breakfast" | "lunch" | "dinner" | "snack",
  lang: Lang
): string {
  return pickLabel(labels[meal], lang);
}

export function uiLocale(lang: Lang): string {
  if (lang === "zh") return "zh-HK";
  if (lang === "fil") return "fil-PH";
  return "en-HK";
}

export function getTodayDayKey(timeZone = "Asia/Hong_Kong"): string {
  const weekday = new Intl.DateTimeFormat("en-US", {
    timeZone,
    weekday: "long",
  }).format(new Date());
  return weekday.toLowerCase();
}

export function getHongKongTimeParts(date = new Date()) {
  const parts = new Intl.DateTimeFormat("en-GB", {
    timeZone: "Asia/Hong_Kong",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).formatToParts(date);

  const hour = Number(parts.find((p) => p.type === "hour")?.value ?? 0);
  const minute = Number(parts.find((p) => p.type === "minute")?.value ?? 0);
  return { hour, minute, minutesSinceMidnight: hour * 60 + minute };
}
