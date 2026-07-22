"use client";

import { useLanguage } from "@/contexts/LanguageContext";
import type { Lang } from "@/lib/types";

const ORDER: Lang[] = ["en", "zh", "fil"];
const SHORT: Record<Lang, string> = {
  en: "EN",
  zh: "繁",
  fil: "FIL",
};

export function LanguageToggle() {
  const { lang, setLang } = useLanguage();

  const cycle = () => {
    const i = ORDER.indexOf(lang);
    setLang(ORDER[(i + 1) % ORDER.length]);
  };

  return (
    <button
      type="button"
      onClick={cycle}
      title="Switch language"
      aria-label={`Language ${SHORT[lang]}. Tap to switch.`}
      className="rounded-lg bg-white px-2.5 py-1.5 text-xs font-semibold text-stone-700 ring-1 ring-stone-200"
    >
      {SHORT[lang]}
    </button>
  );
}
