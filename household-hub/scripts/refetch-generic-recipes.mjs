#!/usr/bin/env node
/**
 * Replace generic “watch YouTube / ask Sir” dinner recipes with real
 * ingredients + numbered steps, then tag EPC17 / Easy Fry where appropriate.
 *
 * Base = live /api/dinner/recipes (Admin truth). Writes seed JSON.
 * If OPENROUTER_API_KEY is set, YouTube dishes also go through enrichYoutubeRecipe.
 *
 *   node scripts/refetch-generic-recipes.mjs
 */
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(__dirname, "..");
const LIVE_URL =
  process.env.LIVE_RECIPES_URL ||
  "https://zizi-family-hub.vercel.app/api/dinner/recipes";

const EPC = "app-tefal-epc17";
const FRY = "app-tefal-easy-fry-xxl";

const ing = (en, qty, fil, zh) => ({
  en,
  ...(qty ? { qty } : {}),
  ...(fil ? { fil } : {}),
  ...(zh ? { zh } : {}),
});
const notes = (en, fil, zh) => ({ en, fil, zh: zh || "" });

function blob(r) {
  return nfkc(
    [r.name, r.nameEn, r.nameFil, r.subCategory, r.category]
      .filter(Boolean)
      .join(" ")
  );
}

export function isGenericWatch(prep) {
  const en = prep?.en || "";
  return /Watch the YouTube\/Instagram video|Ask Sir\/Mum if unsure about seasoning/.test(
    en
  );
}

function placeholderIngs(list) {
  if (!list?.length) return true;
  return list.some((i) =>
    /as in video|ayon sa video|見影片|see video|from video title/i.test(
      `${i.en || ""} ${i.zh || ""} ${i.fil || ""} ${i.qty || ""}`
    )
  );
}

function inferMethod(r) {
  const t = blob(r);
  if (/氣炸|air[\s-]?fry/i.test(t)) return "airfry";
  if (/湯|soup/i.test(t) && r.category === "Soup") return "soup";
  if (/炆|燉|滷水|牛尾|oxtail|牛腩|牛筋/i.test(t)) return "braise";
  if (/三杯/i.test(t)) return "braise";
  if (/咖喱|curry/i.test(t) && /炆|肋條|牛|雞|豬排飯/i.test(t)) return "braise";
  if (/涼拌|沙拉|salad/i.test(t)) return "salad";
  if (/蒸/i.test(t)) return "steam";
  if (/電飯煲|炊飯/i.test(t)) return "ricecooker";
  if (/焗|烤/i.test(t)) return "roast";
  if (/酥炸|脆皮/i.test(t)) return "airfry";
  if (/炒/i.test(t)) return "stirfry";
  if (/煎/i.test(t)) return "panfry";
  if (/燉飯|risotto/i.test(t)) return "risotto";
  if (r.category === "Soup") return "soup";
  return "panfry";
}

function suggestDevice(r, method) {
  const t = blob(r);
  if (/炒/i.test(t) && !/氣炸|air[\s-]?fry/i.test(t)) return null;
  if (
    method === "airfry" ||
    /氣炸|air[\s-]?fry|酥炸|脆皮|雞翼|wings/i.test(t) ||
    method === "roast"
  ) {
    return FRY;
  }
  if (method === "soup" || method === "braise") return EPC;
  return null;
}

const NAME_EN = JSON.parse(
  fs.readFileSync(path.join(__dirname, "recipe-name-en.json"), "utf8")
);

function nfkc(s) {
  return (s || "")
    .normalize("NFKC")
    .replace(/⻘/g, "青")
    .replace(/⻄/g, "西")
    .replace(/⻘/g, "青")
    .replace(/⽜/g, "牛")
    .replace(/⽺/g, "羊")
    .replace(/⽔/g, "水")
    .replace(/⽩/g, "白")
    .replace(/⽟/g, "玉")
    .replace(/⾖/g, "豆")
    .replace(/⾁/g, "肉")
    .replace(/⿂/g, "魚")
    .replace(/⿊/g, "黑")
    .replace(/⾦/g, "金")
    .replace(/⻘/g, "青");
}

