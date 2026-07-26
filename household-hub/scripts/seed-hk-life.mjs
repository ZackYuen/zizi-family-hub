#!/usr/bin/env node
/** Merge HK Life guides, checklist, emergency contacts, weather flag into content.json */
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const files = [
  path.join(__dirname, "../data/content.json"),
  path.join(__dirname, "../public/data/content.json"),
];

const tip = (id, category, priority, area, title, body, sourceUrl) => ({
  id,
  category,
  priority,
  area,
  title,
  body,
  ...(sourceUrl ? { sourceUrl } : {}),
  lastReviewed: "2026-07-22",
});

const hkLifeGuides = [
  tip(
    "life-emergency-999",
    "emergency",
    1,
    "hk-general",
    {
      en: "Hong Kong emergency number",
      fil: "Emergency number sa Hong Kong",
      zh: "香港緊急電話",
    },
    {
      en: "Call 999 for police, fire, or ambulance. Then call Sir or Mum immediately. Keep the phone charged.",
      fil: "Tumawag sa 999 para sa pulis, bombero, o ambulansya. Pagkatapos, tawagan agad si Sir o Mum. Panatilihing charged ang telepono.",
      zh: "報警／救護／消防請打 999，然後立刻致電 Sir 或 Mum。保持手機有電。",
    }
  ),
  tip(
    "life-family-contacts",
    "emergency",
    2,
    "kwun-tong",
    {
      en: "Call Sir or Mum first for family matters",
      fil: "Para sa family matters, tawagan muna si Sir o Mum",
      zh: "家事先聯絡 Sir 或 Mum",
    },
    {
      en: "For Zizi health, school, money, visitors, or if you are unsure — tell Sir or Mum right away. Do not wait. Numbers are in the Emergency section of this app (Admin can update).",
      fil: "Kung may sakit si Zizi, problema sa eskwela, pera, bisita, o kung hindi ka sigurado — sabihin agad kay Sir o Mum. Nasa Emergency section ng app ang mga numero (maaaring i-update sa Admin).",
      zh: "Zizi 健康、學校、金錢、訪客或任何不肯定的事 — 立刻告知 Sir 或 Mum。電話在 App 緊急聯絡（Admin 可更新）。",
    }
  ),
  tip(
    "life-ph-support",
    "emergency",
    3,
    "hk-general",
    {
      en: "Philippine support in Hong Kong",
      fil: "Tulong mula sa Pilipinas sa Hong Kong",
      zh: "在港菲律賓支援",
    },
    {
      en: "For serious labour/welfare issues you may contact: Labour Department 2171 1771; Philippine Consulate emergency 9155 4023; MWO hotline 5529 1880; OWWA 6345 9324 (Admiralty, United Centre). Still tell Sir/Mum first for normal family matters. Confirm numbers if needed.",
      fil: "Para sa seryosong labour/welfare: Labour Department 2171 1771; Philippine Consulate emergency 9155 4023; MWO 5529 1880; OWWA 6345 9324 (Admiralty, United Centre). Para sa normal na family matter, sabihin muna kay Sir/Mum.",
      zh: "嚴重勞工／福利事宜可聯絡：勞工處 2171 1771；菲律賓領事館緊急 9155 4023；MWO 5529 1880；OWWA 6345 9324（金鐘 United Centre）。一般家事仍先告知 Sir/Mum。",
    },
    "https://hongkongpcg.dfa.gov.ph/directory"
  ),
  tip(
    "life-contract-maw",
    "rights",
    10,
    "hk-general",
    {
      en: "Standard contract & minimum wage (general)",
      fil: "Standard contract at minimum wage (pangkalahatan)",
      zh: "標準合約與最低工資（一般資料）",
    },
    {
      en: "FDHs in HK use the government Standard Employment Contract (ID 407). For contracts signed on/after 30 Sep 2025, Minimum Allowable Wage is HK$5,100/month (check YOUR contract — older contracts may differ). This is general info, not legal advice. Ask Sir/Mum about your terms. Source: Labour Department FDH Portal.",
      fil: "Ang FDH sa HK ay gumagamit ng Standard Employment Contract (ID 407). Para sa kontrata mula 30 Sep 2025, MAW ay HK$5,100/buwan (tingnan ANG IYONG kontrata). Impormasyon lang ito — hindi legal advice. Tanungin si Sir/Mum. Source: Labour Department.",
      zh: "外傭使用政府標準僱傭合約（ID 407）。2025年9月30日或之後簽訂的合約，最低許可工資為每月港幣$5,100（以你的合約為準）。此為一般資料，非法律意見。請向 Sir/Mum 確認。來源：勞工處。",
    },
    "https://www.fdh.labour.gov.hk/en/home.html"
  ),
  tip(
    "life-rest-day",
    "rights",
    11,
    "hk-general",
    {
      en: "Weekly rest day (24 hours)",
      fil: "Lingguhang rest day (24 oras)",
      zh: "每週休息日（24 小時）",
    },
    {
      en: "By HK law, a helper should get at least one rest day every 7 days — a continuous period of at least 24 hours. In this family, Sunday and HK public holidays (勞工假) are Charlene day off. Employer generally must not force work on a rest day. Confirm details with Sir/Mum.",
      fil: "Ayon sa batas ng HK, dapat may hindi bababa sa isang rest day bawat 7 araw — tuloy-tuloy na hindi bababa sa 24 oras. Sa pamilyang ito, Linggo at HK public holiday (勞工假) ay day off ni Charlene. Huwag pilitin magtrabaho sa rest day. Kumpirmahin kay Sir/Mum.",
      zh: "香港法例下，外傭每 7 天至少有 1 個連續不少於 24 小時的休息日。本家庭：星期日及公眾假期（勞工假）為 Charlene 放假。一般不可強迫休息日工作。請向 Sir/Mum 確認。",
    },
    "https://www.fdh.labour.gov.hk/res/pdf/Employment_handbook_FDH_English.pdf"
  ),
  tip(
    "life-stat-holidays",
    "rights",
    12,
    "hk-general",
    {
      en: "Statutory holidays",
      fil: "Statutory holidays",
      zh: "法定假日",
    },
    {
      en: "Helpers are entitled to statutory holidays (15 in 2026). Employers cannot pay cash instead of giving the holiday. If you work on a statutory holiday, an alternative holiday should be arranged under the rules. Ask Sir/Mum before changing plans.",
      fil: "May statutory holidays ang helpers (15 noong 2026). Hindi pwedeng bayaran na lang kapalit ng holiday. Kung magtrabaho sa statutory holiday, may alternative holiday ayon sa batas. Tanungin si Sir/Mum bago baguhin ang plano.",
      zh: "外傭享有法定假日（2026 年為 15 天）。不可用金錢代替放假。若法定假日工作，應按規定另排補假。更改前先問 Sir/Mum。",
    },
    "https://www.fdh.labour.gov.hk/en/faq.html"
  ),
  tip(
    "life-typhoon",
    "weather",
    20,
    "hk-general",
    {
      en: "Typhoon T8+ / Black rainstorm",
      fil: "Typhoon T8+ / Black rainstorm",
      zh: "八號風球／黑色暴雨",
    },
    {
      en: "When Typhoon Signal No. 8 or above, or Black Rainstorm is in force: do not go outdoors for work (e.g. school run) unless Sir/Mum clearly say it is safe and necessary. Stay indoors. Indoor housework may still apply on a normal work day — follow Sir/Mum. On YOUR rest day you should not be forced to work. Check the weather banner in this app and ask Sir/Mum.",
      fil: "Kapag may Typhoon Signal No. 8 pataas o Black Rainstorm: huwag lumabas para magtrabaho (hal. hatid-sundo) maliban kung malinaw na sinabi nina Sir/Mum na safe. Manatili sa loob. Sa work day, baka may indoor gawain pa rin — sundin sina Sir/Mum. Sa REST DAY mo, hindi ka dapat pilitin magtrabaho. Tingnan ang weather banner at tanungin sina Sir/Mum.",
      zh: "八號或以上風球／黑色暴雨生效時：除非 Sir/Mum 明確表示安全必要，否則不要戶外工作（例如接送）。留在室內。正常工作日仍可能做室內家務 — 聽 Sir/Mum。休息日不可被強迫工作。查看 App 天氣提示並詢問 Sir/Mum。",
    },
    "https://www.fdh.labour.gov.hk/en/home.html"
  ),
  tip(
    "life-octopus",
    "money",
    30,
    "hk-general",
    {
      en: "Octopus card",
      fil: "Octopus card",
      zh: "八達通",
    },
    {
      en: "Get an Octopus card early. Use it on MTR, buses, and many shops (7-Eleven, some supermarkets). Top up at MTR machines or 7-Eleven. Keep enough balance for school walks / shopping days. Never borrow money for top-up — ask Sir/Mum.",
      fil: "Kumuha agad ng Octopus. Magagamit sa MTR, bus, at maraming tindahan (7-Eleven, supermarket). Mag-top up sa MTR o 7-Eleven. Mag-iwan ng sapat na balanse. Huwag humiram ng pera — tanungin si Sir/Mum.",
      zh: "盡早辦理八達通。可用於港鐵、巴士及不少商店（7-Eleven、部分超市）。可在港鐵或 7-Eleven 增值。保持足夠餘額。不要借錢增值 — 問 Sir/Mum。",
    }
  ),
  tip(
    "life-no-borrow",
    "money",
    31,
    "hk-general",
    {
      en: "Do not borrow or lend money",
      fil: "Huwag humiram o magpahiram ng pera",
      zh: "不要借貸",
    },
    {
      en: "Family ground rule: do not borrow money from anyone, and do not lend your money to other helpers. If you need something, ask Sir/Mum directly. See Ground Rules for consequences.",
      fil: "Alituntunin ng pamilya: huwag humiram ng pera kaninuman, at huwag magpahiram sa ibang helper. Kung may kailangan, diretso kay Sir/Mum. Tingnan ang Ground Rules para sa resulta.",
      zh: "家庭守則：不要向任何人借錢，也不要借錢給其他傭工。有需要直接問 Sir/Mum。後果見 Ground Rules。",
    }
  ),
  tip(
    "life-kt-school-walk",
    "transport",
    40,
    "kwun-tong",
    {
      en: "Walk to Zizi's kindergarten (Kwun Tong / Lam Tin)",
      fil: "Lakad papunta sa kindergarten ni Zizi (Kwun Tong / Lam Tin)",
      zh: "步行往 Zizi 幼稚園（觀塘／藍田）",
    },
    {
      en: "Lam Tin Ling Liang Kindergarten — PM class Mon–Fri. Walk from home is about 30 minutes. Leave by 12:30 to arrive by 13:00. Leave by 16:00 to pick up at 16:30. Bring Octopus / water on hot days. In severe weather, ask Sir/Mum before going out.",
      fil: "Lam Tin Ling Liang Kindergarten — PM class Lunes–Biyernes. Mga 30 minuto lakad mula bahay. Umalis ng 12:30 para dumating bago 13:00. Umalis ng 16:00 para sundo ng 16:30. Magdala ng Octopus / tubig kung mainit. Sa masamang panahon, tanungin muna sina Sir/Mum.",
      zh: "藍田靈糧幼稚園 — 星期一至五下午班。由家步行約 30 分鐘。12:30 出門，13:00 前到達；16:00 出門，16:30 接回。熱天帶八達通／水。惡劣天氣出門前先問 Sir/Mum。",
    }
  ),
  tip(
    "life-kt-mtr",
    "transport",
    41,
    "kwun-tong",
    {
      en: "Nearby MTR (Kwun Tong)",
      fil: "Malapit na MTR (Kwun Tong)",
      zh: "附近港鐵（觀塘）",
    },
    {
      en: "Home → Kwun Tong MTR is about a 3-minute walk. Useful stations: Kwun Tong (home), Lam Tin (kindergarten area), Yau Tong (only if needed). For taxis, show the Chinese destination on your phone map. Keep Sir/Mum address saved offline. Prefer the known school walking route during work hours unless told otherwise.",
      fil: "Bahay → Kwun Tong MTR: mga 3 minutong lakad. Mga istasyon: Kwun Tong (bahay), Lam Tin (kindergarten), Yau Tong (kung kailangan lang). Sa taxi, ipakita ang Chinese destination sa phone map. I-save ang address nina Sir/Mum. Sa work hours, mas mabuti ang alam na lakad papuntang school maliban kung may ibang utos.",
      zh: "由家步行約3分鐘到觀塘港鐵。常用站：觀塘（家）、藍田（幼稚園）、油塘（有需要才去）。的士可出示手機地圖中文目的地。儲存 Sir/Mum 地址。工作時間優先用熟悉的上學步行路線，除非另有指示。",
    }
  ),
  tip(
    "life-aeon",
    "shopping",
    50,
    "kwun-tong",
    {
      en: "Groceries — YATA at apm (first)",
      fil: "Pamimili — YATA sa apm (una)",
      zh: "買菜 — apm 一田 YATA（優先）",
    },
    {
      en: "First choice: YATA (一田) supermarket inside apm, linked to our Kwun Tong home (near Kwun Tong MTR, ~3 min walk). Use the shopping list from tonight’s Meals tab when possible. AEON Yau Tong / Domain only if Sir/Mum ask or something is missing. Keep receipts if asked. Do not buy on credit or borrow.",
      fil: "Una: YATA (一田) supermarket sa apm, konektado sa Kwun Tong home namin (malapit sa Kwun Tong MTR, ~3 min lakad). Gamitin ang shopping list sa Meals tab kung pwede. AEON Yau Tong / Domain lang kung sabihin ni Sir/Mum o may kulang. Itago ang resibo kung kailangan. Huwag bumili nang utang o humiram.",
      zh: "優先：家附近 apm 內的一田 YATA（近觀塘港鐵，步行約3分鐘）。盡量用 Meals 分頁購物清單。只有 Sir/Mum 吩咐或買不到時才去油塘／Domain AEON。如需要請保留收據。不要賒帳或向人借錢。",
    }
  ),
  
  tip(
    "life-zizi-meals",
    "culture",
    36,
    "kwun-tong",
    {
      en: "Zizi meals (breakfast, lunch, dinner)",
      fil: "Pagkain ni Zizi (almusal, tanghalian, dinner)",
      zh: "Zizi 三餐（早、午、晚）",
    },
    {
      en: "Work days (not Charlene day off): (1) Simple breakfast — egg / pancake / siumai / 蕃薯 etc. + morning milk in a glass with glass straw. (2) Lunch — spaghetti / fried rice / noodle / 烏冬 etc., must include meat and vegetables. (3) Dinner — follow Meals tab random menu (meat + vegetable + soup) for the family. Ask Sir/Mum if Zizi refuses food or seems unwell.",
      fil: "Work days (hindi day off ni Charlene): (1) Simpleng almusal — itlog / pancake / siumai / 蕃薯 atbp. + morning milk sa baso na may glass straw. (2) Tanghalian — spaghetti / fried rice / noodle / 烏冬 atbp., dapat may meat at gulay. (3) Dinner — sundin ang Meals tab (meat + gulay + sabaw) para sa pamilya. Sabihin kay Sir/Mum kung ayaw kumain si Zizi o may sakit.",
      zh: "工作天（Charlene 放假除外）：(1) 簡單早餐 — 蛋／pancake／燒賣／蕃薯等＋玻璃杯牛奶配玻璃吸管。(2) 午餐 — 意粉／炒飯／麵／烏冬等，必須有肉和蔬菜。(3) 晚餐 — 跟 Meals 分頁隨機菜單（肉＋菜＋湯）給一家人。若 Zizi 拒食或不適，告知 Sir/Mum。",
    }
  ),
  tip(
    "life-weekly-chores",
    "culture",
    37,
    "kwun-tong",
    {
      en: "Weekly house rhythm (~660 sq ft, boy at home)",
      fil: "Lingguhang gawain sa bahay (~660 sq ft, may batang lalaki)",
      zh: "每週家務節奏（約660呎、有小男孩）",
    },
    {
      en: "Small flat, 4 people, active boy — little and often beats one huge clean. Daily: meals, dishes, kitchen bin, evening vacuum, Zizi shower, tidy toys. Mon: laundry + mop. Tue: toys + living room + YATA shop. Wed: kitchen machines deep clean. Thu: bathroom deep clean. Fri: bedrooms. Sat: iron, school bag/shoes, top-up shop. Monthly list: sheets, AC filters (×3), fridge, hood, soft toys, windows. Sunday / public holiday: Charlene day off.",
      fil: "Maliit na flat, 4 tao, active na bata — konti pero madalas mas maganda kaysa isang malaking linis. Araw-araw: pagkain, hugas, basurahan, vacuum sa gabi, shower ni Zizi, ayos laruan. Lun: labada + mop. Mar: laruan + sala + YATA. Miy: kitchen machines. Huw: banyo. Biy: kwarto. Sab: plantsa, bag/sapatos, konting pamimili. Buwanan: sheets, AC filter (×3), ref, hood, soft toys, bintana. Linggo / holiday: day off ni Charlene.",
      zh: "小單位、四人、活潑男孩——少量多次勝過一次大掃除。每日：三餐、洗碗、廚房垃圾桶、晚間吸塵、Zizi 洗澡、收拾玩具。一：洗衣拖地。二：玩具客廳＋一田。三：廚房電器深清。四：浴室深清。五：睡房。六：熨衣、書包鞋、補買。每月：床單、3部冷氣濾網、雪櫃、油煙機、毛公仔、窗。日／公眾假期：Charlene 放假。",
    }
  ),
  tip(
    "life-zizi-sick",
    "health",
    60,
    "kwun-tong",
    {
      en: "If Zizi is unwell",
      fil: "Kung may sakit si Zizi",
      zh: "若 Zizi 不適",
    },
    {
      en: "Fever, vomiting, injury, or unusual sleepiness: call Sir/Mum immediately. Do not give medicine unless Sir/Mum instructed. Stay with Zizi; stop non-urgent chores.",
      fil: "Lagnat, pagsusuka, sugat, o hindi pangkaraniwang antok: tawagan agad si Sir/Mum. Huwag magbigay ng gamot kung walang utos. Samahan si Zizi; itigil ang hindi urgent na gawain.",
      zh: "發燒、嘔吐、受傷或不尋常昏睡：立刻致電 Sir/Mum。未獲指示不要自行餵藥。陪伴 Zizi；暫停非緊急家務。",
    }
  ),
  tip(
    "life-heat",
    "health",
    61,
    "kwun-tong",
    {
      en: "Hot weather walking",
      fil: "Mainit na panahon kapag may lakad",
      zh: "炎熱天氣步行",
    },
    {
      en: "Hong Kong summers are hot and humid. On school walks bring water for Zizi, use shade where possible, and rest if he looks overheated. Tell Sir/Mum if Zizi refuses water or seems dizzy.",
      fil: "Mainit at mahalumigmig ang tag-init sa HK. Magdala ng tubig para kay Zizi, humanap ng lilim, at magpahinga kung mukhang sobrang init. Sabihin kay Sir/Mum kung ayaw uminom o nahihilo.",
      zh: "香港夏天炎熱潮濕。上學步行請為 Zizi 帶水、盡量走陰涼處，若他過熱就休息。若拒喝水或頭暈，告知 Sir/Mum。",
    }
  ),
  tip(
    "life-quiet",
    "culture",
    70,
    "kwun-tong",
    {
      en: "Building quiet hours",
      fil: "Tahimik sa building tuwing gabi",
      zh: "大廈夜間保持安靜",
    },
    {
      en: "Keep TV and voices low at night so neighbours are not disturbed. No loud calls in corridors. Follow any building notice Sir/Mum show you.",
      fil: "Babaan ang TV at boses sa gabi para hindi maistorbo ang kapitbahay. Walang malakas na tawag sa koridor. Sundin ang building notice na ipapakita nina Sir/Mum.",
      zh: "晚上調低電視及說話聲量，勿打擾鄰居。走廊不要大聲講電話。遵守 Sir/Mum 出示的大廈通告。",
    }
  ),
  tip(
    "life-rubbish",
    "culture",
    71,
    "kwun-tong",
    {
      en: "Rubbish & recycling",
      fil: "Basura at recycling",
      zh: "垃圾與回收",
    },
    {
      en: "Ask Sir/Mum where to put rubbish and recycling in this building, and which days. Do not leave bags in the corridor. Keep the kitchen bin clean daily.",
      fil: "Tanungin si Sir/Mum kung saan at kailan itinatapon ang basura/recycling sa building. Huwag mag-iwan ng basura sa koridor. Linisin araw-araw ang basurahan sa kusina.",
      zh: "向 Sir/Mum 查詢本大廈垃圾／回收位置及日子。不要把垃圾袋留在走廊。每天清理廚房垃圾桶。",
    }
  ),
  tip(
    "life-live-in",
    "culture",
    72,
    "hk-general",
    {
      en: "Live-in requirement",
      fil: "Live-in requirement",
      zh: "留宿規定",
    },
    {
      en: "Under the Standard Employment Contract, helpers live at the employer's home. Do not sleep elsewhere overnight without Sir/Mum agreement. On rest days you may go out, but return as agreed with the family.",
      fil: "Ayon sa Standard Employment Contract, nakatira ang helper sa bahay ng employer. Huwag matulog sa ibang lugar overnight kung walang sang-ayon sina Sir/Mum. Sa rest day pwede lumabas, pero umuwi ayon sa usapan.",
      zh: "按標準僱傭合約，外傭須住在僱主家。未得 Sir/Mum 同意不要在外過夜。休息日可外出，但按家庭約定回家。",
    },
    "https://www.fdh.labour.gov.hk/en/faq.html"
  ),
  tip(
    "life-food-allowance",
    "rights",
    13,
    "hk-general",
    {
      en: "Food or food allowance",
      fil: "Pagkain o food allowance",
      zh: "膳食或膳食津貼",
    },
    {
      en: "Employers provide free food or a food allowance (general minimum reference HK$1,236/month when no free food — confirm your contract). In this home Charlene cooks family meals including Zizi's. Ask Sir/Mum if unsure what you may eat.",
      fil: "Nagbibigay ang employer ng libreng pagkain o food allowance (pangkalahatang sanggunian ≥ HK$1,236/buwan kung walang free food — tingnan ang kontrata). Dito, nagluluto si Charlene para sa pamilya kasama si Zizi. Tanungin si Sir/Mum kung ano ang pwede kainin.",
      zh: "僱主提供免費膳食或膳食津貼（一般參考：無免費膳食時每月不少於港幣$1,236 — 以合約為準）。本家庭由 Charlene 煮家人及 Zizi 的餐。不肯定可吃什麼時問 Sir/Mum。",
    },
    "https://www.fdh.labour.gov.hk/en/home.html"
  ),
  tip(
    "life-documents",
    "rights",
    14,
    "hk-general",
    {
      en: "Keep your documents safe",
      fil: "Ingatan ang iyong mga dokumento",
      zh: "妥善保管證件",
    },
    {
      en: "Keep passport, HKID, and contract copies safe and reachable. Do not give original documents to strangers or other helpers. Tell Sir/Mum if anything is missing.",
      fil: "Ingatan ang passport, HKID, at kopya ng kontrata — safe pero accessible. Huwag ibigay ang original sa estranghero o ibang helper. Sabihin kay Sir/Mum kung may nawawala.",
      zh: "護照、香港身份證及合約副本須安全且可取用。不要把正本交給陌生人或他傭。有遺失立刻告知 Sir/Mum。",
    }
  ),
  tip(
    "life-leave-record",
    "rights",
    15,
    "hk-general",
    {
      en: "Keep your own leave record",
      fil: "Mag-tala ng sariling leave record",
      zh: "自行記錄休假",
    },
    {
      en: "Labour Department advises helpers to keep their own record of rest days and holidays to avoid disputes. You can note them in your phone. Ask Sir/Mum before swapping rest days.",
      fil: "Inirerekomenda ng Labour Department na mag-tala ang helper ng rest days at holidays. Pwede sa phone. Bago magpalit ng rest day, tanungin si Sir/Mum.",
      zh: "勞工處建議外傭自行記錄休息日及假日以免爭議。可用手機備註。調休前先問 Sir/Mum。",
    },
    "https://www.fdh.labour.gov.hk/res/pdf/Employment_handbook_FDH_English.pdf"
  ),
  tip(
    "life-android-apps",
    "culture",
    73,
    "hk-general",
    {
      en: "Must-have Android apps in Hong Kong",
      fil: "Mga dapat i-download na Android app sa Hong Kong",
      zh: "在港必備 Android 應用程式",
    },
    {
      en: "Install from Google Play (free). Ask Sir/Mum if you need Wi‑Fi or a Hong Kong SIM.\n• WhatsApp — message Sir/Mum and this family's helper bot\n• Google Maps — walking / bus routes; save home + kindergarten\n• MTR Mobile — train routes, fares, delays\n• Octopus App — balance & top-up; some Android phones (Android 12+, NFC on, HK-sold device) can tap Octopus from the phone\n• AlipayHK or PayMe — common QR shop payments (optional; physical Octopus still covers most daily taps)\n• OpenRice — restaurants, hours, reviews\n• MyObservatory (HKO) — typhoon / rain alerts\n• Google Translate — Chinese signs & menus (camera mode)\nKeep your phone charged. Never share OTP / verification codes or lend your phone to strangers.",
      fil: "I-download sa Google Play (libre). Tanungin si Sir/Mum kung kailangan ng Wi‑Fi o HK SIM.\n• WhatsApp — makipag-usap kay Sir/Mum at sa family bot\n• Google Maps — lakad / bus; i-save ang bahay + kindergarten\n• MTR Mobile — ruta, pamasahe, delay\n• Octopus App — balanse at top-up; may Android phone (Android 12+, naka-NFC, binili sa HK) na pwedeng mag-tap ng Octopus mula sa phone\n• AlipayHK o PayMe — QR payment sa tindahan (opsyonal; sapat na ang physical Octopus sa araw-araw)\n• OpenRice — restawran, oras, review\n• MyObservatory (HKO) — bagyo / ulan\n• Google Translate — Chinese signs at menu (camera)\nPanatilihing charged ang phone. Huwag ibigay ang OTP / verification code o ipahiram ang phone sa estranghero.",
      zh: "請從 Google Play 免費下載。需要 Wi‑Fi 或香港 SIM 可問 Sir/Mum。\n• WhatsApp — 聯絡 Sir/Mum 及本家庭助手 bot\n• Google Maps — 步行／巴士；儲存住家＋幼稚園\n• MTR Mobile — 路線、車費、延誤\n• Octopus App — 查餘額／增值；部分 Android（Android 12+、開啟 NFC、香港行貨）可用手機拍卡八達通\n• AlipayHK 或 PayMe — 常見 QR 付款（可選；日常多數仍可用實體八達通）\n• OpenRice — 餐廳、營業時間、評價\n• 我的天文台 MyObservatory — 颱風／暴雨提示\n• Google 翻譯 — 中文路牌與菜單（相機模式）\n保持手機有電。切勿把 OTP／驗證碼給人或把手機借給陌生人。",
    },
    "https://www.discoverhongkong.com/eng/travel-guide/traveller-essentials/travel-apps.html"
  ),
  tip(
    "life-healthy-holiday",
    "health",
    62,
    "hk-general",
    {
      en: "Healthy activities on Filipino rest days",
      fil: "Masusustansiyang gawain sa rest day / holiday",
      zh: "外傭休息日健康活動",
    },
    {
      en: "Your Sunday and HK public holidays (勞工假) are for rest and health — not only sitting in crowded Central parks all day.\n• Easy walk or short hike in country parks / harbourfront — bring water, hat, and Octopus; start short if you are new\n• Near Kwun Tong / Lam Tin: Jordan Valley Park, Lam Tin & Yau Tong parks, waterfront promenades — good for walking and stretching\n• Free outdoor fitness: helper-friendly Sunday groups (e.g. free sessions at Tamar Park — search current “G-Class” / park fitness posts). Join only groups you trust\n• Nature day: Kadoorie Farm & Botanic Garden (KFBG) often runs a free Sunday programme for migrant domestic workers (shuttle, vegan lunch, yoga/art). Check kfbg.org and register early — seats go fast\n• Public pools / sports centres (Leisure & Cultural Services) when open — swim or stretch\n• Church or fellowship + a walk is fine; leave time to sleep before Monday work\nAvoid: long sun with no water; heavy drinking; money-lending circles; overnight stays without Sir/Mum agreement.\nIf Typhoon T8+ / Black rain / extreme heat: stay indoors — see Weather tips.",
      fil: "Ang Linggo at HK public holiday (勞工假) ay para sa pahinga at kalusugan — hindi lang umupo buong araw sa siksikang park sa Central.\n• Madaling lakad o maikling hike sa country park / harbourfront — magdala ng tubig, sombrero, Octopus; magsimula sa maikli kung bago ka\n• Malapit sa Kwun Tong / Lam Tin: Jordan Valley Park, parke sa Lam Tin at Yau Tong, waterfront — maganda sa lakad at stretching\n• Libreng outdoor fitness: Sunday groups para sa helpers (hal. free sessions sa Tamar Park — hanapin ang kasalukuyang “G-Class” / park fitness posts). Sumali lang sa trusted group\n• Nature day: Madalas may libreng Sunday programme ang Kadoorie Farm & Botanic Garden (KFBG) para sa migrant domestic workers (shuttle, vegan lunch, yoga/art). Tingnan ang kfbg.org at magpa-reserve agad — mabilis maubos\n• Public pool / sports centre (Leisure & Cultural Services) kapag bukas — langoy o stretch\n• Church o fellowship + lakad ay OK; mag-iwan ng oras matulog bago ang Lunes\nIwasan: mahabang araw nang walang tubig; sobrang inuman; money-lending circle; matulog sa labas nang walang sang-ayon nina Sir/Mum.\nKung T8+ / Black rain / sobrang init: manatili sa loob — tingnan ang Weather tips.",
      zh: "星期日及香港公眾假期（勞工假）應用來休息與健康 — 不必整天只坐在中環擠擁的公園。\n• 郊野公園／海濱輕鬆步行或短途行山 — 帶水、帽、八達通；新手先選短線\n• 觀塘／藍田附近：佐敦谷公園、藍田及油塘公園、海濱長廊 — 適合步行伸展\n• 免費戶外健身：外傭友善的星期日團體（例如添馬公園免費操 — 搜尋最新 “G-Class”／公園健身訊息）。只參加你信任的團體\n• 親近大自然：嘉道理農場暨植物園（KFBG）常有外傭免費星期日活動（接送、素食午餐、瑜伽／藝術）。查 kfbg.org 並提早報名 — 名額很快滿\n• 公眾泳池／體育館（康文署）開放時可游泳或伸展\n• 教會／團契加散步可以；週一上班前預留睡眠時間\n避免：烈日下長時間缺水、大量飲酒、借貸圈子、未得 Sir/Mum 同意在外過夜。\n八號風球／黑雨／極端炎熱：留在室內 — 見天氣提示。",
    },
    "https://www.kfbg.org/en/events/free-sunday-programme-for-migrant-domestic-workers-at-kfbg"
  ),
];

