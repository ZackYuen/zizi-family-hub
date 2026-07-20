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

export function GroundRulesView({ rules }: { rules: GroundRule[] }) {
  const { lang } = useLanguage();
  const sorted = [...rules].sort((a, b) => a.priority - b.priority);

  return (
    <div className="space-y-3">
      {sorted.map((rule, index) => (
        <article
          key={rule.id}
          className="rounded-2xl bg-white p-4 shadow-sm ring-1 ring-stone-100"
        >
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
                {categoryIcons[rule.category]} {categoryLabel(rule.category, lang)}
              </span>
            </div>
          </div>
          <p className="pl-11 text-sm leading-relaxed text-stone-600">
            {localized(rule.description, lang)}
          </p>
        </article>
      ))}
    </div>
  );
}
