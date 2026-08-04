import fs from "fs/promises";
import path from "path";
import { getSupabaseAdmin, isSupabaseConfigured } from "./supabase";
import { normalizeDinnerOverride } from "./dinner";
import type {
  AppContent,
  DinnerMenuOverride,
  DinnerMenuOverrides,
  DinnerRecipe,
  FrontendVisitItem,
  FrontendVisitLog,
  ShoppingChecklistState,
  WhatsAppInbox,
  WhatsAppInboxItem,
} from "./types";

const CONTENT_KEY = "content";
const RECIPES_KEY = "dinner_recipes";
const MENU_OVERRIDES_KEY = "dinner_menu_overrides";
const INBOX_KEY = "whatsapp_inbox";
const INBOX_MAX = 200;
const VISIT_LOG_KEY = "frontend_visit_log";
const VISIT_LOG_MAX = 500;
const SHOPPING_CHECKLIST_KEY = "shopping_checklist";
/** Keep checklist dates for this many days */
const SHOPPING_CHECKLIST_KEEP_DAYS = 21;

export type DataSource = "supabase" | "local";

function isGoodTranslation(text?: string): boolean {
  if (!text?.trim()) return false;
  if (/@|Email|sportbenzin|salmo\.ee/i.test(text)) return false;
  if (/orchid|ratio of garlic|rotten|Chiton/i.test(text)) return false;
  if (/pickpocket|WhatsApp Online|Gillette|Burning is better|triple-breasted/i.test(text))
    return false;
  if (/[\u4e00-\u9fff]/.test(text)) return false;
  return true;
}

/** Merge nameEn/nameFil from local seed when Supabase entries are missing or bad */
function recipeIngText(r: DinnerRecipe): string {
  return JSON.stringify(r.ingredients ?? []).toLowerCase();
}

/** Photo-corrected long beans & egg still missing abalone sauce on live → prefer seed */
function shouldPreferSeedLongBeansEgg(
  remote: DinnerRecipe,
  seed: DinnerRecipe
): boolean {
  if (remote.id !== "d-18" && seed.id !== "d-18") return false;
  const seedHasAbalone =
    recipeIngText(seed).includes("abalone") ||
    recipeIngText(seed).includes("鮑魚");
  const remoteHasAbalone =
    recipeIngText(remote).includes("abalone") ||
    recipeIngText(remote).includes("鮑魚");
  return seedHasAbalone && !remoteHasAbalone;
}

function mergeRecipeTranslations(
  remote: DinnerRecipe[],
  local: DinnerRecipe[]
): DinnerRecipe[] {
  const localMap = new Map(local.map((r) => [r.id, r]));
  const remoteIds = new Set(remote.map((r) => r.id));
  const merged = remote.map((r) => {
    const seed = localMap.get(r.id);
    if (!seed) return r;
    if (shouldPreferSeedLongBeansEgg(r, seed)) {
      return {
        ...r,
        name: seed.name || r.name,
        nameEn: seed.nameEn || r.nameEn,
        nameFil: seed.nameFil || r.nameFil,
        ingredients: seed.ingredients,
        prepNotes: seed.prepNotes,
        cookDevice: r.cookDevice || seed.cookDevice,
        cookSettings: r.cookSettings?.steps?.en
          ? r.cookSettings
          : seed.cookSettings,
      };
    }
    return {
      ...r,
      nameEn: isGoodTranslation(r.nameEn)
        ? r.nameEn
        : isGoodTranslation(seed.nameEn)
          ? seed.nameEn
          : r.nameEn,
      nameFil: isGoodTranslation(r.nameFil)
        ? r.nameFil
        : isGoodTranslation(seed.nameFil)
          ? seed.nameFil
          : r.nameFil,
      ingredients: r.ingredients?.length ? r.ingredients : seed.ingredients,
      prepNotes: r.prepNotes?.en || r.prepNotes?.fil ? r.prepNotes : seed.prepNotes,
      cookDevice: r.cookDevice || seed.cookDevice,
      cookSettings: r.cookSettings?.steps?.en
        ? r.cookSettings
        : seed.cookSettings,
    };
  });
  // Append seed-only recipes (e.g. new EPC17 set) without wiping Admin edits
  for (const seed of local) {
    if (!remoteIds.has(seed.id)) merged.push(seed);
  }
  return merged;
}

