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

/** Term vs summer holiday dates (Hong Kong calendar dates, YYYY-MM-DD). */
export interface SchoolCalendar {
  /** Inclusive last day of summer holiday */
  summerEndsOn: string;
  /** First day of school term */
  termStartsOn: string;
  /** e.g. K3 */
  grade: string;
  /** Kindergarten session */
  classSession: "AM" | "PM";
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
  /** Banner while summer holiday schedule is active */
  ziziSchoolSummer?: BilingualText;
  /** Summer / term switch dates + grade */
  schoolCalendar?: SchoolCalendar;
  groundRules: GroundRule[];
  /**
   * Soft family preferences / shopping tips — helpful guidance, NOT ground rules.
   * No consequences; shown below Ground Rules.
   */
  familyPreferences?: FamilyPreferenceTip[];
  /** How to use house tools / kitchen appliances */
  appliances?: ApplianceGuide[];
  /** School-term weekly schedule (used from termStartsOn) */
  weeklySchedule: DaySchedule[];
  /** Summer-holiday weekly schedule (used through summerEndsOn) */
  weeklyScheduleSummer?: DaySchedule[];
  monthlyTasks: BilingualText[];
  lastUpdated: string;
  /** Where the family lives — for HK Life tips */
  homeArea?: BilingualText;
  hkLifeGuides?: HkLifeGuide[];
  settlingChecklist?: SettlingCheckItem[];
  emergencyContacts?: EmergencyContact[];
  hkWeather?: HkWeatherFlag;
}

/** Soft preference — not a ground rule (no “If Broken”) */
export type PreferenceCategory = "shopping" | "food" | "kitchen" | "general";

export interface FamilyPreferenceTip {
  id: string;
  title: BilingualText;
  body: BilingualText;
  category: PreferenceCategory;
  priority: number;
}

export type ApplianceKind =
  | "vacuum"
  | "rice-cooker"
  | "pressure-cooker"
  | "washing-machine"
  | "bread-machine"
  | "air-fryer"
  | "water-dispenser"
  | "range-hood"
  | "dehumidifier"
  | "air-purifier"
  | "iron"
  | "shower"
  | "other";

export interface ApplianceGuide {
  id: string;
  kind: ApplianceKind;
  priority: number;
  title: BilingualText;
  /** Exact model if known, e.g. Dyson V12 */
  model?: string;
  /** How to use / daily tips */
  tips: BilingualText;
  /** Soft caution (still not a golden-rule consequence) */
  warnings?: BilingualText;
  /** Manual / support page */
  sourceUrl?: string;
  /** Optional photo / panel diagram (public path or absolute URL) */
  imageUrl?: string;
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
