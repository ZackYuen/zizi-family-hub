#!/usr/bin/env node
/**
 * Build summer holiday + K3 term schedule fields from current content / live JSON.
 *
 * Usage:
 *   node scripts/build-summer-k3-schedule.mjs [live.json]
 * Writes:
 *   - updates data/content.json + public/data/content.json
 *   - scripts/_patch-summer-k3.json for npm run patch-live
 */
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(__dirname, "..");

const SCHOOL_CALENDAR = {
  summerEndsOn: "2026-09-01",
  termStartsOn: "2026-09-02",
  grade: "K3",
  classSession: "PM",
};

const SUMMER_BANNER = {
  en: "Summer holiday until 1 Sep — no kindergarten. School resumes 2 Sep (K3 PM).",
  fil: "Summer holiday hanggang 1 Sep — walang kindergarten. Balik-eskwela 2 Sep (K3 PM).",
  zh: "暑假至 9月1日 — 無幼稚園。9月2日復課（K3 下午班）。",
};

const DRAWING_TASK = {
  en: "Drawing class (14:00–15:00)",
  fil: "Drawing class (14:00–15:00)",
  zh: "繪畫班（14:00–15:00）",
};

const DRAWING_NOTES = {
  en: "One Point Studio · Kwun Tong Industrial Centre Phase 1, 12/F Room B（觀塘工業中心一期12樓B室）",
  fil: "One Point Studio · Kwun Tong Industrial Centre Phase 1, 12/F Room B（觀塘工業中心一期12樓B室）",
  zh: "One Point Studio · 觀塘工業中心一期12樓B室",
};

const TERM_BANNER = {
  en: "Lam Tin Ling Liang Kindergarten — K3 PM, Mon–Fri (drop-off by 13:00, pick-up 16:30).",
  fil: "Lam Tin Ling Liang Kindergarten — K3 PM, Lunes–Biyernes (drop-off bago 13:00, sundo 16:30).",
  zh: "藍田靈糧幼稚園 — K3 下午班，周一至五（13:00 前送到，16:30 接）。",
};

const DAY_LABELS = {
  monday: { en: "Monday", fil: "Lunes", zh: "星期一" },
  tuesday: { en: "Tuesday", fil: "Martes", zh: "星期二" },
  wednesday: { en: "Wednesday", fil: "Miyerkules", zh: "星期三" },
  thursday: { en: "Thursday", fil: "Huwebes", zh: "星期四" },
  friday: { en: "Friday", fil: "Biyernes", zh: "星期五" },
  saturday: { en: "Saturday", fil: "Sabado", zh: "星期六" },
  sunday: { en: "Sunday", fil: "Linggo", zh: "星期日" },
};

function t(id, start, end, en, fil, zh, extra = {}) {
  return {
    id,
    time: start,
    startTime: start,
    ...(end ? { endTime: end } : {}),
    task: { en, fil, zh: zh || en },
    ...extra,
  };
}

function drawingClassTask(id) {
  return {
    id,
    time: "14:00",
    startTime: "14:00",
    endTime: "15:00",
    task: { ...DRAWING_TASK },
    notes: { ...DRAWING_NOTES },
  };
}

function eveningTail(prefix) {
  return [
    t(
      `${prefix}12`,
      "16:30",
      "17:00",
      "ZiZi tea time",
      "Merienda ni Zizi",
      "Zizi 茶點"
    ),
    t(
      `${prefix}13`,
      "17:00",
      "18:00",
      "Prepare food — check tonight's random dinner menu (meat + veg + soup)",
      "Maghanda — tingnan ang random na hapunan (karne + gulay + sabaw)",
      "準備晚餐（查看今晚隨機菜單）"
    ),
    t(`${prefix}14`, "18:00", "18:30", "Cook dinner", "Magluto ng hapunan", "煮晚餐"),
    t(
      `${prefix}15`,
      "18:30",
      "20:15",
      "ZiZi dinner",
      "Hapunan ni Zizi",
      "Zizi 晚餐"
    ),
    t(
      `${prefix}16`,
      "20:15",
      "20:30",
      "Wash dishes / tidy kitchen",
      "Hugasan ang pinggan / ayusin ang kusina",
      "洗碗／整理廚房"
    ),
    t(`${prefix}17`, "20:30", "21:15", "Vacuum floor", "Vacuum ng sahig", "吸塵"),
    t(`${prefix}18`, "21:15", "21:45", "ZiZi shower", "Paligo ni Zizi", "Zizi 洗澡"),
    t(
      `${prefix}19`,
      "21:45",
      null,
      "Charlene rest time",
      "Oras ng pahinga ni Charlene",
      "Charlene 休息"
    ),
  ];
}