async function readLocalContent(): Promise<AppContent> {
  const raw = await fs.readFile(
    path.join(process.cwd(), "data", "content.json"),
    "utf-8"
  );
  return JSON.parse(raw) as AppContent;
}

async function readLocalRecipes(): Promise<DinnerRecipe[]> {
  const raw = await fs.readFile(
    path.join(process.cwd(), "data", "dinner-recipes.json"),
    "utf-8"
  );
  const parsed = JSON.parse(raw) as { recipes: DinnerRecipe[] };
  return parsed.recipes;
}

/** Only for one-time bootstrap of broken pre-Admin rows — never overrides newer Admin saves */
function isBrokenLegacyContent(content: AppContent): boolean {
  const monday = content.weeklySchedule?.find((d) => d.dayKey === "monday");
  const wake = monday?.tasks?.find((t) =>
    t.task.en.toLowerCase().includes("wake")
  );
  const wakeTime = wake?.startTime ?? wake?.time;
  if (wakeTime === "07:30") return true;
  if (!content.groundRules?.length) return true;
  if (content.groundRules.some((r) => !r.consequences?.en?.trim())) return true;
  return false;
}

function bootstrapFromLocal(remote: AppContent, local: AppContent): AppContent {
  return {
    ...remote,
    weeklySchedule: local.weeklySchedule,
    ziziSchool: local.ziziSchool,
    groundRules: local.groundRules,
    lastUpdated: new Date().toISOString(),
  };
}

const KINDERGARTEN_FIXES: [string, string][] = [
  ["Lam Tin Liang Leung Kindergarten", "Lam Tin Ling Liang Kindergarten"],
  ["Liang Leung Kindergarten", "Ling Liang Kindergarten"],
  ["藍田梁靓幼稚園", "藍田靈糧幼稚園"],
];

function rewriteKindergartenName(text: string | undefined): string | undefined {
  if (!text) return text;
  let out = text;
  for (const [from, to] of KINDERGARTEN_FIXES) {
    out = out.split(from).join(to);
  }
  return out;
}

function rewriteBilingualKindergarten<T extends { en?: string; fil?: string; zh?: string }>(
  value: T | undefined
): T | undefined {
  if (!value) return value;
  return {
    ...value,
    en: rewriteKindergartenName(value.en) ?? value.en,
    fil: rewriteKindergartenName(value.fil) ?? value.fil,
    zh: rewriteKindergartenName(value.zh) ?? value.zh,
  };
}

/** Fix misspelled kindergarten name in live Admin content without wiping other edits. */
function repairKindergartenNames(content: AppContent): {
  content: AppContent;
  changed: boolean;
} {
  const blob = JSON.stringify(content);
  if (!/Liang Leung|梁靓/.test(blob)) {
    // Still ensure zh school name exists when local has the correct one
    return { content, changed: false };
  }

  const weeklySchedule = content.weeklySchedule?.map((day) => ({
    ...day,
    tasks: day.tasks?.map((task) => ({
      ...task,
      task: rewriteBilingualKindergarten(task.task) ?? task.task,
      notes: rewriteBilingualKindergarten(task.notes),
    })),
  }));

  const hkLifeGuides = content.hkLifeGuides?.map((g) => ({
    ...g,
    title: rewriteBilingualKindergarten(g.title) ?? g.title,
    body: rewriteBilingualKindergarten(g.body) ?? g.body,
  }));

  const settlingChecklist = content.settlingChecklist?.map((item) => ({
    ...item,
    title: rewriteBilingualKindergarten(item.title) ?? item.title,
  }));

  const fixed: AppContent = {
    ...content,
    ziziSchool: rewriteBilingualKindergarten(content.ziziSchool) ?? content.ziziSchool,
    weeklySchedule: weeklySchedule ?? content.weeklySchedule,
    hkLifeGuides: hkLifeGuides ?? content.hkLifeGuides,
    settlingChecklist: settlingChecklist ?? content.settlingChecklist,
    lastUpdated: new Date().toISOString(),
  };

  return { content: fixed, changed: true };
}

