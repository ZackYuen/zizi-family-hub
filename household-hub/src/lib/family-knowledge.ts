import { getTodayDayKey, getHongKongTimeParts } from "./i18n";
import { isHelperDayOff } from "./hk-holidays";
import { generateTonightMenu } from "./dinner";
import { getContentWithSource, getDinnerRecipes } from "./data";
import { getRecipeDisplayName } from "./recipe-display";
import { resolveActiveSchedule, type ScheduleSeason } from "./school-calendar";
import type {
  AppContent,
  ApplianceGuide,
  DinnerRecipe,
  EmergencyContact,
  FamilyPreferenceTip,
  HkLifeGuide,
  HkWeatherFlag,
  SchoolCalendar,
  SettlingCheckItem,
  TonightMenu,
} from "./types";

export interface LiveFamilySnapshot {
  source: "supabase" | "local";
  lastUpdated: string;
  /** Current Hong Kong wall-clock, e.g. 2026-07-22 12:56 (Asia/Hong_Kong) */
  nowHongKong: string;
  helperName: string;
  familyName: string;
  isHelperDayOffToday: boolean;
  todayDayKey: string;
  scheduleSeason: ScheduleSeason;
  schoolCalendar: SchoolCalendar;
  ziziSchool: AppContent["ziziSchool"];
  todaySchedule: AppContent["weeklySchedule"][0] | null;
  groundRules: AppContent["groundRules"];
  familyPreferences: FamilyPreferenceTip[];
  appliances: ApplianceGuide[];
  monthlyTasks: AppContent["monthlyTasks"];
  tonight: TonightMenu | null;
  recipeCount: number;
  homeArea?: AppContent["homeArea"];
  hkLifeGuides: HkLifeGuide[];
  settlingChecklist: SettlingCheckItem[];
  emergencyContacts: EmergencyContact[];
  hkWeather?: HkWeatherFlag;
}

function formatNowHongKong(date = new Date()): string {
  const datePart = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Hong_Kong",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(date);
  const { hour, minute } = getHongKongTimeParts(date);
  const hh = String(hour).padStart(2, "0");
  const mm = String(minute).padStart(2, "0");
  return `${datePart} ${hh}:${mm} (Asia/Hong_Kong)`;
}

function ingredientLine(recipe: DinnerRecipe, lang: "en" | "fil" = "en"): string[] {
  if (!recipe.ingredients?.length) return [];
  return recipe.ingredients.map((ing) => {
    const name =
      lang === "fil"
        ? ing.fil || ing.en || ing.zh || ""
        : ing.en || ing.fil || ing.zh || "";
    return ing.qty ? `${name} (${ing.qty})` : name;
  });
}

export async function buildLiveSnapshot(): Promise<LiveFamilySnapshot> {
  const { content, source } = await getContentWithSource();
  const recipes = await getDinnerRecipes();
  const tonight = recipes.length ? generateTonightMenu(recipes) : null;
  const dayOff = isHelperDayOff();
  const dayKey = dayOff ? "sunday" : getTodayDayKey();
  const active = resolveActiveSchedule(content);
  const todaySchedule =
    active.schedule.find((d) => d.dayKey === dayKey) ?? null;

  return {
    source,
    lastUpdated: content.lastUpdated,
    nowHongKong: formatNowHongKong(),
    helperName: content.helperName,
    familyName: content.familyName,
    isHelperDayOffToday: dayOff,
    todayDayKey: dayKey,
    scheduleSeason: active.season,
    schoolCalendar: active.calendar,
    ziziSchool: active.ziziSchool,
    todaySchedule,
    groundRules: content.groundRules,
    familyPreferences: content.familyPreferences ?? [],
    appliances: content.appliances ?? [],
    monthlyTasks: content.monthlyTasks,
    tonight,
    recipeCount: recipes.length,
    homeArea: content.homeArea,
    hkLifeGuides: content.hkLifeGuides ?? [],
    settlingChecklist: content.settlingChecklist ?? [],
    emergencyContacts: content.emergencyContacts ?? [],
    hkWeather: content.hkWeather,
  };
}

