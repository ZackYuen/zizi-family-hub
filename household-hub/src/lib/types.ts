export type Lang = "en" | "fil";

export interface BilingualText {
  en: string;
  fil: string;
}

export interface GroundRule {
  id: string;
  title: BilingualText;
  description: BilingualText;
  category: "general" | "kitchen" | "childcare" | "safety";
  priority: number;
}

export interface ScheduleTask {
  id: string;
  time: string;
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

export interface DinnerRecipe {
  id: string;
  index: number;
  name: string;
  nameEn?: string;
  nameFil?: string;
  category: "Meat" | "Vegetable" | "Soup";
  subCategory?: string;
  link: string;
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
}