/**
 * Live source of truth:
 * - With Supabase: Admin-saved rows win. Repo JSON is seed/fallback only.
 * - Without Supabase: local content.json.
 * - FORCE_SEED_FROM_LOCAL=1: force push local JSON into Supabase (intentional reset).
 * - Auto-merge may APPEND missing ids from seed; it must not wipe Admin collections.
 * - Agents: fetch /api/live → patch-live (Admin Save). Never treat content.json as live.
 */
export async function getContent(): Promise<AppContent> {
  if (!isSupabaseConfigured()) {
    return readLocalContent();
  }

  const supabase = getSupabaseAdmin();
  const { data, error } = await supabase
    .from("app_data")
    .select("data")
    .eq("key", CONTENT_KEY)
    .maybeSingle();

  if (error) throw error;

  const local = await readLocalContent();
  const forceSeed = process.env.FORCE_SEED_FROM_LOCAL === "1";

  if (!data) {
    if (forceSeed) {
      await saveContent(local);
    }
    return local;
  }

  const remote = data.data as AppContent;

  if (forceSeed) {
    const seeded = { ...local, lastUpdated: new Date().toISOString() };
    await saveContent(seeded);
    return seeded;
  }

  // One-time repair of legacy broken rows only — Admin saves always win after that
  if (isBrokenLegacyContent(remote)) {
    const fixed = bootstrapFromLocal(remote, local);
    saveContent(fixed).catch(() => {});
    return fixed;
  }

  // Fix misspelled kindergarten name (Liang Leung → Ling Liang / 靈糧) in live data
  // Only rewrite wrong strings inside remote — do NOT replace Admin's whole ziziSchool blob
  const kg = repairKindergartenNames(remote);
  if (kg.changed) {
    const withSchool: AppContent = {
      ...kg.content,
      ziziSchool: {
        ...kg.content.ziziSchool,
        // Fill zh from seed only if live is still missing zh after rewrite
        zh:
          kg.content.ziziSchool?.zh ||
          (local.ziziSchool?.en?.includes("Ling Liang")
            ? local.ziziSchool.zh
            : kg.content.ziziSchool?.zh),
      },
    };
    try {
      await saveContent(withSchool);
      return withSchool;
    } catch (err) {
      console.error("Failed to repair kindergarten name", err);
      return withSchool;
    }
  } else if (local.ziziSchool?.zh && !remote.ziziSchool?.zh) {
    const withSchool: AppContent = {
      ...remote,
      ziziSchool: { ...remote.ziziSchool, zh: local.ziziSchool.zh },
      lastUpdated: new Date().toISOString(),
    };
    try {
      await saveContent(withSchool);
      return withSchool;
    } catch {
      return withSchool;
    }
  }

  // Fill missing HK Life / preferences / appliances from local seed without wiping Admin edits
  const remoteGuideIds = new Set((remote.hkLifeGuides ?? []).map((g) => g.id));
  const missingGuides = (local.hkLifeGuides ?? []).filter(
    (g) => !remoteGuideIds.has(g.id)
  );
  const remoteCheckIds = new Set((remote.settlingChecklist ?? []).map((c) => c.id));
  const missingChecks = (local.settlingChecklist ?? []).filter(
    (c) => !remoteCheckIds.has(c.id)
  );
  const remoteHolidayIds = new Set(
    (remote.statutoryHolidays ?? []).map((h) => h.id)
  );
  const missingHolidays = (local.statutoryHolidays ?? []).filter(
    (h) => !remoteHolidayIds.has(h.id)
  );
  const remoteSalaryIds = new Set(
    (remote.salaryPayments ?? []).map((s) => s.id)
  );
  const missingSalaries = (local.salaryPayments ?? []).filter(
    (s) => !remoteSalaryIds.has(s.id)
  );
  const needsHkLifeSeed =
    (!remote.hkLifeGuides?.length && Boolean(local.hkLifeGuides?.length)) ||
    missingGuides.length > 0 ||
    missingChecks.length > 0 ||
    (!remote.statutoryHolidays?.length && Boolean(local.statutoryHolidays?.length)) ||
    missingHolidays.length > 0 ||
    (!remote.salaryPayments?.length && Boolean(local.salaryPayments?.length)) ||
    missingSalaries.length > 0 ||
    (!remote.emergencyContacts?.length && Boolean(local.emergencyContacts?.length)) ||
    (!remote.hkWeather && Boolean(local.hkWeather)) ||
    (!remote.homeArea && Boolean(local.homeArea));

  if (needsHkLifeSeed) {
    const guides =
      !remote.hkLifeGuides?.length && local.hkLifeGuides?.length
        ? local.hkLifeGuides
        : missingGuides.length
          ? [...(remote.hkLifeGuides ?? []), ...missingGuides].sort(
              (a, b) => a.priority - b.priority
            )
          : remote.hkLifeGuides;
    const checklist =
      !remote.settlingChecklist?.length && local.settlingChecklist?.length
        ? local.settlingChecklist
        : missingChecks.length
          ? [...(remote.settlingChecklist ?? []), ...missingChecks]
          : remote.settlingChecklist;
    const holidays =
      !remote.statutoryHolidays?.length && local.statutoryHolidays?.length
        ? local.statutoryHolidays
        : missingHolidays.length
          ? [...(remote.statutoryHolidays ?? []), ...missingHolidays].sort((a, b) =>
              a.date.localeCompare(b.date)
            )
          : remote.statutoryHolidays;
    const salaries =
      !remote.salaryPayments?.length && local.salaryPayments?.length
        ? local.salaryPayments
        : missingSalaries.length
          ? [...(remote.salaryPayments ?? []), ...missingSalaries].sort((a, b) =>
              a.period.localeCompare(b.period)
            )
          : remote.salaryPayments;
    const filled: AppContent = {
      ...remote,
      hkLifeGuides: guides,
      settlingChecklist: checklist,
      statutoryHolidays: holidays,
      salaryPayments: salaries,
      emergencyContacts: remote.emergencyContacts?.length
        ? remote.emergencyContacts
        : local.emergencyContacts,
      hkWeather: remote.hkWeather ?? local.hkWeather,
      homeArea: remote.homeArea ?? local.homeArea,
    };
    saveContent(filled).catch(() => {});
    return filled;
  }

  // Soft-fill summer/term calendar fields from seed if Admin never had them
  const needsSummerSchedule =
    !remote.weeklyScheduleSummer?.length &&
    Boolean(local.weeklyScheduleSummer?.length);
  const needsSchoolCalendar =
    !remote.schoolCalendar?.termStartsOn && Boolean(local.schoolCalendar?.termStartsOn);
  const needsSummerBanner =
    !remote.ziziSchoolSummer?.en && Boolean(local.ziziSchoolSummer?.en);
  const needsK3Banner =
    Boolean(local.ziziSchool?.en?.includes("K3")) &&
    !remote.ziziSchool?.en?.includes("K3");
  const hasBrokenThuIds = remote.weeklySchedule?.some((d) =>
    d.tasks?.some((t) => t.id === "thNaN")
  );
  const needsThuIdFix =
    Boolean(hasBrokenThuIds) &&
    Boolean(local.weeklySchedule?.find((d) => d.dayKey === "thursday"));

  if (
    needsSummerSchedule ||
    needsSchoolCalendar ||
    needsSummerBanner ||
    needsK3Banner ||
    needsThuIdFix
  ) {
    const filled: AppContent = {
      ...remote,
      weeklyScheduleSummer: needsSummerSchedule
        ? local.weeklyScheduleSummer
        : remote.weeklyScheduleSummer,
      schoolCalendar: needsSchoolCalendar ? local.schoolCalendar : remote.schoolCalendar,
      ziziSchoolSummer: needsSummerBanner
        ? local.ziziSchoolSummer
        : remote.ziziSchoolSummer,
      ziziSchool: needsK3Banner ? local.ziziSchool : remote.ziziSchool,
      weeklySchedule: needsThuIdFix
        ? remote.weeklySchedule.map((day) => {
            if (day.dayKey !== "thursday") return day;
            const seedThu = local.weeklySchedule.find((d) => d.dayKey === "thursday");
            if (!seedThu) return day;
            return {
              ...day,
              tasks: day.tasks.map((task, i) => {
                if (task.id !== "thNaN") return task;
                const seedTask = seedThu.tasks[i];
                return { ...task, id: seedTask?.id && seedTask.id !== "thNaN" ? seedTask.id : `th-fix-${i}` };
              }),
            };
          })
        : remote.weeklySchedule,
      lastUpdated: new Date().toISOString(),
    };
    try {
      await saveContent(filled);
      return filled;
    } catch (err) {
      console.error("Failed to seed summer schedule calendar", err);
      return filled;
    }
  }

  const needsPrefs =
    !remote.familyPreferences?.length && Boolean(local.familyPreferences?.length);
  const needsAppliances =
    !remote.appliances?.length && Boolean(local.appliances?.length);

  // APPEND-ONLY: never replace Admin's appliances list with repo seed
  const remoteApplianceIds = new Set((remote.appliances ?? []).map((a) => a.id));
  const missingAppliances = (local.appliances ?? []).filter(
    (a) => !remoteApplianceIds.has(a.id)
  );
  const remotePrefIds = new Set(
    (remote.familyPreferences ?? []).map((p) => p.id)
  );
  const missingPrefs = (local.familyPreferences ?? []).filter(
    (p) => !remotePrefIds.has(p.id)
  );

  if (needsPrefs || needsAppliances || missingAppliances.length || missingPrefs.length) {
    const filled: AppContent = {
      ...remote,
      familyPreferences: needsPrefs
        ? local.familyPreferences
        : missingPrefs.length
          ? [...(remote.familyPreferences ?? []), ...missingPrefs].sort(
              (a, b) => a.priority - b.priority
            )
          : remote.familyPreferences,
      appliances: needsAppliances
        ? local.appliances
        : missingAppliances.length
          ? [...(remote.appliances ?? []), ...missingAppliances].sort(
              (a, b) => a.priority - b.priority
            )
          : remote.appliances,
      lastUpdated: new Date().toISOString(),
    };
    try {
      await saveContent(filled);
      return filled;
    } catch (err) {
      console.error("Failed to seed preferences/appliances", err);
      return filled;
    }
  }

  // Patch only soft borrow rule wording — do NOT replace all Admin ground rules
  const remoteBorrow = remote.groundRules?.find((r) => r.id === "rule-1");
  const localBorrow = local.groundRules?.find((r) => r.id === "rule-1");
  const remoteBorrowBlob = `${remoteBorrow?.title?.en || ""}\n${remoteBorrow?.description?.en || ""}\n${remoteBorrow?.consequences?.en || ""}`;
  const needsRule1Refresh = Boolean(
    localBorrow &&
      remoteBorrow &&
      /Ask the family before borrowing|We will talk together first|practice together|Friendly reminder first|gentle written|retrain gently|help you find a safe way|Please do not borrow/i.test(
        remoteBorrowBlob
      )
  );

  if (needsRule1Refresh || (!remote.familyWelcome && local.familyWelcome)) {
    const filled: AppContent = {
      ...remote,
      groundRules: needsRule1Refresh
        ? (remote.groundRules ?? []).map((r) =>
            r.id === "rule-1" ? localBorrow! : r
          )
        : remote.groundRules,
      familyWelcome: remote.familyWelcome ?? local.familyWelcome,
      lastUpdated: new Date().toISOString(),
    };
    try {
      await saveContent(filled);
      return filled;
    } catch (err) {
      console.error("Failed to refresh ground rules from seed", err);
      return filled;
    }
  }

  return remote;
}

