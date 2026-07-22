"use client";

import { useLanguage } from "@/contexts/LanguageContext";
import { categoryLabel } from "@/lib/i18n";
import { localized } from "@/lib/localized-text";
import type { GroundRule } from "@/lib/types";

const categoryIcons: Record<GroundRule["category"], string> = {
  general: "🏠",
  kitchen: "🍳",
  childcare: "👶",
  safety: "🛡️",
};

const categoryColors: Record<GroundRule["category"], string> = {
  general: "bg-blue-50 text-blue-700 ring-blue-100",
  kitchen: "bg-orange-50 text-orange-700 ring-orange-100",
  childcare: "bg-pink-50 text-pink-700 ring-pink-100",
  safety: "bg-red-50 text-red-700 ring-red-100",
};

const ui = {
  bannerTitle: {
    en: "We are a family — clear and kind",
    fil: "Pamilya tayo — malinaw at mabait",
    zh: "我們是一家人 — 清楚而溫和",
  },
  bannerBody: {
    en: "Charlene is new to Hong Kong. These are our shared house agreements so everyone stays safe and feels welcome. If something goes wrong, tell Sir or Mum early — we will talk and learn together. Each card has “If Broken” for clarity.",
    fil: "Bago pa si Charlene sa Hong Kong. Ito ang shared agreements ng bahay para ligtas at welcome ang lahat. Kung may mali, sabihin agad kay Sir o Mum — mag-uusap at matututo nang magkasama. May “If Broken” sa bawat card para malinaw.",
    zh: "Charlene 初到香港。這些是我們共同的家約，讓大家安全、受歡迎。有事早告訴 Sir 或 Mum — 我們一起商量學習。每張卡有 “If Broken” 方便清楚。",
  },
  ifBroken: {
    en: "If Broken",
    fil: "If Broken",
    zh: "If Broken",
  },
  tellEmployer: {
    en: "Tell Sir or Mum right away — you will not be blamed for asking",
    fil: "Sabihin agad kay Sir o Mum — hindi ka sisisihin sa pagtatanong",
    zh: "立刻告訴 Sir 或 Mum — 發問不會被責備",
  },
};

export function GroundRulesView({ rules }: { rules: GroundRule[] }) {
  const { lang } = useLanguage();
  const sorted = [...rules].sort((a, b) => a.priority - b.priority);

  return (
    <div className="space-y-4">
      <div className="rounded-2xl border-2 border-red-200 bg-gradient-to-br from-red-50 to-amber-50 p-4 shadow-sm">
        <div className="flex gap-3">
          <span className="text-2xl" aria-hidden>
            ⚠️
          </span>
          <div>
            <h2 className="text-base font-bold text-red-900">{ui.bannerTitle[lang]}</h2>
            <p className="mt-1 text-sm leading-relaxed text-red-800">{ui.bannerBody[lang]}</p>
          </div>
        </div>
      </div>

      <div className="space-y-3">
        {sorted.map((rule, index) => {
          const consequence = localized(rule.consequences, lang);
          return (
            <article
              key={rule.id}
              className="overflow-hidden rounded-2xl bg-white shadow-sm ring-1 ring-stone-100"
            >
              <div className="p-4">
                <div className="mb-2 flex items-start gap-3">
                  <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-teal-100 text-sm font-bold text-teal-800">
                    {index + 1}
                  </span>
                  <div className="min-w-0 flex-1">
                    <h3 className="text-base font-semibold text-stone-900">
                      {localized(rule.title, lang)}
                    </h3>
                    <span
                      className={`mt-1 inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium ring-1 ${categoryColors[rule.category]}`}
                    >
                      {categoryIcons[rule.category]}{" "}
                      {categoryLabel(rule.category, lang)}
                    </span>
                  </div>
                </div>
                <p className="pl-11 text-sm leading-relaxed text-stone-600">
                  {localized(rule.description, lang)}
                </p>
              </div>

              {consequence && (
                <div className="border-t-2 border-red-100 bg-red-50/80 px-4 py-3">
                  <p className="mb-1 flex items-center gap-1.5 text-xs font-bold uppercase tracking-wide text-red-800">
                    <span aria-hidden>🚨</span>
                    {ui.ifBroken[lang]}
                  </p>
                  <p className="text-sm font-medium leading-relaxed text-red-900">
                    {consequence}
                  </p>
                  <p className="mt-2 text-xs font-semibold text-red-700">
                    → {ui.tellEmployer[lang]}
                  </p>
                </div>
              )}
            </article>
          );
        })}
      </div>
    </div>
  );
}
