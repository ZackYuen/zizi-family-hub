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
    en: "Must follow",
    fil: "Dapat sundin",
    zh: "必須遵守",
  },
  bannerBody: {
    en: "Golden Rules. Borrowing money and Zizi’s safety can end the contract. Other mistakes: warning + talk with Sir/Mum — tell them right away.",
    fil: "Golden Rules. Ang paghiram ng pera at kaligtasan ni Zizi ay maaaring magtapos ng kontrata. Iba pang pagkakamali: warning + usapan kay Sir/Mum — sabihin agad.",
    zh: "黃金守則。借錢與 Zizi 安全可終止合約。其他失誤：警告並與 Sir/Mum 面談 — 有事先說。",
  },
  ifBroken: {
    en: "If Broken",
    fil: "If Broken",
    zh: "If Broken",
  },
};

export function GroundRulesView({ rules }: { rules: GroundRule[] }) {
  const { lang } = useLanguage();
  const sorted = [...rules].sort((a, b) => a.priority - b.priority);

  return (
    <div className="space-y-4">
      <div className="rounded-xl bg-red-50 px-3 py-2.5 ring-1 ring-red-100">
        <h2 className="text-sm font-bold text-red-900">{ui.bannerTitle[lang]}</h2>
        <p className="mt-0.5 text-xs leading-snug text-red-800">{ui.bannerBody[lang]}</p>
      </div>

      <div className="space-y-2.5">
        {sorted.map((rule, index) => {
          const consequence = localized(rule.consequences, lang);
          return (
            <article
              key={rule.id}
              className="overflow-hidden rounded-2xl bg-white ring-1 ring-stone-100"
            >
              <div className="p-3.5">
                <div className="mb-1.5 flex items-start gap-2.5">
                  <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-stone-100 text-xs font-bold text-stone-700">
                    {index + 1}
                  </span>
                  <div className="min-w-0 flex-1">
                    <h3 className="text-sm font-semibold text-stone-900">
                      {localized(rule.title, lang)}
                    </h3>
                    <span
                      className={`mt-1 inline-flex items-center gap-1 rounded-md px-1.5 py-0.5 text-[11px] font-medium ring-1 ${categoryColors[rule.category]}`}
                    >
                      {categoryIcons[rule.category]}{" "}
                      {categoryLabel(rule.category, lang)}
                    </span>
                  </div>
                </div>
                <p className="pl-9 text-sm leading-relaxed text-stone-600">
                  {localized(rule.description, lang)}
                </p>
              </div>

              {consequence && (
                <div className="border-t border-red-100 bg-red-50/70 px-3.5 py-2.5">
                  <p className="mb-0.5 text-[11px] font-bold uppercase tracking-wide text-red-800">
                    {ui.ifBroken[lang]}
                  </p>
                  <p className="text-sm leading-relaxed text-red-900">{consequence}</p>
                </div>
              )}
            </article>
          );
        })}
      </div>
    </div>
  );
}