export async function getContentWithSource(): Promise<{
  content: AppContent;
  source: DataSource;
}> {
  const source: DataSource = isSupabaseConfigured() ? "supabase" : "local";
  const content = await getContent();
  return { content, source };
}

export async function saveContent(content: AppContent): Promise<AppContent> {
  const updated = { ...content, lastUpdated: new Date().toISOString() };

  if (!isSupabaseConfigured()) {
    throw new Error("Live database is not configured — cannot save");
  }

  const supabase = getSupabaseAdmin();
  const { error } = await supabase.from("app_data").upsert({
    key: CONTENT_KEY,
    data: updated,
    updated_at: new Date().toISOString(),
  });

  if (error) throw error;
  return updated;
}

export async function getDinnerRecipes(): Promise<DinnerRecipe[]> {
  if (!isSupabaseConfigured()) {
    return readLocalRecipes();
  }

  const supabase = getSupabaseAdmin();
  const { data, error } = await supabase
    .from("app_data")
    .select("data")
    .eq("key", RECIPES_KEY)
    .maybeSingle();

  if (error) throw error;
  if (!data) return readLocalRecipes();
  const parsed = data.data as { recipes: DinnerRecipe[] };
  const local = await readLocalRecipes();
  return mergeRecipeTranslations(parsed.recipes, local);
}

