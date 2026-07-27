import type { BilingualText, Lang } from "./types";

/** Known cook devices Charlene can use for marked Meals recipes */
export const COOK_DEVICES: Record<
  string,
  {
    shortName: BilingualText;
    badge: BilingualText;
    howTo: BilingualText;
  }
> = {
  "app-tefal-epc17": {
    shortName: {
      en: "Tefal EPC17 pressure cooker",
      fil: "Tefal EPC17 pressure cooker",
      zh: "Tefal EPC17 電子壓力鍋",
    },
    badge: {
      en: "Cook with EPC17",
      fil: "Luto sa EPC17",
      zh: "用 EPC17 煮",
    },
    howTo: {
      en: "How to cook this with Tefal EPC17:\n1) Always put the removable bowl in first.\n2) Add food + enough liquid (≥ ~250 ml). Stay under MAX (under ~½ for rice/beans).\n3) Fit the valve (slightly loose is normal) and push it down; lock the lid.\n4) Choose Pressure cook → HI-P / P / LO-P as the prep notes say → set minutes → Start.\n5) Wait until pressure is fully released before opening (use the release Sir/Mum showed).\n6) Panel map: open Tools → Cooking → Tefal EPC17.",
      fil: "Paano lutuin ito sa Tefal EPC17:\n1) Ilagay muna ang removable bowl.\n2) Pagkain + sapat na liquid (≥ ~250 ml). Huwag lampas sa MAX (sa ilalim ng ~½ para sa rice/beans).\n3) Ilagay ang valve (medyo maluwag — normal) at i-down; i-lock ang lid.\n4) Pressure cook → HI-P / P / LO-P ayon sa prep notes → oras → Start.\n5) Hintaying fully released ang pressure bago buksan (sundin ang release nina Sir/Mum).\n6) Panel map: Tools → Cooking → Tefal EPC17.",
      zh: "用 Tefal EPC17 煮這道菜：\n1) 必須先放入可拆內鍋。\n2) 食物＋足夠液體（≥約 250 ml）。勿超 MAX（米／豆勿超約一半）。\n3) 裝上限壓閥（略鬆正常）並按下，鎖蓋。\n4) 選壓力煮 → 按準備說明選 HI-P／P／LO-P → 調時間 → 開始。\n5) 等壓力完全釋放才開蓋（用 Sir/Mum 教的洩壓方式）。\n6) 面板圖：打開「家電／Tools」→ 煮食 → Tefal EPC17。",
    },
  },
  "app-tefal-easy-fry-xxl": {
    shortName: {
      en: "Tefal Easy Fry & Grill XXL",
      fil: "Tefal Easy Fry & Grill XXL",
      zh: "Tefal Easy Fry & Grill XXL 氣炸鍋",
    },
    badge: {
      en: "Cook with Easy Fry",
      fil: "Luto sa Easy Fry",
      zh: "用 Easy Fry 煮",
    },
    howTo: {
      en: "How to cook this with Tefal Easy Fry & Grill XXL:\n1) Optional preheat: Start → Air Fry (often 180°C) → adjust °C with +/− → Start until it beeps.\n2) Put food in the basket/bowl — do not overcrowd; shake or turn halfway.\n3) Manual: set 40–220°C and minutes (see prep notes), then Start. Or pick an auto mode.\n4) Grill mode: preheat ~15 min at 220°C; flip meat halfway; oil collects in the bowl.\n5) Light oil brush/spray only — do not pour a pool of oil. Basket is hot — use tongs.\n6) Panel map: open Tools → Cooking → Tefal Easy Fry & Grill XXL.",
      fil: "Paano lutuin ito sa Tefal Easy Fry & Grill XXL:\n1) Optional preheat: Start → Air Fry (madalas 180°C) → ayusin °C gamit +/− → Start hanggang may beep.\n2) Ilagay ang pagkain sa basket — huwag siksikin; iling / baliktarin sa gitna.\n3) Manual: 40–220°C at minuto (tingnan prep notes), Start. O auto mode.\n4) Grill: preheat ~15 min sa 220°C; baliktarin ang karne sa gitna.\n5) Light oil lang — huwag magbuhos ng maraming mantika. Mainit ang basket — gumamit ng tongs.\n6) Panel map: Tools → Cooking → Tefal Easy Fry & Grill XXL.",
      zh: "用 Tefal Easy Fry & Grill XXL 煮這道菜：\n1) 可先預熱：Start → Air Fry（常 180°C）→ 用 +/− 調溫 → 再 Start 至響聲。\n2) 食物放入籃／鍋——不要過滿；中途搖動或翻面。\n3) 手動：40–220°C 與分鐘（見準備說明）後 Start；或選自動模式。\n4) Grill：約 220°C 預熱 15 分鐘；肉中途翻面。\n5) 薄刷／噴少許油即可——不要倒一大灘油。籃很燙——用夾。\n6) 面板圖：打開「家電／Tools」→ 煮食 → Tefal Easy Fry & Grill XXL。",
    },
  },
};

export function cookDeviceMeta(id: string | undefined) {
  if (!id) return null;
  return COOK_DEVICES[id] ?? null;
}

export function cookDeviceLabel(id: string | undefined, lang: Lang): string {
  const meta = cookDeviceMeta(id);
  if (!meta) return "";
  return lang === "zh"
    ? meta.badge.zh || meta.badge.en
    : lang === "fil"
      ? meta.badge.fil || meta.badge.en
      : meta.badge.en;
}
