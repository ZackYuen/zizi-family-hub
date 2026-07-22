"use client";

import { useEffect, useMemo, useState } from "react";
import { useLanguage } from "@/contexts/LanguageContext";
import { localized } from "@/lib/localized-text";
import type {
  AppContent,
  EmergencyContact,
  HkLifeCategory,
  HkLifeGuide,
  SettlingCheckItem,
} from "@/lib/types";

const CATEGORY_ORDER: HkLifeCategory[] = [
  "emergency",
  "weather",
  "rights",
  "money",
  "transport",
  "shopping",
  "health",
  "culture",
];

const categoryMeta: Record<
  HkLifeCategory,
  { icon: string; en: string; fil: string; zh: string; tone: string }
> = {
  emergency: {
    icon: "🆘",
    en: "Emergency",
    fil: "Emergency",
    zh: "緊急",
    tone: "bg-red-50 text-red-800 ring-red-100",
  },
  weather: {
    icon: "🌧️",
    en: "Weather",
    fil: "Panahon",
    zh: "天氣",
    tone: "bg-sky-50 text-sky-800 ring-sky-100",
  },
  rights: {
    icon: "📜",
    en: "Rights",
    fil: "Karapatan",
    zh: "權益",
    tone: "bg-amber-50 text-amber-900 ring-amber-100",
  },
  money: {
    icon: "💳",
    en: "Money",
    fil: "Pera",
    zh: "金錢",
    tone: "bg-emerald-50 text-emerald-800 ring-emerald-100",
  },
  transport: {
    icon: "🚶",
    en: "Transport",
    fil: "Transport",
    zh: "交通",
    tone: "bg-teal-50 text-teal-800 ring-teal-100",
  },
  shopping: {
    icon: "🛒",
    en: "Shopping",
    fil: "Pamimili",
    zh: "購物",
    tone: "bg-orange-50 text-orange-800 ring-orange-100",
  },
  health: {
    icon: "🌡️",
    en: "Health",
    fil: "Kalusugan",
    zh: "健康",
    tone: "bg-rose-50 text-rose-800 ring-rose-100",
  },
  culture: {
    icon: "🏠",
    en: "Daily life",
    fil: "Araw-araw",
    zh: "日常",
    tone: "bg-stone-100 text-stone-800 ring-stone-200",
  },
};

const ui = {
  title: { en: "HK Life", fil: "HK Life", zh: "香港生活" },
  subtitle: {
    en: "Tips for settling in Kwun Tong — confirm contract details with Sir/Mum.",
    fil: "Mga tip para sa Kwun Tong — kumpirmahin ang kontrata kay Sir/Mum.",
    zh: "觀塘安頓貼士 — 合約細節請向 Sir/Mum 確認。",
  },
  emergency: { en: "Emergency phones", fil: "Emergency phones", zh: "緊急電話" },
  checklist: {
    en: "Settling checklist",
    fil: "Settling checklist",
    zh: "安頓清單",
  },
  checklistHint: {
    en: "Tap to mark done on this phone (saved here only).",
    fil: "I-tap para i-mark na tapos (sa phone na ito lang).",
    zh: "點一下標記完成（只保存在此手機）。",
  },
  guides: { en: "Guides", fil: "Mga gabay", zh: "指南" },
  kwunTong: { en: "Kwun Tong", fil: "Kwun Tong", zh: "觀塘" },
  hkWide: { en: "All HK", fil: "Buong HK", zh: "全港" },
  source: { en: "Source", fil: "Source", zh: "來源" },
  noPhone: {
    en: "Add number in Admin",
    fil: "Ilagay ang numero sa Admin",
    zh: "請在 Admin 填寫號碼",
  },
};

const STORAGE_KEY = "hk-life-checklist-done";

function loadLocalDone(): Record<string, boolean> {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return {};
    return JSON.parse(raw) as Record<string, boolean>;
  } catch {
    return {};
  }
}