export async function saveDinnerRecipes(recipes: DinnerRecipe[]): Promise<void> {
  if (!isSupabaseConfigured()) {
    throw new Error("Live database is not configured");
  }

  const supabase = getSupabaseAdmin();
  const { error } = await supabase.from("app_data").upsert({
    key: RECIPES_KEY,
    data: { recipes },
    updated_at: new Date().toISOString(),
  });

  if (error) throw error;
}

export async function getDinnerMenuOverrides(): Promise<DinnerMenuOverrides> {
  const empty: DinnerMenuOverrides = {
    byDate: {},
    updatedAt: new Date().toISOString(),
  };
  if (!isSupabaseConfigured()) return empty;

  const supabase = getSupabaseAdmin();
  const { data, error } = await supabase
    .from("app_data")
    .select("data")
    .eq("key", MENU_OVERRIDES_KEY)
    .maybeSingle();

  if (error) throw error;
  if (!data?.data) return empty;
  const parsed = data.data as DinnerMenuOverrides;
  const rawByDate =
    parsed.byDate && typeof parsed.byDate === "object" ? parsed.byDate : {};
  const byDate: DinnerMenuOverrides["byDate"] = {};
  for (const [date, raw] of Object.entries(rawByDate)) {
    const normalized = normalizeDinnerOverride(raw, date);
    if (normalized) byDate[date] = normalized;
  }
  return {
    byDate,
    updatedAt: parsed.updatedAt || new Date().toISOString(),
  };
}

