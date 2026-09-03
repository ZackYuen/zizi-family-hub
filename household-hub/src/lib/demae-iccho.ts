import { localized } from "./localized-text";
import type { BilingualText, Lang } from "./types";

export const DEMAE_ICCHO_SOP: BilingualText = {
  en: [
    "出前一丁 (Demae Iccho) — family SOP:",
    "1. Boil a pot of water.",
    "2. Scoop out 300 ml. Mix the seasoning powder into that 300 ml (this is the soup).",
    "3. Put the noodles into the remaining boiling water. Keep boiling.",
    "4. Boil 1½ minutes, then scoop the noodles out and put them into the 300 ml soup.",
    "5. Finish eating within 3 minutes — do not let it sit.",
  ].join("\n"),
  fil: [
    "出前一丁 (Demae Iccho) — SOP ng pamilya:",
    "1. Pakuluan ang isang pot ng tubig.",
    "2. Kumuha ng 300 ml. Haloan ang seasoning powder sa 300 ml na iyon (ito ang sabaw).",
    "3. Ilagay ang noodles sa natitirang kumukulong tubig. Tuloy ang pagpakulo.",
    "4. Pakuluan ng 1½ minuto, saka isalok ang noodles at ilagay sa 300 ml na sabaw.",
    "5. Kainin lahat within 3 minutes — huwag hayaang tumagal.",
  ].join("\n"),
  zh: [
    "出前一丁 — 家中煮法：",
    "1. 煲滾一兜水。",
    "2. 攞 300 ml 出來，撈味粉（這 300 ml 就是湯）。",
    "3. 淨返嘅滾水落麵，繼續煲。",
    "4. 煲一分半鐘撈起，放返落 300 ml 湯。",
    "5. 3 分鐘內要食晒 — 不要放住。",
  ].join("\n"),
};

export function isDemaeIcchoQuestion(question: string): boolean {
  const q = question.toLowerCase();
  return /出前一丁|出前1丁|demae|iccho|nissin\s*demae/.test(q);
}

export function demaeIcchoAnswer(lang: Lang): string {
  return localized(DEMAE_ICCHO_SOP, lang);
}
