"use client";

import { useLanguage } from "@/contexts/LanguageContext";
import { localized } from "@/lib/localized-text";
import type {
  ApplianceGuide,
  ApplianceKind,
  FamilyPreferenceTip,
  GroundRule,
} from "@/lib/types";
import { GroundRulesView } from "./GroundRulesView";

const prefIcons: Record<FamilyPreferenceTip["category"], string> = {
  shopping: "🛒",
  food: "🥗",
  kitchen: "🍳",
  general: "💛",
};

const prefUi = {
  title: {
    en: "Family preferences",
    fil: "Mga preference ng pamilya",
    zh: "家庭偏好",
  },
  banner: {
    en: "Helpful tips about how our family likes things — not Ground Rules. There is no “If Broken”. When unsure, ask Sir or Mum.",
    fil: "Mga tip kung paano gusto ng pamilya — hindi Ground Rules. Walang “If Broken”. Kung unsure, tanungin si Sir o Mum.",
    zh: "關於我們家習慣的貼士——不是守則。沒有 “If Broken”。不確定就問 Sir 或 Mum。",
  },
};

function PreferencesSection({ tips }: { tips: FamilyPreferenceTip[] }) {
  const { lang } = useLanguage();
  const sorted = [...tips].sort((a, b) => a.priority - b.priority);
  if (!sorted.length) return null;

  return (
    <div className="space-y-3 pt-2">
      <div className="rounded-2xl border border-teal-200 bg-gradient-to-br from-teal-50 to-emerald-50 p-4">
        <h2 className="text-base font-bold text-teal-950">{prefUi.title[lang]}</h2>
        <p className="mt-1 text-sm leading-relaxed text-teal-900">{prefUi.banner[lang]}</p>
      </div>
      {sorted.map((tip) => (
        <article
          key={tip.id}
          className="rounded-2xl bg-white p-4 shadow-sm ring-1 ring-teal-100"
        >
          <div className="mb-2 flex items-start gap-2">
            <span className="text-lg" aria-hidden>
              {prefIcons[tip.category]}
            </span>
            <h3 className="text-base font-semibold text-stone-900">
              {localized(tip.title, lang)}
            </h3>
          </div>
          <p className="text-sm leading-relaxed text-stone-600">
            {localized(tip.body, lang)}
          </p>
        </article>
      ))}
    </div>
  );
}

export function RulesAndPreferencesView({
  rules,
  preferences,
}: {
  rules: GroundRule[];
  preferences?: FamilyPreferenceTip[];
}) {
  return (
    <div className="space-y-6">
      <GroundRulesView rules={rules} />
      <PreferencesSection tips={preferences ?? []} />
    </div>
  );
}

const kindIcon: Record<ApplianceKind, string> = {
  vacuum: "🧹",
  "rice-cooker": "🍚",
  "pressure-cooker": "🍲",
  "washing-machine": "👕",
  "bread-machine": "🍞",
  "air-fryer": "🍟",
  "water-dispenser": "💧",
  "range-hood": "🌬️",
  dehumidifier: "💨",
  "air-purifier": "🌀",
  other: "🔌",
};

const toolsUi = {
  title: {
    en: "House tools & appliances",
    fil: "Mga gamit sa bahay",
    zh: "家電與工具",
  },
  hint: {
    en: "Short how-to for our machines. Details can change — ask Sir or Mum if the buttons look different.",
    fil: "Maikling how-to para sa aming machines. Puwedeng mag-iba — tanungin si Sir o Mum kung iba ang buttons.",
    zh: "家中機器的簡短用法。機型可能不同——按鈕不一樣就問 Sir 或 Mum。",
  },
  caution: {
    en: "Caution",
    fil: "Babala",
    zh: "注意",
  },
};

export function AppliancesView({ appliances }: { appliances: ApplianceGuide[] }) {
  const { lang } = useLanguage();
  const sorted = [...appliances].sort((a, b) => a.priority - b.priority);

  return (
    <div className="space-y-4">
      <div className="rounded-2xl bg-gradient-to-br from-stone-800 to-stone-900 p-4 text-white shadow-md">
        <h2 className="text-lg font-bold">{toolsUi.title[lang]}</h2>
        <p className="mt-1 text-xs opacity-80">{toolsUi.hint[lang]}</p>
      </div>

      <div className="space-y-3">
        {sorted.map((item) => {
          const warning = item.warnings ? localized(item.warnings, lang) : "";
          return (
            <article
              key={item.id}
              className="overflow-hidden rounded-2xl bg-white shadow-sm ring-1 ring-stone-100"
            >
              <div className="p-4">
                <div className="mb-2 flex items-center gap-2">
                  <span className="text-xl" aria-hidden>
                    {kindIcon[item.kind] || kindIcon.other}
                  </span>
                  <div className="min-w-0">
                    <h3 className="text-base font-semibold text-stone-900">
                      {localized(item.title, lang)}
                    </h3>
                    {item.model && (
                      <p className="text-[11px] font-medium text-stone-400">
                        {item.model}
                      </p>
                    )}
                  </div>
                </div>
                <p className="text-sm leading-relaxed text-stone-600">
                  {localized(item.tips, lang)}
                </p>
                {item.sourceUrl && (
                  <a
                    href={item.sourceUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="mt-2 inline-block text-xs font-medium text-teal-700 underline"
                  >
                    {lang === "fil"
                      ? "Manual / support"
                      : lang === "zh"
                        ? "說明／支援頁"
                        : "Manual / support"}
                  </a>
                )}
              </div>
              {warning && (
                <div className="border-t border-amber-100 bg-amber-50/90 px-4 py-3">
                  <p className="mb-1 text-xs font-bold uppercase tracking-wide text-amber-900">
                    {toolsUi.caution[lang]}
                  </p>
                  <p className="text-sm leading-relaxed text-amber-950">{warning}</p>
                </div>
              )}
            </article>
          );
        })}
      </div>
    </div>
  );
}