export async function saveDinnerMenuOverrides(
  overrides: DinnerMenuOverrides
): Promise<DinnerMenuOverrides> {
  if (!isSupabaseConfigured()) {
    throw new Error("Live database is not configured");
  }

  const updated: DinnerMenuOverrides = {
    byDate: overrides.byDate || {},
    updatedAt: new Date().toISOString(),
  };

  const supabase = getSupabaseAdmin();
  const { error } = await supabase.from("app_data").upsert({
    key: MENU_OVERRIDES_KEY,
    data: updated,
    updated_at: updated.updatedAt,
  });
  if (error) throw error;
  return updated;
}

export async function upsertDinnerMenuOverride(
  override: DinnerMenuOverride
): Promise<DinnerMenuOverrides> {
  const current = await getDinnerMenuOverrides();
  const normalized = normalizeDinnerOverride(override, override.date);
  if (!normalized) {
    throw new Error("Invalid dinner menu override");
  }
  current.byDate[normalized.date] = {
    ...normalized,
    updatedAt: new Date().toISOString(),
  };
  return saveDinnerMenuOverrides(current);
}

export async function clearDinnerMenuOverride(
  date: string
): Promise<DinnerMenuOverrides> {
  const current = await getDinnerMenuOverrides();
  delete current.byDate[date];
  return saveDinnerMenuOverrides(current);
}

