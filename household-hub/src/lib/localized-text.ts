import type { BilingualText, Lang } from "./types";

export function hasCjk(text: string): boolean {
  return /[\u4e00-\u9fff\u3400-\u4dbf]/.test(text);
}

/** Pick best available string for the selected UI language */
export function localized(text: BilingualText | undefined, lang: Lang): string {
  if (!text) return "";
  const pick = (key: keyof BilingualText) => text[key]?.trim() ?? "";
  if (lang === "zh") return pick("zh") || pick("en") || pick("fil");
  if (lang === "fil") return pick("fil") || pick("en") || pick("zh");
  return pick("en") || pick("zh") || pick("fil");
}

export function emptyBilingual(): BilingualText {
  return { en: "", fil: "", zh: "" };
}

export function detectTextLang(text: string): Lang {
  if (!text.trim()) return "en";
  if (hasCjk(text)) return "zh";
  if (/[àáâãäåæçèéêëìíîïñòóôõöùúûüý]/i.test(text)) return "fil";
  return "en";
}
