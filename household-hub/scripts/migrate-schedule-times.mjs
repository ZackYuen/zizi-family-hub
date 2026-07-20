#!/usr/bin/env node
/** Add startTime/endTime to schedule tasks; update Sunday day-off */
import { readFileSync, writeFileSync } from "fs";
import { join } from "path";

const paths = [
  join(process.cwd(), "data", "content.json"),
  join(process.cwd(), "public", "data", "content.json"),
];

const END_OVERRIDES = {
  m2: "10:15",
  m15: "20:00",
  t2: "10:15",
  w2: "10:15",
  th2: "10:15",
  f2: "10:15",
  s2: "10:15",
  su1b: "10:15",
  su5: "14:00",
};

for (const path of paths) {
  const data = JSON.parse(readFileSync(path, "utf-8"));

  data.ziziSchool = {
    en: "Lam Tin Liang Leung Kindergarten (PM class, arrive by 1:00 PM). Sundays & HK public holidays (香港勞工假): Zizi whole day off — no school.",
    fil: "Lam Tin Liang Leung Kindergarten (PM class, dumating bago 1:00 PM). Linggo at HK public holiday (香港勞工假): buong araw na day off si Zizi — walang eskwela.",
  };

  for (const day of data.weeklySchedule) {
    const sorted = [...day.tasks].sort((a, b) =>
      (a.startTime ?? a.time).localeCompare(b.startTime ?? b.time)
    );

    day.tasks = sorted.map((task, i) => {
      const startTime = task.startTime ?? task.time;
      const next = sorted[i + 1];
      let endTime =
        task.endTime ??
        END_OVERRIDES[task.id] ??
        (next && !next.fullDay ? next.startTime ?? next.time : undefined);

      if (task.fullDay) endTime = undefined;

      return {
        ...task,
        time: startTime,
        startTime,
        ...(endTime ? { endTime } : {}),
      };
    });

    if (day.dayKey === "sunday") {
      day.tasks.unshift({
        id: "su0",
        time: "00:00",
        startTime: "00:00",
        fullDay: true,
        task: {
          en: "Zizi (Seth) — whole day off, no kindergarten (Sunday & HK public holidays / 香港勞工假)",
          fil: "Si Zizi (Seth) — buong araw na day off, walang eskwela (Linggo at HK public holiday / 香港勞工假)",
        },
      });
      const su1 = day.tasks.find((t) => t.id === "su1");
      if (su1) {
        su1.task = {
          en: "Zizi (Seth) wake up",
          fil: "Gisingin si Zizi (Seth)",
        };
      }
    }
  }

  data.lastUpdated = new Date().toISOString();
  writeFileSync(path, JSON.stringify(data, null, 2) + "\n", "utf-8");
  console.log("Updated:", path);
}
