import { getTodayDayKey, getHongKongTimeParts } from "./i18n";
import { isHelperDayOff } from "./hk-holidays";
import { hongKongDateKey, resolveTonightMenu, tonightDishes } from "./dinner";
import {
  getContentWithSource,
  getDinnerMenuOverrides,
  getDinnerRecipes,
} from "./data";
import { getRecipeDisplayName } from "./recipe-display";
import {
  extractSummerDrawingClass,
  resolveActiveSchedule,
  resolveTasksForDate,
  tasksIncludeDrawingClass,
  type ScheduleSeason,
  type SummerDrawingClassInfo,
} from "./school-calendar";
import {
  APPLIANCE_CATEGORY_ORDER,
  applianceCategory,
  applianceCategoryMeta,
} from "./appliance-categories";
import type {
  AppContent,
  ApplianceGuide,
  DinnerRecipe,
  EmergencyContact,
  FamilyPreferenceTip,
  HkLifeGuide,
  HkWeatherFlag,
  PlaceMapLink,
  SalaryPaymentItem,
  ScheduleTask,
  SchoolCalendar,
  SettlingCheckItem,
  StatutoryHolidayItem,
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
  /** HK YYYY-MM-DD */
  todayDateKey: string;
  scheduleSeason: ScheduleSeason;
  schoolCalendar: SchoolCalendar;
  ziziSchool: AppContent["ziziSchool"];
  /** Summer Wed/Fri drawing class from live schedule (null if none). */
  drawingClass: SummerDrawingClassInfo | null;
  /** True when today's plan comes from scheduleDateOverrides */
  todayFromOverride: boolean;
  /** True when today's override (or template) includes drawing class */
  todayHasDrawingClass: boolean;
  /** Upcoming one-off days (date → tasks), including today */
  scheduleDateOverrides: Record<string, ScheduleTask[]>;
  todaySchedule: AppContent["weeklySchedule"][0] | null;
  groundRules: AppContent["groundRules"];
  familyPreferences: FamilyPreferenceTip[];
  appliances: ApplianceGuide[];
  monthlyTasks: AppContent["monthlyTasks"];
  tonight: TonightMenu | null;
  recipeCount: number;
  homeArea?: AppContent["homeArea"];
  places: PlaceMapLink[];
  hkLifeGuides: HkLifeGuide[];
  settlingChecklist: SettlingCheckItem[];
  statutoryHolidays: StatutoryHolidayItem[];
  /** YYYY-MM-DD entitlement start for Charlene */
  statutoryHolidayEntitledFrom?: string;
  salaryPayments: SalaryPaymentItem[];
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
  const overrides = await getDinnerMenuOverrides();
  const dateKey = hongKongDateKey();
  const tonight = recipes.length
    ? resolveTonightMenu(recipes, dateKey, overrides.byDate[dateKey] ?? null)
    : null;
  const dayOff = isHelperDayOff();
  const dayKey = dayOff ? "sunday" : getTodayDayKey();
  const active = resolveActiveSchedule(content);
  const resolvedToday = resolveTasksForDate(content, dateKey);
  const templateDay =
    active.schedule.find((d) => d.dayKey === dayKey) ?? null;
  const todaySchedule = templateDay
    ? { ...templateDay, tasks: resolvedToday.tasks }
    : {
        day: { en: dayKey, fil: dayKey, zh: dayKey },
        dayKey,
        tasks: resolvedToday.tasks,
      };
  const drawingClass = extractSummerDrawingClass(
    content.weeklyScheduleSummer?.length
      ? content.weeklyScheduleSummer
      : active.season === "summer"
        ? active.schedule
        : null
  );
  const scheduleDateOverrides = content.scheduleDateOverrides ?? {};

  return {
    source,
    lastUpdated: content.lastUpdated,
    nowHongKong: formatNowHongKong(),
    helperName: content.helperName,
    familyName: content.familyName,
    isHelperDayOffToday: dayOff,
    todayDayKey: dayKey,
    todayDateKey: dateKey,
    scheduleSeason: active.season,
    schoolCalendar: active.calendar,
    ziziSchool: active.ziziSchool,
    drawingClass,
    todayFromOverride: resolvedToday.fromOverride,
    todayHasDrawingClass: tasksIncludeDrawingClass(resolvedToday.tasks),
    scheduleDateOverrides,
    todaySchedule,
    groundRules: content.groundRules,
    familyPreferences: content.familyPreferences ?? [],
    appliances: content.appliances ?? [],
    monthlyTasks: content.monthlyTasks,
    tonight,
    recipeCount: recipes.length,
    homeArea: content.homeArea,
    places: content.places ?? [],
    hkLifeGuides: content.hkLifeGuides ?? [],
    settlingChecklist: content.settlingChecklist ?? [],
    statutoryHolidays: content.statutoryHolidays ?? [],
    statutoryHolidayEntitledFrom:
      content.statutoryHolidayEntitledFrom || "2026-10-27",
    salaryPayments: content.salaryPayments ?? [],
    emergencyContacts: content.emergencyContacts ?? [],
    hkWeather: content.hkWeather,
  };
}

