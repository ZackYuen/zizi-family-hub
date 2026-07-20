import type { Lang } from "./types";

export const labels = {
  appTitle: { en: "Household Guide", fil: "Gabay sa Bahay" },
  welcome: { en: "Welcome", fil: "Maligayang pagdating" },
  groundRules: { en: "Ground Rules", fil: "Mga Alituntunin" },
  schedule: { en: "Task Schedule", fil: "Iskedyul ng Gawain" },
  meals: { en: "Meals", fil: "Pagkain" },
  today: { en: "Today", fil: "Ngayon" },
  allDays: { en: "All Days", fil: "Lahat ng Araw" },
  breakfast: { en: "Breakfast", fil: "Almusal" },
  lunch: { en: "Lunch", fil: "Tanghalian" },
  dinner: { en: "Dinner", fil: "Hapunan" },
  snack: { en: "Snack", fil: "Merienda" },
  category: {
    general: { en: "General", fil: "Pangkalahatan" },
    kitchen: { en: "Kitchen", fil: "Kusina" },
    childcare: { en: "Childcare", fil: "Pag-aalaga kay Zizi" },
    safety: { en: "Safety", fil: "Kaligtasan" },
  },
  lastUpdated: { en: "Last updated", fil: "Huling update" },
  admin: { en: "Admin", fil: "Admin" },
  language: { en: "Language", fil: "Wika" },
  english: { en: "English", fil: "English" },
  filipino: { en: "Filipino", fil: "Filipino" },
  forHelper: { en: "Helper guide for Hong Kong", fil: "Gabay para sa katulong sa Hong Kong" },
} as const;

export function t(key: keyof typeof labels, lang: Lang): string {
  const val = labels[key];
  if (typeof val === "object" && "en" in val && "fil" in val) {
    return val[lang];
  }
  return String(val);
}

export function categoryLabel(
  category: keyof typeof labels.category,
  lang: Lang
): string {
  return labels.category[category][lang];
}

export function mealLabel(
  meal: "breakfast" | "lunch" | "dinner" | "snack",
  lang: Lang
): string {
  return labels[meal][lang];
}

export function getTodayDayKey(): string {
  const days = [
    "sunday",
    "monday",
    "tuesday",
    "wednesday",
    "thursday",
    "friday",
    "saturday",
  ];
  return days[new Date().getDay()];
}
