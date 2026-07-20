#!/usr/bin/env node
/** Rearrange Mon–Fri school-day schedule; Sunday/HK holidays = Charlene day off */
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const paths = [
  path.join(__dirname, "../data/content.json"),
  path.join(__dirname, "../public/data/content.json"),
];

const ziziSchool = {
  en: "Lam Tin Liang Leung Kindergarten — PM class Mon–Fri only (arrive by 1:00 PM, 30 min walk). Sundays & HK public holidays (香港勞工假): Charlene day off.",
  fil: "Lam Tin Liang Leung Kindergarten — PM class Lunes–Biyernes lang (dumating bago 1:00 PM, 30 min lakad). Linggo at HK public holiday (香港勞工假): day off ni Charlene.",
};

const morningBlock = (prefix) => [
  {
    id: `${prefix}1`,
    time: "09:30",
    startTime: "09:30",
    endTime: "09:45",
    task: {
      en: "Zizi (Seth) wake up",
      fil: "Gisingin si Zizi (Seth)",
    },
  },
  {
    id: `${prefix}2`,
    time: "09:45",
    startTime: "09:45",
    endTime: "10:15",
    task: {
      en: "ZiZi breakfast — Charlene prepares every morning / brush teeth",
      fil: "Almusal ni Zizi — ihanda ni Charlene tuwing umaga / sipilyo",
    },
  },
  {
    id: `${prefix}3`,
    time: "10:15",
    startTime: "10:15",
    endTime: "11:30",
    task: {
      en: "Prepare Zizi's lunch + play / supervise Zizi at home",
      fil: "Ihanda ang tanghalian ni Zizi + maglaro / bantayan si Zizi sa bahay",
    },
  },
  {
    id: `${prefix}4`,
    time: "11:30",
    startTime: "11:30",
    endTime: "12:00",
    task: {
      en: "Prepare school bag, shoes, uniform",
      fil: "Ihanda ang bag, sapatos, uniporme",
    },
  },
  {
    id: `${prefix}5`,
    time: "12:00",
    startTime: "12:00",
    endTime: "12:30",
    task: {
      en: "ZiZi lunch at home",
      fil: "Tanghalian ni Zizi sa bahay",
    },
  },
  {
    id: `${prefix}6`,
    time: "12:30",
    startTime: "12:30",
    endTime: "13:00",
    task: {
      en: "Leave home — walk 30 min, drop off Zizi at Lam Tin Liang Leung Kindergarten by 13:00",
      fil: "Umalis sa bahay — 30 min lakad, hatid si Zizi sa kindergarten bago 13:00",
    },
  },
];

const schoolChores = {
  monday: {
    id: "m7",
    task: {
      en: "Wash clothing (all clothes first, then Charlene's clothes), vacuum floor, deep clean floor (mop), toilet",
      fil: "Labada (lahat ng damit muna, tapos damit ni Charlene), vacuum, mop, linis ng toilet",
    },
  },
  tuesday: {
    id: "t7",
    task: {
      en: "Clean Zizi toys, vacuum floor & living room, toilet, buy food (AEON @ Yau Tong)",
      fil: "Linisin ang mga laruan ni Zizi, vacuum ng sala, toilet, bumili ng pagkain (AEON @ Yau Tong)",
    },
  },
  wednesday: {
    id: "w7",
    task: {
      en: "Vacuum floor, deep clean kitchen (water/bread/coffee machine), toilet, buy food",
      fil: "Vacuum, malalim na linis ng kusina, toilet, bumili ng pagkain",
    },
  },
  thursday: {
    id: "th7",
    task: {
      en: "Vacuum floor, deep clean toilet (faucet/shower/mat/washing machine/curtain), buy food",
      fil: "Vacuum, malalim na linis ng banyo, bumili ng pagkain",
    },
  },
  friday: {
    id: "f7",
    task: {
      en: "Vacuum floor, deep clean bedroom, toilet, buy food",
      fil: "Vacuum, malalim na linis ng kwarto, toilet, bumili ng pagkain",
    },
  },
};

const flexibleMonthly = (prefix, num) => ({
  id: `${prefix}${num}`,
  time: "15:30",
  startTime: "15:30",
  endTime: "16:00",
  task: {
    en: "Flexible / monthly task (see list)",
    fil: "Flexible / buwanang gawain (tingnan ang list)",
  },
});

