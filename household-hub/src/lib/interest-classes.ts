import type {
  AppContent,
  BilingualText,
  InterestClassTerm,
  Lang,
  ScheduleTask,
} from "./types";
import { localized } from "./localized-text";

export type { InterestClassTerm };

export interface InterestClassSpec {
  term: InterestClassTerm;
  noon: boolean;
  after: boolean;
}

/** 2026–2027 Term 1 — 藍田靈糧幼稚園 interest classes (enrolled). */
export const DEFAULT_INTEREST_CLASSES: InterestClassTerm[] = [
  {
    id: "percussion",
    dayKey: "monday",
    dates: [
      "2026-10-12",
      "2026-10-26",
      "2026-11-02",
      "2026-11-09",
      "2026-11-16",
      "2026-11-23",
      "2026-11-30",
      "2026-12-07",
      "2026-12-14",
      "2027-01-11",
      "2027-01-25",
    ],
    noonLabel: {
      en: "Percussion (snare + glockenspiel) 12:00–13:00",
      fil: "Percussion (snare + glockenspiel) 12:00–13:00",
      zh: "敲擊樂（小鼓及鋼片琴）12:00–13:00",
    },
  },
  {
    id: "sumblox-magic",
    dayKey: "tuesday",
    dates: [
      "2026-10-06",
      "2026-10-13",
      "2026-10-20",
      "2026-10-27",
      "2026-11-03",
      "2026-11-10",
      "2026-11-17",
      "2026-11-24",
      "2026-12-01",
      "2026-12-08",
      "2026-12-15",
      "2027-01-05",
      "2027-01-12",
      "2027-01-19",
      "2027-01-26",
      "2027-02-16",
    ],
    noonLabel: {
      en: "Sumblox math blocks 12:00–13:00",
      fil: "Sumblox math blocks 12:00–13:00",
      zh: "Sumblox 數學積木 12:00–13:00",
    },
    afterLabel: {
      en: "Magic class 16:30–17:30 — pick up at 17:30",
      fil: "Magic class 16:30–17:30 — sundo ng 17:30",
      zh: "魔術班 16:30–17:30 — 17:30 接",
    },
  },
  {
    id: "fencing",
    dayKey: "friday",
    dates: [
      "2026-10-02",
      "2026-10-09",
      "2026-10-16",
      "2026-10-30",
      "2026-11-06",
      "2026-11-20",
      "2026-12-04",
      "2026-12-11",
      "2027-01-08",
      "2027-01-15",
      "2027-01-22",
      "2027-01-29",
      "2027-02-19",
    ],
    noonLabel: {
      en: "Fencing 12:00–13:00",
      fil: "Fencing 12:00–13:00",
      zh: "劍擊 12:00–13:00",
    },
  },
];

export function getInterestClasses(
  content?: Pick<AppContent, "interestClasses"> | null
): InterestClassTerm[] {
  return content?.interestClasses?.length
    ? content.interestClasses
    : DEFAULT_INTEREST_CLASSES;
}

export function interestClassForDate(
  dateKey: string,
  content?: Pick<AppContent, "interestClasses"> | null
): InterestClassSpec | null {
  const term = getInterestClasses(content).find((c) => c.dates.includes(dateKey));
  if (!term) return null;
  return { term, noon: true, after: Boolean(term.afterLabel) };
}

function setTimes(task: ScheduleTask, start: string, end?: string): ScheduleTask {
  return {
    ...task,
    time: start,
    startTime: start,
    ...(end ? { endTime: end } : { endTime: task.endTime }),
  };
}

function withTask(
  task: ScheduleTask,
  label: BilingualText,
  start: string,
  end: string,
  extra: Partial<ScheduleTask> = {}
): ScheduleTask {
  return {
    ...setTimes(task, start, end),
    task: { ...task.task, ...label },
    ...extra,
  };
}

