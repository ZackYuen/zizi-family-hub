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
