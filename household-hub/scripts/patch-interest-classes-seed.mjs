#!/usr/bin/env node
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { DEFAULT_INTEREST_CLASSES } from "../src/lib/interest-classes.ts";
import { TERM_K3_SCHOOL_BANNER } from "../src/lib/school-calendar.ts";

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");
const file = path.join(root, "data", "content.json");
const content = JSON.parse(fs.readFileSync(file, "utf8"));

content.interestClasses = DEFAULT_INTEREST_CLASSES;
content.ziziSchool = { ...TERM_K3_SCHOOL_BANNER };

const walk = (content.hkLifeGuides || []).find((g) => g.id === "life-kt-school-walk");
if (walk) {
  walk.body = {
    en: "Lam Tin Ling Liang Kindergarten — PM class Mon–Fri. Walk from home is about 30 minutes. Usual: leave 12:30, pick up 16:30. Interest class days (from Oct, school dates): Mon percussion / Tue Sumblox+magic / Fri fencing — leave 11:30; Tue pick up 17:30. Bring Octopus / water on hot days. In severe weather, ask Sir/Mum before going out.",
    zh: "藍田靈糧幼稚園 — 星期一至五下午班。由家步行約 30 分鐘。平常：12:30 出門，16:30 接。興趣班日子（10月起，以校方日期為準）：一鋼片琴／二 Sumblox+魔術／五劍擊 — 11:30 出門；星期二 17:30 接。熱天帶八達通／水。惡劣天氣出門前先問 Sir/Mum。",
    fil: "Lam Tin Ling Liang Kindergarten — PM class Lunes–Biyernes. Mga 30 minuto lakad mula bahay. Karaniwan: umalis 12:30, sundo 16:30. Interest class (mula Oct): Lunes percussion / Martes Sumblox+magic / Biyernes fencing — umalis 11:30; Martes sundo 17:30. Magdala ng Octopus / tubig kung mainit. Sa masamang panahon, tanungin muna sina Sir/Mum.",
  };
  walk.lastReviewed = "2026-09-07";
}

const guides = content.hkLifeGuides || [];
if (!guides.some((g) => g.id === "life-kt-interest-classes")) {
  guides.push({
    id: "life-kt-interest-classes",
    category: "transport",
    priority: 39,
    area: "kwun-tong",
    lastReviewed: "2026-09-07",
    title: {
      en: "Zizi K3 interest classes (Term 1)",
      fil: "Interest class ni Zizi sa K3 (Term 1)",
      zh: "孜孜 K3 興趣班（第一期）",
    },
    body: {
      en: "Enrolled: Mon percussion (glockenspiel) 12:00–13:00 from 12 Oct; Tue Sumblox 12:00–13:00 + magic 16:30–17:30 from 6 Oct; Fri fencing 12:00–13:00 from 2 Oct. On those school-notice dates leave home 11:30; Tue pick up 17:30. Other school days: leave 12:30, pick up 16:30. Some Mondays/Fridays have no class — follow the Schedule tab for that date.",
      fil: "Naka-enroll: Lunes percussion (glockenspiel) 12:00–13:00 mula 12 Oct; Martes Sumblox 12:00–13:00 + magic 16:30–17:30 mula 6 Oct; Biyernes fencing 12:00–13:00 mula 2 Oct. Sa mga petsa iyon, umalis 11:30; Martes sundo 17:30. Ibang araw ng pasok: umalis 12:30, sundo 16:30. May Lunes/Biyernes na walang class — sundin ang Schedule tab.",
      zh: "已報名：一 敲擊樂／鋼片琴 12:00–13:00（10月12日起）；二 Sumblox 12:00–13:00 + 魔術 16:30–17:30（10月6日起）；五 劍擊 12:00–13:00（10月2日起）。當日 11:30 出門；星期二 17:30 接。其他上學日 12:30 出門、16:30 接。部分星期一／五沒有堂 — 以當日日程為準。",
    },
  });
  content.hkLifeGuides = guides.sort((a, b) => (a.priority ?? 0) - (b.priority ?? 0));
}

const prefs = content.familyPreferences || [];
if (!prefs.some((p) => p.id === "pref-zizi-interest-classes")) {
  prefs.push({
    id: "pref-zizi-interest-classes",
    category: "general",
    priority: 8,
    title: {
      en: "Zizi Term 1 interest classes",
      fil: "Interest class ni Zizi (Term 1)",
      zh: "孜孜第一期興趣班",
    },
    body: {
      en: "K2 choir and school drawing are paused this term. Enrolled: percussion (Mon noon), Sumblox (Tue noon), magic (Tue after school), fencing (Fri noon). Follow the Schedule tab times on class dates.",
      fil: "Paused muna ang choir at school drawing ngayong term. Naka-enroll: percussion (Lunes tanghali), Sumblox (Martes tanghali), magic (Martes after school), fencing (Biyernes tanghali). Sundin ang oras sa Schedule tab.",
      zh: "今年暫停合唱團及學校畫畫。已報：敲擊樂（一中午）、Sumblox（二中午）、魔術（二放學）、劍擊（五中午）。當日時間以日程為準。",
    },
  });
  content.familyPreferences = prefs;
}

content.lastUpdated = new Date().toISOString();
fs.writeFileSync(file, `${JSON.stringify(content, null, 2)}\n`);
console.log("Patched data/content.json interest classes");
