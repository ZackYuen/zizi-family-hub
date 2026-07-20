#!/usr/bin/env node
/** Patch schedule: Zizi wake 09:30, Sunday & 勞工假 whole day off */
import { readFileSync, writeFileSync } from "fs";
import { join } from "path";

const paths = [
  join(process.cwd(), "data", "content.json"),
  join(process.cwd(), "public", "data", "content.json"),
];

const WAKE = {
  en: "Zizi (Seth) wake up",
  fil: "Gisingin si Zizi (Seth)",
};

const DAY_OFF_BANNER = {
  en: "Zizi (Seth) whole day off — no kindergarten (Sunday & public holidays / 勞工假)",
  fil: "Buong araw na day off si Zizi (Seth) — walang eskwela (Linggo at public holiday / 勞工假)",
};

for (const path of paths) {
  const data = JSON.parse(readFileSync(path, "utf-8"));

  data.ziziSchool = {
    en: "Lam Tin Liang Leung Kindergarten (PM class, arrive by 1:00 PM). Sundays & public holidays (勞工假): Zizi whole day off.",
    fil: "Lam Tin Liang Leung Kindergarten (PM class, dumating bago 1:00 PM). Linggo at public holiday (勞工假): buong araw na day off si Zizi.",
  };

  for (const day of data.weeklySchedule) {
    const isSunday = day.dayKey === "sunday";
    const isWeekday = ["monday", "tuesday", "wednesday", "thursday", "friday"].includes(day.dayKey);

    for (const task of day.tasks) {
      const text = task.task.en.toLowerCase();

      if (text.includes("wake up") || text.includes("gisingin")) {
        task.time = "09:30";
        task.task = { ...WAKE };
      } else if (text.includes("milk / breakfast") || text.includes("almusal / sipilyo")) {
        task.time = "09:45";
      } else if (task.time === "09:30" && !text.includes("wake")) {
        task.time = "10:30";
      }

      if (task.time === "10:00" && day.dayKey === "monday" && task.id === "m4") {
        task.time = "11:00";
      }
      if (task.time === "10:00" && day.dayKey === "tuesday" && task.id === "t4") {
        task.time = "11:00";
      }

      if (isSunday && task.id === "su1") {
        task.time = "09:30";
        task.task = { ...DAY_OFF_BANNER };
      }
      if (isSunday && task.id === "su5") {
        task.task = {
          en: "Family time — Zizi whole day off, play & rest at home",
          fil: "Oras ng pamilya — buong araw na day off si Zizi, maglaro at magpahinga sa bahay",
        };
      }
      if (isSunday && task.id === "su13") {
        task.task = {
          en: "Charlene rest time",
          fil: "Oras ng pahinga ni Charlene",
        };
      }

      if (isWeekday) {
        for (const school of [
          "Send Zizi",
          "Pick up Zizi",
          "Prepare school bag",
          "Prepare for PM school",
        ]) {
          if (task.task.en.includes(school)) {
            // keep school tasks Mon–Fri only
          }
        }
      }
    }

    day.tasks.sort((a, b) => a.time.localeCompare(b.time));
  }

  data.lastUpdated = new Date().toISOString();
  writeFileSync(path, JSON.stringify(data, null, 2) + "\n", "utf-8");
  console.log("Updated:", path);
}
