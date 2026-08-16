#!/usr/bin/env node
/**
 * Fill missing dinner-recipe ingredients + short prepNotes from dish names
 * (Chinese title is primary; YouTube is visual reference).
 * Review in Admin after publish — quantities are practical shopping estimates.
 */
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const files = [
  path.join(__dirname, "../data/dinner-recipes.json"),
  path.join(__dirname, "../public/data/dinner-recipes.json"),
];

const ing = (en, qty, fil, zh) => ({
  en,
  ...(qty ? { qty } : {}),
  ...(fil ? { fil } : {}),
  ...(zh ? { zh } : {}),
});

const notes = (en, fil, zh) => ({ en, fil, zh: zh || "" });

/** Per-id curated shopping lists (Cantonese / home cooking) */
const BY_ID = {
  "d-10": {
    ingredients: [
      ing("Frozen dumplings", "1 pack", "Frozen dumpling", "急凍餃子"),
      ing("Cooking oil", "2 tbsp", "Mantika", "油"),
      ing("Water", "as needed", "Tubig", "水"),
      ing("Soy sauce / vinegar", "to serve", "Toyo / suka", "豉油／醋"),
      ing("Spring onion", "optional", "Sibuyas dahon", "蔥"),
    ],
    prepNotes: notes(
      "1) Pan medium heat + little oil. 2) Arrange dumplings. 3) Add a splash of water, cover until bottoms crisp (ice-flower). 4) Serve with dip. Watch video for timing.",
      "1) Medium heat + konting oil. 2) Ilagay ang dumplings. 3) Magdagdag ng konting tubig, takpan hanggang crispy. 4) Serve with toyo/suka. Tingnan ang video sa timing.",
      "中火少油煎餃，加水蓋蓋至底部冰花，配醬。"
    ),
  },
  "d-14": {
    ingredients: [
      ing("Kimchi", "200g", "Kimchi", "泡菜"),
      ing("Soft tofu", "1 block", "Malambot na tofu", "嫩豆腐"),
      ing("Pork or spam (optional)", "100g", "Baboy / spam (opsyonal)", "豬肉／午餐肉（可選）"),
      ing("Egg", "1", "Itlog", "蛋"),
      ing("Gochujang / chilli paste", "1 tbsp", "Gochujang", "韓式辣椒醬"),
      ing("Spring onion", "2 stalks", "Sibuyas dahon", "蔥"),
    ],
    prepNotes: notes(
      "Simmer kimchi + water/stock, add tofu gently, optional meat, crack egg on top. Don't boil tofu hard. Video shows seasoning.",
      "Pakuluan ang kimchi + sabaw, dahan-dahang ilagay ang tofu, optional meat, itlog sa ibabaw. Huwag masyadong pakuluan ang tofu.",
      "泡菜加水煮，輕放豆腐，可加肉，打蛋，勿猛滾豆腐。"
    ),
  },
  "d-18": {
    ingredients: [
      ing("Long beans / green beans", "200g", "Sitaw / beans", "豆角"),
      ing("Eggs", "3", "Itlog", "蛋"),
      ing("Garlic", "2 cloves", "Bawang", "蒜"),
      ing("Oil, salt, soy sauce", "to taste", "Mantika, asin, toyo", "油、鹽、豉油"),
    ],
    prepNotes: notes(
      "Stir-fry beans first until tender, push aside, scramble eggs, mix. Season lightly.",
      "Igisa muna ang beans, isaisantabi, lutuin ang itlog, paghaluin. Konting seasoning.",
      "先炒豆角至熟，再炒蛋混合調味。"
    ),
  },
};

function baseAromatics() {
  return [
    ing("Garlic", "2–3 cloves", "Bawang", "蒜"),
    ing("Ginger", "a few slices", "Luya", "薑"),
    ing("Spring onion", "2 stalks", "Sibuyas dahon", "蔥"),
    ing("Cooking oil", "2 tbsp", "Mantika", "油"),
    ing("Salt / soy sauce", "to taste", "Asin / toyo", "鹽／豉油"),
  ];
}

