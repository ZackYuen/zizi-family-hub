#!/usr/bin/env node
/**
 * Attach researched per-dish cookSettings (Easy Fry + EPC17) and sync prepNotes.
 * Sources: Tefal Easy Fry & Grill XXL EY801 cooking guide; EPC17 HI-P/LO-P/Steam family timings.
 *
 * Run: node scripts/apply-dish-cook-settings.mjs
 */
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(__dirname, "..");

function t(en, fil, zh) {
  return { en, fil, zh };
}

function easy(modeEn, tempC, minutes, steps) {
  return {
    mode: t(modeEn, modeEn, modeEn === "Reheat" ? "翻熱" : modeEn === "Air Fry" ? "氣炸 Air Fry" : modeEn),
    tempC,
    minutes,
    steps,
  };
}

function epc(modeEn, modeZh, minutes, steps) {
  return {
    mode: t(modeEn, modeEn, modeZh),
    minutes,
    steps,
  };
}

/** @type {Record<string, { cookSettings: object, prepNotes: object }>} */
const UPDATES = {
  // —— Easy Fry (Tefal EY801 guide + family portions) ——
  "d-51": {
    cookSettings: easy(
      "Air Fry",
      "160–170",
      "8–12",
      t(
        "1) Trim enoki; light oil only.\n2) Single layer — don’t overcrowd.\n3) Air Fry 160–170°C, 8–12 min; shake halfway.\n4) Soft for Zizi — cut shorter if needed.",
        "1) Putulin ang enoki; light oil lang.\n2) Isang layer — huwag siksikin.\n3) Air Fry 160–170°C, 8–12 min; iling sa gitna.\n4) Soft para kay Zizi — putulin kung kailangan.",
        "1) 金針菇去根，薄油。\n2) 單層，不要過滿。\n3) 氣炸 160–170°C、8–12 分鐘；中途搖動。\n4) 給 Zizi 可切短。"
      )
    ),
  },
  "d-140": {
    cookSettings: easy(
      "Air Fry",
      "180–200",
      "10–15",
      t(
        "1) Slice zucchini even thickness; light oil + salt.\n2) Spread in basket.\n3) Air Fry 180–200°C, 10–15 min; turn halfway.\n4) Soft veg side for family.",
        "1) Hiwain ang zucchini nang pantay; light oil + asin.\n2) Ikalat sa basket.\n3) Air Fry 180–200°C, 10–15 min; baliktarin sa gitna.\n4) Soft gulay para sa pamilya.",
        "1) 翠玉瓜切均勻薄片；薄油＋鹽。\n2) 鋪開在籃內。\n3) 氣炸 180–200°C、10–15 分鐘；中途翻面。\n4) 軟熟作配菜。"
      )
    ),
  },
  "d-540": {
    cookSettings: easy(
      "Air Fry",
      "190–200",
      "12–16",
      t(
        "1) Marinate pork with lemongrass.\n2) Optional preheat Air Fry 190°C.\n3) Air Fry 190–200°C, 12–16 min; flip halfway (Tefal chop guide ~200°C).\n4) Cut small for Zizi; check fully cooked.",
        "1) Marinate ang pork sa lemongrass.\n2) Optional preheat Air Fry 190°C.\n3) Air Fry 190–200°C, 12–16 min; baliktarin sa gitna.\n4) Cut maliit para kay Zizi; tiyaking luto.",
        "1) 香茅醃豬扒。\n2) 可預熱氣炸 190°C。\n3) 190–200°C、12–16 分鐘；中途翻面（Tefal 豬扒約 200°C）。\n4) 切小塊給 Zizi；確認熟透。"
      )
    ),
  },
  "d-560": {
    cookSettings: easy(
      "Air Fry",
      "160–180",
      "8–14",
      t(
        "1) Pat fish/seafood dry; light oil.\n2) Single layer in basket.\n3) Air Fry 160–180°C, 8–14 min by thickness (shrimp often ~170°C, shorter); flip once.\n4) Bones out for Zizi. Ask Sir/Mum if unsure.",
        "1) Patuyuin ang isda/seafood; light oil.\n2) Isang layer sa basket.\n3) Air Fry 160–180°C, 8–14 min ayon sa kapal (hipon ~170°C, mas maikli); baliktarin minsan.\n4) Alisin buto para kay Zizi.",
        "1) 魚／海鮮抹乾薄油。\n2) 單層。\n3) 氣炸 160–180°C、8–14 分鐘視厚薄（蝦約 170°C、時間較短）；翻一次。\n4) 給 Zizi 去骨。不肯定問 Sir/Mum。"
      )
    ),
  },
  "d-790": {
    cookSettings: easy(
      "Air Fry",
      "190–200",
      "12–16",
      t(
        "1) Breaded chop — light spray oil only (no oil pool).\n2) Air Fry 190–200°C, 12–16 min; flip halfway for crisp.\n3) Cut for Zizi; check cooked through.",
        "1) Breaded chop — light spray oil lang.\n2) Air Fry 190–200°C, 12–16 min; baliktarin sa gitna.\n3) Cut para kay Zizi; tiyaking luto.",
        "1) 吉列豬扒 — 薄噴油即可。\n2) 氣炸 190–200°C、12–16 分鐘；中途翻面更脆。\n3) 切給 Zizi；確認熟透。"
      )
    ),
  },
  "d-af-1601": {
    cookSettings: easy(
      "Air Fry",
      "190–200",
      "20–28",
      t(
        "1) Pat wings dry; season. Optional preheat 190°C.\n2) Single layer — don’t stack.\n3) Air Fry 190–200°C, 20–28 min for a family batch; flip halfway (large frozen packs need longer ~30–35 min at 200°C).\n4) Fully cooked for Zizi — cut smaller.",
        "1) Patuyuin ang wings; timplahan. Optional preheat 190°C.\n2) Isang layer — huwag isalansan.\n3) Air Fry 190–200°C, 20–28 min; baliktarin sa gitna (malaking frozen pack ~30–35 min sa 200°C).\n4) Luto nang tuluyan para kay Zizi — cut maliit.",
        "1) 雞翼抹乾調味；可預熱 190°C。\n2) 單層勿堆疊。\n3) 氣炸 190–200°C、家庭份 20–28 分鐘；中途翻面（大包裝急凍約 200°C、30–35 分）。\n4) 給 Zizi 要熟透並切小。"
      )
    ),
  },
  "d-af-1602": {
    cookSettings: easy(
      "Air Fry",
      "190–200",
      "18–25",
      t(
        "1) Cut wedges; toss light oil + salt; dry surface helps crisp.\n2) Air Fry 190–200°C, 18–25 min; shake 2–3 times (Tefal wedges guide ~200°C).\n3) Soft inside for Zizi — cook until tender.",
        "1) Hiwain wedges; light oil + asin.\n2) Air Fry 190–200°C, 18–25 min; iling 2–3 beses.\n3) Soft sa loob para kay Zizi — hanggang malambot.",
        "1) 薯角拌薄油＋鹽。\n2) 氣炸 190–200°C、18–25 分鐘；搖 2–3 次（Tefal 薯角約 200°C）。\n3) 給 Zizi 要軟熟。"
      )
    ),
  },
  "d-af-1603": {
    cookSettings: easy(
      "Air Fry",
      "140–160",
      "12–16",
      t(
        "1) Season salmon; light oil. Do NOT use 180°C — Tefal guide is cooler for fillets.\n2) Air Fry 140–160°C, 12–16 min (official ~140°C, 14–17 min for fillets).\n3) Usually no flip. Flakes easily when done.\n4) Remove bones/skin for Zizi.",
        "1) Timplahan ang salmon; light oil. HUWAG 180°C — mas mababa ang temp sa Tefal guide.\n2) Air Fry 140–160°C, 12–16 min (opisyal ~140°C, 14–17 min).\n3) Madalas hindi kailangan baliktarin.\n4) Alisin buto/balat para kay Zizi.",
        "1) 三文魚調味薄油。勿用 180°C — Tefal 指南較低溫。\n2) 氣炸 140–160°C、12–16 分鐘（官方魚柳約 140°C、14–17 分）。\n3) 通常不用翻面；輕壓可散即熟。\n4) 給 Zizi 去骨去皮。"
      )
    ),
  },
  "d-af-1604": {
    cookSettings: easy(
      "Air Fry",
      "190–200",
      "12–18",
      t(
        "1) Cut veg similar sizes; light oil.\n2) Air Fry 190–200°C, 12–18 min; shake halfway (Tefal veg guide often ~200°C).\n3) Soft for Zizi — don’t burn tips.",
        "1) Magkaparehong laki ang gulay; light oil.\n2) Air Fry 190–200°C, 12–18 min; iling sa gitna.\n3) Soft para kay Zizi — huwag sunugin ang dulo.",
        "1) 菜切均勻大小；薄油。\n2) 氣炸 190–200°C、12–18 分鐘；中途搖（Tefal 蔬菜常約 200°C）。\n3) 給 Zizi 要軟；勿焦邊。"
      )
    ),
  },
  "d-af-1605": {
    cookSettings: easy(
      "Air Fry",
      "180–190",
      "12–15",
      t(
        "1) Press tofu dry; cube; light oil/soy.\n2) Air Fry 180–190°C, 12–15 min; shake once.\n3) Soft protein for Zizi.",
        "1) Patuyuin ang tofu; cubewin; light oil/soy.\n2) Air Fry 180–190°C, 12–15 min; iling minsan.\n3) Soft protein para kay Zizi.",
        "1) 豆腐壓乾切丁；薄油／豉油。\n2) 氣炸 180–190°C、12–15 分鐘；搖一次。\n3) 給 Zizi 作軟蛋白。"
      )
    ),
  },
  "d-af-1606": {
    cookSettings: easy(
      "Air Fry",
      "180–190",
      "18–25",
      t(
        "1) Marinate thigh pieces.\n2) Air Fry 180–190°C, 18–25 min; flip halfway (similar to Tefal chicken fillet band).\n3) Juices run clear. Debone/cut for Zizi.",
        "1) Marinate ang thigh.\n2) Air Fry 180–190°C, 18–25 min; baliktarin sa gitna.\n3) Clear ang juice. Alisin buto / cut para kay Zizi.",
        "1) 雞腿醃味。\n2) 氣炸 180–190°C、18–25 分鐘；中途翻面。\n3) 汁液清澈即熟。給 Zizi 去骨切小。"
      )
    ),
  },
  "d-af-1607": {
    cookSettings: easy(
      "Air Fry",
      "180",
      "8–12",
      t(
        "1) Light spray; single layer (frozen may need +2–4 min).\n2) Air Fry 180°C, 8–12 min; shake/turn once.\n3) Cool slightly for Zizi.",
        "1) Light spray; isang layer (frozen +2–4 min).\n2) Air Fry 180°C, 8–12 min; iling/baliktarin minsan.\n3) Palamigin sandali para kay Zizi.",
        "1) 薄噴油；單層（急凍可多 2–4 分）。\n2) 氣炸 180°C、8–12 分鐘；搖／翻一次。\n3) 稍涼再給 Zizi。"
      )
    ),
  },
  "d-af-1608": {
    cookSettings: easy(
      "Air Fry",
      "180–200",
      "12–16",
      t(
        "1) Light oil on cob pieces.\n2) Air Fry 180–200°C, 12–16 min; turn once.\n3) Soft sweet veg — good with meat.",
        "1) Light oil sa corn.\n2) Air Fry 180–200°C, 12–16 min; baliktarin minsan.\n3) Soft matamis na gulay — maganda with meat.",
        "1) 玉米段薄油。\n2) 氣炸 180–200°C、12–16 分鐘；翻一次。\n3) 軟甜配菜，配肉好。"
      )
    ),
  },
  "d-af-1609": {
    cookSettings: easy(
      "Air Fry",
      "190–200",
      "10–14",
      t(
        "1) Season chop; optional preheat 190°C.\n2) Air Fry 190–200°C, 10–14 min; flip halfway (Tefal QSG chops ~200°C, 6–12 min — extend if thick).\n3) Cut small for Zizi; fully cooked.",
        "1) Timplahan; optional preheat 190°C.\n2) Air Fry 190–200°C, 10–14 min; baliktarin sa gitna.\n3) Cut maliit para kay Zizi; tiyaking luto.",
        "1) 調味；可預熱 190°C。\n2) 氣炸 190–200°C、10–14 分鐘；中途翻面（Tefal 豬扒約 200°C、6–12 分，厚則加時）。\n3) 切小給 Zizi；確認熟透。"
      )
    ),
  },
  "d-af-1610": {
    cookSettings: easy(
      "Reheat",
      "160",
      "up to 10",
      t(
        "1) Only leftovers Sir/Mum say are OK — not for raw food.\n2) Spread in basket; light spray if dry.\n3) Air Fry / reheat 160°C, up to ~10 min; check often; shake/turn once.\n4) Hot basket — use tongs.",
        "1) Leftovers lang na OK ayon kay Sir/Mum — hindi para sa hilaw.\n2) Ikalat sa basket; light spray kung tuyo.\n3) Reheat 160°C, hanggang ~10 min; tingnan madalas; iling/baliktarin minsan.\n4) Mainit ang basket — tongs.",
        "1) 只翻熱 Sir/Mum 說可以的剩菜 — 不適用生食。\n2) 鋪開；過乾可薄噴油。\n3) 翻熱 160°C、最多約 10 分鐘；常檢查；搖／翻一次。\n4) 籃燙 — 用夾。"
      )
    ),
  },

  // —— EPC17 (electric pressure; times from family HI-P / LO-P / Steam practice) ——
  "d-epc-1501": {
    cookSettings: epc(
      "HI-P",
      "高壓 HI-P",
      "30–35",
      t(
        "1) Blanch ribs 3–5 min; rinse.\n2) Bowl in → ribs + corn + carrot + ginger (+ dates) + water (under MAX, ≥250 ml).\n3) Valve down, lock → Pressure HI-P 30–35 min.\n4) Natural release ≥5 min, then open safely.\n5) Salt to taste. Soft soup for Zizi.",
        "1) Blanch ribs 3–5 min; banlawan.\n2) Bowl → ribs + corn + carrot + ginger (+ dates) + tubig (under MAX, ≥250 ml).\n3) Valve down, lock → HI-P 30–35 min.\n4) Natural release ≥5 min, tapos buksan nang safe.\n5) Asin. Soft soup para kay Zizi.",
        "1) 排骨汆水 3–5 分鐘；沖淨。\n2) 內鍋：排骨＋玉米＋胡蘿蔔＋薑（可加紅棗）＋水（勿超 MAX，≥250 ml）。\n3) 閥下壓鎖蓋 → 高壓 HI-P 30–35 分鐘。\n4) 自然洩壓 ≥5 分鐘再開蓋。\n5) 調味。給 Zizi 軟湯。"
      )
    ),
  },
  "d-epc-1502": {
    cookSettings: epc(
      "HI-P then LO-P/Steam",
      "先高壓再低壓／蒸",
      "20 + 8–10",
      t(
        "1) Blanch ribs → bowl + ribs + ginger + water → HI-P 20 min.\n2) Release safely (natural ~5 min or careful quick-release).\n3) Add winter melon (+ goji) → LO-P or Steam 8–10 min until soft.\n4) Salt. Don’t turn melon to mush if Zizi likes cubes.",
        "1) Blanch ribs → bowl + ribs + ginger + tubig → HI-P 20 min.\n2) Release nang safe.\n3) Lagyan winter melon (+ goji) → LO-P o Steam 8–10 min.\n4) Asin. Huwag sobrang luto kung gusto ni Zizi may cubes.",
        "1) 排骨汆水 → 內鍋＋薑＋水 → HI-P 20 分鐘。\n2) 安全洩壓。\n3) 下冬瓜（可枸杞）→ LO-P 或蒸 8–10 分鐘至軟。\n4) 調味。若 Zizi 要塊狀勿煮溶。"
      )
    ),
  },
  "d-epc-1503": {
    cookSettings: epc(
      "Brown + HI-P",
      "炒香＋高壓",
      "25–30",
      t(
        "1) Optional Brown (lid often open) — sear beef/onion.\n2) Add tomato, potato, seasonings + liquid under MAX.\n3) Lock → HI-P 25–30 min.\n4) Natural release ~10 min. Cut smaller for Zizi. Serve with rice.",
        "1) Optional Brown (madalas bukas lid) — sear beef/onion.\n2) Lagyan tomato, potato, seasonings + liquid under MAX.\n3) Lock → HI-P 25–30 min.\n4) Natural release ~10 min. Cut maliit para kay Zizi. May rice.",
        "1) 可先 Brown（常開蓋）炒牛肉／洋蔥。\n2) 下番茄、薯、調味＋液體（勿超 MAX）。\n3) 鎖蓋 → HI-P 25–30 分鐘。\n4) 自然洩壓約 10 分鐘。給 Zizi 切小；配飯。"
      )
    ),
  },
  "d-epc-1504": {
    cookSettings: epc(
      "HI-P",
      "高壓 HI-P",
      "15–18",
      t(
        "1) Bowl → chicken + ginger/onion + soy + sugar + water (≥250 ml, under MAX).\n2) Valve down, lock → HI-P 15–18 min (bone-in).\n3) Natural release 5–10 min.\n4) Optional Brown lid-open to reduce sauce if Sir/Mum showed. Remove bones for Zizi.",
        "1) Bowl → chicken + ginger/onion + soy + sugar + tubig.\n2) Valve down, lock → HI-P 15–18 min.\n3) Natural release 5–10 min.\n4) Optional Brown (bukas lid) para mag-reduce ng sauce. Alisin buto para kay Zizi.",
        "1) 內鍋：雞＋薑／蔥＋豉油＋糖＋水。\n2) 閥下壓鎖蓋 → HI-P 15–18 分鐘（連骨）。\n3) 自然洩壓 5–10 分鐘。\n4) 可開蓋 Brown 收汁（若 Sir/Mum 教過）。給 Zizi 去骨。"
      )
    ),
  },
  "d-epc-1505": {
    cookSettings: epc(
      "Brown + HI-P",
      "炒香＋高壓",
      "12–15",
      t(
        "1) Optional Brown onion/chicken.\n2) Add potato + curry + liquid under MAX.\n3) HI-P 12–15 min → natural ~5 min.\n4) Mild for family — ask Sir/Mum how spicy. Good with rice.",
        "1) Optional Brown onion/chicken.\n2) Lagyan potato + curry + liquid under MAX.\n3) HI-P 12–15 min → natural ~5 min.\n4) Mild — tanungin si Sir/Mum kung gaano kaanghang. May rice.",
        "1) 可先 Brown 洋蔥／雞。\n2) 下薯＋咖喱＋液體（勿超 MAX）。\n3) HI-P 12–15 分鐘 → 自然洩壓約 5 分鐘。\n4) 家常微辣 — 問 Sir/Mum 辣度；配飯。"
      )
    ),
  },
  "d-epc-1506": {
    cookSettings: epc(
      "LO-P / Brown",
      "低壓／炒煮",
      "3–5",
      t(
        "1) Tomato + water: Soup/Steam or LO-P 3–5 min, then release.\n2) Switch to Brown/simmer lid-open: stir in beaten egg; season.\n3) Or cook fully on Brown if easier. Soft quick soup.",
        "1) Tomato + tubig: Soup/Steam o LO-P 3–5 min, release.\n2) Brown/simmer bukas lid: haluin ang egg; timplahan.\n3) O lahat sa Brown kung mas madali. Soft mabilis na soup.",
        "1) 番茄＋水：湯／蒸或 LO-P 3–5 分鐘後洩壓。\n2) 改 Brown 開蓋：倒入蛋液攪勻調味。\n3) 或全程 Brown。快速軟湯。"
      )
    ),
  },
  "d-epc-1507": {
    cookSettings: epc(
      "Steam",
      "蒸 Steam",
      "8–10",
      t(
        "1) Beat eggs + warm water + salt; strain into bowl; cover foil.\n2) Trivet + ~1 cup water in cooker bowl.\n3) Steam 8–10 min, then natural ~5 min.\n4) Smooth egg for Zizi — ask Sir/Mum water ratio once.",
        "1) Haluin eggs + warm water + asin; salain; takpan foil.\n2) Trivet + ~1 cup tubig sa cooker.\n3) Steam 8–10 min, natural ~5 min.\n4) Smooth para kay Zizi — tanungin si Sir/Mum sa ratio.",
        "1) 蛋＋溫水＋鹽打勻；過濾入碗；蓋箔。\n2) 蒸架＋約 1 杯水。\n3) 蒸 8–10 分鐘，再自然約 5 分鐘。\n4) 給 Zizi 滑蛋 — 水蛋比例問過 Sir/Mum 一次即可。"
      )
    ),
  },
  "d-epc-1508": {
    cookSettings: epc(
      "HI-P (2 stages)",
      "高壓（兩段）",
      "35–40 + 8–10",
      t(
        "1) Optional blanch beef.\n2) Bowl → beef + seasonings + water under MAX → HI-P 35–40 min.\n3) Release safely → add radish → Pressure 8–10 min more until soft.\n4) Cut small for Zizi. Meat + veg in one pot.",
        "1) Optional blanch beef.\n2) Bowl → beef + seasonings + tubig under MAX → HI-P 35–40 min.\n3) Safe release → lagyan radish → Pressure 8–10 min pa.\n4) Cut maliit para kay Zizi.",
        "1) 牛腩可先汆水。\n2) 內鍋：牛＋調味＋水（勿超 MAX）→ HI-P 35–40 分鐘。\n3) 洩壓後下蘿蔔 → 再壓力 8–10 分鐘至軟。\n4) 給 Zizi 切小。一鍋肉菜。"
      )
    ),
  },
  "d-epc-1509": {
    cookSettings: epc(
      "LO-P or HI-P",
      "低壓或高壓",
      "5–8",
      t(
        "1) Bowl → tofu + veg + sauce + liquid under MAX (≥250 ml).\n2) LO-P or HI-P 5–8 min (veg softs fast).\n3) Careful quick-release. Don’t overcook to mush.\n4) Mild for Zizi; add minced meat if Sir/Mum wants.",
        "1) Bowl → tofu + gulay + sauce + liquid under MAX.\n2) LO-P o HI-P 5–8 min.\n3) Quick-release nang ingat. Huwag sobrang luto.\n4) Mild para kay Zizi; dagdag minced meat kung gusto nina Sir/Mum.",
        "1) 內鍋：豆腐＋菜＋醬汁＋液體（≥250 ml，勿超 MAX）。\n2) LO-P 或 HI-P 5–8 分鐘（菜很快軟）。\n3) 小心快速洩壓；勿煮溶。\n4) 給 Zizi 清淡；若要蛋白可加免治肉。"
      )
    ),
  },
  "d-epc-1510": {
    cookSettings: epc(
      "HI-P",
      "高壓 HI-P",
      "25",
      t(
        "1) Optional blanch chicken.\n2) Bowl → chicken + veg + ginger + water → HI-P ~25 min.\n3) Natural release ~10 min. Salt.\n4) Remove bones before serving Zizi.",
        "1) Optional blanch chicken.\n2) Bowl → chicken + gulay + ginger + tubig → HI-P ~25 min.\n3) Natural ~10 min. Asin.\n4) Alisin buto bago ihanda kay Zizi.",
        "1) 雞可先汆水。\n2) 內鍋：雞＋菜＋薑＋水 → HI-P 約 25 分鐘。\n3) 自然洩壓約 10 分鐘；調味。\n4) 給 Zizi 前去骨。"
      )
    ),
  },
};