function betterEn(r) {
  const key = nfkc(r.name);
  if (NAME_EN[key]) return NAME_EN[key];
  if (NAME_EN[r.name]) return NAME_EN[r.name];
  if (NAME_EN[r.nameEn]) return NAME_EN[r.nameEn];
  const en = r.nameEn || "";
  if (
    !en ||
    /fragment|decomposition|spoilage|replacement|multiple|vanilla frying|porcupine|ribbon carpet|shaqiuzi|imperial|dressings|un.?cooked|piper nigrum|hua hua|stir-fry chopped|broccoli dish|rice with soup/i.test(
      en
    )
  ) {
    return NAME_EN[nfkc(en)] || r.name || en;
  }
  return en;
}

function addIng(list, item) {
  if (!list.some((x) => x.en === item.en || (item.zh && x.zh === item.zh))) {
    list.push(item);
  }
}

function inferIngredients(r) {
  const n = blob(r);
  const ings = [];
  const add = (...items) => items.forEach((i) => addIng(ings, i));

  if (/牛尾|oxtail/i.test(n)) add(ing("Oxtail", "800g–1kg", "Buntot ng baka", "牛尾"));
  else if (/牛腩|牛筋|牛仔骨|牛肋|肥牛|牛肉|牛尾|oxtail|gyudon|short rib/i.test(n) && !/牛油/i.test(n))
    add(ing("Beef", "300–500g", "Baka", "牛肉"));
  if (/豬頸/i.test(n)) add(ing("Pork neck", "300g", "Leeg ng baboy", "豬頸肉"));
  else if (/五花/i.test(n)) add(ing("Pork belly", "300g", "Liempo", "五花肉"));
  else if (/豬扒|豬排|豚/i.test(n)) add(ing("Pork chop", "2–3 pcs", "Pork chop", "豬扒"));
  else if (/午餐肉|spam/i.test(n)) add(ing("Spam / luncheon meat", "1 tin", "Spam", "午餐肉"));
  else if (/肉碎|⾁碎|minced/i.test(n)) add(ing("Minced pork", "200–250g", "Giniling na baboy", "豬肉碎"));
  else if (/豬|pork/i.test(n) && !ings.some((i) => /pork|baboy|豬/i.test(i.en + i.zh)))
    add(ing("Pork", "300g", "Baboy", "豬肉"));
  if (/雞翼|wings/i.test(n)) add(ing("Chicken wings", "8–12 pcs", "Pakpak ng manok", "雞翼"));
  else if (/雞髀|雞腿|雞扒/i.test(n)) add(ing("Chicken legs / chops", "2–4 pcs", "Hita / chop", "雞髀／雞扒"));
  else if (/雞胸/i.test(n)) add(ing("Chicken breast", "2 pcs", "Dibdib ng manok", "雞胸"));
  else if (/雞柳|雞球/i.test(n)) add(ing("Chicken strips", "250–300g", "Manok (hiwa)", "雞柳"));
  else if (/雞|chicken/i.test(n)) add(ing("Chicken pieces", "600–800g", "Manok", "雞件"));
  if (/羊|⽺|lamb/i.test(n)) add(ing("Lamb", "400–500g", "Kordero", "羊肉"));
  if (/三文|鮭|salmon/i.test(n)) add(ing("Salmon", "2 fillets", "Salmon", "三文魚"));
  else if (/黃花|⿈花/i.test(n)) add(ing("Yellow croaker", "1–2 pcs", "Yellow croaker", "黃花魚"));
  else if (/比目|⽬⿂|flounder/i.test(n)) add(ing("Flounder / sole", "2 steaks", "Flounder", "比目魚"));
  else if (/斑|魚塊|⿂/i.test(n) && /蒸|煎|氣炸|烤|湯/i.test(n))
    add(ing("Fish", "1 whole or 2 fillets", "Isda", "魚"));
  if (/蝦|shrimp/i.test(n)) add(ing("Prawns / shrimp", "250g", "Hipon", "蝦"));
  if (/青口|花蛤|蛤蜊|mussel|clam/i.test(n) && !/garlic-butter chicken wings/i.test(n))
    add(ing("Mussels or clams", "500g", "Tahong / halaan", "青口／花蛤"));
  if (/豆腐|⾖腐|tofu/i.test(n)) add(ing("Tofu", "1 block", "Tofu", "豆腐"));
  if (/豆卜|⾖⼘/i.test(n)) add(ing("Fried tofu puffs", "8–10 pcs", "Tofu puff", "豆卜"));
  if (/蛋|egg| omelette|蛋餅/i.test(n)) add(ing("Eggs", "2–4", "Itlog", "雞蛋"));
  if (/泡菜|kimchi/i.test(n)) add(ing("Kimchi", "150–200g", "Kimchi", "泡菜"));
  if (/年糕/i.test(n)) add(ing("Korean rice cake", "200g", "Tteok", "年糕"));
  if (/番茄|蕃茄|tomato/i.test(n)) add(ing("Tomato", "2–3", "Kamatis", "番茄"));
  if (/薯|馬鈴薯|potato/i.test(n)) add(ing("Potato", "2", "Patatas", "薯仔"));
  if (/南瓜|pumpkin/i.test(n)) add(ing("Pumpkin", "400g", "Kalabasa", "南瓜"));
  if (/西蘭花|⻄蘭|花椰|broccoli|cauliflower/i.test(n))
    add(ing("Broccoli / cauliflower", "1 head", "Broccoli", "西蘭花／椰菜花"));
  if (/菠菜|spinach/i.test(n)) add(ing("Spinach", "1 bunch", "Spinach", "菠菜"));
  if (/菜心|菜⼼/i.test(n)) add(ing("Choy sum", "1 bunch", "Choy sum", "菜心"));
  if (/津白|津⽩|napa/i.test(n)) add(ing("Napa cabbage", "1/2 head", "Napa cabbage", "津白"));
  if (/豆角|⾖⾓|長豆/i.test(n)) add(ing("Long beans", "200g", "Sitaw", "豆角"));
  if (/青豆|⻘⾖|green bean/i.test(n)) add(ing("Green beans", "200g", "Baguio beans", "青豆"));
  if (/豆芽|⾖芽/i.test(n)) add(ing("Bean sprouts", "200g", "Toge", "豆芽"));
  if (/杏鮑|雞髀菇|enoki|金菇|⾦菇|蘑菇|菇/i.test(n))
    add(ing("Mushrooms", "200g", "Kabute", "菇"));
  if (/茄子|茄⼦|eggplant/i.test(n)) add(ing("Eggplant", "2", "Talong", "茄子"));
  if (/洋葱|洋蔥|onion/i.test(n)) add(ing("Onion", "1", "Sibuyas", "洋蔥"));
  if (/蘆筍|asparagus/i.test(n)) add(ing("Asparagus", "1 bunch", "Asparagus", "蘆筍"));
  if (/翠肉|翠⽟|zucchini/i.test(n)) add(ing("Zucchini", "1–2", "Zucchini", "翠肉瓜"));
  if (/蘿蔔|carrot/i.test(n)) add(ing("Carrot or white radish", "1–2", "Carrot / labanos", "蘿蔔"));
  if (/毛豆|⽑⾖|edamame/i.test(n)) add(ing("Edamame", "250g", "Edamame", "毛豆"));
  if (/荷蘭豆/i.test(n)) add(ing("Snow peas", "150g", "Snow peas", "荷蘭豆"));
  if (/玉米|粟米|⽟⽶|corn/i.test(n)) add(ing("Corn", "1–2 cobs or 1 cup", "Mais", "粟米"));
  if (/芒果|mango/i.test(n)) add(ing("Mango", "1–2 ripe", "Mangga", "芒果"));
  if (/香蕉|banana/i.test(n)) add(ing("Banana", "2–3", "Saging", "香蕉"));
  if (/糯米|sticky/i.test(n)) add(ing("Glutinous rice", "1 cup", "Malagkit", "糯米"));
  if (/飯|rice|gyudon/i.test(n) && !/cauliflower rice|椰菜花飯/i.test(n))
    add(ing("Cooked rice", "2 bowls", "Kanin", "白飯"));
  if (/金邊粉|⾦邊粉|粉絲|意粉|意大利|spaghetti|麵/i.test(n))
    add(ing("Noodles / pasta / vermicelli", "200g", "Pancit / pasta", "粉／麵"));
  if (/椰菜花飯/i.test(n)) add(ing("Cauliflower rice", "3 cups", "Cauliflower rice", "椰菜花飯"));
  if (/咖喱|curry/i.test(n)) add(ing("Curry paste / sauce", "2–3 tbsp", "Curry", "咖喱"));
  if (/味噌|miso/i.test(n)) add(ing("Miso paste", "1–2 tbsp", "Miso", "味噌"));
  if (/芝士|芝⼠|cheese/i.test(n)) add(ing("Cheese", "as needed", "Cheese", "芝士"));
  if (/冬陰|tom yum/i.test(n)) add(ing("Tom yum paste", "2 tbsp", "Tom yum paste", "冬陰醬"));
  if (/沙嗲|satay/i.test(n)) add(ing("Satay sauce", "3 tbsp", "Satay sauce", "沙嗲醬"));
  if (/三杯/i.test(n))
    add(
      ing("Sesame oil", "2 tbsp", "Sesame oil", "麻油"),
      ing("Soy sauce", "2 tbsp", "Toyo", "豉油"),
      ing("Rice wine", "2 tbsp", "Rice wine", "米酒"),
      ing("Thai basil / basil", "1 handful", "Basil", "九層塔")
    );
  if (/蜜糖|honey/i.test(n)) add(ing("Honey", "2 tbsp", "Honey", "蜜糖"));
  if (/黑椒|⿊椒|black pepper/i.test(n)) add(ing("Black pepper", "1 tsp", "Paminta", "黑椒"));
  if (/椒鹽|salt and pepper/i.test(n)) add(ing("Salt-and-pepper seasoning", "1 tsp", "Asin-paminta", "椒鹽"));
  if (/孜然|cumin/i.test(n)) add(ing("Cumin powder", "1 tsp", "Cumin", "孜然"));
  if (/香茅|lemongrass/i.test(n)) add(ing("Lemongrass", "1–2 stalks", "Tanglad", "香茅"));
  if (/XO/i.test(n)) add(ing("XO sauce", "1–2 tbsp", "XO sauce", "XO醬"));
  if (/金華|⾦華|ham/i.test(n)) add(ing("Jinhua ham or cooked ham", "40g", "Ham", "金華火腿"));
  if (/忌廉|cream|白酒/i.test(n)) add(ing("Cooking cream (or milk)", "150ml", "Cream", "忌廉"));
  if (/牛油|⽜油|butter/i.test(n)) add(ing("Butter", "20–30g", "Butter", "牛油"));
  if (/煉乳|condensed/i.test(n)) add(ing("Condensed milk", "2 tbsp", "Condensed milk", "煉乳"));
  if (/吞拿|tuna/i.test(n)) add(ing("Canned tuna", "1 tin", "Tuna", "吞拿魚"));
  if (/麻油|sesame oil/i.test(n) && !ings.some((i) => /sesame|麻油/i.test(i.en + (i.zh || ""))))
    add(ing("Sesame oil", "1 tbsp", "Sesame oil", "麻油"));
  if (/菠蘿|pineapple/i.test(n)) add(ing("Pineapple", "1 cup chunks", "Pinya", "菠蘿"));
  if (/肉丸|⾁丸|meatball/i.test(n)) add(ing("Meatballs", "300g", "Meatballs", "肉丸"));
  if (/西多|⻄多|french toast/i.test(n))
    add(ing("Bread slices", "4", "Tinapay", "方包"), ing("Peanut butter or jam", "to fill", "Peanut butter", "花生醬"));

  add(ing("Garlic", "2–3 cloves", "Bawang", "蒜"));
  if (!/salad|芒果糯|banana cake|pancake/i.test(n)) {
    add(ing("Ginger", "a few slices", "Luya", "薑"));
  }
  add(ing("Spring onion", "1–2 stalks", "Sibuyas dahon", "蔥"));
  add(ing("Cooking oil", "1–2 tbsp", "Mantika", "油"));
  add(ing("Salt / soy sauce", "to taste", "Asin / toyo", "鹽／豉油"));

  if (r.category === "Soup" || /湯|soup|炆|燉|滷/i.test(n)) {
    add(ing("Water or stock", "800ml–1L (under MAX if EPC17)", "Tubig o stock", "水或湯底"));
  }
  if (ings.length < 4) {
    add(ing("Main ingredients from the dish name", "family portion", "Pangunahing sangkap", "主料（按菜名）"));
  }
  return ings;
}