const pickupBlock = (prefix, num) => [
  {
    id: `${prefix}${num}`,
    time: "16:00",
    startTime: "16:00",
    endTime: "16:30",
    task: {
      en: "Leave home — walk 30 min, pick up Zizi at 16:30 from Lam Tin Liang Leung Kindergarten",
      fil: "Umalis sa bahay — 30 min lakad, sunduin si Zizi ng 16:30 sa kindergarten",
    },
  },
];

function buildSchoolDay(dayKey, prefix, eveningTasks, includeFlexible = true) {
  const chores = schoolChores[dayKey];
  const choresTask = {
    id: chores.id,
    time: "13:30",
    startTime: "13:30",
    endTime: includeFlexible ? "15:30" : "16:00",
    task: chores.task,
  };
  const tasks = [
    ...morningBlock(prefix),
    choresTask,
    ...(includeFlexible ? [flexibleMonthly(prefix, parseInt(chores.id.slice(1)) + 1)] : []),
    ...pickupBlock(prefix, includeFlexible ? parseInt(chores.id.slice(1)) + 2 : parseInt(chores.id.slice(1)) + 1),
    ...eveningTasks,
  ];
  return tasks;
}

// Evening tasks extracted from existing Monday schedule (m12 onwards)
const mondayEvening = [
  { id: "m12", time: "16:30", startTime: "16:30", endTime: "17:00", task: { en: "ZiZi tea time", fil: "Merienda ni Zizi" } },
  { id: "m13", time: "17:00", startTime: "17:00", endTime: "18:00", task: { en: "Prepare food — check tonight's random dinner menu (meat + veg + soup)", fil: "Maghanda — tingnan ang random na hapunan (karne + gulay + sabaw)" } },
  { id: "m14", time: "18:00", startTime: "18:00", endTime: "18:30", task: { en: "Cook dinner", fil: "Magluto ng hapunan" } },
  { id: "m15", time: "18:30", startTime: "18:30", endTime: "20:00", task: { en: "ZiZi dinner (6:30–8:00 PM)", fil: "Hapunan ni Zizi (6:30–8:00 PM)" } },
  { id: "m16", time: "20:15", startTime: "20:15", endTime: "20:30", task: { en: "Wash dishes / tidy up kitchen", fil: "Hugasan ang pinggan / ayusin ang kusina" } },
  { id: "m17", time: "20:30", startTime: "20:30", endTime: "21:15", task: { en: "Vacuum floor", fil: "Vacuum ng sahig" } },
  { id: "m18", time: "21:15", startTime: "21:15", endTime: "21:45", task: { en: "ZiZi shower", fil: "Paligo ni Zizi" } },
  { id: "m19", time: "21:45", startTime: "21:45", task: { en: "Charlene rest time", fil: "Oras ng pahinga ni Charlene" } },
];

const tuesdayEvening = [
  { id: "t12", time: "16:30", startTime: "16:30", endTime: "17:00", task: { en: "ZiZi tea time", fil: "Merienda ni Zizi" } },
  { id: "t13", time: "17:00", startTime: "17:00", endTime: "18:00", task: { en: "Prepare food & soup — tonight's random menu", fil: "Maghanda ng pagkain at sabaw — random na menu" } },
  { id: "t14", time: "18:00", startTime: "18:00", endTime: "18:30", task: { en: "Cook", fil: "Magluto" } },
  { id: "t15", time: "18:30", startTime: "18:30", endTime: "20:15", task: { en: "ZiZi dinner", fil: "Hapunan ni Zizi" } },
  { id: "t16", time: "20:15", startTime: "20:15", endTime: "20:30", task: { en: "Wash dishes / tidy kitchen", fil: "Hugasan / ayusin ang kusina" } },
  { id: "t17", time: "20:30", startTime: "20:30", endTime: "21:15", task: { en: "Vacuum floor", fil: "Vacuum ng sahig" } },
  { id: "t18", time: "21:15", startTime: "21:15", endTime: "21:45", task: { en: "ZiZi shower", fil: "Paligo ni Zizi" } },
  { id: "t19", time: "21:45", startTime: "21:45", task: { en: "Charlene rest time", fil: "Oras ng pahinga ni Charlene" } },
];

const wednesdayEvening = tuesdayEvening.map((t) => ({ ...t, id: t.id.replace("t", "w") }));
wednesdayEvening[1].task = { en: "Prepare food — tonight's random menu", fil: "Maghanda — random na menu ng gabi" };

const thursdayEvening = tuesdayEvening.map((t) => ({ ...t, id: t.id.replace("t", "th") }));
thursdayEvening[1].task = { en: "Prepare food & soup — tonight's random menu", fil: "Maghanda ng pagkain at sabaw" };