function morningHome(prefix) {
  return [
    t(
      `${prefix}1`,
      "09:30",
      "09:45",
      "Zizi (Seth) wake up",
      "Gisingin si Zizi (Seth)",
      "叫醒 Zizi (Seth)"
    ),
    t(
      `${prefix}2`,
      "09:45",
      "10:15",
      "ZiZi breakfast — Charlene prepares every morning / brush teeth",
      "Almusal ni Zizi — ihanda ni Charlene tuwing umaga / sipilyo",
      "Zizi 早餐／刷牙"
    ),
    t(
      `${prefix}3`,
      "10:15",
      "12:00",
      "Play / supervise Zizi at home (summer holiday — no kindergarten)",
      "Maglaro / bantayan si Zizi sa bahay (summer holiday — walang kindergarten)",
      "在家陪伴 Zizi（暑假 — 無幼稚園）"
    ),
    t(
      `${prefix}4`,
      "12:00",
      "13:00",
      "ZiZi lunch at home",
      "Tanghalian ni Zizi sa bahay",
      "Zizi 在家午餐"
    ),
  ];
}

const CHORE_BY_DAY = {
  monday: {
    en: "Wash clothing (all clothes first, then Charlene's), vacuum, mop, toilet",
    fil: "Labada (lahat muna, tapos damit ni Charlene), vacuum, mop, toilet",
    zh: "洗衣（全家衣物後再洗 Charlene 的）、吸塵、拖地、廁所",
  },
  tuesday: {
    en: "Clean Zizi toys, vacuum living room, toilet, buy food (AEON @ Domain if needed)",
    fil: "Linisin ang laruan ni Zizi, vacuum living room, toilet, bumili ng pagkain (AEON @ Domain kung kailangan)",
    zh: "清潔玩具、客廳吸塵、廁所、買菜（需要可去 Domain AEON）",
  },
  thursday: {
    en: "Vacuum floor, deep clean toilet (faucet/shower/mat/washing machine/curtain)",
    fil: "Vacuum, malalim na linis ng toilet (gripo/shower/mat/washing machine/curtain)",
    zh: "吸塵、徹底清潔廁所（龍頭／花灑／地墊／洗衣機／浴簾）",
  },
};

function summerHomeDay(dayKey, prefix) {
  const chore = CHORE_BY_DAY[dayKey] || {
    en: "Housework + buy food as needed",
    fil: "Gawaing bahay + bumili ng pagkain kung kailangan",
    zh: "家務＋按需要買菜",
  };
  return {
    dayKey,
    day: DAY_LABELS[dayKey],
    tasks: [
      ...morningHome(prefix),
      t(
        `${prefix}5`,
        "13:00",
        "14:00",
        "Zizi nap / quiet time at home",
        "Tulog / tahimik na oras ni Zizi sa bahay",
        "Zizi 午睡／安靜時間"
      ),
      t(`${prefix}6`, "14:00", "16:00", chore.en, chore.fil, chore.zh),
      t(
        `${prefix}7`,
        "16:00",
        "16:30",
        "Flexible / prepare for tea time",
        "Flexible / maghanda para sa merienda",
        "彈性時間／準備茶點"
      ),
      ...eveningTail(prefix),
    ],
  };
}

function summerDrawingDay(dayKey, prefix, choreEn, choreFil, choreZh) {
  return {
    dayKey,
    day: DAY_LABELS[dayKey],
    tasks: [
      ...morningHome(prefix),
      t(
        `${prefix}5`,
        "13:00",
        "13:30",
        "Prepare & leave home for drawing class (Kwun Tong Industrial Centre)",
        "Maghanda at umalis papuntang drawing class (Kwun Tong Industrial Centre)",
        "準備出門前往繪畫班（觀塘工業中心）"
      ),
      t(
        `${prefix}6`,
        "13:30",
        "14:00",
        "Travel / arrive at One Point Studio",
        "Biyahe / dumating sa One Point Studio",
        "前往／到達 One Point Studio"
      ),
      drawingClassTask(`${prefix}7`),
      t(
        `${prefix}8`,
        "15:00",
        "15:30",
        "Return home from drawing class",
        "Umuwi mula sa drawing class",
        "繪畫班結束回家"
      ),
      t(`${prefix}9`, "15:30", "16:30", choreEn, choreFil, choreZh),
      ...eveningTail(prefix),
    ],
  };
}