export async function getWhatsAppInbox(): Promise<WhatsAppInbox> {
  if (!isSupabaseConfigured()) {
    return { items: [], updatedAt: new Date().toISOString() };
  }

  const supabase = getSupabaseAdmin();
  const { data, error } = await supabase
    .from("app_data")
    .select("data")
    .eq("key", INBOX_KEY)
    .maybeSingle();

  if (error) throw error;
  if (!data) return { items: [], updatedAt: new Date().toISOString() };
  const parsed = data.data as WhatsAppInbox;
  return {
    items: Array.isArray(parsed.items) ? parsed.items : [],
    updatedAt: parsed.updatedAt || new Date().toISOString(),
  };
}

export async function saveWhatsAppInbox(inbox: WhatsAppInbox): Promise<WhatsAppInbox> {
  if (!isSupabaseConfigured()) {
    throw new Error("Live database is not configured — cannot save inbox");
  }

  const updated: WhatsAppInbox = {
    items: inbox.items.slice(0, INBOX_MAX),
    updatedAt: new Date().toISOString(),
  };

  const supabase = getSupabaseAdmin();
  const { error } = await supabase.from("app_data").upsert({
    key: INBOX_KEY,
    data: updated,
    updated_at: updated.updatedAt,
  });

  if (error) throw error;
  return updated;
}

/** Prepend a WhatsApp inbox item (newest first), capped */
export async function appendWhatsAppInboxItem(
  item: Omit<WhatsAppInboxItem, "id" | "ts" | "status"> & {
    id?: string;
    ts?: string;
    status?: WhatsAppInboxItem["status"];
  }
): Promise<WhatsAppInboxItem> {
  const inbox = await getWhatsAppInbox();
  const full: WhatsAppInboxItem = {
    id: item.id || `wa-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    ts: item.ts || new Date().toISOString(),
    kind: item.kind,
    jid: item.jid,
    fromName: item.fromName,
    text: item.text.slice(0, 2000),
    answer: item.answer?.slice(0, 4000),
    link: item.link,
    category: item.category,
    status: item.status || "new",
  };
  inbox.items = [full, ...inbox.items].slice(0, INBOX_MAX);
  await saveWhatsAppInbox(inbox);
  return full;
}

export async function getFrontendVisitLog(): Promise<FrontendVisitLog> {
  if (!isSupabaseConfigured()) {
    return { items: [], updatedAt: new Date().toISOString() };
  }

  const supabase = getSupabaseAdmin();
  const { data, error } = await supabase
    .from("app_data")
    .select("data")
    .eq("key", VISIT_LOG_KEY)
    .maybeSingle();

  if (error) throw error;
  if (!data) return { items: [], updatedAt: new Date().toISOString() };
  const parsed = data.data as FrontendVisitLog;
  return {
    items: Array.isArray(parsed.items) ? parsed.items : [],
    updatedAt: parsed.updatedAt || new Date().toISOString(),
  };
}

export async function saveFrontendVisitLog(
  log: FrontendVisitLog
): Promise<FrontendVisitLog> {
  if (!isSupabaseConfigured()) {
    throw new Error("Live database is not configured — cannot save visit log");
  }

  const updated: FrontendVisitLog = {
    items: log.items.slice(0, VISIT_LOG_MAX),
    updatedAt: new Date().toISOString(),
  };

  const supabase = getSupabaseAdmin();
  const { error } = await supabase.from("app_data").upsert({
    key: VISIT_LOG_KEY,
    data: updated,
    updated_at: updated.updatedAt,
  });

  if (error) throw error;
  return updated;
}

/** Prepend a frontend visit (newest first), capped */
export async function appendFrontendVisit(
  item: Omit<FrontendVisitItem, "id" | "ts"> & {
    id?: string;
    ts?: string;
  }
): Promise<FrontendVisitItem> {
  const log = await getFrontendVisitLog();
  const full: FrontendVisitItem = {
    id: item.id || `visit-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    ts: item.ts || new Date().toISOString(),
    surface: item.surface,
    displayName: item.displayName?.slice(0, 80) || undefined,
    email: item.email?.slice(0, 120) || undefined,
    lang: item.lang?.slice(0, 8) || undefined,
    sessionId: item.sessionId?.slice(0, 64) || undefined,
  };
  log.items = [full, ...log.items].slice(0, VISIT_LOG_MAX);
  await saveFrontendVisitLog(log);
  return full;
}