/** Plain-text knowledge pack for the ask / WhatsApp agent */
export function snapshotToKnowledgeText(snap: LiveFamilySnapshot): string {
  const lines: string[] = [];
  lines.push(`Family: ${snap.familyName}`);
  lines.push(`Family member (Charlene): ${snap.helperName}`);
  lines.push(
    "Tone: Charlene is treated as a member of the family, not labeled as a 'helper' in replies. Say Charlene / family member. Do not use 姐姐."
  );
  if (snap.homeArea?.en) lines.push(`Home area: ${snap.homeArea.en}`);
  lines.push(`Data source: ${snap.source === "supabase" ? "live Admin" : "local"}`);
  lines.push(
    `CURRENT Hong Kong date/time (use this for "what time is it"): ${snap.nowHongKong}`
  );
  lines.push(
    `Admin data lastUpdated (NOT the current clock — ignore for time-of-day questions): ${snap.lastUpdated}`
  );
  lines.push(`Today key: ${snap.todayDayKey}`);
  lines.push(
    `Schedule season: ${snap.scheduleSeason === "summer" ? "SUMMER HOLIDAY (no kindergarten)" : "SCHOOL TERM"}`
  );
  lines.push(
    `School calendar: summer ends ${snap.schoolCalendar.summerEndsOn}; term starts ${snap.schoolCalendar.termStartsOn}; grade ${snap.schoolCalendar.grade} ${snap.schoolCalendar.classSession}`
  );
  lines.push(
    `Charlene day off today (Sunday / HK public holiday): ${snap.isHelperDayOffToday ? "YES" : "NO"}`
  );
  if (snap.hkWeather?.alertActive) {
    lines.push(
      `WEATHER ALERT ACTIVE (level=${snap.hkWeather.level}): ${snap.hkWeather.note.en} / ${snap.hkWeather.note.fil}`
    );
  }
  lines.push("");
  lines.push(
    'For "what should I do now?" / current task: pick the schedule item whose start–end covers CURRENT Hong Kong time. If in a gap, say so and give the NEXT upcoming task only — do not dump the whole day.'
  );
  lines.push(
    "HK life / FDH tips below are general guidance. For legal/contract specifics, tell Charlene to confirm with Sir/Mum or official Labour Department sources. Never invent visa/immigration advice."
  );
  lines.push("");
  lines.push("Zizi school:");
  lines.push(`- EN: ${snap.ziziSchool.en}`);
  lines.push(`- FIL: ${snap.ziziSchool.fil}`);
  lines.push("");

  if (snap.todaySchedule) {
    lines.push(`Today's schedule (${snap.todaySchedule.day.en}):`);
    for (const t of snap.todaySchedule.tasks) {
      const range = t.fullDay
        ? "All day"
        : `${t.startTime ?? t.time}${t.endTime ? `–${t.endTime}` : ""}`;
      lines.push(`- ${range}: ${t.task.en}`);
      if (t.task.fil) lines.push(`  (FIL: ${t.task.fil})`);
    }
  }

  lines.push("");
  lines.push("Golden rules (serious — have consequences):");
  for (const r of snap.groundRules) {
    lines.push(`- ${r.title.en}: ${r.description.en}`);
    if (r.consequences?.en) lines.push(`  If Broken: ${r.consequences.en}`);
  }

  if (snap.familyPreferences.length) {
    lines.push("");
    lines.push(
      "Family preferences (SOFT tips only — NOT golden rules, no punishment):"
    );
    const sorted = [...snap.familyPreferences].sort(
      (a, b) => a.priority - b.priority
    );
    for (const p of sorted) {
      lines.push(`- [${p.category}] ${p.title.en}`);
      lines.push(`  EN: ${p.body.en}`);
      lines.push(`  FIL: ${p.body.fil}`);
    }
  }

  if (snap.appliances.length) {
    lines.push("");
    lines.push("House tools / appliances (how-to):");
    const sorted = [...snap.appliances].sort((a, b) => a.priority - b.priority);
    for (const a of sorted) {
      lines.push(
        `- [${a.kind}] ${a.title.en}${a.model ? ` (${a.model})` : ""}`
      );
      for (const tipLine of a.tips.en.split(/\n+/).filter(Boolean)) {
        lines.push(`  ${tipLine.trim()}`);
      }
      if (a.warnings?.en) {
        lines.push(`  Caution:`);
        for (const w of a.warnings.en.split(/\n+/).filter(Boolean)) {
          lines.push(`  ${w.trim()}`);
        }
      }
      if (a.sourceUrl) lines.push(`  Manual: ${a.sourceUrl}`);
    }
  }

  if (snap.hkLifeGuides.length) {
    lines.push("");
    lines.push("HK Life guides (Kwun Tong + FDH basics):");
    const sorted = [...snap.hkLifeGuides].sort((a, b) => a.priority - b.priority);
    for (const g of sorted) {
      lines.push(`- [${g.category}/${g.area}] ${g.title.en}`);
      lines.push(`  EN: ${g.body.en}`);
      lines.push(`  FIL: ${g.body.fil}`);
      if (g.sourceUrl) lines.push(`  Source: ${g.sourceUrl}`);
    }
  }

  if (snap.emergencyContacts.length) {
    lines.push("");
    lines.push("Emergency contacts:");
    for (const c of snap.emergencyContacts) {
      lines.push(
        `- ${c.name.en}: ${c.phone || "(add in Admin)"} ${c.note?.en ? `— ${c.note.en}` : ""}`
      );
    }
  }

  if (snap.settlingChecklist.length) {
    lines.push("");
    lines.push("Settling checklist (first weeks in HK):");
    for (const item of snap.settlingChecklist) {
      lines.push(`- [${item.done ? "done" : "todo"}] ${item.title.en}`);
    }
  }

  if (snap.monthlyTasks?.length) {
    lines.push("");
    lines.push("Monthly tasks:");
    for (const m of snap.monthlyTasks) lines.push(`- ${m.en}`);
  }

  if (snap.tonight) {
    lines.push("");
    lines.push(`Tonight's dinner (${snap.tonight.date}):`);
    for (const dish of [snap.tonight.meat, snap.tonight.vegetable, snap.tonight.soup]) {
      lines.push(
        `- ${dish.category}: ${getRecipeDisplayName(dish, "en")} / ${getRecipeDisplayName(dish, "fil")}`
      );
      const ings = ingredientLine(dish, "en");
      if (ings.length) lines.push(`  Ingredients: ${ings.join(", ")}`);
      else lines.push(`  Ingredients: (not listed yet — check recipe link ${dish.link})`);
      if (dish.prepNotes?.en || dish.prepNotes?.fil) {
        lines.push(
          `  Prep notes EN: ${dish.prepNotes.en || ""} | FIL: ${dish.prepNotes.fil || ""}`
        );
      }
      lines.push(`  Recipe video (may be Cantonese): ${dish.link}`);
    }
  }

  lines.push("");
  lines.push("Cooking help:");
  lines.push(
    "- YouTube recipe videos are often in Cantonese. Prefer ingredients + prepNotes for Charlene; she can still open the link for visuals."
  );
  lines.push("- If prepNotes are empty, tell her to follow the shopping list and ask Sir/Mum for steps.");

  lines.push("");
  lines.push("Important facts:");
  lines.push("- Zizi kindergarten: Mon–Fri PM class only. Walk from home is 30 minutes.");
  lines.push("- Drop-off by 13:00; pick up at 16:30.");
  lines.push("- Sunday and HK public holidays (香港勞工假) are Charlene day off — not about Zizi.");
  lines.push("- Zizi needs breakfast and lunch prepared by Charlene every morning on work days.");
  lines.push("- Do not invent rules. If unsure, tell Charlene to ask Sir or Mum.");
  lines.push(
    "- Family preferences are soft tips (shopping/food likes) — never describe them as golden rules or give “If Broken”."
  );
  lines.push(
    "- Appliance tips are how-to only; if buttons differ from the guide, tell Charlene to ask Sir/Mum."
  );

  return lines.join("\n");
}

export function findLifeGuide(
  guides: HkLifeGuide[],
  predicate: (g: HkLifeGuide) => boolean
): HkLifeGuide | undefined {
  return [...guides].sort((a, b) => a.priority - b.priority).find(predicate);
}