function starterSettings(device) {
  if (device === FRY) {
    return {
      mode: { en: "Air Fry", fil: "Air Fry", zh: "氣炸 Air Fry" },
      tempC: "180–200",
      minutes: "12–20",
      steps: notes(
        "Device cook step only (keep wash/cut/marinate from prep notes):\n• Single layer, light oil spray.\n• Air Fry ~180–200°C for ~12–20 min (adjust); shake/flip halfway.\n• Panel: Tools → Cooking → Easy Fry.",
        "Cook step lang sa device (panatilihin ang hugasan/hiwa/marinate sa prep notes):\n• Isang layer, light oil spray.\n• Air Fry ~180–200°C ~12–20 min; iling/baliktarin sa gitna.\n• Panel: Tools → Cooking → Easy Fry.",
        "僅代替「炸／焗」步驟（洗切醃仍跟準備說明）：\n• 單層，薄噴油。\n• 氣炸約 180–200°C、12–20 分鐘；中途搖／翻。\n• 面板：家電 → 煮食 → Easy Fry。"
      ),
    };
  }
  if (device === EPC) {
    return {
      mode: { en: "HI-P", fil: "HI-P", zh: "高壓 HI-P" },
      minutes: "20–35",
      steps: notes(
        "Device cook step only (keep wash / blanch / cut from prep notes):\n• After prep, bowl + food + liquid ≥250 ml (under MAX).\n• Lock → HI-P ~20–35 min (instead of long stove simmer).\n• Natural release ≥5–10 min, then season.\n• Panel: Tools → Cooking → EPC17.",
        "Cook step lang sa device (panatilihin ang hugasan / blanch / hiwa sa prep notes):\n• Pagkatapos ng prep: bowl + pagkain + liquid ≥250 ml (under MAX).\n• Lock → HI-P ~20–35 min (imbes na mahabang simmer).\n• Natural release ≥5–10 min, tapos timplahan.\n• Panel: Tools → Cooking → EPC17.",
        "僅代替「炆／煮」步驟（洗切飛水仍跟準備說明）：\n• 準備好後：內鍋＋食材＋液體 ≥250 ml（勿超 MAX）。\n• 鎖蓋 → 高壓 HI-P 約 20–35 分鐘。\n• 自然洩壓 ≥5–10 分鐘，再調味。\n• 面板：家電 → 煮食 → EPC17。"
      ),
    };
  }
  return undefined;
}

