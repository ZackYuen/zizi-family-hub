"use client";

import { useState } from "react";
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
  tabRules: {
    en: "Must follow",
    fil: "Dapat sundin",
    zh: "必須遵守",
  },
  tabPrefs: {
    en: "Preferences",
    fil: "Preferences",
    zh: "偏好",
  },
  title: {
    en: "Family preferences",
    fil: "Mga preference ng pamilya",
    zh: "家庭偏好",
  },
  banner: {
    en: "Soft tips only — how our family likes shopping & daily habits. Not Ground Rules. No “If Broken”. When unsure, ask Sir or Mum.",
    fil: "Soft tips lang — kung paano gusto ng pamilya sa shopping at araw-araw. Hindi Ground Rules. Walang “If Broken”. Kung unsure, tanungin si Sir o Mum.",
    zh: "軟性貼士而已——購物與日常習慣。不是守則。沒有 “If Broken”。不確定就問 Sir 或 Mum。",
  },
  badge: {
    en: "Preference tip",
    fil: "Preference tip",
    zh: "偏好貼士",
  },
  empty: {
    en: "No preference tips yet. Sir/Mum can add them in Admin.",
    fil: "Wala pang preference tips. Puwedeng magdagdag sina Sir/Mum sa Admin.",
    zh: "尚無偏好貼士。Sir/Mum 可在 Admin 新增。",
  },
};

function PreferencesSection({ tips }: { tips: FamilyPreferenceTip[] }) {
  const { lang } = useLanguage();
  const sorted = [...tips].sort((a, b) => a.priority - b.priority);

  return (
    <div className="space-y-3">
      <div className="rounded-2xl border-2 border-teal-300 bg-gradient-to-br from-teal-50 to-emerald-50 p-4">
        <p className="text-[11px] font-bold uppercase tracking-wide text-teal-700">
          {prefUi.badge[lang]}
        </p>
        <h2 className="mt-1 text-base font-bold text-teal-950">{prefUi.title[lang]}</h2>
        <p className="mt-1 text-sm leading-relaxed text-teal-900">{prefUi.banner[lang]}</p>
      </div>
      {!sorted.length && (
        <p className="rounded-2xl bg-white px-4 py-6 text-center text-sm text-stone-500 ring-1 ring-stone-100">
          {prefUi.empty[lang]}
        </p>
      )}
      {sorted.map((tip) => (
        <article
          key={tip.id}
          className="rounded-2xl bg-white p-4 shadow-sm ring-1 ring-teal-100"
        >
          <div className="mb-2 flex items-start gap-2">
            <span className="text-lg" aria-hidden>
              {prefIcons[tip.category]}
            </span>
            <div className="min-w-0 flex-1">
              <span className="inline-block rounded-full bg-teal-100 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-teal-800">
                {prefUi.badge[lang]}
              </span>
              <h3 className="mt-1 text-base font-semibold text-stone-900">
                {localized(tip.title, lang)}
              </h3>
            </div>
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
  const { lang } = useLanguage();
  const [pane, setPane] = useState<"rules" | "prefs">("rules");
  const prefCount = preferences?.length ?? 0;

  return (
    <div className="space-y-4">
      <div
        className="grid grid-cols-2 gap-1 rounded-2xl bg-stone-200/80 p-1"
        role="tablist"
        aria-label="Rules or preferences"
      >
        <button
          type="button"
          role="tab"
          aria-selected={pane === "rules"}
          onClick={() => setPane("rules")}
          className={`rounded-xl px-3 py-2.5 text-sm font-semibold transition ${
            pane === "rules"
              ? "bg-red-600 text-white shadow-sm"
              : "bg-transparent text-stone-600"
          }`}
        >
          {prefUi.tabRules[lang]}
          <span className="ml-1 text-xs opacity-80">({rules.length})</span>
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={pane === "prefs"}
          onClick={() => setPane("prefs")}
          className={`rounded-xl px-3 py-2.5 text-sm font-semibold transition ${
            pane === "prefs"
              ? "bg-teal-600 text-white shadow-sm"
              : "bg-transparent text-stone-600"
          }`}
        >
          {prefUi.tabPrefs[lang]}
          <span className="ml-1 text-xs opacity-80">({prefCount})</span>
        </button>
      </div>

      {pane === "rules" ? (
        <GroundRulesView rules={rules} />
      ) : (
        <PreferencesSection tips={preferences ?? []} />
      )}
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

/** Split tip text into bullet lines (supports • / - / numbered / newlines). */
function tipLines(text: string): string[] {
  const raw = text.trim();
  if (!raw) return [];
  if (raw.includes("\n") || raw.includes("•")) {
    return raw
      .split(/\n+/)
      .map((s) => s.replace(/^[\s•\-–—]+/, "").replace(/^\d+[.)]\s*/, "").trim())
      .filter(Boolean);
  }
  return raw
    .split(/(?<=[.!?。！？])\s+/)
    .map((s) => s.trim())
    .filter((s) => s.length > 2);
}

function BulletList({
  text,
  className,
}: {
  text: string;
  className?: string;
}) {
  const lines = tipLines(text);
  if (lines.length <= 1) {
    return <p className={className}>{text}</p>;
  }
  return (
    <ul className={`list-disc space-y-1.5 pl-4 ${className || ""}`}>
      {lines.map((line, i) => (
        <li key={`${i}-${line.slice(0, 24)}`}>{line}</li>
      ))}
    </ul>
  );
}

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
                <BulletList
                  text={localized(item.tips, lang)}
                  className="text-sm leading-relaxed text-stone-600"
                />
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
                  <BulletList
                    text={warning}
                    className="text-sm leading-relaxed text-amber-950"
                  />
                </div>
              )}
            </article>
          );
        })}
      </div>
    </div>
  );
}
