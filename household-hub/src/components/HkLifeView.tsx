"use client";

import { useEffect, useMemo, useState, type ReactNode } from "react";
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
    en: "Health & rest day",
    fil: "Kalusugan at rest day",
    zh: "健康與休息日",
    tone: "bg-rose-50 text-rose-800 ring-rose-100",
  },
  culture: {
    icon: "🏠",
    en: "Daily life & apps",
    fil: "Araw-araw at apps",
    zh: "日常與應用",
    tone: "bg-stone-100 text-stone-800 ring-stone-200",
  },
};

const ui = {
  title: { en: "HK Life", fil: "HK Life", zh: "香港生活" },
  subtitle: {
    en: "Tap a topic to open. Confirm contract details with Sir/Mum.",
    fil: "I-tap ang topic para buksan. Kumpirmahin ang kontrata kay Sir/Mum.",
    zh: "點選主題展開。合約細節請向 Sir/Mum 確認。",
  },
  emergency: {
    en: "Emergency phones",
    fil: "Mga emergency phone",
    zh: "緊急電話",
  },
  checklist: {
    en: "Settling checklist",
    fil: "Settling checklist",
    zh: "安頓清單",
  },
  checklistHint: {
    en: "Saved on this phone only.",
    fil: "Sa phone na ito lang naka-save.",
    zh: "只保存在此手機。",
  },
  doneOf: {
    en: (d: number, t: number) => `${d}/${t} done`,
    fil: (d: number, t: number) => `${d}/${t} tapos`,
    zh: (d: number, t: number) => `已完成 ${d}/${t}`,
  },
  topics: { en: "Topics", fil: "Mga topic", zh: "主題" },
  tips: {
    en: (n: number) => `${n} tips`,
    fil: (n: number) => `${n} tip`,
    zh: (n: number) => `${n} 則`,
  },
  kwunTong: { en: "Kwun Tong", fil: "Kwun Tong", zh: "觀塘" },
  hkWide: { en: "All HK", fil: "Buong HK", zh: "全港" },
  source: { en: "Source", fil: "Source", zh: "來源" },
  noPhone: {
    en: "Add in Admin",
    fil: "Ilagay sa Admin",
    zh: "請在 Admin 填寫",
  },
};

const STORAGE_KEY = "hk-life-checklist-done";
const OPEN_SECTIONS_KEY = "hk-life-open-sections";

function loadLocalDone(): Record<string, boolean> {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return {};
    return JSON.parse(raw) as Record<string, boolean>;
  } catch {
    return {};
  }
}

function loadOpenSections(): string[] {
  try {
    const raw = localStorage.getItem(OPEN_SECTIONS_KEY);
    if (!raw) return ["emergency-phones"];
    return JSON.parse(raw) as string[];
  } catch {
    return ["emergency-phones"];
  }
}

function Chevron({ open }: { open: boolean }) {
  return (
    <span
      aria-hidden
      className={`inline-block text-stone-400 transition-transform ${open ? "rotate-180" : ""}`}
    >
      ▾
    </span>
  );
}

function Accordion({
  id,
  open,
  onToggle,
  title,
  subtitle,
  tone,
  children,
}: {
  id: string;
  open: boolean;
  onToggle: (id: string) => void;
  title: ReactNode;
  subtitle?: string;
  tone?: string;
  children: ReactNode;
}) {
  return (
    <section
      className={`overflow-hidden rounded-2xl ring-1 ${tone ?? "bg-white ring-stone-100"}`}
    >
      <button
        type="button"
        onClick={() => onToggle(id)}
        aria-expanded={open}
        className="flex w-full items-center gap-3 px-4 py-3.5 text-left"
      >
        <div className="min-w-0 flex-1">
          <div className="font-semibold text-stone-900">{title}</div>
          {subtitle && (
            <p className="mt-0.5 text-xs text-stone-500">{subtitle}</p>
          )}
        </div>
        <Chevron open={open} />
      </button>
      {open && <div className="border-t border-stone-100/80 px-3 pb-3 pt-1">{children}</div>}
    </section>
  );
}

