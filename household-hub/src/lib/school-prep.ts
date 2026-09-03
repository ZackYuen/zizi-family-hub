import type { AppContent, BilingualText, DaySchedule, ScheduleTask } from "./types";
import { localized } from "./localized-text";
import type { Lang } from "./types";

const PREP_EN = [
  "Take temperature",
  "Fill the temperature form",
  "Bring 1 dry towel + 1 wet towel",
  "Bring 2 spare masks",
  "Bring water",
  "Bring an empty food container for Zizi school tea time",
  "Help Zizi comb hair",
  "Put the pickup card in your own bag",
];

const PREP_FIL = [
  "Sukatin ang temperatura",
  "Punuan ang temperature paper",
  "Magdala ng 1 tuyong tuwalya + 1 basang tuwalya",
  "Magdala ng 2 extra na mask",
  "Magdala ng tubig",
  "Magdala ng walang lamang food container para sa tea time ni Zizi sa eskwela",
  "Suklayin ang buhok ni Zizi",
  "Ilagay ang pickup card sa sarili mong bag",
];

const PREP_ZH = [
  "量溫度",
  "填體溫紙",
  "帶乾／濕毛巾各一",
  "帶兩個口罩備用",
  "帶水",
  "帶空食物盒給孜孜學校茶點時間",
  "幫孜孜梳頭",
  "自己袋接送卡",
];

const TUE_EN = "Tuesday: wear sportswear";
const TUE_FIL = "Martes: magsuot ng sportswear";
const TUE_ZH = "逢星期二著運動衫";

function bullets(items: string[]): string {
  return items.map((s) => `• ${s}`).join("\n");
}

export function schoolPrepNotes(includeTuesdaySportswear: boolean): BilingualText {
  const en = [
    "Zizi school prep:",
    bullets(includeTuesdaySportswear ? [...PREP_EN, TUE_EN] : PREP_EN),
  ].join("\n");
  const fil = [
    "Prep ni Zizi sa eskwela:",
    bullets(includeTuesdaySportswear ? [...PREP_FIL, TUE_FIL] : PREP_FIL),
  ].join("\n");
  const zh = [
    "孜孜上學準備：",
    bullets(includeTuesdaySportswear ? [...PREP_ZH, TUE_ZH] : PREP_ZH),
  ].join("\n");
  return { en, fil, zh };
}

export const SCHOOL_PREP_TASK_IDS = [
  "m4",
  "t4",
  "w4",
  "th4",
  "f4",
  "m6",
  "t6",
  "w6",
  "th6",
  "f6",
] as const;

export const SCHOOL_PREP_TUESDAY_IDS = new Set(["t4", "t6"]);

function notesAreEmpty(notes?: BilingualText): boolean {
  if (!notes) return true;
  return !`${notes.en || ""}${notes.fil || ""}${notes.zh || ""}`.trim();
}

function seedNotesByTaskId(seed: AppContent): Map<string, BilingualText> {
  const map = new Map<string, BilingualText>();
  const collect = (days?: DaySchedule[]) => {
    for (const day of days || []) {
      for (const task of day.tasks || []) {
        if (task.notes && !notesAreEmpty(task.notes)) {
          map.set(task.id, task.notes);
        }
      }
    }
  };
  collect(seed.weeklySchedule);
  collect(seed.weeklyScheduleSummer);
  for (const tasks of Object.values(seed.scheduleDateOverrides || {})) {
    for (const task of tasks) {
      if (task.notes && !notesAreEmpty(task.notes)) {
        map.set(task.id, task.notes);
      }
    }
  }
  return map;
}

function applyNotesToDays(
  days: DaySchedule[] | undefined,
  notesById: Map<string, BilingualText>
): DaySchedule[] | undefined {
  if (!days) return days;
  return days.map((day) => ({
    ...day,
    tasks: (day.tasks || []).map((task) => {
      if (!notesAreEmpty(task.notes) || !notesById.has(task.id)) return task;
      return { ...task, notes: notesById.get(task.id) };
    }),
  }));
}

/** Copy seed task notes onto live tasks that have none (do not overwrite Admin). */
export function overlayMissingTaskNotes(
  live: AppContent,
  seed: AppContent
): AppContent {
  const notesById = seedNotesByTaskId(seed);
  if (!notesById.size) return live;
  const overrides = { ...(live.scheduleDateOverrides || {}) };
  for (const [date, tasks] of Object.entries(overrides)) {
    overrides[date] = (tasks || []).map((task) => {
      if (!notesAreEmpty(task.notes) || !notesById.has(task.id)) return task;
      return { ...task, notes: notesById.get(task.id) };
    });
  }
  return {
    ...live,
    weeklySchedule: applyNotesToDays(live.weeklySchedule, notesById) ?? live.weeklySchedule,
    weeklyScheduleSummer: applyNotesToDays(live.weeklyScheduleSummer, notesById),
    scheduleDateOverrides: Object.keys(overrides).length
      ? overrides
      : live.scheduleDateOverrides,
  };
}