function pruneShoppingChecklistDates(
  byDate: Record<string, Record<string, boolean>>
): Record<string, Record<string, boolean>> {
  const cutoff = new Date();
  cutoff.setUTCDate(cutoff.getUTCDate() - SHOPPING_CHECKLIST_KEEP_DAYS);
  const cutoffKey = cutoff.toISOString().slice(0, 10);
  const next: Record<string, Record<string, boolean>> = {};
  for (const [date, map] of Object.entries(byDate || {})) {
    if (date >= cutoffKey && map && typeof map === "object") {
      next[date] = map;
    }
  }
  return next;
}

export async function getShoppingChecklist(): Promise<ShoppingChecklistState> {
  if (!isSupabaseConfigured()) {
    return { byDate: {}, updatedAt: new Date().toISOString() };
  }

  const supabase = getSupabaseAdmin();
  const { data, error } = await supabase
    .from("app_data")
    .select("data")
    .eq("key", SHOPPING_CHECKLIST_KEY)
    .maybeSingle();

  if (error) throw error;
  if (!data) return { byDate: {}, updatedAt: new Date().toISOString() };
  const parsed = data.data as ShoppingChecklistState;
  return {
    byDate:
      parsed?.byDate && typeof parsed.byDate === "object" ? parsed.byDate : {},
    updatedAt: parsed?.updatedAt || new Date().toISOString(),
  };
}

export async function saveShoppingChecklist(
  state: ShoppingChecklistState
): Promise<ShoppingChecklistState> {
  if (!isSupabaseConfigured()) {
    throw new Error(
      "Live database is not configured — cannot save shopping checklist"
    );
  }

  const updated: ShoppingChecklistState = {
    byDate: pruneShoppingChecklistDates(state.byDate || {}),
    updatedAt: new Date().toISOString(),
  };

  const supabase = getSupabaseAdmin();
  const { error } = await supabase.from("app_data").upsert({
    key: SHOPPING_CHECKLIST_KEY,
    data: updated,
    updated_at: updated.updatedAt,
  });

  if (error) throw error;
  return updated;
}

/** Replace checked map for one dinner date (shared globally). */
export async function setShoppingChecklistForDate(
  date: string,
  checked: Record<string, boolean>
): Promise<ShoppingChecklistState> {
  const state = await getShoppingChecklist();
  const clean: Record<string, boolean> = {};
  for (const [id, on] of Object.entries(checked || {})) {
    if (on && id) clean[id.slice(0, 200)] = true;
  }
  state.byDate[date] = clean;
  return saveShoppingChecklist(state);
}