const settlingChecklist = [
  {
    id: "check-octopus",
    title: {
      en: "Get / top up Octopus card",
      fil: "Kumuha / mag-top up ng Octopus",
      zh: "辦理／增值八達通",
    },
    done: false,
  },
  {
    id: "check-android-apps",
    title: {
      en: "Install must-have Android apps (see HK Life)",
      fil: "I-install ang must-have Android apps (tingnan ang HK Life)",
      zh: "安裝必備 Android 應用（見香港生活）",
    },
    done: false,
  },
  {
    id: "check-school-route",
    title: {
      en: "Walk the route to kindergarten once with Sir/Mum",
      fil: "Lakarin ang ruta papuntang kindergarten kasama si Sir/Mum",
      zh: "與 Sir/Mum 走一次往幼稚園路線",
    },
    done: false,
  },
  {
    id: "check-emergency",
    title: {
      en: "Save Sir/Mum + 999 in phone",
      fil: "I-save sa phone si Sir/Mum + 999",
      zh: "手機儲存 Sir/Mum + 999",
    },
    done: false,
  },
  {
    id: "check-aeon",
    title: {
      en: "Know how to go to YATA at apm (first supermarket)",
      fil: "Alamin ang daan papuntang YATA sa apm (unang supermarket)",
      zh: "知道如何前往 apm 一田 YATA（優先超市）",
    },
    done: false,
  },
  {
    id: "check-typhoon",
    title: {
      en: "Understand T8 / Black rain — ask Sir/Mum before going out",
      fil: "Maintindihan ang T8 / Black rain — tanungin si Sir/Mum bago lumabas",
      zh: "明白八號風球／黑雨 — 出門前問 Sir/Mum",
    },
    done: false,
  },
  {
    id: "check-rubbish",
    title: {
      en: "Learn rubbish / recycling place in the building",
      fil: "Alamin kung saan ang basura / recycling sa building",
      zh: "了解大廈垃圾／回收位置",
    },
    done: false,
  },
  {
    id: "check-home-layout",
    title: {
      en: "Know rooms: Charlene bedroom (has AC), 3 ACs total, rubbish place",
      fil: "Alamin ang mga kwarto: kwarto ni Charlene (may AC), 3 AC lahat, basurahan",
      zh: "認識單位：Charlene 睡房（有冷氣）、共3部冷氣、垃圾位置",
    },
    done: false,
  },
  {
    id: "check-documents",
    title: {
      en: "Know where passport / HKID / contract copies are kept",
      fil: "Alamin kung nasaan ang passport / HKID / kontrata",
      zh: "知道護照／身份證／合約存放處",
    },
    done: false,
  },
  {
    id: "check-rest-day",
    title: {
      en: "Confirm Sunday rest day & public holiday day off with Sir/Mum",
      fil: "Kumpirmahin ang Linggo rest day at public holiday day off",
      zh: "與 Sir/Mum 確認星期日及公眾假期放假",
    },
    done: false,
  },
];