function fixTermSchedule(weekly) {
  return weekly.map((day) => {
    const next = {
      ...day,
      day: { ...DAY_LABELS[day.dayKey], ...day.day },
      tasks: day.tasks.map((task, i) => {
        let id = task.id;
        if (id === "thNaN" || !id) {
          id = task.task?.en?.toLowerCase().includes("pick up")
            ? "th9"
            : task.task?.en?.toLowerCase().includes("flexible")
              ? "th8"
              : `th-fix-${i}`;
        }
        let taskText = { ...task.task };
        // Mark K3 on drop-off / pick-up lines
        if (/kindergarten|drop off|pick up/i.test(taskText.en || "")) {
          if (!/\bK3\b/i.test(taskText.en)) {
            taskText = {
              ...taskText,
              en: (taskText.en || "").replace(
                "Lam Tin Ling Liang Kindergarten",
                "Lam Tin Ling Liang Kindergarten (K3)"
              ),
              fil: (taskText.fil || "").replace(
                "kindergarten",
                "kindergarten (K3)"
              ),
              zh: (taskText.zh || "").includes("K3")
                ? taskText.zh
                : `${taskText.zh || "藍田靈糧幼稚園"}（K3）`,
            };
          }
        }
        if (/no kindergarten/i.test(taskText.en || "")) {
          taskText = {
            ...taskText,
            en: "Prepare Zizi's lunch + play / supervise Zizi at home (no kindergarten — Mon–Fri only; K3 term from 2 Sep)",
            fil: "Ihanda ang tanghalian ni Zizi + maglaro / bantayan (walang eskwela — Lunes–Biyernes lang; K3 mula 2 Sep)",
            zh: "準備午餐＋在家陪伴（無幼稚園 — 僅周一至五上課；K3 由 9月2日起）",
          };
        }
        return { ...task, id, task: taskText };
      }),
    };
    return next;
  });
}

function buildSummerSchedule(termWeekly) {
  const byKey = Object.fromEntries(termWeekly.map((d) => [d.dayKey, d]));
  return [
    summerHomeDay("monday", "sm"),
    summerHomeDay("tuesday", "st"),
    summerDrawingDay(
      "wednesday",
      "sw",
      "Light housework after drawing class / buy food if needed",
      "Magaan na gawaing bahay pagkatapos ng drawing / bumili ng pagkain kung kailangan",
      "繪畫班後輕家務／按需要買菜"
    ),
    summerHomeDay("thursday", "sth"),
    summerDrawingDay(
      "friday",
      "sf",
      "Vacuum / tidy bedroom & toilet after drawing class",
      "Vacuum / ayusin ang kwarto at toilet pagkatapos ng drawing",
      "繪畫班後吸塵／整理睡房與廁所"
    ),
    // Saturday/Sunday keep term versions (Sat home day, Sun day off)
    {
      ...byKey.saturday,
      day: DAY_LABELS.saturday,
      tasks: (byKey.saturday?.tasks || []).map((task) => {
        if (/no kindergarten/i.test(task.task?.en || "")) {
          return {
            ...task,
            task: {
              en: "Play / supervise Zizi at home (Saturday — no kindergarten)",
              fil: "Maglaro / bantayan si Zizi sa bahay (Sabado — walang kindergarten)",
              zh: "在家陪伴 Zizi（星期六 — 無幼稚園）",
            },
          };
        }
        return task;
      }),
    },
    byKey.sunday || {
      dayKey: "sunday",
      day: DAY_LABELS.sunday,
      tasks: [
        t(
          "su0",
          "00:00",
          null,
          "Charlene day off",
          "Day off ni Charlene",
          "Charlene 放假",
          { fullDay: true }
        ),
      ],
    },
  ];
}

const livePath = process.argv[2];
let content;
if (livePath) {
  const raw = JSON.parse(fs.readFileSync(livePath, "utf8"));
  content = raw.content || raw;
} else {
  content = JSON.parse(
    fs.readFileSync(path.join(ROOT, "data", "content.json"), "utf8")
  );
}

const termWeekly = fixTermSchedule(content.weeklySchedule);
const summerWeekly = buildSummerSchedule(termWeekly);

const updated = {
  ...content,
  schoolCalendar: SCHOOL_CALENDAR,
  ziziSchool: TERM_BANNER,
  ziziSchoolSummer: SUMMER_BANNER,
  weeklySchedule: termWeekly,
  weeklyScheduleSummer: summerWeekly,
  lastUpdated: new Date().toISOString(),
};

for (const rel of ["data/content.json", "public/data/content.json"]) {
  fs.writeFileSync(path.join(ROOT, rel), JSON.stringify(updated, null, 2) + "\n");
  console.log("wrote", rel);
}

const patch = {
  set: {
    schoolCalendar: SCHOOL_CALENDAR,
    ziziSchool: TERM_BANNER,
    ziziSchoolSummer: SUMMER_BANNER,
    weeklySchedule: termWeekly,
    weeklyScheduleSummer: summerWeekly,
  },
};

const patchPath = path.join(ROOT, "scripts", "_patch-summer-k3.json");
fs.writeFileSync(patchPath, JSON.stringify(patch, null, 2) + "\n");
console.log("wrote", patchPath);
console.log(
  "Summer Wed tasks:",
  summerWeekly.find((d) => d.dayKey === "wednesday").tasks.map((t) => `${t.startTime} ${t.task.en}`).join(" | ")
);
