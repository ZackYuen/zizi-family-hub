import fs from "fs/promises";
import path from "path";
import { getSupabaseAdmin, isSupabaseConfigured } from "./supabase";
import type {
  AppContent,
  DinnerRecipe,
  WhatsAppInbox,
  WhatsAppInboxItem,
} from "./types";

const CONTENT_KEY = "content";
const RECIPES_KEY = "dinner_recipes";
const INBOX_KEY = "whatsapp_inbox";
const INBOX_MAX = 200;

export type DataSource = "supabase" | "local";

function isGoodTranslation(text?: string): boolean {
  if (!text?.trim()) return false;
  if (/@|Email|sportbenzin|salmo\.ee/i.test(text)) return false;
  if (/orchid|ratio of garlic|rotten|Chiton/i.test(text)) return false;
  if (/[\u4e00-\u9fff]/.test(text)) return false;
  return true;
}

/** Merge nameEn/nameFil from local seed when Supabase entries are missing or bad */
function mergeRecipeTranslations(
  remote: DinnerRecipe[],
  local: DinnerRecipe[]
): DinnerRecipe[] {
  const localMap = new Map(local.map((r) => [r.id, r]));
  return remote.map((r) => {
    const seed = localMap.get(r.id);
    if (!seed) return r;
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
    };
  });
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

/**
 * Live source of truth:
 * - With Supabase: Admin-saved rows win. Repo JSON is seed/fallback only.
 * - Without Supabase: local content.json.
 * - FORCE_SEED_FROM_LOCAL=1: force push local JSON into Supabase (intentional reset).
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

  // Fill missing HK Life / preferences / appliances from local seed without wiping Admin edits
  const remoteGuideIds = new Set((remote.hkLifeGuides ?? []).map((g) => g.id));
  const missingGuides = (local.hkLifeGuides ?? []).filter(
    (g) => !remoteGuideIds.has(g.id)
  );
  const remoteCheckIds = new Set((remote.settlingChecklist ?? []).map((c) => c.id));
  const missingChecks = (local.settlingChecklist ?? []).filter(
    (c) => !remoteCheckIds.has(c.id)
  );
  const needsHkLifeSeed =
    (!remote.hkLifeGuides?.length && Boolean(local.hkLifeGuides?.length)) ||
    missingGuides.length > 0 ||
    missingChecks.length > 0 ||
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
    const filled: AppContent = {
      ...remote,
      hkLifeGuides: guides,
      settlingChecklist: checklist,
      emergencyContacts: remote.emergencyContacts?.length
        ? remote.emergencyContacts
        : local.emergencyContacts,
      hkWeather: remote.hkWeather ?? local.hkWeather,
      homeArea: remote.homeArea ?? local.homeArea,
    };
    saveContent(filled).catch(() => {});
    return filled;
  }

  const needsPrefs =
    !remote.familyPreferences?.length && Boolean(local.familyPreferences?.length);
  const needsAppliances =
    !remote.appliances?.length && Boolean(local.appliances?.length);
  // Refresh when live still has generic seed (no family model IDs)
  const needsApplianceModels = Boolean(
    local.appliances?.some((a) => a.id === "app-dyson-v12") &&
      remote.appliances?.length &&
      (!remote.appliances.some((a) => a.id === "app-dyson-v12") ||
        !remote.appliances.some((a) => a.id === "app-tefal-du4120g0") ||
        !remote.appliances.some((a) => a.id === "app-dyson-hp07") ||
        !remote.appliances.some((a) => a.id === "app-tefal-epc17") ||
        // Refresh when tips are still paragraph form (no bullet markers)
        !remote.appliances.some((a) => a.tips?.en?.includes("•")))
  );
  if (needsPrefs || needsAppliances || needsApplianceModels) {
    const filled: AppContent = {
      ...remote,
      familyPreferences: needsPrefs
        ? local.familyPreferences
        : remote.familyPreferences,
      appliances:
        needsAppliances || needsApplianceModels
          ? local.appliances
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

  // Force-refresh ground rules when live Supabase still has soft / old borrow wording
  const remoteBorrow = remote.groundRules?.find((r) => r.id === "rule-1");
  const localBorrow = local.groundRules?.find((r) => r.id === "rule-1");
  const remoteRuleBlob = remote.groundRules
    ?.map((r) => `${r.title?.en || ""}\n${r.description?.en || ""}\n${r.consequences?.en || ""}`)
    .join("\n") || "";
  const needsRuleRefresh = Boolean(
    localBorrow &&
      remoteBorrow &&
      (remoteBorrow.title?.en !== localBorrow.title?.en ||
        /Ask the family before borrowing|We will talk together first|practice together|Friendly reminder first|gentle written|retrain gently|help you find a safe way|Please do not borrow/i.test(
          remoteRuleBlob
        ))
  );

  if (needsRuleRefresh || (!remote.familyWelcome && local.familyWelcome)) {
    const filled: AppContent = {
      ...remote,
      groundRules: needsRuleRefresh ? local.groundRules : remote.groundRules,
      familyWelcome: remote.familyWelcome ?? local.familyWelcome,
      lastUpdated: new Date().toISOString(),
    };
    // Await so the next request sees firm rules (critical for Charlene's live app)
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
