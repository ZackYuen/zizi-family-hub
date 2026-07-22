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
}

export interface TonightMenu {
  date: string;
  meat: DinnerRecipe;
  vegetable: DinnerRecipe;
  soup: DinnerRecipe;
}

export interface AppContent {
  helperName: string;
  familyName: string;
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
