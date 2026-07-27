/**
 * Append EPC17 pressure-cooker recipes + sync public copy.
 * Run: node scripts/add-epc17-recipes.mjs
 */
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(__dirname, "..");
const DEVICE = "app-tefal-epc17";

/** Family-friendly EPC17 recipes (pressure cooker). Links = reference guides online. */
const NEW = [
  {
    id: "d-epc-1501",
    index: 1501,
    name: "玉米紅蘿蔔排骨湯（壓力鍋）",
    nameEn: "Corn carrot pork-rib soup (EPC17)",
    nameFil: "Corn carrot pork-rib soup (EPC17)",
    category: "Soup",
    subCategory: "Pork",
    cookDevice: DEVICE,
    link: "https://whattocooktoday.com/chinese-sweet-corn-pork-ribs-soup.html",
    ingredients: [
      { en: "Pork spare ribs", fil: "Pork spare ribs", zh: "豬排骨", qty: "500–600g" },
      { en: "Sweet corn", fil: "Sweet corn", zh: "玉米", qty: "2 ears, cut" },
      { en: "Carrot", fil: "Carrot", zh: "紅蘿蔔", qty: "1–2, chunks" },
      { en: "Ginger", fil: "Ginger", zh: "薑", qty: "2–3 slices" },
      { en: "Red dates (optional)", fil: "Red dates (optional)", zh: "紅棗（可選）", qty: "4–6" },
      { en: "Water", fil: "Water", zh: "水", qty: "cover ingredients; under MAX" },
      { en: "Salt", fil: "Salt", zh: "鹽", qty: "to taste at end" },
    ],
    prepNotes: {
      en: "EPC17: 1) Blanch ribs 3–5 min, rinse. 2) Bowl in → ribs + corn + carrot + ginger (+ dates) + water (under MAX). 3) Valve down, lock. 4) Pressure cook HI-P ~30–35 min. 5) Natural release ≥5 min, then open safely. 6) Salt to taste. Soft meat+veg soup for Zizi.",
      fil: "EPC17: 1) Blanch ribs 3–5 min, banlawan. 2) Bowl → ribs + corn + carrot + ginger (+ dates) + tubig (under MAX). 3) Valve down, lock. 4) Pressure HI-P ~30–35 min. 5) Natural release ≥5 min, tapos buksan nang safe. 6) Asin sa dulo. Soft soup para kay Zizi.",
      zh: "EPC17：1) 排骨飛水 3–5 分鐘沖淨。2) 內鍋放排骨＋玉米＋紅蘿蔔＋薑（可加紅棗）＋水（勿超 MAX）。3) 閥按下、鎖蓋。4) 高壓 HI-P 約 30–35 分鐘。5) 自然洩壓≥5 分鐘再開蓋。6) 最後加鹽。湯軟適合 Zizi。",
    },
  },
  {
    id: "d-epc-1502",
    index: 1502,
    name: "冬瓜排骨湯（壓力鍋）",
    nameEn: "Winter melon pork-rib soup (EPC17)",
    nameFil: "Winter melon pork-rib soup (EPC17)",
    category: "Soup",
    subCategory: "Pork",
    cookDevice: DEVICE,
    link: "https://www.youtube.com/results?search_query=pressure+cooker+winter+melon+pork+ribs+soup",
    ingredients: [
      { en: "Pork spare ribs", fil: "Pork spare ribs", zh: "豬排骨", qty: "400–500g" },
      { en: "Winter melon", fil: "Winter melon", zh: "冬瓜", qty: "400g, cubes" },
      { en: "Ginger", fil: "Ginger", zh: "薑", qty: "2 slices" },
      { en: "Dried scallop or goji (optional)", fil: "Dried scallop / goji (optional)", zh: "瑤柱／枸杞（可選）", qty: "small handful" },
      { en: "Water", fil: "Water", zh: "水", qty: "cover; under MAX" },
      { en: "Salt", fil: "Salt", zh: "鹽", qty: "to taste" },
    ],
    prepNotes: {
      en: "EPC17: Blanch ribs → bowl + ribs + ginger + water → HI-P 20 min. Quick-release carefully OR natural 5 min. Add winter melon (+ goji) → Pressure LO-P or Steam 8–10 min until soft. Salt. Don’t overcook melon to mush if Zizi prefers cubes.",
      fil: "EPC17: Blanch ribs → bowl + ribs + ginger + tubig → HI-P 20 min. Release nang safe. Lagyan winter melon (+ goji) → LO-P/Steam 8–10 min hanggang malambot. Asin. Huwag sobrang luto kung gusto ni Zizi may cubes.",
      zh: "EPC17：排骨飛水 → 內鍋＋排骨＋薑＋水 → HI-P 20 分鐘。安全洩壓。加冬瓜（可加枸杞）→ LO-P／蒸 8–10 分鐘至軟。加鹽。若 Zizi 要有塊感勿煮太爛。",
    },
  },
  {
    id: "d-epc-1503",
    index: 1503,
    name: "番茄薯仔牛肉（壓力鍋）",
    nameEn: "Tomato potato beef stew (EPC17)",
    nameFil: "Tomato potato beef stew (EPC17)",
    category: "Meat",
    subCategory: "Beef",
    cookDevice: DEVICE,
    link: "https://www.youtube.com/results?search_query=instant+pot+tomato+potato+beef+chinese",
    ingredients: [
      { en: "Beef chunks (stew cut)", fil: "Beef chunks", zh: "牛腩／炆牛肉", qty: "500g" },
      { en: "Tomato", fil: "Tomato", zh: "番茄", qty: "2–3" },
      { en: "Potato", fil: "Potato", zh: "薯仔", qty: "2, chunks" },
      { en: "Onion", fil: "Onion", zh: "洋蔥", qty: "1" },
      { en: "Ginger + garlic", fil: "Ginger + garlic", zh: "薑蒜", qty: "to taste" },
      { en: "Soy sauce + water/stock", fil: "Soy sauce + water/stock", zh: "豉油＋水／湯", qty: "≥250 ml liquid" },
    ],
    prepNotes: {
      en: "EPC17: Optional Brown mode (lid often open) — sear beef/onion. Add tomato, potato, seasonings + liquid under MAX. Lock → Pressure HI-P ~25–30 min. Natural release 10 min. Soft enough for Zizi; cut smaller if needed. Serve with rice (rice cooker).",
      fil: "EPC17: Optional Brown (madalas bukas ang lid) — sear beef/onion. Lagyan tomato, potato, seasonings + liquid under MAX. Lock → HI-P ~25–30 min. Natural release 10 min. Malambot para kay Zizi. Serve with rice.",
      zh: "EPC17：可用煎香模式（多數開蓋）略煎牛肉／洋蔥。加番茄、薯仔、調味＋液體（勿超 MAX）。鎖蓋 → HI-P 約 25–30 分鐘。自然洩壓 10 分鐘。軟嫩適合 Zizi；配飯煲白飯。",
    },
  },
  {
    id: "d-epc-1504",
    index: 1504,
    name: "豉油雞（壓力鍋）",
    nameEn: "Soy sauce chicken (EPC17)",
    nameFil: "Soy sauce chicken (EPC17)",
    category: "Meat",
    subCategory: "Chicken",
    cookDevice: DEVICE,
    link: "https://www.youtube.com/results?search_query=instant+pot+soy+sauce+chicken+chinese",
    ingredients: [
      { en: "Chicken pieces", fil: "Chicken pieces", zh: "雞件", qty: "800g–1kg" },
      { en: "Light + dark soy", fil: "Light + dark soy", zh: "生抽＋老抽", qty: "to taste" },
      { en: "Ginger + spring onion", fil: "Ginger + spring onion", zh: "薑蔥", qty: "few" },
      { en: "Sugar", fil: "Sugar", zh: "糖", qty: "1–2 tsp" },
      { en: "Water", fil: "Water", zh: "水", qty: "≥250 ml; under MAX" },
    ],
    prepNotes: {
      en: "EPC17: Bowl → chicken + ginger/onion + soy + sugar + water. Valve down, lock. Pressure HI-P ~15–18 min (bone-in). Natural release 5–10 min. Sauce can reduce on Brown/simmer lid-open if Sir/Mum showed. Remove bones for Zizi.",
      fil: "EPC17: Bowl → chicken + ginger/onion + soy + sugar + tubig. Valve down, lock. HI-P ~15–18 min. Natural release 5–10 min. Puwedeng mag-reduce ng sauce sa Brown (bukas lid) kung itinuro nina Sir/Mum. Alisin buto para kay Zizi.",
      zh: "EPC17：內鍋放雞＋薑蔥＋豉油＋糖＋水。閥按下鎖蓋。HI-P 約 15–18 分鐘。自然洩壓 5–10 分鐘。可開蓋用煎香／炆煮收汁（跟 Sir/Mum）。給 Zizi 先去骨。",
    },
  },
  {
    id: "d-epc-1505",
    index: 1505,
    name: "咖喱雞薯仔（壓力鍋）",
    nameEn: "Curry chicken with potato (EPC17)",
    nameFil: "Curry chicken with potato (EPC17)",
    category: "Meat",
    subCategory: "Chicken",
    cookDevice: DEVICE,
    link: "https://www.youtube.com/results?search_query=instant+pot+curry+chicken+potato",
    ingredients: [
      { en: "Chicken pieces", fil: "Chicken pieces", zh: "雞件", qty: "600–800g" },
      { en: "Potato", fil: "Potato", zh: "薯仔", qty: "2–3" },
      { en: "Onion", fil: "Onion", zh: "洋蔥", qty: "1" },
      { en: "Curry paste/powder", fil: "Curry paste/powder", zh: "咖喱", qty: "per pack / taste" },
      { en: "Coconut milk or water", fil: "Coconut milk or water", zh: "椰漿或水", qty: "≥250 ml" },
    ],
    prepNotes: {
      en: "EPC17: Optional Brown onion/chicken. Add potato + curry + liquid under MAX. HI-P ~12–15 min. Natural 5 min. Mild curry for family — ask Sir/Mum how spicy. Good with rice.",
      fil: "EPC17: Optional Brown onion/chicken. Lagyan potato + curry + liquid under MAX. HI-P ~12–15 min. Natural 5 min. Mild para sa pamilya — tanungin si Sir/Mum kung gaano kaanghang. Maganda with rice.",
      zh: "EPC17：可略煎洋蔥／雞。加薯仔＋咖喱＋液體（勿超 MAX）。HI-P 約 12–15 分鐘。自然洩壓 5 分鐘。家常微辣 — 問 Sir/Mum。配飯。",
    },
  },
  {
    id: "d-epc-1506",
    index: 1506,
    name: "番茄蛋花湯（壓力鍋快煮）",
    nameEn: "Tomato egg-drop soup (EPC17 quick)",
    nameFil: "Tomato egg-drop soup (EPC17 quick)",
    category: "Soup",
    subCategory: "Egg",
    cookDevice: DEVICE,
    link: "https://www.youtube.com/results?search_query=tomato+egg+drop+soup",
    ingredients: [
      { en: "Tomato", fil: "Tomato", zh: "番茄", qty: "2" },
      { en: "Eggs", fil: "Eggs", zh: "蛋", qty: "2" },
      { en: "Water or stock", fil: "Water or stock", zh: "水或湯", qty: "~1 L; under MAX" },
      { en: "Spring onion", fil: "Spring onion", zh: "蔥", qty: "to finish" },
      { en: "Salt / sesame oil", fil: "Salt / sesame oil", zh: "鹽／麻油", qty: "to taste" },
    ],
    prepNotes: {
      en: "EPC17: Faster with Soup/Steam or short Pressure LO-P 3–5 min for tomatoes in water, then release. Switch to Brown/simmer lid-open: stir in beaten egg, season. Or cook fully on Brown if easier. Soft soup — good when time is short.",
      fil: "EPC17: Soup/Steam o LO-P 3–5 min para sa tomato + tubig, release. Brown/simmer bukas lid: haluin ang egg, timplahan. O kayang lahat sa Brown. Soft soup — mabilis.",
      zh: "EPC17：可用湯／蒸或低壓 LO-P 3–5 分鐘煮番茄水，洩壓後開蓋用煎香／炆煮打蛋花調味。或全程開蓋快煮。清淡快手湯。",
    },
  },
  {
    id: "d-epc-1507",
    index: 1507,
    name: "蒸蛋（壓力鍋／蒸模式）",
    nameEn: "Steamed egg (EPC17 Steam)",
    nameFil: "Steamed egg (EPC17 Steam)",
    category: "Meat",
    subCategory: "Egg",
    cookDevice: DEVICE,
    link: "https://www.youtube.com/results?search_query=instant+pot+chinese+steamed+egg",
    ingredients: [
      { en: "Eggs", fil: "Eggs", zh: "蛋", qty: "3" },
      { en: "Warm water", fil: "Warm water", zh: "溫水", qty: "~1.5× egg volume" },
      { en: "Salt", fil: "Salt", zh: "鹽", qty: "pinch" },
      { en: "Soy + sesame + spring onion", fil: "Soy + sesame + spring onion", zh: "豉油麻油蔥", qty: "to finish" },
    ],
    prepNotes: {
      en: "EPC17 Steam: Beat eggs + warm water + salt; strain into bowl; cover with foil. Trivet + 1 cup water in cooker bowl. Steam ~8–10 min, natural 5 min. Smooth egg for Zizi — ask Sir/Mum water ratio once.",
      fil: "EPC17 Steam: Haluin eggs + warm water + asin; salain sa bowl; takpan foil. Trivet + 1 cup tubig sa cooker. Steam ~8–10 min, natural 5 min. Smooth para kay Zizi — tanungin si Sir/Mum sa ratio.",
      zh: "EPC17 蒸：蛋＋溫水＋鹽打勻過篩，蓋保鮮紙／箔。內鍋加水＋蒸架。蒸約 8–10 分鐘，再燜 5 分鐘。滑嫩適合 Zizi — 水蛋比例問 Sir/Mum 一次即可。",
    },
  },
  {
    id: "d-epc-1508",
    index: 1508,
    name: "炆蘿蔔牛腩（壓力鍋）",
    nameEn: "Braised beef brisket with radish (EPC17)",
    nameFil: "Braised beef brisket with radish (EPC17)",
    category: "Meat",
    subCategory: "Beef",
    cookDevice: DEVICE,
    link: "https://www.youtube.com/results?search_query=instant+pot+beef+brisket+radish+chinese",
    ingredients: [
      { en: "Beef brisket", fil: "Beef brisket", zh: "牛腩", qty: "500–700g" },
      { en: "White radish (daikon)", fil: "White radish", zh: "白蘿蔔", qty: "1, chunks" },
      { en: "Ginger + star anise (optional)", fil: "Ginger + star anise", zh: "薑＋八角（可選）", qty: "to taste" },
      { en: "Soy + oyster sauce + water", fil: "Soy + oyster + water", zh: "豉油蠔油＋水", qty: "≥250 ml" },
    ],
    prepNotes: {
      en: "EPC17: Blanch beef optional. Bowl → beef + seasonings + water under MAX → HI-P ~35–40 min. Release safely. Add radish → Pressure 8–10 min more until soft. Cut small for Zizi. Meat + veg in one pot.",
      fil: "EPC17: Optional blanch beef. Bowl → beef + seasonings + tubig under MAX → HI-P ~35–40 min. Safe release. Lagyan radish → Pressure 8–10 min pa. Cut maliit para kay Zizi. Meat + gulay sa isang pot.",
      zh: "EPC17：牛腩可飛水。內鍋＋牛腩＋調味＋水（勿超 MAX）→ HI-P 約 35–40 分鐘。安全洩壓。加蘿蔔再壓 8–10 分鐘至軟。切小塊給 Zizi。肉菜一鍋。",
    },
  },
  {
    id: "d-epc-1509",
    index: 1509,
    name: "壓力鍋炆豆腐雜菜",
    nameEn: "Braised tofu & mixed veg (EPC17)",
    nameFil: "Braised tofu & mixed veg (EPC17)",
    category: "Vegetable",
    subCategory: "Tofu",
    cookDevice: DEVICE,
    link: "https://www.youtube.com/results?search_query=pressure+cooker+braised+tofu+vegetables",
    ingredients: [
      { en: "Firm tofu", fil: "Firm tofu", zh: "板豆腐", qty: "1 block" },
      { en: "Mixed vegetables (carrot, cabbage, mushroom)", fil: "Mixed vegetables", zh: "雜菜（蘿蔔椰菜菇）", qty: "3–4 cups" },
      { en: "Garlic + ginger", fil: "Garlic + ginger", zh: "蒜薑", qty: "to taste" },
      { en: "Soy + water/stock", fil: "Soy + water/stock", zh: "豉油＋水／湯", qty: "≥250 ml" },
    ],
    prepNotes: {
      en: "EPC17: Bowl → tofu + veg + sauce + liquid under MAX. Pressure LO-P or HI-P ~5–8 min (veg soft quick). Quick-release carefully. Don’t overcook to mush. Mild for Zizi; add minced meat if Sir/Mum wants more protein.",
      fil: "EPC17: Bowl → tofu + gulay + sauce + liquid under MAX. LO-P o HI-P ~5–8 min. Quick-release nang ingat. Huwag sobrang luto. Mild para kay Zizi; dagdag minced meat kung gusto nina Sir/Mum.",
      zh: "EPC17：內鍋放豆腐＋菜＋醬汁＋液體（勿超 MAX）。低壓或高壓約 5–8 分鐘（菜易熟）。小心洩壓。勿煮太烂。清淡適合 Zizi；可加免治肉增蛋白質。",
    },
  },
  {
    id: "d-epc-1510",
    index: 1510,
    name: "清雞湯（壓力鍋）",
    nameEn: "Simple chicken soup (EPC17)",
    nameFil: "Simple chicken soup (EPC17)",
    category: "Soup",
    subCategory: "Chicken",
    cookDevice: DEVICE,
    link: "https://www.youtube.com/results?search_query=instant+pot+chinese+chicken+soup",
    ingredients: [
      { en: "Chicken pieces or carcass", fil: "Chicken pieces", zh: "雞件／雞架", qty: "500–800g" },
      { en: "Carrot + corn or potato", fil: "Carrot + corn/potato", zh: "紅蘿蔔＋玉米或薯仔", qty: "as available" },
      { en: "Ginger", fil: "Ginger", zh: "薑", qty: "2 slices" },
      { en: "Water", fil: "Water", zh: "水", qty: "cover; under MAX" },
      { en: "Salt", fil: "Salt", zh: "鹽", qty: "to taste" },
    ],
    prepNotes: {
      en: "EPC17: Optional blanch chicken. Bowl → chicken + veg + ginger + water → HI-P ~25 min. Natural release 10 min. Salt. Clear light soup — remove bones before serving Zizi.",
      fil: "EPC17: Optional blanch chicken. Bowl → chicken + gulay + ginger + tubig → HI-P ~25 min. Natural 10 min. Asin. Clear light soup — alisin buto bago ihanda kay Zizi.",
      zh: "EPC17：雞可飛水。內鍋＋雞＋菜＋薑＋水 → HI-P 約 25 分鐘。自然洩壓 10 分鐘。加鹽。清淡湯 — 給 Zizi 先去骨。",
    },
  },
];

function load(file) {
  return JSON.parse(fs.readFileSync(file, "utf8"));
}

function save(file, data) {
  fs.writeFileSync(file, JSON.stringify(data, null, 2) + "\n");
}

for (const rel of ["data/dinner-recipes.json", "public/data/dinner-recipes.json"]) {
  const file = path.join(ROOT, rel);
  const data = load(file);
  const ids = new Set(data.recipes.map((r) => r.id));
  let added = 0;
  for (const r of NEW) {
    if (ids.has(r.id)) {
      const i = data.recipes.findIndex((x) => x.id === r.id);
      data.recipes[i] = r;
    } else {
      data.recipes.push(r);
      added++;
    }
  }
  save(file, data);
  console.log(rel, "total", data.recipes.length, "added", added);
}
