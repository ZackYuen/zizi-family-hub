#!/usr/bin/env node
/** Firm but respectful ground-rule consequences — no second chance to break */
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const files = [
  path.join(__dirname, "../data/content.json"),
  path.join(__dirname, "../public/data/content.json"),
];

/** Firm If Broken text — friendly tone, zero room for a second trial */
const consequencesById = {
  "rule-1": {
    en: "If Broken: Immediate serious written warning and a meeting with Sir/Mum. Hidden borrowing or any second time: contract ends and repatriation is arranged; the agency will be informed. There is no trial second chance.",
    fil: "If Broken: Agad na seryosong written warning at meeting kay Sir/Mum. Naitagong paghiram o pangalawang beses: tatapusin ang kontrata at i-aayos ang repatriation; iinforma ang agency. Walang second chance.",
    zh: "若違反：立即嚴正書面警告並與 Sir/Mum 會面。隱瞞借錢或第二次：終止合約並安排遣返，同時通知中介。沒有第二次機會。",
  },
  "rule-2": {
    en: "If Broken: Immediate written warning. If Zizi was hungry, unsafe, or unattended because other tasks came first: this is treated as serious — contract may end the same day. Zizi’s safety has no second chance.",
    fil: "If Broken: Agad na written warning. Kung si Zizi ay gutom, delikado, o walang bantay dahil inuna ang ibang gawain: seryoso ito — maaaring matapos ang kontrata sa araw ding iyon. Walang second chance sa kaligtasan ni Zizi.",
    zh: "若違反：立即書面警告。若因先做其他事令 Zizi 挨餓、不安全或無人看管：視為嚴重 — 可即日終止合約。Zizi 的安全沒有第二次機會。",
  },
  "rule-3": {
    en: "If Broken: Immediate written warning and supervised kitchen correction the same day. Mixing raw and cooked tools again, or if anyone falls ill: contract ends. Food safety is not for trial and error.",
    fil: "If Broken: Agad na written warning at supervised kitchen correction sa araw ding iyon. Kung ulitin ang paghalo ng hilaw/luto, o may magkasakit: tatapusin ang kontrata. Hindi pwedeng trial-and-error ang food safety.",
    zh: "若違反：立即書面警告，並於當日在監督下改正。再生熟混用或有人生病：終止合約。食物安全不容試錯。",
  },
  "rule-4": {
    en: "If Broken: Immediate written warning. Using the wrong board again, or if it causes illness: contract ends. Labels must be followed from day one — no second trial.",
    fil: "If Broken: Agad na written warning. Ulit na maling board, o kung may magkasakit: tatapusin ang kontrata. Sundin ang label mula unang araw — walang second trial.",
    zh: "若違反：立即書面警告。再用錯砧板或導致生病：終止合約。標籤從第一天起必須遵守 — 沒有第二次試錯。",
  },
  "rule-5": {
    en: "If Broken: Immediate written warning. Resting while Zizi still needs meals, pickup, or safety care again: contract review the same week and may end. Rest is after urgent family needs — not optional.",
    fil: "If Broken: Agad na written warning. Kung ulitin ang pahinga habang kailangan pa ni Zizi ang pagkain, sundo, o safety: i-review ang kontrata sa linggo ring iyon at maaaring matapos. Ang pahinga ay pagkatapos ng urgent na needs — hindi optional.",
    zh: "若違反：立即書面警告。若再在 Zizi 仍需膳食／接送／安全照顧時休息：會於同週檢討合約並可能終止。休息須在緊急家事之後 — 不可自行改變。",
  },
  "rule-6": {
    en: "If Broken: Immediate written warning. Phone use that distracts while caring for Zizi a second time: contract ends. Keep the phone for emergencies only during work — no second chance.",
    fil: "If Broken: Agad na written warning. Pangalawang beses na makagambala ang telepono habang inaalagaan si Zizi: tatapusin ang kontrata. Sa oras ng gawain, telepono para sa emergency lang — walang second chance.",
    zh: "若違反：立即書面警告。照顧 Zizi 時再因手機分心：終止合約。工作時間手機僅作緊急用途 — 沒有第二次機會。",
  },
  "rule-7": {
    en: "If Broken: Immediate written warning. Hiding a problem, or delay that harms Zizi or the home: contract may end immediately. Always tell Sir/Mum at once — silence is not allowed a second time.",
    fil: "If Broken: Agad na written warning. Pagtatago ng problema, o delay na nakakasama kay Zizi o sa bahay: maaaring matapos agad ang kontrata. Laging sabihin agad kay Sir/Mum — hindi pwedeng ulitin ang pagtatago.",
    zh: "若違反：立即書面警告。隱瞞問題，或延誤令 Zizi／家居受損：可立即終止合約。必須立刻告知 Sir/Mum — 不容第二次沉默。",
  },
  "rule-8": {
    en: "If Broken: Immediate written warning. Leaving doors/windows unlocked again, or if theft/danger follows: contract ends and you may be held responsible. Locking is required every time — no second chance.",
    fil: "If Broken: Agad na written warning. Ulit na hindi naka-lock, o may nakawan/panganib: tatapusin ang kontrata at maaaring managot ka. Kailangan i-lock palagi — walang second chance.",
    zh: "若違反：立即書面警告。再忘記鎖門窗，或因而失竊／危險：終止合約並可能須負責。每次都必須上鎖 — 沒有第二次機會。",
  },
};

for (const file of files) {
  const content = JSON.parse(fs.readFileSync(file, "utf8"));
  for (const rule of content.groundRules || []) {
    const c = consequencesById[rule.id];
    if (c) rule.consequences = c;
  }
  content.lastUpdated = new Date().toISOString();
  fs.writeFileSync(file, JSON.stringify(content, null, 2) + "\n");
  console.log("Updated", file);
}
