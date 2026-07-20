"use client";

import { useLanguage } from "@/contexts/LanguageContext";
import { labels } from "@/lib/i18n";
import type { Lang } from "@/lib/types";

const OPTIONS: { id: Lang; label: string }[] = [
  { id: "en", label: labels.english.en },
  { id: "zh", label: labels.chinese.zh },
  { id: "fil", label: labels.filipino.fil },
];

export function LanguageToggle() {
  const { lang, setLang } = useLanguage();

  return (
    <div className="flex rounded-full bg-white/80 p-0.5 shadow-sm ring-1 ring-stone-200">
      {OPTIONS.map(({ id, label }) => (
        <button
          key={id}
          type="button"
          onClick={() => setLang(id)}
          className={`rounded-full px-2.5 py-1.5 text-xs font-medium transition sm:px-3 sm:text-sm ${
            lang === id
              ? "bg-teal-600 text-white shadow-sm"
              : "text-stone-600 hover:text-stone-900"
          }`}
        >
          {label}
        </button>
      ))}
    </div>
  );
}
