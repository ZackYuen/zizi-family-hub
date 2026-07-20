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

export interface AppContent {
  helperName: string;
  familyName: string;
  groundRules: GroundRule[];
  weeklySchedule: DaySchedule[];
  weeklyMeals: DayMeals[];
  lastUpdated: string;
}