const emergencyContacts = [
  {
    id: "ec-999",
    name: { en: "Hong Kong Emergency", fil: "HK Emergency (999)", zh: "香港緊急求助" },
    phone: "999",
    note: {
      en: "Police / Fire / Ambulance",
      fil: "Pulis / Bombero / Ambulansya",
      zh: "警察／消防／救護",
    },
  },
  {
    id: "ec-sir",
    name: { en: "Sir (Kwok Wai Yuen)", fil: "Sir (Kwok Wai Yuen)", zh: "Sir（Kwok Wai Yuen）" },
    phone: "",
    note: {
      en: "Add phone in Admin → HK Life",
      fil: "Ilagay ang numero sa Admin → HK Life",
      zh: "請在 Admin → HK Life 填寫電話",
    },
  },
  {
    id: "ec-mum",
    name: { en: "Mum", fil: "Mum", zh: "Mum" },
    phone: "",
    note: {
      en: "Add phone in Admin → HK Life",
      fil: "Ilagay ang numero sa Admin → HK Life",
      zh: "請在 Admin → HK Life 填寫電話",
    },
  },
  {
    id: "ec-labour",
    name: { en: "Labour Department", fil: "Labour Department", zh: "勞工處" },
    phone: "21711771",
    note: {
      en: "Employment rights enquiry (via 1823)",
      fil: "Tungkol sa karapatan sa trabaho",
      zh: "僱傭權益查詢",
    },
  },
  {
    id: "ec-pcg",
    name: {
      en: "Philippine Consulate (emergency)",
      fil: "Philippine Consulate (emergency)",
      zh: "菲律賓領事館（緊急）",
    },
    phone: "91554023",
    note: {
      en: "After-hours emergency hotline — confirm if needed",
      fil: "Emergency hotline — kumpirmahin kung kailangan",
      zh: "非辦公時間緊急熱線 — 如有需要請再確認",
    },
  },
];

for (const file of files) {
  const content = JSON.parse(fs.readFileSync(file, "utf8"));
  content.hkLifeGuides = hkLifeGuides;
  content.settlingChecklist = settlingChecklist;
  content.emergencyContacts = emergencyContacts;
  content.hkWeather = {
    alertActive: false,
    level: "none",
    note: {
      en: "When Sir/Mum turn this on: follow typhoon / black rain guidance — ask before outdoor school runs.",
      fil: "Kapag binuksan ito nina Sir/Mum: sundin ang gabay sa typhoon / black rain — tanungin bago lumabas para sa school.",
      zh: "當 Sir/Mum 開啟此提示：遵循颱風／黑雨指引 — 戶外接送前先詢問。",
    },
  };
  content.homeArea = {
    en: "Kwun Tong, Hong Kong",
    fil: "Kwun Tong, Hong Kong",
    zh: "香港觀塘",
  };
  content.lastUpdated = new Date().toISOString();
  fs.writeFileSync(file, JSON.stringify(content, null, 2) + "\n");
  console.log("Updated", file, "guides=", hkLifeGuides.length);
}
