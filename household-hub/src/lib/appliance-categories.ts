import type { ApplianceKind, Lang } from "./types";

/** Display groups for the Tools tab (mapped from appliance `kind`). */
export type ApplianceCategory =
  | "cooking"
  | "cleaning"
  | "laundry"
  | "bathroom"
  | "other";

export const APPLIANCE_CATEGORY_ORDER: ApplianceCategory[] = [
  "cooking",
  "cleaning",
  "laundry",
  "bathroom",
  "other",
];

export const applianceCategoryMeta: Record<
  ApplianceCategory,
  { icon: string; en: string; fil: string; zh: string }
> = {
  cooking: {
    icon: "🍳",
    en: "Cooking",
    fil: "Pagluluto",
    zh: "煮食",
  },
  cleaning: {
    icon: "🧹",
    en: "Cleaning & air",
    fil: "Paglilinis at hangin",
    zh: "清潔與空氣",
  },
  laundry: {
    icon: "👕",
    en: "Laundry",
    fil: "Labada",
    zh: "洗衣",
  },
  bathroom: {
    icon: "🚿",
    en: "Bathroom",
    fil: "Banyo",
    zh: "浴室",
  },
  other: {
    icon: "🔌",
    en: "Other",
    fil: "Iba pa",
    zh: "其他",
  },
};

const kindToCategory: Record<ApplianceKind, ApplianceCategory> = {
  "rice-cooker": "cooking",
  "pressure-cooker": "cooking",
  "bread-machine": "cooking",
  "air-fryer": "cooking",
  "range-hood": "cooking",
  "water-dispenser": "cooking",
  vacuum: "cleaning",
  dehumidifier: "cleaning",
  "air-purifier": "cleaning",
  "washing-machine": "laundry",
  iron: "laundry",
  shower: "bathroom",
  other: "other",
};

export function applianceCategory(kind: ApplianceKind): ApplianceCategory {
  return kindToCategory[kind] ?? "other";
}

export function applianceCategoryLabel(
  category: ApplianceCategory,
  lang: Lang
): string {
  return applianceCategoryMeta[category][lang];
}