function inferFromName(recipe) {
  const n = `${recipe.name || ""} ${recipe.nameEn || ""}`;
  const ings = [];
  const add = (...items) => {
    for (const i of items) {
      if (!ings.some((x) => x.en === i.en)) ings.push(i);
    }
  };

  // Proteins
  if (/牛|beef|oxtail|⽜|牛尾|肋條|牛柳|牛腩|牛排|肥⽜|肥牛/i.test(n))
    add(ing("Beef (as in video)", "300–500g", "Baka (ayon sa video)", "牛肉（見影片）"));
  if (/豬|pork|五花|豬扒|豬排|豬頸|松阪|午餐⾁|午餐肉|spam/i.test(n))
    add(ing("Pork (as in video)", "300g", "Baboy (ayon sa video)", "豬肉（見影片）"));
  if (/雞|chicken|雞翼|雞髀|雞胸|雞柳|三杯雞/i.test(n))
    add(ing("Chicken (as in video)", "300–500g", "Manok (ayon sa video)", "雞肉（見影片）"));
  if (/羊|⽺|lamb/i.test(n))
    add(ing("Lamb / mutton", "300g", "Kordero", "羊肉"));
  if (/魚|salmon|鮭|三⽂|三文|比⽬|比目|黃花|⿈花|蝦|shrimp|蛤|青口|藍青口|⻘⼝/i.test(n))
    add(ing("Seafood (as in video)", "300g", "Seafood (ayon sa video)", "海鮮（見影片）"));
  if (/豆腐|⾖腐|tofu/i.test(n)) add(ing("Tofu", "1 block", "Tofu", "豆腐"));
  if (/蛋|egg|煎蛋|水蛋|⽔蛋/i.test(n)) add(ing("Eggs", "2–4", "Itlog", "蛋"));
  if (/泡菜|kimchi/i.test(n)) add(ing("Kimchi", "150–200g", "Kimchi", "泡菜"));
  if (/年糕/i.test(n)) add(ing("Korean rice cake (tteok)", "200g", "Korean rice cake", "年糕"));

  // Veg / carbs
  if (/番茄|蕃茄|tomato/i.test(n)) add(ing("Tomato", "2–3", "Kamatis", "番茄"));
  if (/薯|馬鈴薯|⾺鈴薯|potato/i.test(n)) add(ing("Potato", "2", "Patatas", "薯仔"));
  if (/南瓜|pumpkin/i.test(n)) add(ing("Pumpkin", "400g", "Kalabasa", "南瓜"));
  if (/椰菜|花椰|broccoli|⻄蘭|西蘭|花椰菜/i.test(n))
    add(ing("Broccoli / cauliflower", "1 head", "Broccoli / cauliflower", "椰菜花／西蘭花"));
  if (/菠菜|spinach/i.test(n)) add(ing("Spinach", "1 bunch", "Spinach", "菠菜"));
  if (/菜⼼|菜心/i.test(n)) add(ing("Choy sum", "1 bunch", "Choy sum", "菜心"));
  if (/芥蘭/i.test(n)) add(ing("Chinese kale (gai lan)", "1 bunch", "Gai lan", "芥蘭"));
  if (/豆角|⾖⾓|長豆/i.test(n)) add(ing("Long beans", "200g", "Sitaw", "豆角"));
  if (/豆芽|⾖芽|芽菜/i.test(n)) add(ing("Bean sprouts", "200g", "Toge", "豆芽"));
  if (/菇|蘑菇|金針|⾦針|杏鮑|雞髀菇|enoki/i.test(n))
    add(ing("Mushrooms (as in video)", "200g", "Kabute (ayon sa video)", "菇（見影片）"));
  if (/茄子|茄⼦|eggplant/i.test(n)) add(ing("Eggplant", "2", "Talong", "茄子"));
  if (/洋葱|洋蔥|onion/i.test(n)) add(ing("Onion", "1", "Sibuyas", "洋蔥"));
  if (/蘆筍|asparagus/i.test(n)) add(ing("Asparagus", "1 bunch", "Asparagus", "蘆筍"));
  if (/青瓜|翠⽟瓜|jade melon|zucchini/i.test(n))
    add(ing("Zucchini / green melon", "1–2", "Zucchini", "翠肉瓜"));
  if (/蘿蔔|carrot/i.test(n)) add(ing("Carrot / white radish", "1", "Carrot / labanos", "蘿蔔"));
  if (/飯|rice|炊飯|炒飯/i.test(n)) add(ing("Rice", "2 cups cooked", "Kanin", "飯"));
  if (/麵|意粉|意⼤利|spaghetti|金邊粉|⾦邊粉|粉絲/i.test(n))
    add(ing("Noodles / pasta (as in video)", "200g", "Pancit / pasta", "粉／麵（見影片）"));
  if (/咖喱|咖哩|curry/i.test(n))
    add(ing("Curry paste / powder", "2 tbsp", "Curry", "咖喱"));
  if (/味噌|miso/i.test(n)) add(ing("Miso paste", "1–2 tbsp", "Miso", "味噌"));
  if (/芝士|芝⼠|起司|cheese/i.test(n)) add(ing("Cheese", "as needed", "Cheese", "芝士"));
  if (/香蕉|banana/i.test(n)) add(ing("Banana", "2–3", "Saging", "香蕉"));
  if (/芒果|mango/i.test(n)) add(ing("Mango", "1–2", "Mangga", "芒果"));
  if (/糯米|sticky/i.test(n)) add(ing("Glutinous rice", "1 cup", "Malagkit", "糯米"));
  if (/冬陰|tom yum/i.test(n))
    add(
      ing("Tom yum paste / herbs", "2 tbsp", "Tom yum paste", "冬陰酱／香料"),
      ing("Prawns or chicken", "200g", "Hipon o manok", "蝦或雞")
    );
  if (/沙嗲|satay/i.test(n)) add(ing("Satay sauce", "3 tbsp", "Satay sauce", "沙嗲醬"));
  if (/三杯/i.test(n))
    add(
      ing("Sesame oil, soy sauce, rice wine", "2 tbsp each", "Sesame oil, toyo, rice wine", "麻油、豉油、米酒")
    );
  if (/氣炸|air.?fry/i.test(n))
    add(ing("Oil spray / little oil", "as needed", "Mantika", "少許油"));
  if (/椒鹽|salt and pepper/i.test(n))
    add(ing("Salt & pepper seasoning", "1 tsp", "Asin at paminta", "椒鹽"));
  if (/蜜糖|honey/i.test(n)) add(ing("Honey", "2 tbsp", "Honey", "蜜糖"));
  if (/黑椒|⿊椒|black pepper/i.test(n))
    add(ing("Black pepper", "1 tsp", "Paminta", "黑椒"));
  if (/孜然|cumin/i.test(n)) add(ing("Cumin powder", "1 tsp", "Cumin", "孜然"));
  if (/香茅|lemongrass|citronella/i.test(n))
    add(ing("Lemongrass", "1–2 stalks", "Tanglad", "香茅"));
  if (/XO/i.test(n)) add(ing("XO sauce", "1–2 tbsp", "XO sauce", "XO醬"));
  if (/白酒|忌廉|cream|酒/i.test(n) && /煮|cream/i.test(n))
    add(ing("White wine + cream (or milk)", "as in video", "Wine + cream", "白酒＋忌廉"));

  // Always add aromatics for savoury mains
  if (recipe.category !== "Soup" || ings.length < 2) {
    for (const a of baseAromatics().slice(0, 3)) add(a);
  } else {
    add(ing("Garlic / ginger / spring onion", "to taste", "Bawang / luya / sibuyas", "蒜／薑／蔥"));
  }

  if (recipe.category === "Soup" && !ings.some((i) => /stock|water|sabaw/i.test(i.en))) {
    add(ing("Water or stock", "800ml–1L", "Tubig o stock", "水或湯底"));
  }

  // Ensure minimum useful list
  if (ings.length < 3) {
    add(
      ing("Main ingredients from video title", "see video", "Sangkap mula sa video", "見影片主料"),
      ...baseAromatics()
    );
  }

  const prepNotes = notes(
    `1. Wash and cut ingredients first (bite-size for Zizi).\n2. Cook ${recipe.category === "Soup" ? "as a soup: simmer or EPC17 HI-P 20–35 min, liquid ≥250 ml under MAX" : "on medium heat 5–12 min, stirring as needed"}.\n3. Season lightly with salt / soy. Debone before serving.`,
    `1. Hugasan at hiwain muna (maliit para kay Zizi).\n2. Lutuin ${recipe.category === "Soup" ? "bilang sabaw: EPC17 HI-P 20–35 min, liquid ≥250 ml under MAX" : "sa medium heat 5–12 min"}.\n3. Konting asin / toyo. Tanggalin ang buto bago ihain.`,
    `1. 先洗切（小塊方便 Zizi）。\n2. ${recipe.category === "Soup" ? "煲湯：爐火慢煮或 EPC17 高壓 20–35 分鐘，液體 ≥250 ml 勿超 MAX" : "中火烹調 5–12 分鐘" }。\n3. 少許鹽／豉油。上碟前去骨。`
  );

  return { ingredients: ings, prepNotes };
}

