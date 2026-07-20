"use client";

import { useLanguage } from "@/contexts/LanguageContext";
import { labels } from "@/lib/i18n";

export function LanguageToggle() {
  const { lang, setLang } = useLanguage();

  return (
    <div className="flex rounded-full bg-white/80 p-1 shadow-sm ring-1 ring-stone-200">
      <button
        type="button"
        onClick={() => setLang("en")}
        className={`rounded-full px-3 py-1.5 text-sm font-medium transition ${
          lang === "en"
            ? "bg-teal-600 text-white shadow-sm"
            : "text-stone-600 hover:text-stone-900"
        }`}
      >
        {labels.english.en}
      </button>
      <button
        type="button"
        onClick={() => setLang("fil")}
        className={`rounded-full px-3 py-1.5 text-sm font-medium transition ${
          lang === "fil"
            ? "bg-teal-600 text-white shadow-sm"
            : "text-stone-600 hover:text-stone-900"
        }`}
      >
        {labels.filipino.fil}
      </button>
    </div>
  );
}