const PREP_TASK_ID_SET = new Set<string>(SCHOOL_PREP_TASK_IDS);

function rewriteLunchBoxLine(notes: BilingualText): BilingualText {
  return {
    en: (notes.en || "").replace(
      /Bring the lunch box/g,
      "Bring an empty food container for Zizi school tea time"
    ),
    fil: (notes.fil || "").replace(
      /Magdala ng food box \/ lunch box/g,
      "Magdala ng walang lamang food container para sa tea time ni Zizi sa eskwela"
    ),
    zh: (notes.zh || "").replace(
      /帶食物盒(?!給孜孜)/g,
      "帶空食物盒給孜孜學校茶點時間"
    ),
  };
}

function mapPrepTasks(
  days: DaySchedule[] | undefined,
  rewrite: (task: ScheduleTask) => ScheduleTask
): { days: DaySchedule[] | undefined; changed: boolean } {
  if (!days) return { days, changed: false };
  let changed = false;
  const next = days.map((day) => ({
    ...day,
    tasks: (day.tasks || []).map((task) => {
      const rewritten = rewrite(task);
      if (rewritten !== task) changed = true;
      return rewritten;
    }),
  }));
  return { days: next, changed };
}

/** Fix already-saved school-prep notes that still say “bring lunch box”. */
export function rewriteStaleSchoolPrepLunchBox(content: AppContent): {
  content: AppContent;
  changed: boolean;
} {
  const rewriteTask = (task: ScheduleTask): ScheduleTask => {
    if (!PREP_TASK_ID_SET.has(task.id) || notesAreEmpty(task.notes)) return task;
    const nextNotes = rewriteLunchBoxLine(task.notes!);
    if (
      nextNotes.en === (task.notes?.en || "") &&
      nextNotes.fil === (task.notes?.fil || "") &&
      nextNotes.zh === (task.notes?.zh || "")
    ) {
      return task;
    }
    return { ...task, notes: nextNotes };
  };

  const week = mapPrepTasks(content.weeklySchedule, rewriteTask);
  const summer = mapPrepTasks(content.weeklyScheduleSummer, rewriteTask);
  const overrides = { ...(content.scheduleDateOverrides || {}) };
  let overrideChanged = false;
  for (const [date, tasks] of Object.entries(overrides)) {
    const next = (tasks || []).map(rewriteTask);
    if (next.some((t, i) => t !== (tasks || [])[i])) {
      overrides[date] = next;
      overrideChanged = true;
    }
  }
  const changed = week.changed || summer.changed || overrideChanged;
  if (!changed) return { content, changed: false };
  return {
    changed: true,
    content: {
      ...content,
      weeklySchedule: week.days ?? content.weeklySchedule,
      weeklyScheduleSummer: summer.days,
      scheduleDateOverrides: overrideChanged
        ? overrides
        : content.scheduleDateOverrides,
    },
  };
}

export function isSchoolPrepQuestion(question: string): boolean {
  const q = question.toLowerCase();
  return /school\s*prep|go to school prep|上學準備|上学准备|prep\s*(sa\s*)?(eskwela|school)|體溫|体温|量溫度|量温度|temperature\s*(form|paper|sheet)|towel|tuwalya|毛巾|口罩|spare\s*mask|lunch\s*box|food\s*box|food\s*container|tea\s*time|茶點|食物盒|接送卡|pickup\s*card|運動衫|sportswear|sukat(in)?\s*(ang\s*)?temperatura|suklay|梳頭|comb\s*(hair|zizi)|school\s*bag/.test(
    q
  );
}

export function schoolPrepAnswer(
  lang: Lang,
  todayTasks: ScheduleTask[] | undefined,
  todayDayKey: string
): string {
  const fromToday = (todayTasks || []).find(
    (t) => t.notes && /school prep|上學準備|prep ni zizi/i.test(t.notes.en || t.notes.zh || "")
  );
  const notes = fromToday?.notes || schoolPrepNotes(todayDayKey === "tuesday");
  const list = localized(notes, lang);
  if (lang === "fil") {
    return `11:30 — prep ni Zizi bago umalis ng 12:30 (K3).\n\n${list}`;
  }
  if (lang === "zh") {
    return `11:30 — 孜孜上學準備，12:30 出門（K3）。\n\n${list}`;
  }
  return `11:30 — Zizi school prep, then leave home at 12:30 (K3).\n\n${list}`;
}
