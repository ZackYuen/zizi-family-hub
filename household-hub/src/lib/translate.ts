import type { Lang } from "./types";

/** MyMemory language codes — zh uses Traditional Chinese (zh-TW) for Hong Kong */
const MYMEMORY: Record<Lang, string> = {
  en: "en",
  fil: "tl",
  zh: "zh-TW",
};

/** Translate via MyMemory API between English, Filipino, and Chinese */
export async function translateText(
  text: string,
  from: Lang,
  to: Lang
): Promise<string> {
  if (!text.trim() || from === to) return text;

  const res = await fetch(
    `https://api.mymemory.translated.net/get?q=${encodeURIComponent(text)}&langpair=${MYMEMORY[from]}|${MYMEMORY[to]}`
  );
  const data = (await res.json()) as {
    responseData?: { translatedText?: string };
  };

  const translated = data.responseData?.translatedText?.trim();
  if (!translated || translated.toUpperCase() === text.toUpperCase()) {
    return text;
  }
  return translated;
}

/** @deprecated use translateText(text, "en", "fil") */
export async function translateEnToFil(text: string): Promise<string> {
  return translateText(text, "en", "fil");
}
