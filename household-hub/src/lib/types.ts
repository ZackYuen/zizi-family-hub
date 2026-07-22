export type Lang = "en" | "fil" | "zh";

export interface BilingualText {
  en: string;
  fil: string;
  zh?: string;
}

export interface GroundRule {
  id: string;
  title: BilingualText;
  description: BilingualText;
  /** What happens if this rule is broken — must be stated clearly */
  consequences: BilingualText;
  category: "general" | "kitchen" | "childcare" | "safety";
  priority: number;
}

export interface ScheduleTask {
  id: string;
  /** @deprecated use startTime — kept for backward compatibility */
  time: string;
  startTime?: string;
  endTime?: string;
  fullDay?: boolean;
  task: BilingualText;
  notes?: BilingualText;
}

export interface DaySchedule {
  day: BilingualText;
  dayKey: string;
  tasks: ScheduleTask[];
}

export interface MealItem {
  id: string;
  meal: "breakfast" | "lunch" | "dinner" | "snack";
  dish: BilingualText;
  notes?: BilingualText;
}

export interface DayMeals {
  day: BilingualText;
  dayKey: string;
  meals: MealItem[];
}

export interface RecipeIngredient {
  /** Display name — prefer English for Charlene; optional FIL/ZH */
  en: string;
  fil?: string;
  zh?: string;
  /** Optional amount, e.g. "300g", "2 pcs" */
  qty?: string;
}

export interface DinnerRecipe {
  id: string;
  index: number;
  name: string;
  nameEn?: string;
  nameFil?: string;
  category: "Meat" | "Vegetable" | "Soup";
  subCategory?: string;
  link: string;
  /** Ingredients for shopping / prep reminder */
  ingredients?: RecipeIngredient[];
  /**
   * Simple EN/FIL/ZH cook notes for Charlene when the YouTube video is Cantonese.
   * Prefer short steps — not a full transcript.
   */
  prepNotes?: BilingualText;
}

export interface TonightMenu {
  date: string;
  meat: DinnerRecipe;
  vegetable: DinnerRecipe;
  soup: DinnerRecipe;
}

/** WhatsApp → Admin inbox (Q&A log + tip/recipe candidates) */
export type WhatsAppInboxKind =
  | "ask"
  | "note"
  | "tip_candidate"
  | "recipe_candidate";

export interface WhatsAppInboxItem {
  id: string;
  ts: string;
  kind: WhatsAppInboxKind;
  jid?: string;
  fromName?: string;
  text: string;
  answer?: string;
  /** For recipe candidates */
  link?: string;
  category?: DinnerRecipe["category"];
  status: "new" | "promoted" | "dismissed";
}

export interface WhatsAppInbox {
  items: WhatsAppInboxItem[];
  updatedAt: string;
}

export interface AppContent {
  /** Display name for Charlene (family member) — kept as helperName for API compatibility */
  helperName: string;
  familyName: string;
  /** Short welcome line under the header */
  familyWelcome?: BilingualText;
  ziziSchool: BilingualText;
  groundRules: GroundRule[];
  weeklySchedule: DaySchedule[];
  monthlyTasks: BilingualText[];
  lastUpdated: string;
  /** Where the family lives — for HK Life tips */
  homeArea?: BilingualText;
  hkLifeGuides?: HkLifeGuide[];
  settlingChecklist?: SettlingCheckItem[];
  emergencyContacts?: EmergencyContact[];
  hkWeather?: HkWeatherFlag;
}

export type HkLifeCategory =
  | "emergency"
  | "rights"
  | "weather"
  | "money"
  | "transport"
  | "shopping"
  | "health"
  | "culture";

export interface HkLifeGuide {
  id: string;
  category: HkLifeCategory;
  priority: number;
  area: "hk-general" | "kwun-tong";
  title: BilingualText;
  body: BilingualText;
  sourceUrl?: string;
  lastReviewed?: string;
}

export interface SettlingCheckItem {
  id: string;
  title: BilingualText;
  done: boolean;
}

export interface EmergencyContact {
  id: string;
  name: BilingualText;
  phone: string;
  note?: BilingualText;
}

export interface HkWeatherFlag {
  /** Manual flag from Admin when T8+ / black rain / family alert */
  alertActive: boolean;
  level: "none" | "t3" | "t8" | "black-rain" | "other";
  note: BilingualText;
}