for (const [id, u] of Object.entries(UPDATES)) {
  const s = u.cookSettings.steps;
  u.prepNotes = {
    en: `${u.cookSettings.mode.en}${u.cookSettings.tempC ? ` ${u.cookSettings.tempC}°C` : ""}, ${u.cookSettings.minutes} min.\n${s.en}`,
    fil: `${u.cookSettings.mode.fil}${u.cookSettings.tempC ? ` ${u.cookSettings.tempC}°C` : ""}, ${u.cookSettings.minutes} min.\n${s.fil}`,
    zh: `${u.cookSettings.mode.zh}${u.cookSettings.tempC ? ` ${u.cookSettings.tempC}°C` : ""}，${u.cookSettings.minutes} 分鐘。\n${s.zh}`,
  };
}

for (const rel of ["data/dinner-recipes.json", "public/data/dinner-recipes.json"]) {
  const p = path.join(ROOT, rel);
  const j = JSON.parse(fs.readFileSync(p, "utf8"));
  const recipes = j.recipes || j;
  let n = 0;
  for (const r of recipes) {
    const u = UPDATES[r.id];
    if (!u) continue;
    r.cookSettings = u.cookSettings;
    r.prepNotes = u.prepNotes;
    n++;
  }
  const out = Array.isArray(j) ? recipes : { ...j, recipes };
  fs.writeFileSync(p, JSON.stringify(out, null, 2) + "\n");
  console.log(rel, "updated", n);
}

console.log("ids", Object.keys(UPDATES).length);