function improveEnglishName(recipe) {
  const map = {
    冰花煎餃: "Crispy-bottom pan-fried dumplings",
    韓式泡菜豆腐鍋: "Korean kimchi soft-tofu stew",
    "韓式泡菜⾖腐鍋": "Korean kimchi soft-tofu stew",
    豆角炒蛋: "Stir-fried long beans with egg",
    "⾖⾓炒蛋": "Stir-fried long beans with egg",
    韓式牛尾湯: "Korean oxtail soup",
    "韓式⽜尾湯": "Korean oxtail soup",
    濃白蒜頭雞湯: "Creamy garlic chicken soup",
    "濃⽩蒜頭雞湯": "Creamy garlic chicken soup",
    特濃蕃茄薯仔魚湯: "Tomato potato fish soup",
    "特濃蕃茄薯仔⿂湯": "Tomato potato fish soup",
    蕃茄炒蛋: "Tomato scrambled eggs",
    三杯雞: "Three-cup chicken",
    蒸水蛋: "Steamed egg custard",
    "蒸⽔蛋": "Steamed egg custard",
    冬陰公湯: "Tom yum soup",
    泰式青咖喱雞: "Thai green curry chicken",
    "泰式⻘咖喱雞": "Thai green curry chicken",
  };
  const fixed = map[recipe.name];
  if (fixed) return fixed;
  return recipe.nameEn;
}

