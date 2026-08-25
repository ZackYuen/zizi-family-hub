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
  /**
   * WhatsApp group ping 1 hour before startTime when Zizi must go out
   * (kindergarten drop-off, drawing class leave-home). `false` opts out.
   * If omitted, leave-home/class tasks are still detected from the task text.
   */
  outingReminder?: boolean;
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
  /**
   * Optional Tools appliance id (e.g. app-tefal-epc17).
   * Meals shows a “cook with this device” guide when set.
   */
  cookDevice?: string;
  /**
   * Per-dish settings for Easy Fry / EPC17 (mode, °C, minutes, steps).
   * Shown on the Meals card instead of the generic device howto.
   */
  cookSettings?: RecipeCookSettings;
}

/** Dish-specific appliance settings (not the shared device manual). */
export interface RecipeCookSettings {
  /** e.g. Air Fry / Grill / HI-P / LO-P / Steam / Brown / Reheat */
  mode: BilingualText;
  /** e.g. "180" or "160–180" — omit for pressure modes that don't use °C */
  tempC?: string;
  /** e.g. "18–25" or "up to 10" */
  minutes: string;
  /** Numbered steps for this dish only */
  steps: BilingualText;
}

export interface TonightMenu {
  date: string;
  /** Default random = one item; Admin override may be 0..n */
  meat: DinnerRecipe[];
  vegetable: DinnerRecipe[];
  soup: DinnerRecipe[];
  /** True when Admin picked dishes for this date instead of date-hash random */
  overridden?: boolean;
}

/** Admin override for a calendar date (Hong Kong YYYY-MM-DD) */
export interface DinnerMenuOverride {
  date: string;
  /** Preferred: 0..n recipe IDs per category */
  meatIds: string[];
  vegetableIds: string[];
  soupIds: string[];
  /**
   * @deprecated legacy singular — migrated to *Ids on read
   */
  meatId?: string;
  /** @deprecated */
  vegetableId?: string;
  /** @deprecated */
  soupId?: string;
  updatedAt?: string;
}