function buildNotes(r, method, device) {
  const name = betterEn(r);
  if (method === "soup" || device === EPC && r.category === "Soup") {
    return notes(
      `1. Wash and cut all soup ingredients (meat in chunks; veg in large pieces).\n2. Optional: blanch bones/meat 3–5 min; rinse.\n3. EPC17: bowl in → ingredients + water/stock (≥250 ml, under MAX). Valve down, lock → HI-P 20–35 min.\n4. Natural release ≥5–10 min. Skim, salt lightly. Remove bones before Zizi eats.\n5. Stove option: simmer gently 45–90 min instead of pressure.`,
      `1. Hugasan at hiwain ang sangkap.\n2. Opsyonal: i-blanch ang buto/karne 3–5 min; banlawan.\n3. EPC17: bowl + sangkap + tubig (≥250 ml, under MAX). Lock → HI-P 20–35 min.\n4. Natural release ≥5–10 min. Konting asin. Alisin ang buto bago kainin ni Zizi.\n5. O sa kalan: pakuluan nang mahina 45–90 min.`,
      `1. 洗淨切件（肉塊、菜大件）。\n2. 可選：肉／骨飛水 3–5 分鐘，沖淨。\n3. EPC17：內鍋＋材料＋水（≥250 ml，勿超 MAX）。閥下壓鎖蓋 → 高壓 20–35 分鐘。\n4. 自然洩壓 ≥5–10 分鐘。少許鹽。給 Zizi 前挑骨。\n5. 或用爐：慢火 45–90 分鐘。`
    );
  }
  if (method === "braise") {
    return notes(
      `1. Cut meat into even pieces; wash veg.\n2. Optional Brown in EPC17 (or wok): sear meat + onion/garlic.\n3. Add sauce + liquid ≥250 ml, under MAX. Lock → HI-P 20–35 min (ribs/brisket toward 30–35).\n4. Natural release ≥8 min. Taste; thicken on Brown if needed. Mild for Zizi.`,
      `1. Hiwain ang karne; hugasan ang gulay.\n2. Optional Brown sa EPC17 (o kawali): prituhin ang karne + sibuyas/bawang.\n3. Dagdag sarsa + liquid ≥250 ml, under MAX. Lock → HI-P 20–35 min.\n4. Natural release ≥8 min. Tikman; salsahan kung kinakailangan. Mild para kay Zizi.`,
      `1. 肉切均勻塊，菜洗淨。\n2. EPC17 可先用炒／Brown 煎香肉＋洋蔥蒜。\n3. 加醬汁＋液體 ≥250 ml，勿超 MAX。鎖蓋 → 高壓 20–35 分鐘（牛腩／肋條偏 30–35）。\n4. 自然洩壓 ≥8 分鐘。試味；需要可再開蓋收汁。口味偏淡給 Zizi。`
    );
  }
  if (method === "airfry" || device === FRY) {
    const wing = /翼|wing/i.test(blob(r));
    return notes(
      `1. Wash, pat very dry, cut/trim as needed. Season or marinate 15–20 min.\n2. Easy Fry: single layer, light oil spray (no oil pool).\n3. Air Fry ${wing ? "190–200°C, 20–28 min" : "180–200°C, 12–20 min"}; shake or flip halfway.\n4. Check cooked through (chicken juices clear). Cool slightly for Zizi.\n5. Panel: Tools → Cooking → Easy Fry.`,
      `1. Hugasan, patuyuin, hiwain. Timpla / marinade 15–20 min.\n2. Easy Fry: isang layer, konting spray ng mantika.\n3. Air Fry ${wing ? "190–200°C, 20–28 min" : "180–200°C, 12–20 min"}; iling o baliktarin sa gitna.\n4. Siguraduhing luto. Palamigin nang kaunti para kay Zizi.\n5. Panel: Tools → Cooking → Easy Fry.`,
      `1. 洗淨抹乾，按需要切件。醃 15–20 分鐘。\n2. Easy Fry：單層，薄噴油（不要積油）。\n3. 氣炸 ${wing ? "190–200°C、20–28 分鐘" : "180–200°C、12–20 分鐘"}；中途搖／翻。\n4. 確認熟透（雞肉汁清）。稍涼再給 Zizi。\n5. 面板：家電 → 煮食 → Easy Fry。`
    );
  }
  if (method === "stirfry") {
    return notes(
      `1. Wash and cut everything first (veg bite-size for Zizi; meat thin slices).\n2. Optional: velvet meat with 1 tsp soy + little starch 10 min.\n3. Wok medium-high, 1–2 tbsp oil. Garlic/ginger 20 sec.\n4. Meat first until just cooked; add veg; stir-fry 2–4 min until veg bright and tender-crisp.\n5. Season lightly (soy / salt / pinch sugar). Serve at once.`,
      `1. Hugasan at hiwain muna lahat (maliit para kay Zizi).\n2. Opsyonal: timplahan ang karne ng 1 tsp toyo + konting starch 10 min.\n3. Kawali medium-high, 1–2 tbsp mantika. Bawang/luya 20 sec.\n4. Karne muna hanggang maluto; dagdag gulay; igisa 2–4 min.\n5. Konting toyo/asin. Ihain agad.`,
      `1. 先洗切（菜切小塊方便 Zizi；肉薄片）。\n2. 可選：肉用 1 茶匙豉油＋少許生粉醃 10 分鐘。\n3. 鑊中大火，1–2 湯匙油。爆香蒜／薑約 20 秒。\n4. 先炒肉至剛熟，再下菜炒 2–4 分鐘至熟脆。\n5. 少許豉油／鹽／糖。立即上碟。`
    );
  }
  if (method === "steam") {
    return notes(
      `1. Wash fish/eggs; plate with ginger and spring onion.\n2. Steam over boiling water: fish ~8–12 min; steamed egg 10–12 min (cover plate).\n3. Don't over-steam. Pour hot soy + oil + more spring onion.\n4. Debone fish carefully for Zizi.`,
      `1. Hugasan; ilagay luya at sibuyas dahon.\n2. I-steam: isda ~8–12 min; steamed egg 10–12 min.\n3. Huwag sobra. Budburan ng mainit na toyo + mantika + sibuyas.\n4. Ingatang tanggalin ang tinik para kay Zizi.`,
      `1. 洗淨，鋪薑蔥。\n2. 水滾後蒸：魚約 8–12 分鐘；蒸水蛋 10–12 分鐘（碟加蓋）。\n3. 不要蒸老。淋熱豉油＋油＋蔥。\n4. 給 Zizi 前仔細挑骨。`
    );
  }
  if (method === "ricecooker") {
    return notes(
      `1. Rinse rice. Cut toppings (chicken/salmon/mushroom/tomato).\n2. Rice + water in cooker; lay toppings and seasonings on top (don't stir hard).\n3. Cook one normal rice cycle.\n4. Rest 5 min, fluff, taste salt. Cheese last if using.`,
      `1. Banlawan ang bigas. Hiwain ang toppings.\n2. Bigas + tubig sa rice cooker; ilagay ang toppings at pampalasa sa ibabaw.\n3. Isang normal na rice cycle.\n4. Palamigin 5 min, haluin, tikman. Cheese sa dulo kung meron.`,
      `1. 洗米。切好配料（雞／三文魚／菇／番茄）。\n2. 飯＋水入電飯煲，配料和調味放面上（不要大力攪）。\n3. 用普通煮飯程序。\n4. 燜 5 分鐘再拌勻試味。芝士最後加。`
    );
  }
  if (method === "roast") {
    return notes(
      `1. Wash, cut even pieces; toss with oil, garlic, salt.\n2. Easy Fry or oven 190–200°C, 15–25 min until edges brown; shake/turn once.\n3. Soft enough for Zizi. Optional cheese in last 3 min.`,
      `1. Hugasan, hiwain; haluan ng mantika, bawang, asin.\n2. Easy Fry o oven 190–200°C, 15–25 min hanggang brown; baliktarin minsan.\n3. Malambot para kay Zizi. Opsyonal cheese sa huling 3 min.`,
      `1. 洗切均勻，拌油、蒜、鹽。\n2. Easy Fry 或焗爐 190–200°C、15–25 分鐘至邊焦；中途翻一次。\n3. 軟身方便 Zizi。可選最後 3 分鐘加芝士。`
    );
  }
  if (method === "salad") {
    return notes(
      `1. Wash veg/sprouts well; drain.\n2. Cook chicken/tofu if needed; cool; shred or cube.\n3. Toss with sesame oil, soy, pinch sugar. Serve cool.\n4. No raw leftover meat — cook fresh.`,
      `1. Hugasan mabuti ang gulay/toge; patuyuin.\n2. Lutuin ang manok/tofu kung kailangan; palamigin; hiwain.\n3. Haluan ng sesame oil, toyo, konting asukal. Ihain nang malamig.\n4. Huwag gumamit ng leftover na hilaw na karne.`,
      `1. 菜／芽菜洗淨瀝乾。\n2. 雞／豆腐煮熟放涼，撕絲或切粒。\n3. 拌麻油、豉油、少許糖。凍食。\n4. 不要用隔夜生肉。`
    );
  }
  if (method === "risotto") {
    return notes(
      `1. Dice mushroom/pumpkin; mince garlic.\n2. Pan: oil + garlic, add rice or leftover rice / risotto rice, then stock a little at a time (or rice cooker risotto style).\n3. Stir until creamy, 15–20 min. Season lightly. Cheese optional.`,
      `1. Hiwain ang kabute/kalabasa; tadtarin ang bawang.\n2. Kawali: mantika + bawang, dagdag kanin, unti-unting stock.\n3. Haluin hanggang creamy, 15–20 min. Konting pampalasa.`,
      `1. 菇／南瓜切粒，蒜蓉。\n2. 鍋：油爆蒜，下飯或米飯，分次加湯。\n3. 攪至乳油約 15–20 分鐘。淡鹽。可加芝士。`
    );
  }
  // panfry default
  return notes(
    `1. Wash and pat dry. Cut to even thickness so it cooks through.\n2. Season 10–15 min (salt, pepper, a little soy).\n3. Pan medium heat + 1 tbsp oil. Cook without moving until golden; flip.\n4. Chicken/pork: juices clear. Fish: flakes easily. Rest 2 min. Debone for Zizi.`,
    `1. Hugasan at patuyuin. Hiwain nang pareho ang kapal.\n2. Timpla 10–15 min (asin, paminta, konting toyo).\n3. Kawali medium + 1 tbsp mantika. Huwag galawin hanggang golden; baliktarin.\n4. Manok/baboy: malinaw ang juice. Isda: madaling mahimay. Palamigin 2 min. Tanggalin ang buto para kay Zizi.`,
    `1. 洗淨抹乾，切均勻厚薄。\n2. 醃 10–15 分鐘（鹽、胡椒、少許豉油）。\n3. 中火平底鍋＋1 湯匙油。不要頻翻，一面金黃再翻。\n4. 雞／豬：肉汁清。魚：易起肉。休息 2 分鐘。給 Zizi 前去骨。`
  );
}

