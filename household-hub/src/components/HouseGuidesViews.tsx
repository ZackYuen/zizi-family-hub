"use client";

import { useState } from "react";
import { useLanguage } from "@/contexts/LanguageContext";
import {
  APPLIANCE_CATEGORY_ORDER,
  applianceCategory,
  applianceCategoryMeta,
} from "@/lib/appliance-categories";
import { localized } from "@/lib/localized-text";
import type {
  ApplianceGuide,
  ApplianceKind,
  FamilyPreferenceTip,
  GroundRule,
} from "@/lib/types";
import { AppliancePanelGuide } from "./AppliancePanelGuide";
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
    en: "Soft tips for shopping & daily habits — not Ground Rules.",
    fil: "Soft tips para sa shopping at araw-araw — hindi Ground Rules.",
    zh: "購物與日常軟性貼士 — 不是守則。",
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
    <div className="space-y-2.5">
      <div className="rounded-xl bg-teal-50 px-3 py-2.5 ring-1 ring-teal-100">
        <h2 className="text-sm font-bold text-teal-950">{prefUi.title[lang]}</h2>
        <p className="mt-0.5 text-xs leading-snug text-teal-900">{prefUi.banner[lang]}</p>
      </div>
      {!sorted.length && (
        <p className="rounded-2xl bg-white px-4 py-6 text-center text-sm text-stone-500 ring-1 ring-stone-100">
          {prefUi.empty[lang]}
        </p>
      )}
      {sorted.map((tip) => (
        <article
          key={tip.id}
          className="rounded-2xl bg-white p-3.5 ring-1 ring-stone-100"
        >
          <div className="mb-1 flex items-start gap-2">
            <span className="text-base" aria-hidden>
              {prefIcons[tip.category]}
            </span>
            <h3 className="text-sm font-semibold text-stone-900">
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
  iron: "🧺",
  shower: "🚿",
  other: "🔌",
};

const toolsUi = {
  title: {
    en: "House tools & appliances",
    fil: "Mga gamit sa bahay",
    zh: "家電與工具",
  },
  hint: {
    en: "Tap a category to expand. Ask Sir/Mum if buttons look different.",
    fil: "I-tap ang category para mag-expand. Tanungin si Sir/Mum kung iba ang buttons.",
    zh: "點分類展開。按鈕不一樣就問 Sir/Mum。",
  },
  caution: {
    en: "Caution",
    fil: "Babala",
    zh: "注意",
  },
  items: {
    en: (n: number) => (n === 1 ? "1 item" : `${n} items`),
    fil: (n: number) => (n === 1 ? "1 item" : `${n} items`),
    zh: (n: number) => `${n} 項`,
  },
};

const TOOLS_OPEN_KEY = "tools-open-categories";

function loadOpenToolCategories(fallback: string[]): string[] {
  try {
    const raw = localStorage.getItem(TOOLS_OPEN_KEY);
    if (!raw) return fallback;
    const parsed = JSON.parse(raw) as string[];
    return Array.isArray(parsed) ? parsed : fallback;
  } catch {
    return fallback;
  }
}

function ToolsChevron({ open }: { open: boolean }) {
  return (
    <span
      aria-hidden
      className={`inline-block text-stone-400 transition-transform ${open ? "rotate-180" : ""}`}
    >
      ▾
    </span>
  );
}

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
  const byCategory = APPLIANCE_CATEGORY_ORDER.map((category) => ({
    category,
    items: appliances
      .filter((a) => applianceCategory(a.kind) === category)
      .sort((a, b) => a.priority - b.priority),
  })).filter((g) => g.items.length > 0);

  const defaultOpen = byCategory[0] ? [byCategory[0].category] : [];
  const [openIds, setOpenIds] = useState<string[]>(() =>
    typeof window === "undefined"
      ? defaultOpen
      : loadOpenToolCategories(defaultOpen)
  );

  const onToggle = (id: string) => {
    setOpenIds((prev) => {
      const next = prev.includes(id)
        ? prev.filter((x) => x !== id)
        : [...prev, id];
      try {
        localStorage.setItem(TOOLS_OPEN_KEY, JSON.stringify(next));
      } catch {
        /* ignore */
      }
      return next;
    });
  };

  return (
    <div className="space-y-3">
      <div className="rounded-xl bg-stone-100 px-3 py-2.5 ring-1 ring-stone-200">
        <h2 className="text-sm font-bold text-stone-900">{toolsUi.title[lang]}</h2>
        <p className="mt-0.5 text-xs text-stone-600">{toolsUi.hint[lang]}</p>
      </div>

      <div className="space-y-2">
        {byCategory.map(({ category, items }) => {
          const meta = applianceCategoryMeta[category];
          const open = openIds.includes(category);
          return (
            <section
              key={category}
              className="overflow-hidden rounded-2xl bg-white ring-1 ring-stone-100"
            >
              <button
                type="button"
                onClick={() => onToggle(category)}
                aria-expanded={open}
                className="flex w-full items-center gap-3 px-4 py-3.5 text-left"
              >
                <span
                  className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-stone-50 text-base ring-1 ring-stone-100"
                  aria-hidden
                >
                  {meta.icon}
                </span>
                <div className="min-w-0 flex-1">
                  <div className="font-semibold text-stone-900">{meta[lang]}</div>
                  <p className="mt-0.5 text-xs text-stone-500">
                    {toolsUi.items[lang](items.length)}
                  </p>
                </div>
                <ToolsChevron open={open} />
              </button>

              {open && (
                <div className="space-y-2.5 border-t border-stone-100/80 px-3 pb-3 pt-2">
                  {items.map((item) => {
                    const warning = item.warnings
                      ? localized(item.warnings, lang)
                      : "";
                    return (
                      <article
                        key={item.id}
                        className="overflow-hidden rounded-xl bg-stone-50/80 ring-1 ring-stone-100"
                      >
                        <div className="p-3.5">
                          <div className="mb-2 flex items-center gap-2">
                            <span className="text-lg" aria-hidden>
                              {kindIcon[item.kind] || kindIcon.other}
                            </span>
                            <div className="min-w-0">
                              <h3 className="text-sm font-semibold text-stone-900">
                                {localized(item.title, lang)}
                              </h3>
                              {item.model && (
                                <p className="text-[11px] text-stone-400">
                                  {item.model}
                                </p>
                              )}
                            </div>
                          </div>
                          {item.panelButtons && item.panelButtons.length > 0 ? (
                            <AppliancePanelGuide
                              lang={lang}
                              title={item.model || localized(item.title, lang)}
                              buttons={item.panelButtons}
                            />
                          ) : item.imageUrl ? (
                            <figure className="mb-3 overflow-hidden rounded-lg ring-1 ring-stone-200">
                              {/* eslint-disable-next-line @next/next/no-img-element */}
                              <img
                                src={item.imageUrl}
                                alt={
                                  lang === "zh"
                                    ? `${localized(item.title, lang)} 面板圖`
                                    : lang === "fil"
                                      ? `Panel guide: ${localized(item.title, lang)}`
                                      : `Panel guide: ${localized(item.title, lang)}`
                                }
                                className="h-auto w-full bg-white"
                                loading="lazy"
                              />
                              <figcaption className="bg-white px-2 py-1.5 text-[11px] text-stone-500">
                                {lang === "zh"
                                  ? "面板示意（數字對應按鈕）"
                                  : lang === "fil"
                                    ? "Panel guide (numero = button)"
                                    : "Panel guide (numbers = buttons)"}
                              </figcaption>
                            </figure>
                          ) : null}
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
              )}
            </section>
          );
        })}
      </div>
    </div>
  );
}
