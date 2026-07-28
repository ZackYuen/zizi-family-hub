import type { BilingualText, Lang } from "./types";

/** Known cook devices Charlene can use for marked Meals recipes */
export const COOK_DEVICES: Record<
  string,
  {
    shortName: BilingualText;
    badge: BilingualText;
    /** Short shared basics — dish cards show per-dish cookSettings first */
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
      en: "Device basics (same for every EPC17 dish):\n• Bowl in first · liquid ≥ ~250 ml · under MAX.\n• Valve down + lock lid before pressure.\n• Use HI-P / LO-P / Steam / Brown from THIS dish’s settings.\n• Wait until pressure is fully released before opening.\n• Panel map: Tools → Cooking → Tefal EPC17.",
      fil: "Device basics (pareho sa lahat ng EPC17 dish):\n• Bowl muna · liquid ≥ ~250 ml · under MAX.\n• Valve down + lock lid bago pressure.\n• Gamitin ang HI-P / LO-P / Steam / Brown mula sa settings NG DISH NA ITO.\n• Hintaying fully released ang pressure bago buksan.\n• Panel map: Tools → Cooking → Tefal EPC17.",
      zh: "機具基本（每道 EPC17 菜相同）：\n• 先放內鍋 · 液體 ≥約 250 ml · 勿超 MAX。\n• 壓力前閥下壓並鎖蓋。\n• HI-P／LO-P／蒸／炒按「這道菜」設定。\n• 壓力完全釋放才開蓋。\n• 面板圖：家電 → 煮食 → Tefal EPC17。",
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
      en: "Device basics (same for every Easy Fry dish):\n• Manual: Start → Air Fry → set °C / min from THIS dish → Start.\n• Don’t overcrowd · light oil spray only (no oil pool) · tongs for hot basket.\n• Shake / flip when the dish steps say so.\n• Panel map: Tools → Cooking → Tefal Easy Fry & Grill XXL.",
      fil: "Device basics (pareho sa lahat ng Easy Fry dish):\n• Manual: Start → Air Fry → itakda °C / min mula sa DISH NA ITO → Start.\n• Huwag siksikin · light oil spray lang · tongs sa mainit na basket.\n• Iling / baliktarin kung sinasabi ng steps ng dish.\n• Panel map: Tools → Cooking → Tefal Easy Fry & Grill XXL.",
      zh: "機具基本（每道 Easy Fry 菜相同）：\n• 手動：Start → Air Fry → 按「這道菜」設溫度／分鐘 → Start。\n• 不要過滿 · 薄噴油即可 · 熱籃用夾。\n• 依這道菜步驟中途搖／翻。\n• 面板圖：家電 → 煮食 → Tefal Easy Fry & Grill XXL。",
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