function rebuild(r) {
  const named = { ...r, nameEn: betterEn(r) };
  const method = inferMethod(named);
  const device = named.cookDevice || suggestDevice(named, method);
  const next = {
    ...named,
    ingredients: inferIngredients(named),
    prepNotes: buildNotes(named, method, device),
  };
  if (device) {
    next.cookDevice = device;
    if (!next.cookSettings?.steps?.en) next.cookSettings = starterSettings(device);
  }
  if (!next.nameFil || /ulam na|deformities|sportbenzin/i.test(next.nameFil)) {
    next.nameFil = next.nameEn;
  }
  return next;
}

function tagOnly(r) {
  if (r.cookDevice) return r;
  const device = suggestDevice(r, inferMethod(r));
  if (!device) return r;
  return {
    ...r,
    cookDevice: device,
    cookSettings: r.cookSettings?.steps?.en
      ? r.cookSettings
      : starterSettings(device),
  };
}

async function loadLive() {
  const res = await fetch(LIVE_URL, { headers: { Accept: "application/json" } });
  if (!res.ok) throw new Error(`live recipes ${res.status}`);
  const data = await res.json();
  return Array.isArray(data) ? data : data.recipes || [];
}

function loadSeed() {
  const p = path.join(ROOT, "data/dinner-recipes.json");
  return JSON.parse(fs.readFileSync(p, "utf8"));
}