function GuideCard({ guide }: { guide: HkLifeGuide }) {
  const { lang } = useLanguage();
  const meta = categoryMeta[guide.category];
  return (
    <article className="rounded-2xl bg-white p-4 shadow-sm ring-1 ring-stone-100">
      <div className="mb-2 flex flex-wrap items-center gap-2">
        <span
          className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-semibold ring-1 ${meta.tone}`}
        >
          <span aria-hidden>{meta.icon}</span>
          {meta[lang]}
        </span>
        <span className="text-[11px] text-stone-400">
          {guide.area === "kwun-tong" ? ui.kwunTong[lang] : ui.hkWide[lang]}
        </span>
      </div>
      <h3 className="text-base font-semibold text-stone-900">
        {localized(guide.title, lang)}
      </h3>
      <p className="mt-2 text-sm leading-relaxed text-stone-700 whitespace-pre-line">
        {localized(guide.body, lang)}
      </p>
      {guide.sourceUrl && (
        <a
          href={guide.sourceUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="mt-2 inline-block text-xs font-medium text-teal-700 underline"
        >
          {ui.source[lang]}
        </a>
      )}
    </article>
  );
}

function EmergencyBlock({ contacts }: { contacts: EmergencyContact[] }) {
  const { lang } = useLanguage();
  if (!contacts.length) return null;
  return (
    <section className="space-y-2">
      <h2 className="text-sm font-bold uppercase tracking-wide text-red-800">
        {ui.emergency[lang]}
      </h2>
      <div className="overflow-hidden rounded-2xl bg-gradient-to-br from-red-50 to-amber-50 ring-1 ring-red-100">
        {contacts.map((c) => {
          const phone = c.phone?.trim();
          return (
            <div
              key={c.id}
              className="flex items-center justify-between gap-3 border-b border-red-100/80 px-4 py-3 last:border-0"
            >
              <div className="min-w-0">
                <p className="font-semibold text-stone-900">
                  {localized(c.name, lang)}
                </p>
                {c.note && (
                  <p className="text-xs text-stone-600">{localized(c.note, lang)}</p>
                )}
              </div>
              {phone ? (
                <a
                  href={`tel:${phone.replace(/\s+/g, "")}`}
                  className="shrink-0 rounded-xl bg-red-600 px-3 py-2 text-sm font-bold text-white"
                >
                  {phone}
                </a>
              ) : (
                <span className="shrink-0 text-xs text-stone-400">{ui.noPhone[lang]}</span>
              )}
            </div>
          );
        })}
      </div>
    </section>
  );
}

function ChecklistBlock({
  items,
  doneMap,
  onToggle,
}: {
  items: SettlingCheckItem[];
  doneMap: Record<string, boolean>;
  onToggle: (id: string) => void;
}) {
  const { lang } = useLanguage();
  if (!items.length) return null;
  return (
    <section className="space-y-2">
      <div>
        <h2 className="text-sm font-bold uppercase tracking-wide text-teal-800">
          {ui.checklist[lang]}
        </h2>
        <p className="text-xs text-stone-500">{ui.checklistHint[lang]}</p>
      </div>
      <ul className="space-y-2">
        {items.map((item) => {
          const done = doneMap[item.id] ?? item.done;
          return (
            <li key={item.id}>
              <button
                type="button"
                onClick={() => onToggle(item.id)}
                className={`flex w-full items-start gap-3 rounded-2xl px-4 py-3 text-left ring-1 transition ${
                  done
                    ? "bg-teal-50 ring-teal-100"
                    : "bg-white ring-stone-100"
                }`}
              >
                <span
                  className={`mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded border text-xs ${
                    done
                      ? "border-teal-600 bg-teal-600 text-white"
                      : "border-stone-300 bg-white text-transparent"
                  }`}
                  aria-hidden
                >
                  ✓
                </span>
                <span
                  className={`text-sm ${done ? "text-stone-500 line-through" : "text-stone-800"}`}
                >
                  {localized(item.title, lang)}
                </span>
              </button>
            </li>
          );
        })}
      </ul>
    </section>
  );
}

export function HkLifeView({ content }: { content: AppContent }) {
  const { lang } = useLanguage();
  const guides = content.hkLifeGuides ?? [];
  const contacts = content.emergencyContacts ?? [];
  const checklist = content.settlingChecklist ?? [];
  const [filter, setFilter] = useState<HkLifeCategory | "all">("all");
  const [doneMap, setDoneMap] = useState<Record<string, boolean>>({});

  useEffect(() => {
    setDoneMap(loadLocalDone());
  }, []);

  const onToggle = (id: string) => {
    setDoneMap((prev) => {
      const base = content.settlingChecklist?.find((i) => i.id === id)?.done ?? false;
      const current = prev[id] ?? base;
      const next = { ...prev, [id]: !current };
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
      } catch {
        /* ignore */
      }
      return next;
    });
  };

  const sorted = useMemo(
    () => [...guides].sort((a, b) => a.priority - b.priority),
    [guides]
  );

  const filtered =
    filter === "all" ? sorted : sorted.filter((g) => g.category === filter);

  const usedCategories = CATEGORY_ORDER.filter((c) =>
    guides.some((g) => g.category === c)
  );

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold text-stone-900">{ui.title[lang]}</h2>
        {content.homeArea && (
          <p className="mt-0.5 text-sm font-medium text-teal-800">
            {localized(content.homeArea, lang)}
          </p>
        )}
        <p className="mt-1 text-sm text-stone-600">{ui.subtitle[lang]}</p>
      </div>

      <EmergencyBlock contacts={contacts} />
      <ChecklistBlock items={checklist} doneMap={doneMap} onToggle={onToggle} />

      <section className="space-y-3">
        <h2 className="text-sm font-bold uppercase tracking-wide text-stone-700">
          {ui.guides[lang]}
        </h2>
        <div className="flex gap-2 overflow-x-auto pb-1">
          <button
            type="button"
            onClick={() => setFilter("all")}
            className={`shrink-0 rounded-full px-3 py-1 text-xs font-semibold ${
              filter === "all"
                ? "bg-teal-700 text-white"
                : "bg-white text-stone-600 ring-1 ring-stone-200"
            }`}
          >
            {lang === "fil" ? "Lahat" : lang === "zh" ? "全部" : "All"}
          </button>
          {usedCategories.map((c) => {
            const meta = categoryMeta[c];
            return (
              <button
                key={c}
                type="button"
                onClick={() => setFilter(c)}
                className={`shrink-0 rounded-full px-3 py-1 text-xs font-semibold ${
                  filter === c
                    ? "bg-teal-700 text-white"
                    : "bg-white text-stone-600 ring-1 ring-stone-200"
                }`}
              >
                {meta.icon} {meta[lang]}
              </button>
            );
          })}
        </div>
        <div className="space-y-3">
          {filtered.map((g) => (
            <GuideCard key={g.id} guide={g} />
          ))}
        </div>
      </section>
    </div>
  );
}
