/**
 * Tag existing 氣炸 recipes + add Easy Fry XXL family recipes.
 * Run: node scripts/add-easy-fry-recipes.mjs
 */
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(__dirname, "..");
const DEVICE = "app-tefal-easy-fry-xxl";

/** Improve existing air-fry named dishes */
const TAG_EXISTING = {
  "d-51": {
    nameEn: "Air-fried enoki mushrooms (Easy Fry)",
    nameFil: "Air-fried enoki mushrooms (Easy Fry)",
    cookDevice: DEVICE,
    prepNotes: {
      en: "Easy Fry XXL: Light oil on enoki. Air Fry ~160–180°C, 8–12 min; shake halfway. Don’t overcrowd. Soft for Zizi — cut shorter if needed.",
      fil: "Easy Fry XXL: Light oil sa enoki. Air Fry ~160–180°C, 8–12 min; iling sa gitna. Huwag siksikin. Soft para kay Zizi.",
      zh: "Easy Fry XXL：金針菇薄油。氣炸約 160–180°C、8–12 分鐘；中途搖動。不要過滿。可切短給 Zizi。",
    },
  },
  "d-140": {
    nameEn: "Air-fried zucchini / green melon (Easy Fry)",
    nameFil: "Air-fried zucchini (Easy Fry)",
    cookDevice: DEVICE,
    prepNotes: {
      en: "Easy Fry XXL: Slice zucchini, light oil + salt. Air Fry ~180°C, 10–15 min; turn halfway. Soft veg side for family.",
      fil: "Easy Fry XXL: Hiwain ang zucchini, light oil + asin. Air Fry ~180°C, 10–15 min; baliktarin sa gitna.",
      zh: "Easy Fry XXL：翠玉瓜切片，薄油＋鹽。約 180°C、10–15 分鐘；中途翻面。",
    },
  },
  "d-540": {
    nameEn: "Air-fried lemongrass pork chop (Easy Fry)",
    nameFil: "Air-fried lemongrass pork chop (Easy Fry)",
    cookDevice: DEVICE,
    prepNotes: {
      en: "Easy Fry XXL: Marinate pork (lemongrass). Optional preheat 180°C. Air Fry ~180–190°C, 12–18 min; flip halfway. Cut small for Zizi. Check doneness.",
      fil: "Easy Fry XXL: Marinate pork (lemongrass). Optional preheat 180°C. Air Fry ~180–190°C, 12–18 min; baliktarin sa gitna. Cut maliit para kay Zizi.",
      zh: "Easy Fry XXL：香茅醃豬扒。可預熱 180°C。約 180–190°C、12–18 分鐘；中途翻面。切小塊給 Zizi。確認熟透。",
    },
  },
  "d-560": {
    nameEn: "Air-fried fish / seafood pieces (Easy Fry)",
    nameFil: "Air-fried fish pieces (Easy Fry)",
    cookDevice: DEVICE,
    prepNotes: {
      en: "Easy Fry XXL: Pat fish dry; light oil. Air Fry ~180°C, 8–14 min depending on thickness; flip once. Bones out for Zizi. Ask Sir/Mum if unsure of time.",
      fil: "Easy Fry XXL: Patuyuin ang isda; light oil. Air Fry ~180°C, 8–14 min; baliktarin minsan. Alisin buto para kay Zizi.",
      zh: "Easy Fry XXL：魚塊抹乾薄油。約 180°C、8–14 分鐘（視厚薄）；翻一次。給 Zizi 去骨。時間不肯定問 Sir/Mum。",
    },
  },
  "d-790": {
    nameEn: "Air-fried breaded pork chop (Easy Fry)",
    nameFil: "Air-fried breaded pork chop (Easy Fry)",
    cookDevice: DEVICE,
    prepNotes: {
      en: "Easy Fry XXL: Breaded chop; light spray oil. Air Fry ~180–190°C, 12–16 min; flip halfway for crisp. Cut for Zizi. Don’t pour oil.",
      fil: "Easy Fry XXL: Breaded chop; light spray oil. Air Fry ~180–190°C, 12–16 min; baliktarin sa gitna. Cut para kay Zizi.",
      zh: "Easy Fry XXL：吉列豬扒薄噴油。約 180–190°C、12–16 分鐘；中途翻面更脆。切給 Zizi。不要倒油。",
    },
  },
};