function improveFilName(recipe, nameEn) {
  // Keep existing good FIL; otherwise use English as base for shopping clarity
  if (
    recipe.nameFil &&
    !/ulam na|deformities|sportbenzin|shade|pampublikong/i.test(recipe.nameFil)
  ) {
    return recipe.nameFil;
  }
  return nameEn || recipe.nameFil || recipe.name;
}

let updated = 0;
for (const file of files) {
  const data = JSON.parse(fs.readFileSync(file, "utf8"));
  const recipes = data.recipes || data;
  for (const r of recipes) {
    const curated = BY_ID[r.id];
    const inferred = inferFromName(r);
    if (!r.ingredients?.length) {
      r.ingredients = curated?.ingredients || inferred.ingredients;
      updated++;
    } else if (curated?.ingredients) {
      // keep existing if already filled unless curated preferred — leave existing
    }
    if (!r.prepNotes?.en) {
      r.prepNotes = curated?.prepNotes || inferred.prepNotes;
    }
    const betterEn = improveEnglishName(r);
    if (betterEn) r.nameEn = betterEn;
    r.nameFil = improveFilName(r, r.nameEn);
  }
  fs.writeFileSync(file, JSON.stringify(data, null, 2) + "\n");
  console.log("Updated", file, "newly filled ingredients ≈", updated);
  updated = 0;
}