/** Plain-text knowledge pack for the ask / WhatsApp agent */
export function snapshotToKnowledgeText(snap: LiveFamilySnapshot): string {
  const lines: string[] = [];
  const appUrl = (
    process.env.NEXT_PUBLIC_APP_URL ||
    process.env.OPENROUTER_SITE_URL ||
    "https://zizi-family-hub.vercel.app"
  ).replace(/\/$/, "");
  lines.push(`Family: ${snap.familyName}`);
  lines.push(`Family member (Charlene): ${snap.helperName}`);
  lines.push(
    "Tone: Charlene is treated as a member of the family, not labeled as a 'helper' in replies. Say Charlene / family member. Do not use 姐姐."
  );
  lines.push(
    `Family Hub website (Gabay sa Bahay) — share this when asked for the link/URL/app: ${appUrl}`
  );
  if (snap.homeArea?.en) lines.push(`Home area: ${snap.homeArea.en}`);
  if (snap.places.length) {
    lines.push("Google Maps places (share these links when Charlene asks how to get somewhere):");
    for (const p of [...snap.places].sort((a, b) => a.priority - b.priority)) {
      if (!p.mapsUrl?.trim()) continue;
      const note = p.note?.en ? ` — ${p.note.en}` : "";
      lines.push(`- ${p.name.en}${note}: ${p.mapsUrl.trim()}`);
    }
  }
  lines.push(
    "Home facts: ~660 sq ft Kwun Tong flat; family of 3 (Sir, Mum, Zizi) + Charlene live-in = 4 people; Charlene has own bedroom with AC; 3 ACs total; ~3 min walk to Kwun Tong MTR; linked to apm mall; first supermarket = YATA (一田) at apm (AEON only if needed)."
  );
  lines.push(
    "Zizi meals (work days, not Charlene day off): simple breakfast (egg/pancake/siumai/蕃薯 etc.) + morning milk with glass straw; lunch must have meat + vegetables (spaghetti/fried rice/noodle/烏冬 etc.); dinner = Meals tab (default 1 meat + 1 vegetable + 1 soup; Admin may add/remove dishes)."
  );
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

  if (snap.drawingClass) {
    const d = snap.drawingClass;
    lines.push("Summer drawing class (from live Admin schedule):");
    lines.push(`- Days: ${d.daysEn} (${d.daysFil})`);
    lines.push(`- Class: ${d.classStart}–${d.classEnd}`);
    lines.push(`- Leave home: ~${d.leaveStart}–${d.leaveEnd}`);
    lines.push(`- Venue EN: ${d.venue.en}`);
    if (d.venue.zh) lines.push(`- Venue ZH: ${d.venue.zh}`);
    lines.push("");
  }

  const upcomingOverrides = Object.entries(snap.scheduleDateOverrides || {})
    .filter(([d]) => d >= snap.todayDateKey)
    .sort(([a], [b]) => a.localeCompare(b));
  if (upcomingOverrides.length) {
    lines.push(
      "ONE-OFF schedule changes (these REPLACE the usual day — highest priority):"
    );
    for (const [date, tasks] of upcomingOverrides) {
      lines.push(`- ${date}${date === snap.todayDateKey ? " (TODAY)" : ""}:`);
      for (const t of tasks) {
        const range = t.fullDay
          ? "All day"
          : `${t.startTime ?? t.time}${t.endTime ? `–${t.endTime}` : ""}`;
        lines.push(`  · ${range}: ${t.task.en}`);
      }
    }
    lines.push("");
  }

  if (snap.todayFromOverride) {
    lines.push(
      "NOTE: Today's schedule is a one-off override (not the usual weekly template)."
    );
    if (!snap.todayHasDrawingClass) {
      lines.push("NOTE: No drawing class today (cancelled / replaced).");
    }
    lines.push("");
  }

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
  lines.push("House Rules (serious — have consequences):");
  for (const r of snap.groundRules) {
    lines.push(`- ${r.title.en}: ${r.description.en}`);
    if (r.consequences?.en) lines.push(`  If Broken: ${r.consequences.en}`);
  }

  if (snap.familyPreferences.length) {
    lines.push("");
    lines.push(
      "Family preferences (SOFT tips only — NOT House Rules, no punishment):"
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
    lines.push("House tools / appliances (how-to, by category):");
    for (const category of APPLIANCE_CATEGORY_ORDER) {
      const items = snap.appliances
        .filter((a) => applianceCategory(a.kind) === category)
        .sort((a, b) => a.priority - b.priority);
      if (!items.length) continue;
      lines.push(`## ${applianceCategoryMeta[category].en}`);
      for (const a of items) {
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

  if (snap.statutoryHolidays.length) {
    lines.push("");
    lines.push(
      `Statutory holidays tracker (entitled from ${snap.statutoryHolidayEntitledFrom || "2026-10-27"}; confirm taken in HK Life):`
    );
    for (const h of snap.statutoryHolidays) {
      const status =
        h.entitled === false
          ? "not entitled"
          : h.taken
            ? "taken"
            : "not yet";
      lines.push(
        `- [${status}] ${h.date} ${h.name.en}${h.altDate ? ` (alt ${h.altDate})` : ""}`
      );
    }
  }

  if (snap.salaryPayments.length) {
    lines.push("");
    lines.push("Salary receipt tracker (confirm received in HK Life):");
    for (const s of snap.salaryPayments) {
      lines.push(
        `- [${s.received ? "received" : "not yet"}] ${s.period} HK$${s.amountHkd} ${s.label.en}`
      );
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
    for (const dish of tonightDishes(snap.tonight)) {
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
  lines.push(
    "- Tefal EPC17 electric pressure cooker: Meals recipes with cookDevice app-tefal-epc17 are marked “Cook with EPC17”. Use the removable bowl, ≥250 ml liquid, under MAX, valve down, wait full pressure release. Panel map is in Tools. Good for soups, soy chicken, beef stew, soft tofu veg."
  );
  lines.push(
    "- Tefal Easy Fry & Grill XXL air fryer: Meals recipes with cookDevice app-tefal-easy-fry-xxl are marked “Cook with Easy Fry”. Preheat optional; don’t overcrowd; shake/turn halfway; light oil only; basket is hot. Grill mode ~220°C. Panel map is in Tools. Good for wings, chops, fish, veg, dumplings, reheat ~160°C."
  );
  lines.push(
    "- Air fryer common sense: food can usually go directly in the basket (light oil OK). Aluminum foil or a small oven-safe tray is optional — do not block airflow or cover the heater; do not fully seal the basket. Do NOT invent where foil/containers are stored in THIS flat — if she asks “where is it?”, tell her to ask Sir/Mum."
  );

  lines.push("");
  lines.push("Important facts:");
  lines.push("- Zizi kindergarten: Mon–Fri PM class only. Walk from home is 30 minutes.");
  lines.push("- Drop-off by 13:00; pick up at 16:30.");
  lines.push("- Sunday and HK public holidays (香港勞工假) are Charlene day off — not about Zizi.");
  lines.push("- Zizi needs breakfast and lunch prepared by Charlene every morning on work days.");
  lines.push("- Do not invent rules. If unsure, tell Charlene to ask Sir or Mum.");
  lines.push(
    "- Family preferences are soft tips (shopping/food likes) — never describe them as House Rules or give “If Broken”."
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
