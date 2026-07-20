#!/usr/bin/env node
/** Add explicit consequences to each ground rule */
import { readFileSync, writeFileSync } from "fs";
import { join } from "path";

const paths = [
  join(process.cwd(), "data", "content.json"),
  join(process.cwd(), "public", "data", "content.json"),
];

const CONSEQUENCES = {
  "rule-1": {
    en: "First offence: serious written warning and meeting with employer. Any hidden borrowing or repeat offence: contract terminated immediately, repatriation arranged, and employer may report to the agency.",
    fil: "Unang paglabag: seryosong written warning at meeting sa employer. Anumang naitagong paghiram o ulit na paglabag: tatapusin agad ang kontrata, repatriation, at maaaring i-report ng employer sa agency.",
    zh: "第一次：嚴正書面警告及與僱主會面。任何隱瞞借錢或再犯：立即終止合約、安排遣返，僱主可向中介報告。",
  },
  "rule-2": {
    en: "If Zizi is left hungry, unsafe, or unattended because other tasks were prioritised: written warning. Serious neglect or repeat: employment terminated — Zizi's safety is non-negotiable.",
    fil: "Kung si Zizi ay gutom, delikado, o walang nagbabantay dahil inuna ang ibang gawain: written warning. Malubhang pagpapabaya o ulit: tatapusin ang trabaho — hindi pwedeng i-kompromiso ang kaligtasan ni Zizi.",
    zh: "若因先做其他工作而令 Zizi 餓肚、不安全或無人看管：書面警告。嚴重疏忽或再犯：終止僱傭 — Zizi 的安全絕不可妥協。",
  },
  "rule-3": {
    en: "Mixing raw and cooked tools can make the family sick. First time: retraining and written warning. If anyone gets ill or it happens again: employment terminated.",
    fil: "Ang paghalu ng gamit para sa hilaw at luto ay maaaring magkasakit ang pamilya. Unang beses: retraining at written warning. Kung may magkasakit o maulit: tatapusin ang trabaho.",
    zh: "混用生熟用具可令家人病。第一次：重新訓練及書面警告。若有人病或再犯：終止僱傭。",
  },
  "rule-4": {
    en: "Using the wrong board risks food poisoning. First time: written warning and supervised retraining. Repeat or if family falls ill: employment terminated.",
    fil: "Maling board ay delikado sa pagkain. Unang beses: written warning at supervised retraining. Ulit o kung may magkasakit sa pamilya: tatapusin ang trabaho.",
    zh: "用錯砧板可導致食物中毒。第一次：書面警告及在監督下重新訓練。再犯或家人病：終止僱傭。",
  },
  "rule-5": {
    en: "Resting before finishing Zizi's urgent needs (meals, pickup, safety): verbal then written warning. Repeated: rest time reduced and contract reviewed; may lead to termination.",
    fil: "Magpahinga bago tapusin ang urgent na gawain kay Zizi (pagkain, sundo, kaligtasan): verbal tapos written warning. Paulit-ulit: bawasan ang rest time at review ng kontrata; maaaring matapos ang trabaho.",
    zh: "未完成 Zizi 緊急需要（膳食、接送、安全）就休息：口頭繼而書面警告。再犯：縮短休息時間及檢討合約；可能終止僱傭。",
  },
  "rule-6": {
    en: "Personal phone use during work (not rest time): verbal warning. Repeated or phone use while caring for Zizi: written warning, then termination if it continues.",
    fil: "Personal na telepono habang nagtatrabaho (hindi rest time): verbal warning. Paulit-ulit o gamit habang inaalagaan si Zizi: written warning, tapos termination kung magpatuloy.",
    zh: "工作時間（非休息時間）使用私人手機：口頭警告。再犯或照顧 Zizi 時使用：書面警告，仍繼續則終止僱傭。",
  },
  "rule-7": {
    en: "Not reporting a problem in time — especially if Zizi is hurt, something breaks, or food/kitchen is unsafe — helper is held responsible for resulting harm. Serious cases: written warning or termination.",
    fil: "Hindi agad na i-report ang problema — lalo na kung nasaktan si Zizi, may nasira, o delikado ang pagkain/kusina — pananagutan ng helper ang resulta. Malubhang kaso: written warning o termination.",
    zh: "不及時報告問題 — 尤其 Zizi 受傷、物品損壞或廚房不安全 — 助理須對後果負責。嚴重：書面警告或終止僱傭。",
  },
  "rule-8": {
    en: "Leaving doors or windows unlocked: written warning. If theft, break-in, or Zizi could have been harmed results: employment terminated and helper may be held responsible.",
    fil: "Hindi na-lock ang pinto o bintana: written warning. Kung may nakawan, break-in, o si Zizi ay naging delikado: tatapusin ang trabaho at maaaring managot ang helper.",
    zh: "門窗未上鎖：書面警告。若導致盜竊、入屋或 Zizi 可能受傷：終止僱傭，助理可能須負責。",
  },
};

for (const path of paths) {
  const data = JSON.parse(readFileSync(path, "utf-8"));
  for (const rule of data.groundRules) {
    rule.consequences = CONSEQUENCES[rule.id] ?? {
      en: "Tell employer immediately. Employment may be terminated depending on severity.",
      fil: "Sabihin agad sa employer. Maaaring matapos ang trabaho depende sa kalubhaan.",
      zh: "立即告知僱主。視乎嚴重程度可能終止僱傭。",
    };
  }
  data.lastUpdated = new Date().toISOString();
  writeFileSync(path, JSON.stringify(data, null, 2) + "\n", "utf-8");
  console.log("Updated:", path);
}