function GuideRow({ guide }: { guide: HkLifeGuide }) {
  const { lang } = useLanguage();
  const [open, setOpen] = useState(false);
  return (
    <div className="rounded-xl bg-white/80 ring-1 ring-stone-100">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        className="flex w-full items-start gap-2 px-3 py-2.5 text-left"
      >
        <div className="min-w-0 flex-1">
          <p className="text-sm font-semibold text-stone-900">
            {localized(guide.title, lang)}
          </p>
          {!open && (
            <p className="mt-0.5 text-[11px] text-stone-400">
              {guide.area === "kwun-tong" ? ui.kwunTong[lang] : ui.hkWide[lang]}
            </p>
          )}
        </div>
        <Chevron open={open} />
      </button>
      {open && (
        <div className="space-y-2 border-t border-stone-100 px-3 py-2.5">
          <p className="text-[11px] text-stone-400">
            {guide.area === "kwun-tong" ? ui.kwunTong[lang] : ui.hkWide[lang]}
          </p>
          <p className="text-sm leading-relaxed text-stone-700 whitespace-pre-line">
            {localized(guide.body, lang)}
          </p>
          {guide.sourceUrl && (
            <a
              href={guide.sourceUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-block text-xs font-medium text-teal-700 underline"
            >
              {ui.source[lang]}
            </a>
          )}
        </div>
      )}
    </div>
  );
}

function EmergencyPhones({ contacts }: { contacts: EmergencyContact[] }) {
  const { lang } = useLanguage();
  if (!contacts.length) return null;
  return (
    <div className="overflow-hidden rounded-xl bg-white/70 ring-1 ring-red-100">
      {contacts.map((c) => {
        const phone = c.phone?.trim();
        return (
          <div
            key={c.id}
            className="flex items-center justify-between gap-3 border-b border-red-100/70 px-3 py-2.5 last:border-0"
          >
            <div className="min-w-0">
              <p className="text-sm font-semibold text-stone-900">
                {localized(c.name, lang)}
              </p>
              {c.note && (
                <p className="text-[11px] text-stone-500">
                  {localized(c.note, lang)}
                </p>
              )}
            </div>
            {phone ? (
              <a
                href={`tel:${phone.replace(/\s+/g, "")}`}
                className="shrink-0 rounded-lg bg-red-600 px-2.5 py-1.5 text-xs font-bold text-white"
              >
                {phone}
              </a>
            ) : (
              <span className="shrink-0 text-[11px] text-stone-400">
                {ui.noPhone[lang]}
              </span>
            )}
          </div>
        );
      })}
    </div>
  );
}

function ChecklistRows({
  items,
  doneMap,
  onToggle,
}: {
  items: SettlingCheckItem[];
  doneMap: Record<string, boolean>;
  onToggle: (id: string) => void;
}) {
  const { lang } = useLanguage();
  return (
    <ul className="space-y-1.5">
      {items.map((item) => {
        const done = doneMap[item.id] ?? item.done;
        return (
          <li key={item.id}>
            <button
              type="button"
              onClick={() => onToggle(item.id)}
              className={`flex w-full items-start gap-2.5 rounded-xl px-3 py-2.5 text-left ring-1 transition ${
                done ? "bg-teal-50/80 ring-teal-100" : "bg-white ring-stone-100"
              }`}
            >
              <span
                className={`mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded border text-[10px] ${
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
  );
}

export function HkLifeView({ content }: { content: AppContent }) {
  const { lang } = useLanguage();
  const guides = content.hkLifeGuides ?? [];
  const contacts = content.emergencyContacts ?? [];
  const checklist = content.settlingChecklist ?? [];
  const [doneMap, setDoneMap] = useState<Record<string, boolean>>({});
  const [openIds, setOpenIds] = useState<string[]>(["emergency-phones"]);

  useEffect(() => {
    setDoneMap(loadLocalDone());
    setOpenIds(loadOpenSections());
  }, []);

  const onToggleSection = (id: string) => {
    setOpenIds((prev) => {
      const next = prev.includes(id)
        ? prev.filter((x) => x !== id)
        : [...prev, id];
      try {
        localStorage.setItem(OPEN_SECTIONS_KEY, JSON.stringify(next));
      } catch {
        /* ignore */
      }
      return next;
    });
  };

  const onToggleCheck = (id: string) => {
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

  const byCategory = useMemo(() => {
    const map = new Map<HkLifeCategory, HkLifeGuide[]>();
    for (const cat of CATEGORY_ORDER) map.set(cat, []);
    for (const g of [...guides].sort((a, b) => a.priority - b.priority)) {
      map.get(g.category)?.push(g);
    }
    return CATEGORY_ORDER.filter((c) => (map.get(c)?.length ?? 0) > 0).map(
      (c) => ({ category: c, items: map.get(c)! })
    );
  }, [guides]);

  const checklistDone = checklist.filter(
    (i) => doneMap[i.id] ?? i.done
  ).length;

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-xl font-bold text-stone-900">{ui.title[lang]}</h2>
        {content.homeArea && (
          <p className="mt-0.5 text-sm font-medium text-teal-800">
            {localized(content.homeArea, lang)}
          </p>
        )}
        <p className="mt-1 text-sm text-stone-600">{ui.subtitle[lang]}</p>
      </div>

      {contacts.length > 0 && (
        <Accordion
          id="emergency-phones"
          open={openIds.includes("emergency-phones")}
          onToggle={onToggleSection}
          title={
            <span className="inline-flex items-center gap-2">
              <span aria-hidden>🆘</span>
              {ui.emergency[lang]}
            </span>
          }
          subtitle={`${contacts.length} ${lang === "zh" ? "個號碼" : lang === "fil" ? "numero" : "numbers"}`}
          tone="bg-gradient-to-br from-red-50 to-amber-50 ring-red-100"
        >
          <EmergencyPhones contacts={contacts} />
        </Accordion>
      )}

      {checklist.length > 0 && (
        <Accordion
          id="checklist"
          open={openIds.includes("checklist")}
          onToggle={onToggleSection}
          title={
            <span className="inline-flex items-center gap-2">
              <span aria-hidden>✓</span>
              {ui.checklist[lang]}
            </span>
          }
          subtitle={`${ui.doneOf[lang](checklistDone, checklist.length)} · ${ui.checklistHint[lang]}`}
          tone="bg-teal-50/60 ring-teal-100"
        >
          <ChecklistRows
            items={checklist}
            doneMap={doneMap}
            onToggle={onToggleCheck}
          />
        </Accordion>
      )}

      <div className="space-y-2">
        <h3 className="px-0.5 text-xs font-bold uppercase tracking-wide text-stone-500">
          {ui.topics[lang]}
        </h3>
        {byCategory.map(({ category, items }) => {
          const meta = categoryMeta[category];
          const sectionId = `cat-${category}`;
          return (
            <Accordion
              key={category}
              id={sectionId}
              open={openIds.includes(sectionId)}
              onToggle={onToggleSection}
              title={
                <span className="inline-flex items-center gap-2">
                  <span
                    className={`inline-flex h-7 w-7 items-center justify-center rounded-lg text-sm ring-1 ${meta.tone}`}
                    aria-hidden
                  >
                    {meta.icon}
                  </span>
                  {meta[lang]}
                </span>
              }
              subtitle={ui.tips[lang](items.length)}
              tone="bg-white ring-stone-100"
            >
              <div className="space-y-1.5">
                {items.map((g) => (
                  <GuideRow key={g.id} guide={g} />
                ))}
              </div>
            </Accordion>
          );
        })}
      </div>
    </div>
  );
}