export interface DinnerMenuOverrides {
  /** keyed by date YYYY-MM-DD */
  byDate: Record<string, DinnerMenuOverride>;
  updatedAt: string;
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

/** Frontend app visit log (Admin → Visits) */
export type FrontendVisitSurface =
  | "open"
  | "howto"
  | "schedule"
  | "meals"
  | "tools"
  | "ask"
  | "hkLife"
  | "rules";

export interface FrontendVisitItem {
  id: string;
  ts: string;
  /** What they opened */
  surface: FrontendVisitSurface;
  displayName?: string;
  email?: string;
  lang?: string;
  /** Browser session id (same tab/session) */
  sessionId?: string;
}

export interface FrontendVisitLog {
  items: FrontendVisitItem[];
  updatedAt: string;
}

/** Shared Meals shopping / prep checklist (by dinner date) */
export interface ShoppingChecklistState {
  /** date YYYY-MM-DD → itemId → checked */
  byDate: Record<string, Record<string, boolean>>;
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
   * Soft family preferences / shopping tips — helpful guidance, NOT House Rules.
   * No consequences; shown below House Rules.
   */
  familyPreferences?: FamilyPreferenceTip[];
  /** How to use house tools / kitchen appliances */
  appliances?: ApplianceGuide[];
  /** School-term weekly schedule (used from termStartsOn) */
  weeklySchedule: DaySchedule[];
  /** Summer-holiday weekly schedule (used through summerEndsOn) */
  weeklyScheduleSummer?: DaySchedule[];
  /**
   * One-off day plans by HK date (YYYY-MM-DD).
   * When set, replaces that day's tasks from the weekly template (Schedule + Ask).
   */
  scheduleDateOverrides?: Record<string, ScheduleTask[]>;
  monthlyTasks: BilingualText[];
  lastUpdated: string;
  /** Where the family lives — for HK Life tips */
  homeArea?: BilingualText;
  /**
   * Quick Google Maps links for key places (home, kindergarten, YATA, AEON…).
   * Shown in HK Life; editable in Admin → HK Life.
   */
  places?: PlaceMapLink[];
  hkLifeGuides?: HkLifeGuide[];
  settlingChecklist?: SettlingCheckItem[];
  /** 2026+ statutory holidays — tap to confirm taken */
  statutoryHolidays?: StatutoryHolidayItem[];
  /** YYYY-MM-DD — Charlene entitled to statutory holidays from this date */
  statutoryHolidayEntitledFrom?: string;
  /** Monthly salary rows — tap to confirm receipt */
  salaryPayments?: SalaryPaymentItem[];
  emergencyContacts?: EmergencyContact[];
  hkWeather?: HkWeatherFlag;
  /**
   * Access control — Admin methods, frontend login requirement, and users.
   * Edited under Admin → Access.
   */
  adminAuth?: AdminAuthSettings;
  /**
   * When true, WhatsApp bot (and Meta WhatsApp webhook) stay silent —
   * no replies to ? / @bot. In-app Ask still works.
   * Edited under Admin → Settings.
   */
  whatsappBotPaused?: boolean;
}

/** One person who may use Admin and/or the Charlene frontend app */
export interface AccessUser {
  id: string;
  email: string;
  /** Optional display name */
  name?: string;
  /** May sign into Admin (Google) */
  admin: boolean;
  /** May sign into frontend when frontend login is required */
  frontend: boolean;
  /** Soft disable without deleting */
  enabled: boolean;
}

/** Access / login config (stored in AppContent.adminAuth) */
export interface AdminAuthSettings {
  /** Shared ADMIN_PASSWORD login for Admin */
  passwordEnabled: boolean;
  /** Google login for Admin */
  googleEnabled: boolean;
  /** Enter Admin without credentials */
  skipLogin: boolean;
  /**
   * @deprecated Prefer `users` with admin:true — still read for migration
   */
  googleAllowlist?: string[];
  /** Require Google (or future methods) to open the family app */
  frontendLoginRequired: boolean;
  /** Show Google on frontend login (when required) */
  frontendGoogleEnabled: boolean;
  /** Family members — add/remove/update in Admin → Access */
  users: AccessUser[];
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
  | "gas-hob"
  | "dehumidifier"
  | "air-purifier"
  | "iron"
  | "shower"
  | "other";

export interface AppliancePanelButton {
  /** Display number on the panel map */
  n: number;
  en: string;
  fil: string;
  zh: string;
  hintEn?: string;
  hintFil?: string;
  hintZh?: string;
}

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
  /**
   * Optional external photo / diagram URL.
   * Prefer `panelButtons` (inline) — external images often break on alternate hosts.
   */
  imageUrl?: string;
  /** Numbered control / panel map rendered inline in Tools */
  panelButtons?: AppliancePanelButton[];
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

/** Named place with a Maps URL (Google Maps search / share link) */
export interface PlaceMapLink {
  id: string;
  priority: number;
  name: BilingualText;
  /** Short hint under the name (e.g. “near MTR — ask Sir/Mum for exact pin”) */
  note?: BilingualText;
  /** Full https URL — opens in Maps app / browser */
  mapsUrl: string;
}

export interface SettlingCheckItem {
  id: string;
  title: BilingualText;
  done: boolean;
}

/** Statutory holiday entitlement — confirm when taken / alt holiday used */
export interface StatutoryHolidayItem {
  id: string;
  year: number;
  /** YYYY-MM-DD (Hong Kong) */
  date: string;
  name: BilingualText;
  /**
   * False when this holiday falls before Charlene’s entitlement start
   * (family: entitled from 2026-10-27 after arrival).
   * Default true when omitted (legacy rows).
   */
  entitled?: boolean;
  /** Charlene / family confirm this holiday was taken (or alt day taken) */
  taken: boolean;
  takenOn?: string;
  /** Optional alternative holiday date if she worked on the statutory day */
  altDate?: string;
  notes?: BilingualText;
}

/** Monthly salary — confirm receipt */
export interface SalaryPaymentItem {
  id: string;
  year: number;
  /** YYYY-MM */
  period: string;
  label: BilingualText;
  amountHkd: number;
  /** Expected or actual pay date YYYY-MM-DD */
  payDate?: string;
  received: boolean;
  receivedOn?: string;
  notes?: BilingualText;
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
