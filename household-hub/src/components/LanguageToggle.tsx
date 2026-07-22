"use client";

import { useLanguage } from "@/contexts/LanguageContext";
import type { Lang } from "@/lib/types";

const OPTIONS: { id: Lang; label: string }[] = [
  { id: "en", label: "EN" },
  { id: "zh", label: "繁" },
  { id: "fil", label: "FIL" },
];

export function LanguageToggle() {
  const { lang, setLang } = useLanguage();

  return (
    <div className="flex rounded-lg bg-white p-0.5 ring-1 ring-stone-200">
      {OPTIONS.map(({ id, label }) => (
        <button
          key={id}
          type="button"
          onClick={() => setLang(id)}
          className={`rounded-md px-2 py-1 text-xs font-semibold transition ${
            lang === id
              ? "bg-teal-600 text-white"
              : "text-stone-600 hover:text-stone-900"
          }`}
        >
          {label}
        </button>
      ))}
    </div>
  );
}