const fridayEvening = tuesdayEvening.map((t) => ({ ...t, id: t.id.replace("t", "f") }));
fridayEvening[1].task = { en: "Prepare food — tonight's random menu", fil: "Maghanda — random na menu" };

const saturdayTasks = [
  ...morningBlock("s").slice(0, 3).map((t, i) =>
    i === 2
      ? {
          ...t,
          id: "s3",
          endTime: "12:00",
          task: {
            en: "Prepare Zizi's lunch + play / supervise Zizi at home (no kindergarten — Mon–Fri only)",
            fil: "Ihanda ang tanghalian ni Zizi + maglaro / bantayan (walang eskwela — Lunes–Biyernes lang)",
          },
        }
      : t
  ),
  {
    id: "s4",
    time: "12:00",
    startTime: "12:00",
    endTime: "13:00",
    task: { en: "ZiZi lunch at home", fil: "Tanghalian ni Zizi sa bahay" },
  },
  {
    id: "s5",
    time: "13:00",
    startTime: "13:00",
    endTime: "14:00",
    task: {
      en: "Zizi nap time + clean school bag & shoes",
      fil: "Oras ng tulog ni Zizi + linisin ang bag at sapatos",
    },
  },
  {
    id: "s6",
    time: "14:00",
    startTime: "14:00",
    endTime: "16:00",
    task: {
      en: "Vacuum floor, toilet, iron clothing, buy food",
      fil: "Vacuum, toilet, plantsa ng damit, bumili ng pagkain",
    },
  },
  {
    id: "s7",
    time: "16:00",
    startTime: "16:00",
    endTime: "16:30",
    task: { en: "Prepare food", fil: "Maghanda ng pagkain" },
  },
  { id: "s8", time: "16:30", startTime: "16:30", endTime: "17:00", task: { en: "ZiZi tea time", fil: "Merienda ni Zizi" } },
  { id: "s9", time: "17:00", startTime: "17:00", endTime: "18:00", task: { en: "Play with ZiZi", fil: "Maglaro kasama si Zizi" } },
  { id: "s10", time: "18:00", startTime: "18:00", endTime: "18:30", task: { en: "Cook — tonight's random menu", fil: "Magluto — random na menu" } },
  { id: "s11", time: "18:30", startTime: "18:30", endTime: "20:15", task: { en: "ZiZi dinner", fil: "Hapunan ni Zizi" } },
  { id: "s12", time: "20:15", startTime: "20:15", endTime: "20:30", task: { en: "Wash dishes / tidy kitchen", fil: "Hugasan / ayusin ang kusina" } },
  { id: "s13", time: "20:30", startTime: "20:30", endTime: "21:15", task: { en: "Vacuum floor", fil: "Vacuum ng sahig" } },
  { id: "s14", time: "21:15", startTime: "21:15", endTime: "21:45", task: { en: "ZiZi shower", fil: "Paligo ni Zizi" } },
  { id: "s15", time: "21:45", startTime: "21:45", task: { en: "Charlene rest time", fil: "Oras ng pahinga ni Charlene" } },
];

const sundayTasks = [
  {
    id: "su0",
    time: "00:00",
    startTime: "00:00",
    fullDay: true,
    task: {
      en: "Charlene day off — Sunday & HK public holidays (香港勞工假). Zizi kindergarten is Mon–Fri only.",
      fil: "Day off ni Charlene — Linggo at HK public holiday (香港勞工假). Eskwela ni Zizi Lunes–Biyernes lang.",
    },
  },
];

for (const filePath of paths) {
  const content = JSON.parse(fs.readFileSync(filePath, "utf-8"));
  content.ziziSchool = ziziSchool;

  const dayMap = {
    monday: buildSchoolDay("monday", "m", mondayEvening),
    tuesday: buildSchoolDay("tuesday", "t", tuesdayEvening),
    wednesday: buildSchoolDay("wednesday", "w", wednesdayEvening),
    thursday: buildSchoolDay("thursday", "th", thursdayEvening),
    friday: buildSchoolDay("friday", "f", fridayEvening),
    saturday: saturdayTasks,
    sunday: sundayTasks,
  };

  content.weeklySchedule = content.weeklySchedule.map((day) => ({
    ...day,
    tasks: dayMap[day.dayKey] ?? day.tasks,
  }));

  content.lastUpdated = new Date().toISOString();
  fs.writeFileSync(filePath, JSON.stringify(content, null, 2) + "\n");
  console.log("Updated", filePath);
}