function idSlot(id: string): string | null {
  if (/^(m|t|w|th|f)3$/.test(id)) return "lunchPrep";
  if (/^(m|t|w|th|f)4$/.test(id)) return "prep";
  if (/^(m|t|w|th|f)5$/.test(id)) return "lunch";
  if (/^(m|t|w|th|f)6$/.test(id)) return "leave";
  if (/^(m|t|w|th|f)7$/.test(id)) return "housework";
  if (/^(m|t|w|th|f)8$/.test(id)) return "flex";
  if (/^(m|t|w|th|f)9$/.test(id)) return "pickup";
  if (/^(m|t|w|th|f)12$/.test(id)) return "tea";
  if (/^(m|t|w|th|f)13$/.test(id)) return "dinnerPrep";
  return null;
}

function prefixOf(tasks: ScheduleTask[]): string {
  const id = tasks[0]?.id || "m1";
  const m = id.match(/^(th|m|t|w|f)/);
  return m?.[1] || "m";
}

/** Shift a normal K3 PM day so Zizi can attend a 12:00 school interest class. */
export function applyInterestClassDay(
  tasks: ScheduleTask[],
  spec: InterestClassSpec
): ScheduleTask[] {
  const noon = localized(spec.term.noonLabel, "en");
  const noonZh = spec.term.noonLabel.zh || noon;
  const noonFil = spec.term.noonLabel.fil || noon;
  const prefix = prefixOf(tasks);
  const extra: ScheduleTask[] = [
    {
      id: `${prefix}-noon-class`,
      time: "12:00",
      startTime: "12:00",
      endTime: "13:00",
      task: {
        en: `Zizi: ${noon} at kindergarten, then PM class. Charlene: walk home.`,
        fil: `Si Zizi: ${noonFil} sa kindergarten, tapos PM class. Charlene: umuwi.`,
        zh: `孜孜：${noonZh}（校內），之後上下午班。Charlene：步行回家。`,
      },
    },
  ];
  if (spec.after && spec.term.afterLabel) {
    extra.push({
      id: `${prefix}-magic-class`,
      time: "16:30",
      startTime: "16:30",
      endTime: "17:30",
      task: {
        en: spec.term.afterLabel.en,
        fil: spec.term.afterLabel.fil,
        zh: spec.term.afterLabel.zh || spec.term.afterLabel.en,
      },
    });
  }

  const shifted = tasks.map((task) => {
    const slot = idSlot(task.id);
    if (slot === "lunchPrep") return setTimes(task, "10:15", "10:45");
    if (slot === "prep") return setTimes(task, "10:30", "11:00");
    if (slot === "lunch") return setTimes(task, "11:00", "11:25");
    if (slot === "leave") {
      return withTask(
        task,
        {
          en: `Leave home for noon class — walk 30 min, arrive ~11:55 for ${noon}, then Zizi stays for PM class`,
          fil: `Umalis para sa tanghaling klase — 30 min lakad, dumating ~11:55 para sa ${noonFil}, tapos mag-PM class si Zizi`,
          zh: `出門上午興趣班 — 步行約30分鐘，約11:55到校上${noonZh}，之後留校上下午班`,
        },
        "11:30",
        "12:00"
      );
    }
    if (slot === "housework") return setTimes(task, "12:30", task.endTime || "15:30");
    if (spec.after && slot === "pickup") {
      return {
        ...withTask(
          task,
          {
            en: "Leave home for pick-up — walk 30 min, pick up Zizi at 17:30 after magic class",
            fil: "Umalis para sunduin — 30 min lakad, sundo si Zizi ng 17:30 pagkatapos ng magic class",
            zh: "出門接放學 — 步行約30分鐘，17:30 魔術班完結後接 Zizi",
          },
          "17:00",
          "17:30"
        ),
        outingReminder: true,
      };
    }
    if (spec.after && slot === "tea") return setTimes(task, "17:30", "18:00");
    if (spec.after && slot === "dinnerPrep") return setTimes(task, "16:00", "16:55");
    return task;
  });

  return [...shifted, ...extra];
}

export function findLeaveHomeTask(tasks: ScheduleTask[] | undefined): ScheduleTask | undefined {
  return (tasks || []).find((t) =>
    /leave home for (afternoon|noon)|出門上/i.test(
      `${t.task?.en || ""} ${t.task?.zh || ""}`
    )
  );
}

