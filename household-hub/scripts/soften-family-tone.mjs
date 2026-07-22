#!/usr/bin/env node
/** Soften ground rules + family-member wording in content.json (both copies) */
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const files = [
  path.join(__dirname, "../data/content.json"),
  path.join(__dirname, "../public/data/content.json"),
];

const groundRules = [
  {
    id: "rule-1",
    title: {
      en: "No borrow money",
      fil: "Huwag humiram ng pera",
      zh: "不可借錢",
    },
    description: {
      en: "Do not borrow money from anyone — neighbours, strangers, or other domestic workers. If you need something, tell Sir or Mum directly. No borrowing is allowed.",
      fil: "Huwag humiram ng pera kaninuman — kapitbahay, estranghero, o ibang domestic worker. Kung may kailangan, diretso kay Sir o Mum. Bawal ang paghiram.",
      zh: "不可向任何人借錢 — 鄰居、陌生人或他傭。有需要直接告訴 Sir 或 Mum。禁止借錢。",
    },
    category: "general",
    priority: 1,
    consequences: {
      en: "If Broken: We will talk together first and explain why this protects you. If borrowing continues or is hidden, we will give a clear written reminder and may need to review the work arrangement with the agency.",
      fil: "If Broken: Mag-uusap muna tayo at ipapaliwanag kung bakit ito proteksyon para sa'yo. Kung magpatuloy o itago ang paghiram, magbibigay ng written reminder at maaaring i-review ang arrangement sa agency.",
      zh: "若違反：會先一起商量並說明這是為了保護你。若繼續或隱瞞借錢，會發出書面提醒，並可能與中介檢討工作安排。",
    },
  },
  {
    id: "rule-2",
    title: {
      en: "Zizi comes first — he is our shared priority",
      fil: "Si Zizi ang unahin — shared priority natin",
      zh: "Zizi 優先 — 我們共同的重心",
    },
    description: {
      en: "You are part of our family team caring for Zizi. His meals, rest, school run, and safety come before other chores. If he needs you, pause other work and be with him.",
      fil: "Bahagi ka ng pamilya na nag-aalaga kay Zizi. Ang pagkain, pahinga, school run, at kaligtasan niya ay una bago ang ibang gawain. Kung kailangan ka niya, itigil muna ang iba at samahan siya.",
      zh: "你是照顧 Zizi 的家庭一分子。他的膳食、休息、接送與安全優先於其他家務。他需要你時，請先停下手邊工作陪伴他。",
    },
    category: "childcare",
    priority: 2,
    consequences: {
      en: "If Broken: We will calmly explain what Zizi needed and practice together. If he was unsafe or left hungry/unattended more than once, we will give a written reminder. Serious neglect may mean we cannot continue living together safely.",
      fil: "If Broken: Ipaliwanag nang mahinahon kung ano ang kailangan ni Zizi at magpractice nang magkasama. Kung siya ay naging delikado o gutom/walang bantay nang paulit-ulit, magbibigay ng written reminder. Malubhang pagpapabaya ay maaaring hindi na ligtas magpatuloy.",
      zh: "若違反：會溫和說明 Zizi 的需要並一起練習。若多次令他不安全、挨餓或無人看管，會書面提醒。嚴重疏忽時，為安全可能無法繼續同住安排。",
    },
  },
  {
    id: "rule-3",
    title: {
      en: "Keep raw and cooked tools separate",
      fil: "Hiwalay ang gamit para sa hilaw at luto",
      zh: "生熟用具分開",
    },
    description: {
      en: "Use different chopping boards and knives for raw meat and cooked food. Wash hands and tools after touching raw meat. This keeps everyone — including you — healthy.",
      fil: "Gumamit ng iba't ibang chopping board at kutsilyo para sa hilaw na karne at lutong pagkain. Maghugas ng kamay at gamit pagkatapos humawak ng hilaw na karne. Proteksyon ito para sa lahat — kasama ka.",
      zh: "生肉與熟食用不同砧板和刀。處理生肉後洗手及清洗用具。這是為全家人（包括你）的健康。",
    },
    category: "kitchen",
    priority: 3,
    consequences: {
      en: "If Broken: We will retrain gently on food safety. If anyone gets sick or it happens again after reminder, we will give a written reminder and watch kitchen practice more closely.",
      fil: "If Broken: Tuturuan ulit nang mabait ang food safety. Kung may magkasakit o maulit pagkatapos ng paalala, magbibigay ng written reminder at mas babantayan ang kusina.",
      zh: "若違反：會溫和再教食物安全。若有人生病或提醒後再犯，會書面提醒並更仔細跟進廚房做法。",
    },
  },
  {
    id: "rule-4",
    title: {
      en: "Use the labelled chopping boards",
      fil: "Gamitin ang may label na chopping board",
      zh: "使用已標示的砧板",
    },
    description: {
      en: "Red = raw meat only. Green = cooked food / vegetables. Blue = fish. Clean and dry after each use. Ask Sir/Mum if labels are unclear.",
      fil: "Pula = hilaw na karne lang. Berde = lutong pagkain / gulay. Asul = isda. Linisin at patuyuin pagkatapos. Tanungin si Sir/Mum kung hindi clear ang label.",
      zh: "紅＝生肉。綠＝熟食／蔬菜。藍＝魚。用後洗淨抹乾。標籤不清請問 Sir/Mum。",
    },
    category: "kitchen",
    priority: 4,
    consequences: {
      en: "If Broken: We will show the boards again together. Repeat use of the wrong board: written reminder. If it causes illness, we will review kitchen duties with you carefully.",
      fil: "If Broken: Ipapakita ulit ang boards nang magkasama. Ulit na maling board: written reminder. Kung may magkasakit, i-review nang maingat ang kitchen duties.",
      zh: "若違反：會再一起示範砧板。再犯用錯：書面提醒。若引致病，會仔細檢討廚房分工。",
    },
  },
  {
    id: "rule-5",
    title: {
      en: "Rest after urgent family needs are done",
      fil: "Magpahinga pagkatapos ng urgent na pangangailangan ng pamilya",
      zh: "完成緊急家事後再休息",
    },
    description: {
      en: "You deserve daily rest. Please finish urgent needs for Zizi first (meals, school run, safety), then enjoy your break. Rest helps you stay well in Hong Kong.",
      fil: "May karapatan kang magpahinga araw-araw. Tapusin muna ang urgent para kay Zizi (pagkain, school run, kaligtasan), saka magpahinga. Ang pahinga ay tulong para sa kalusugan mo sa Hong Kong.",
      zh: "你每天都應有休息。請先完成 Zizi 的緊急需要（膳食、接送、安全），再休息。休息能幫助你在香港保持健康。",
    },
    category: "general",
    priority: 5,
    consequences: {
      en: "If Broken: We will talk about timing so rest and Zizi's needs both fit. Repeated early rest while Zizi still needs care: gentle written reminder and we adjust the schedule together.",
      fil: "If Broken: Pag-uusapan ang timing para magkasya ang pahinga at needs ni Zizi. Paulit-ulit na maagang pahinga habang kailangan pa ni Zizi: mahinahong written reminder at i-adjust ang schedule nang magkasama.",
      zh: "若違反：會商量時間，讓休息與 Zizi 需要都能兼顧。多次在 Zizi 仍需照顧時提早休息：溫和書面提醒，並一起調整時間表。",
    },
  },
  {
    id: "rule-6",
    title: {
      en: "Phone during work — emergencies and family contact",
      fil: "Telepono sa oras ng gawain — emergency at family contact",
      zh: "工作時使用電話 — 緊急與家人聯絡",
    },
    description: {
      en: "Keep your phone nearby for emergencies and messages from Sir/Mum. Longer personal calls or scrolling are for rest time and your day off, so Zizi stays safe and you can focus.",
      fil: "Ilagay ang telepono malapit para sa emergency at mensahe nina Sir/Mum. Mas mahabang personal na tawag o scrolling ay sa rest time at day off, para ligtas si Zizi at makapag-focus ka.",
      zh: "手機請放在附近，方便緊急情況及 Sir/Mum 聯絡。較長的私人通話或滑手機，請留在休息時間及放假日，好讓 Zizi 安全、你也能專心。",
    },
    category: "general",
    priority: 6,
    consequences: {
      en: "If Broken: Friendly reminder first. If phone use often distracts while caring for Zizi, we will give a written reminder and agree clearer phone times together.",
      fil: "If Broken: Friendly reminder muna. Kung madalas makagambala ang telepono habang inaalagaan si Zizi, magbibigay ng written reminder at magkasundo sa mas clear na oras ng telepono.",
      zh: "若違反：先友善提醒。若照顧 Zizi 時經常被手機分心，會書面提醒並一起約定更清楚的用機時間。",
    },
  },
  {
    id: "rule-7",
    title: {
      en: "Tell Sir or Mum right away if something is wrong",
      fil: "Sabihin agad kay Sir o Mum kung may problema",
      zh: "有事立刻告訴 Sir 或 Mum",
    },
    description: {
      en: "You are new to Hong Kong — it is OK to ask. If something breaks, Zizi feels unwell, or you are unsure, tell Sir or Mum immediately. We prefer early questions over silent worry.",
      fil: "Bago ka pa sa Hong Kong — OK lang magtanong. Kung may nasira, may sakit si Zizi, o hindi ka sure, sabihin agad kay Sir o Mum. Mas gusto namin ang maagang tanong kaysa tahimik na alalahanin.",
      zh: "你初到香港 — 發問沒問題。東西壞了、Zizi 不適或不肯定時，請立刻告訴 Sir 或 Mum。我們寧願你早問，也不要自己擔心。",
    },
    category: "safety",
    priority: 7,
    consequences: {
      en: "If Broken: We will explain why early reporting keeps everyone safe. If delay causes harm to Zizi or serious damage, we will give a written reminder and plan how to call us next time.",
      fil: "If Broken: Ipaliwanag kung bakit ang maagang pag-report ay proteksyon. Kung dahil sa delay ay nasaktan si Zizi o may malaking sira, magbibigay ng written reminder at plan kung paano tumawag sa susunod.",
      zh: "若違反：會說明及早告知如何保護大家。若延誤令 Zizi 受傷或造成嚴重損壞，會書面提醒並約定下次如何聯絡我們。",
    },
  },
  {
    id: "rule-8",
    title: {
      en: "Lock doors and windows for our home",
      fil: "I-lock ang pinto at bintana ng tahanan natin",
      zh: "鎖好家門與窗戶",
    },
    description: {
      en: "This is your home too while you live with us. Lock the main door when going out or at night, and check windows before sleep. Ask if you are unsure about any lock.",
      fil: "Tahanan mo rin ito habang nakatira ka sa amin. I-lock ang pangunahing pinto kapag aalis o sa gabi, at suriin ang bintana bago matulog. Magtanong kung hindi sure sa lock.",
      zh: "與我們同住期間，這裡也是你的家。出門或晚上請鎖大門，睡前檢查窗戶。鎖不肯定請問。",
    },
    category: "safety",
    priority: 8,
    consequences: {
      en: "If Broken: We will practice locking together. If doors/windows are left open again, written reminder. If it leads to theft or danger for Zizi, we must take the situation very seriously and may need agency support.",
      fil: "If Broken: Magpractice magkasama sa pag-lock. Kung muliang nakalimutan, written reminder. Kung may nakawan o panganib kay Zizi, seryosohin namin ito at maaaring kailanganin ang tulong ng agency.",
      zh: "若違反：會一起練習上鎖。若再忘記，書面提醒。若因此失竊或危及 Zizi，我們會嚴肅處理，並可能需要中介協助。",
    },
  },
];