const NEW = [
  {
    id: "d-af-1601",
    index: 1601,
    name: "氣炸雞翼（Easy Fry）",
    nameEn: "Air-fried chicken wings (Easy Fry)",
    nameFil: "Air-fried chicken wings (Easy Fry)",
    category: "Meat",
    subCategory: "Chicken",
    cookDevice: DEVICE,
    link: "https://www.youtube.com/results?search_query=air+fryer+chicken+wings",
    ingredients: [
      { en: "Chicken wings", fil: "Chicken wings", zh: "雞翼", qty: "8–12 pcs" },
      { en: "Salt / pepper / soy (light)", fil: "Salt / pepper / soy", zh: "鹽／胡椒／少許豉油", qty: "to taste" },
      { en: "Light oil spray", fil: "Light oil spray", zh: "薄噴油", qty: "optional" },
    ],
    prepNotes: {
      en: "Easy Fry XXL: Pat dry, season. Optional preheat 180°C. Single layer in basket. Air Fry ~180–190°C, 18–25 min; flip halfway. Fully cooked for Zizi — cut smaller.",
      fil: "Easy Fry XXL: Patuyuin, timplahan. Optional preheat 180°C. Isang layer. Air Fry ~180–190°C, 18–25 min; baliktarin sa gitna. Luto nang tuluyan para kay Zizi.",
      zh: "Easy Fry XXL：抹乾調味。可預熱 180°C。單層放入。約 180–190°C、18–25 分鐘；中途翻面。確保全熟；可切小給 Zizi。",
    },
  },
  {
    id: "d-af-1602",
    index: 1602,
    name: "氣炸薯仔塊（Easy Fry）",
    nameEn: "Air-fried potato wedges (Easy Fry)",
    nameFil: "Air-fried potato wedges (Easy Fry)",
    category: "Vegetable",
    subCategory: "Potato",
    cookDevice: DEVICE,
    link: "https://www.youtube.com/results?search_query=air+fryer+potato+wedges",
    ingredients: [
      { en: "Potatoes", fil: "Potatoes", zh: "薯仔", qty: "2–3" },
      { en: "Light oil", fil: "Light oil", zh: "少許油", qty: "1–2 tsp" },
      { en: "Salt", fil: "Salt", zh: "鹽", qty: "to taste" },
    ],
    prepNotes: {
      en: "Easy Fry XXL: Cut wedges, toss light oil + salt. Air Fry ~180–190°C, 15–22 min; shake 2–3 times. Soft inside for Zizi — cook until tender.",
      fil: "Easy Fry XXL: Hiwain wedges, light oil + asin. Air Fry ~180–190°C, 15–22 min; iling 2–3 beses. Soft sa loob para kay Zizi.",
      zh: "Easy Fry XXL：切塊拌薄油鹽。約 180–190°C、15–22 分鐘；搖 2–3 次。外脆內軟適合 Zizi。",
    },
  },
  {
    id: "d-af-1603",
    index: 1603,
    name: "氣炸三文魚（Easy Fry）",
    nameEn: "Air-fried salmon (Easy Fry)",
    nameFil: "Air-fried salmon (Easy Fry)",
    category: "Meat",
    subCategory: "Fish",
    cookDevice: DEVICE,
    link: "https://www.youtube.com/results?search_query=air+fryer+salmon",
    ingredients: [
      { en: "Salmon fillet", fil: "Salmon fillet", zh: "三文魚柳", qty: "2 pieces" },
      { en: "Salt / lemon / light oil", fil: "Salt / lemon / light oil", zh: "鹽／檸檬／薄油", qty: "to taste" },
    ],
    prepNotes: {
      en: "Easy Fry XXL: Season; light oil. Air Fry ~180°C, 8–12 min (thickness). No need to flip usually. Check flakes easily; remove bones/skin for Zizi.",
      fil: "Easy Fry XXL: Timplahan; light oil. Air Fry ~180°C, 8–12 min. Madalas hindi kailangan baliktarin. Alisin buto/balat para kay Zizi.",
      zh: "Easy Fry XXL：調味薄油。約 180°C、8–12 分鐘（視厚薄）。多數不用翻。確認可輕撥；給 Zizi 去骨去皮。",
    },
  },
  {
    id: "d-af-1604",
    index: 1604,
    name: "氣炸蔬菜拼盤（Easy Fry）",
    nameEn: "Air-fried mixed vegetables (Easy Fry)",
    nameFil: "Air-fried mixed vegetables (Easy Fry)",
    category: "Vegetable",
    subCategory: "Mixed",
    cookDevice: DEVICE,
    link: "https://www.youtube.com/results?search_query=air+fryer+mixed+vegetables",
    ingredients: [
      { en: "Broccoli / carrot / corn / cabbage", fil: "Broccoli / carrot / corn / cabbage", zh: "西蘭花／紅蘿蔔／玉米／椰菜", qty: "3–4 cups" },
      { en: "Light oil + salt", fil: "Light oil + salt", zh: "薄油＋鹽", qty: "to taste" },
    ],
    prepNotes: {
      en: "Easy Fry XXL: Cut similar sizes; light oil. Air Fry ~170–180°C, 10–15 min; shake halfway. Soft for Zizi — don’t burn tips. Rainbow veg side.",
      fil: "Easy Fry XXL: Magkaparehong laki; light oil. Air Fry ~170–180°C, 10–15 min; iling sa gitna. Soft para kay Zizi — rainbow gulay.",
      zh: "Easy Fry XXL：切相近大小，薄油。約 170–180°C、10–15 分鐘；中途搖。勿焦邊；適合「吃彩虹」配菜。",
    },
  },
  {
    id: "d-af-1605",
    index: 1605,
    name: "氣炸豆腐（Easy Fry）",
    nameEn: "Air-fried tofu (Easy Fry)",
    nameFil: "Air-fried tofu (Easy Fry)",
    category: "Vegetable",
    subCategory: "Tofu",
    cookDevice: DEVICE,
    link: "https://www.youtube.com/results?search_query=air+fryer+tofu",
    ingredients: [
      { en: "Firm tofu", fil: "Firm tofu", zh: "板豆腐", qty: "1 block" },
      { en: "Soy / light oil", fil: "Soy / light oil", zh: "豉油／薄油", qty: "to taste" },
    ],
    prepNotes: {
      en: "Easy Fry XXL: Press tofu dry; cube; light oil/soy. Air Fry ~180°C, 12–15 min; shake once. Soft protein veg for Zizi.",
      fil: "Easy Fry XXL: Patuyuin tofu; cubewin; light oil/soy. Air Fry ~180°C, 12–15 min; iling minsan.",
      zh: "Easy Fry XXL：豆腐壓乾切塊，薄油／豉油。約 180°C、12–15 分鐘；搖一次。適合 Zizi 的蛋白質菜。",
    },
  },
  {
    id: "d-af-1606",
    index: 1606,
    name: "氣炸雞腿／雞扒（Easy Fry）",
    nameEn: "Air-fried chicken thigh (Easy Fry)",
    nameFil: "Air-fried chicken thigh (Easy Fry)",
    category: "Meat",
    subCategory: "Chicken",
    cookDevice: DEVICE,
    link: "https://www.youtube.com/results?search_query=air+fryer+chicken+thigh",
    ingredients: [
      { en: "Chicken thighs", fil: "Chicken thighs", zh: "雞腿／雞扒", qty: "2–4 pcs" },
      { en: "Marinade (soy/garlic)", fil: "Marinade (soy/garlic)", zh: "醃料（豉油蒜）", qty: "to taste" },
    ],
    prepNotes: {
      en: "Easy Fry XXL: Marinate. Air Fry ~180–190°C, 18–25 min; flip halfway. Juices run clear. Debone/cut for Zizi.",
      fil: "Easy Fry XXL: Marinate. Air Fry ~180–190°C, 18–25 min; baliktarin sa gitna. Alisin buto / cut para kay Zizi.",
      zh: "Easy Fry XXL：醃好。約 180–190°C、18–25 分鐘；中途翻面。汁液清澈即熟。去骨切給 Zizi。",
    },
  },
  {
    id: "d-af-1607",
    index: 1607,
    name: "氣炸餃子／鍋貼（Easy Fry）",
    nameEn: "Air-fried dumplings (Easy Fry)",
    nameFil: "Air-fried dumplings (Easy Fry)",
    category: "Meat",
    subCategory: "Pork",
    cookDevice: DEVICE,
    link: "https://www.youtube.com/results?search_query=air+fryer+dumplings",
    ingredients: [
      { en: "Frozen or fresh dumplings", fil: "Dumplings", zh: "餃子／鍋貼", qty: "10–16 pcs" },
      { en: "Light oil spray", fil: "Light oil spray", zh: "薄噴油", qty: "optional" },
      { en: "Dipping sauce", fil: "Dipping sauce", zh: "蘸料", qty: "soy + vinegar" },
    ],
    prepNotes: {
      en: "Easy Fry XXL: Light spray; single layer. Air Fry ~180°C, 8–12 min (frozen may need longer); shake/turn once. Cool slightly for Zizi.",
      fil: "Easy Fry XXL: Light spray; isang layer. Air Fry ~180°C, 8–12 min (frozen mas matagal); iling/baliktarin. Palamigin sandali para kay Zizi.",
      zh: "Easy Fry XXL：薄噴油，單層。約 180°C、8–12 分鐘（急凍可加長）；翻／搖一次。稍涼給 Zizi。",
    },
  },
  {
    id: "d-af-1608",
    index: 1608,
    name: "氣炸玉米（Easy Fry）",
    nameEn: "Air-fried corn (Easy Fry)",
    nameFil: "Air-fried corn (Easy Fry)",
    category: "Vegetable",
    subCategory: "Corn",
    cookDevice: DEVICE,
    link: "https://www.youtube.com/results?search_query=air+fryer+corn",
    ingredients: [
      { en: "Sweet corn (cob or kernels)", fil: "Sweet corn", zh: "玉米", qty: "2 cobs or 2 cups" },
      { en: "Light oil / butter tiny", fil: "Light oil", zh: "少許油／牛油", qty: "optional" },
    ],
    prepNotes: {
      en: "Easy Fry XXL: Light oil on cob pieces. Air Fry ~180°C, 12–15 min; turn once. Soft sweet veg — good with meat.",
      fil: "Easy Fry XXL: Light oil sa corn. Air Fry ~180°C, 12–15 min; baliktarin minsan. Soft matamis na gulay.",
      zh: "Easy Fry XXL：玉米段薄油。約 180°C、12–15 分鐘；翻一次。甜軟配肉。",
    },
  },
  {
    id: "d-af-1609",
    index: 1609,
    name: "氣炸豬扒（簡易）（Easy Fry）",
    nameEn: "Simple air-fried pork chop (Easy Fry)",
    nameFil: "Simple air-fried pork chop (Easy Fry)",
    category: "Meat",
    subCategory: "Pork",
    cookDevice: DEVICE,
    link: "https://www.youtube.com/results?search_query=air+fryer+pork+chop",
    ingredients: [
      { en: "Pork chops", fil: "Pork chops", zh: "豬扒", qty: "2–3" },
      { en: "Salt / pepper / light soy", fil: "Salt / pepper / light soy", zh: "鹽胡椒／豉油", qty: "to taste" },
    ],
    prepNotes: {
      en: "Easy Fry XXL: Season; optional preheat. Air Fry ~180–190°C, 12–16 min; flip halfway. Cut small for Zizi; fully cooked.",
      fil: "Easy Fry XXL: Timplahan; optional preheat. Air Fry ~180–190°C, 12–16 min; baliktarin. Cut maliit para kay Zizi.",
      zh: "Easy Fry XXL：調味；可預熱。約 180–190°C、12–16 分鐘；中途翻面。切小塊給 Zizi；確保熟透。",
    },
  },
  {
    id: "d-af-1610",
    index: 1610,
    name: "氣炸翻熱隔夜菜（Easy Fry）",
    nameEn: "Reheat leftovers (Easy Fry)",
    nameFil: "Reheat leftovers (Easy Fry)",
    category: "Meat",
    subCategory: "Reheat",
    cookDevice: DEVICE,
    link: "https://www.tefal.com/instructions-for-use/Products-/Electrical-Cooking/Oilless-Fryer/Easy-Fry-%26-Grill-XXL/csp/7211004838",
    ingredients: [
      { en: "Leftover cooked meat/veg (safe to reheat)", fil: "Leftovers", zh: "隔夜熟食（可安全翻熱）", qty: "1 plate" },
    ],
    prepNotes: {
      en: "Easy Fry XXL reheat tip: about 160°C up to ~10 min; check often. Only reheat food Sir/Mum say is OK. Shake/turn once. Not for raw food.",
      fil: "Easy Fry XXL reheat: ~160°C hanggang ~10 min; tingnan madalas. Leftovers lang na OK ayon kay Sir/Mum. Hindi para sa hilaw.",
      zh: "Easy Fry XXL 翻熱：約 160°C、最多約 10 分鐘；常查看。只翻熱 Sir/Mum 說可以的隔夜菜。中途翻／搖。不可用於生食。",
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
  let tagged = 0;
  for (const r of data.recipes) {
    const patch = TAG_EXISTING[r.id];
    if (!patch) continue;
    Object.assign(r, patch);
    tagged++;
  }
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
  console.log(rel, "tagged", tagged, "added", added, "total", data.recipes.length);
}