export function findPickupLeaveTask(tasks: ScheduleTask[] | undefined): ScheduleTask | undefined {
  return (tasks || []).find((t) =>
    /leave home for pick-up|出門接/i.test(`${t.task?.en || ""} ${t.task?.zh || ""}`)
  );
}

export function findSchoolPrepTask(tasks: ScheduleTask[] | undefined): ScheduleTask | undefined {
  return (tasks || []).find((t) =>
    /school prep|上學準備|prep sa hapon/i.test(`${t.task?.en || ""} ${t.task?.zh || ""}`)
  );
}

export function isInterestClassQuestion(question: string): boolean {
  return /interest\s*class|興趣班|percussion|鋼片|敲擊|glockenspiel|sumblox|fencing|劍擊|magic\s*class|魔術|劍撃/i.test(
    question
  );
}

export function interestClassOverview(lang: Lang, dateKey?: string): string {
  const spec = dateKey ? interestClassForDate(dateKey) : null;
  if (lang === "fil") {
    const today = spec
      ? spec.after
        ? `Ngayon (${dateKey}): umalis 11:30 para sa ${spec.term.noonLabel.fil}. Sundo 17:30 (magic).`
        : `Ngayon (${dateKey}): umalis 11:30 para sa ${spec.term.noonLabel.fil}. Sundo 16:30.`
      : dateKey
        ? `Ngayon (${dateKey}): walang interest class — umalis 12:30, sundo 16:30.`
        : "";
    return [
      today,
      "K3 PM interest class (Term 1, school dates only):",
      "• Lunes: percussion 12:00–13:00 (first 12 Oct) — umalis 11:30.",
      "• Martes: Sumblox 12:00–13:00 + magic 16:30–17:30 (first 6 Oct) — umalis 11:30, sundo 17:30.",
      "• Biyernes: fencing 12:00–13:00 (first 2 Oct) — umalis 11:30.",
      "Wed/Thu and days with no class: umalis 12:30, sundo 16:30.",
    ]
      .filter(Boolean)
      .join("\n");
  }
  if (lang === "zh") {
    const today = spec
      ? spec.after
        ? `今日（${dateKey}）：11:30 出門上${spec.term.noonLabel.zh}。17:30 接（魔術）。`
        : `今日（${dateKey}）：11:30 出門上${spec.term.noonLabel.zh}。16:30 接。`
      : dateKey
        ? `今日（${dateKey}）：無興趣班 — 12:30 出門，16:30 接。`
        : "";
    return [
      today,
      "K3 下午班興趣班（第一期，以校方日期為準）：",
      "• 一：敲擊樂／鋼片琴 12:00–13:00（10月12日開課）— 11:30 出門。",
      "• 二：Sumblox 12:00–13:00 + 魔術 16:30–17:30（10月6日開課）— 11:30 出門，17:30 接。",
      "• 五：劍擊 12:00–13:00（10月2日開課）— 11:30 出門。",
      "三／四及沒有興趣班的日子：12:30 出門，16:30 接。",
    ]
      .filter(Boolean)
      .join("\n");
  }
  const today = spec
    ? spec.after
      ? `Today (${dateKey}): leave 11:30 for ${spec.term.noonLabel.en}. Pick up 17:30 (magic).`
      : `Today (${dateKey}): leave 11:30 for ${spec.term.noonLabel.en}. Pick up 16:30.`
    : dateKey
      ? `Today (${dateKey}): no interest class — leave 12:30, pick up 16:30.`
      : "";
  return [
    today,
    "K3 PM interest classes (Term 1, school notice dates only):",
    "• Mon: percussion 12:00–13:00 (from 12 Oct) — leave 11:30.",
    "• Tue: Sumblox 12:00–13:00 + magic 16:30–17:30 (from 6 Oct) — leave 11:30, pick up 17:30.",
    "• Fri: fencing 12:00–13:00 (from 2 Oct) — leave 11:30.",
    "Wed/Thu and days with no class: leave 12:30, pick up 16:30.",
  ]
    .filter(Boolean)
    .join("\n");
}