function softenGuideBody(text) {
  if (!text) return text;
  return text
    .replace(/\bother helpers\b/gi, "other domestic workers")
    .replace(/\bibang helper\b/gi, "ibang domestic worker")
    .replace(/\bibang katulong\b/gi, "ibang domestic worker")
    .replace(/\bHelpers are entitled\b/g, "People in your role are entitled")
    .replace(/\bMay statutory holidays ang helpers\b/g, "May statutory holidays ang mga nasa papel mo")
    .replace(/\bBy HK law, a helper should\b/g, "By HK law, someone in your role should")
    .replace(/\bAyon sa batas ng HK, dapat may\b/g, "Ayon sa batas ng HK, dapat may")
    .replace(/\bUnder the Standard Employment Contract, helpers live\b/g, "Under the Standard Employment Contract, you live")
    .replace(/\bnakatira ang helper sa bahay ng employer\b/g, "nakatira ka sa bahay ng pamilya (ayon sa kontrata)")
    .replace(/\bLabour Department advises helpers to\b/g, "Labour Department advises you to")
    .replace(/\bmag-tala ang helper ng\b/g, "mag-tala ka ng")
    .replace(/\bDo not give original documents to strangers or other helpers\b/g, "Do not give original documents to strangers or other domestic workers")
    .replace(/\bestranghero o ibang helper\b/g, "estranghero o ibang domestic worker");
}

for (const file of files) {
  const content = JSON.parse(fs.readFileSync(file, "utf8"));
  content.groundRules = groundRules;
  content.familyWelcome = {
    en: "You are part of Zizi's family. This guide is for your daily life with us in Hong Kong.",
    fil: "Bahagi ka ng pamilya ni Zizi. Ang gabay na ito ay para sa araw-araw ninyong buhay sa Hong Kong.",
    zh: "你是 Zizi 家庭的一分子。這份指南幫助你在香港與我們的日常生活。",
  };
  if (content.hkLifeGuides) {
    for (const g of content.hkLifeGuides) {
      for (const lang of ["en", "fil", "zh"]) {
        if (g.body?.[lang]) g.body[lang] = softenGuideBody(g.body[lang]);
        if (g.title?.[lang]) g.title[lang] = softenGuideBody(g.title[lang]);
      }
    }
  }
  content.lastUpdated = new Date().toISOString();
  fs.writeFileSync(file, JSON.stringify(content, null, 2) + "\n");
  console.log("Updated rules + welcome in", file);
}