const live = await loadLive();
const seedFile = loadSeed();
const seedById = new Map((seedFile.recipes || []).map((r) => [r.id, r]));

let rebuilt = 0;
let tagged = 0;
const out = [];
const seen = new Set();

for (const r of live) {
  seen.add(r.id);
  const generic = isGenericWatch(r.prepNotes) || placeholderIngs(r.ingredients);
  if (generic) {
    out.push(rebuild(r));
    rebuilt += 1;
  } else {
    const next = tagOnly(r);
    if (next.cookDevice && !r.cookDevice) tagged += 1;
    out.push(next);
  }
}

for (const r of seedFile.recipes || []) {
  if (seen.has(r.id)) continue;
  const generic = isGenericWatch(r.prepNotes) || placeholderIngs(r.ingredients);
  out.push(generic ? rebuild(r) : tagOnly(r));
  seen.add(r.id);
  if (generic) rebuilt += 1;
}

const payload = { recipes: out };
for (const rel of ["data/dinner-recipes.json", "public/data/dinner-recipes.json"]) {
  fs.writeFileSync(
    path.join(ROOT, rel),
    JSON.stringify(payload, null, 2) + "\n"
  );
}

const stillGeneric = out.filter((r) => isGenericWatch(r.prepNotes)).length;
const withDevice = out.filter((r) => r.cookDevice).length;
console.log(
  JSON.stringify(
    {
      live: live.length,
      totalOut: out.length,
      rebuilt,
      extraTagged: tagged,
      stillGeneric,
      withDevice,
      epc: out.filter((r) => r.cookDevice === EPC).length,
      easyFry: out.filter((r) => r.cookDevice === FRY).length,
    },
    null,
    2
  )
);
