"use client";

import { useEffect, useMemo, useState, type ReactNode } from "react";
import { useLanguage } from "@/contexts/LanguageContext";
import { localized } from "@/lib/localized-text";
import type {
  AppContent,
  EmergencyContact,
  HkLifeCategory,
  HkLifeGuide,
  PlaceMapLink,
  SalaryPaymentItem,
  SettlingCheckItem,
  StatutoryHolidayItem,
} from "@/lib/types";
import { hongKongDateLabel, isHolidayEntitled } from "@/lib/life-trackers";

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
    en: "Daily life",
    fil: "Araw-araw",
    zh: "日常生活",
    tone: "bg-stone-100 text-stone-800 ring-stone-200",
  },
};

const ui = {
  title: { en: "HK Life", fil: "HK Life", zh: "香港生活" },
  subtitle: {
    en: "Tips for living in Hong Kong. Confirm with Sir/Mum if unsure.",
    fil: "Mga tip para sa pamumuhay sa Hong Kong. Tanungin si Sir/Mum kung unsure.",
    zh: "在香港生活的貼士。有疑問向 Sir/Mum 確認。",
  },
  emergency: {
    en: "Emergency phones",
    fil: "Mga emergency phone",
    zh: "緊急電話",
  },
  checklist: {
    en: "First weeks checklist",
    fil: "Unang linggo checklist",
    zh: "初到安頓清單",
  },
  checklistHint: {
    en: "Saved on this phone only.",
    fil: "Sa phone na ito lang naka-save.",
    zh: "只保存在此手機。",
  },
  records: {
    en: "My records",
    fil: "Mga record ko",
    zh: "我的記錄",
  },
  recordsHint: {
    en: "Holidays & salary — not living tips. Tap to confirm.",
    fil: "Holidays at sahod — hindi living tips. I-tap para kumpirmahin.",
    zh: "假日與薪金 — 不是生活貼士。點選確認。",
  },
  holidays: {
    en: "Statutory holidays 2026",
    fil: "Statutory holidays 2026",
    zh: "2026 法定假日",
  },
  holidaysHint: {
    en: "Entitled from 27 Oct 2026. Tap to confirm taken.",
    fil: "Entitled mula 27 Okt 2026. I-tap para kumpirmahing nakuha.",
    zh: "由 2026年10月27日起享有。點選確認已放。",
  },
  taken: {
    en: "Taken",
    fil: "Nakuha",
    zh: "已放",
  },
  notTaken: {
    en: "Not yet",
    fil: "Wala pa",
    zh: "未放",
  },
  notEntitled: {
    en: "Not entitled yet",
    fil: "Hindi pa entitled",
    zh: "尚未享有",
  },
  entitledOf: {
    en: (d: number, t: number) => `${d}/${t} entitled taken`,
    fil: (d: number, t: number) => `${d}/${t} entitled nakuha`,
    zh: (d: number, t: number) => `已放 ${d}/${t}（可享有）`,
  },
  salary: {
    en: "Salary receipt 2026",
    fil: "Resibo ng sahod 2026",
    zh: "2026 薪金簽收",
  },
  salaryHint: {
    en: "From Aug 2026. Tap to confirm you received salary.",
    fil: "Mula Ago 2026. I-tap para kumpirmahing natanggap ang sahod.",
    zh: "由 2026 年 8 月起。點選確認已收薪。",
  },
  received: {
    en: "Received",
    fil: "Natanggap",
    zh: "已收",
  },
  notReceived: {
    en: "Not yet",
    fil: "Wala pa",
    zh: "未收",
  },
  doneOf: {
    en: (d: number, t: number) => `${d}/${t} done`,
    fil: (d: number, t: number) => `${d}/${t} tapos`,
    zh: (d: number, t: number) => `已完成 ${d}/${t}`,
  },
  topics: { en: "Living tips", fil: "Living tips", zh: "生活貼士" },
  places: {
    en: "Maps — key places",
    fil: "Maps — mahahalagang lugar",
    zh: "地圖 — 常用地點",
  },
  placesHint: {
    en: "Tap to open Google Maps",
    fil: "I-tap para buksan ang Google Maps",
    zh: "點選開啟 Google 地圖",
  },
  openMaps: {
    en: "Open Maps",
    fil: "Buksan ang Maps",
    zh: "開啟地圖",
  },
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

function PlacesMaps({ places }: { places: PlaceMapLink[] }) {
  const { lang } = useLanguage();
  const sorted = [...places]
    .filter((p) => p.mapsUrl?.trim())
    .sort((a, b) => a.priority - b.priority);
  if (!sorted.length) return null;
  return (
    <ul className="space-y-1.5">
      {sorted.map((place) => (
        <li key={place.id}>
          <a
            href={place.mapsUrl.trim()}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-3 rounded-xl bg-white px-3 py-2.5 ring-1 ring-teal-100 transition active:bg-teal-50"
          >
            <span
              className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-teal-100 text-base"
              aria-hidden
            >
              📍
            </span>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-semibold text-stone-900">
                {localized(place.name, lang)}
              </p>
              {place.note ? (
                <p className="mt-0.5 text-[11px] text-stone-500">
                  {localized(place.note, lang)}
                </p>
              ) : null}
            </div>
            <span className="shrink-0 text-[11px] font-bold text-teal-700">
              {ui.openMaps[lang]} →
            </span>
          </a>
        </li>
      ))}
    </ul>
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

function ConfirmMark({ on }: { on: boolean }) {
  return (
    <span
      className={`mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded border text-[10px] ${
        on
          ? "border-teal-600 bg-teal-600 text-white"
          : "border-stone-300 bg-white text-transparent"
      }`}
      aria-hidden
    >
      ✓
    </span>
  );
}

function HolidayRows({
  items,
  onToggle,
  busyId,
}: {
  items: StatutoryHolidayItem[];
  onToggle: (id: string, next: boolean) => void;
  busyId: string | null;
}) {
  const { lang } = useLanguage();
  return (
    <ul className="space-y-1.5">
      {items.map((item) => {
        const entitled = isHolidayEntitled(item);
        const taken = item.taken;
        const busy = busyId === item.id;
        return (
          <li key={item.id}>
            <button
              type="button"
              disabled={busy || !entitled}
              onClick={() => {
                if (!entitled) return;
                onToggle(item.id, !taken);
              }}
              className={`flex w-full items-start gap-2.5 rounded-xl px-3 py-2.5 text-left ring-1 transition disabled:opacity-70 ${
                !entitled
                  ? "bg-stone-100 ring-stone-200"
                  : taken
                    ? "bg-teal-50/80 ring-teal-100"
                    : "bg-white ring-stone-100"
              }`}
            >
              <ConfirmMark on={entitled && taken} />
              <span className="min-w-0 flex-1">
                <span
                  className={`block text-sm font-medium ${
                    !entitled
                      ? "text-stone-400"
                      : taken
                        ? "text-stone-500 line-through"
                        : "text-stone-900"
                  }`}
                >
                  {localized(item.name, lang)}
                </span>
                <span className="mt-0.5 block text-[11px] text-stone-500">
                  {hongKongDateLabel(item.date, lang)}
                  {item.altDate
                    ? ` · alt ${hongKongDateLabel(item.altDate, lang)}`
                    : ""}
                  {" · "}
                  {!entitled
                    ? ui.notEntitled[lang]
                    : taken
                      ? ui.taken[lang]
                      : ui.notTaken[lang]}
                </span>
                {item.notes && (
                  <span
                    className={`mt-1 block text-[11px] leading-snug ${
                      entitled ? "text-amber-800/90" : "text-stone-400"
                    }`}
                  >
                    {localized(item.notes, lang)}
                  </span>
                )}
              </span>
            </button>
          </li>
        );
      })}
    </ul>
  );
}

function SalaryRows({
  items,
  onToggle,
  busyId,
}: {
  items: SalaryPaymentItem[];
  onToggle: (id: string, next: boolean) => void;
  busyId: string | null;
}) {
  const { lang } = useLanguage();
  return (
    <ul className="space-y-1.5">
      {items.map((item) => {
        const received = item.received;
        const busy = busyId === item.id;
        return (
          <li key={item.id}>
            <button
              type="button"
              disabled={busy}
              onClick={() => onToggle(item.id, !received)}
              className={`flex w-full items-start gap-2.5 rounded-xl px-3 py-2.5 text-left ring-1 transition disabled:opacity-60 ${
                received
                  ? "bg-teal-50/80 ring-teal-100"
                  : "bg-white ring-stone-100"
              }`}
            >
              <ConfirmMark on={received} />
              <span className="min-w-0 flex-1">
                <span
                  className={`block text-sm font-medium ${
                    received ? "text-stone-500 line-through" : "text-stone-900"
                  }`}
                >
                  {localized(item.label, lang)}
                </span>
                <span className="mt-0.5 block text-[11px] text-stone-500">
                  HK${item.amountHkd.toLocaleString("en-HK")}
                  {item.payDate
                    ? ` · ${hongKongDateLabel(item.payDate, lang)}`
                    : ""}
                  {" · "}
                  {received ? ui.received[lang] : ui.notReceived[lang]}
                </span>
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
  const places = content.places ?? [];
  const contacts = content.emergencyContacts ?? [];
  const checklist = content.settlingChecklist ?? [];
  const [holidays, setHolidays] = useState<StatutoryHolidayItem[]>(
    () => content.statutoryHolidays ?? []
  );
  const [salaries, setSalaries] = useState<SalaryPaymentItem[]>(
    () => content.salaryPayments ?? []
  );
  const [doneMap, setDoneMap] = useState<Record<string, boolean>>({});
  const [openIds, setOpenIds] = useState<string[]>(["emergency-phones", "places-maps"]);
  const [busyId, setBusyId] = useState<string | null>(null);

  useEffect(() => {
    setDoneMap(loadLocalDone());
    setOpenIds(loadOpenSections());
  }, []);

  useEffect(() => {
    setHolidays(content.statutoryHolidays ?? []);
    setSalaries(content.salaryPayments ?? []);
  }, [content.statutoryHolidays, content.salaryPayments]);

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

  const syncTracker = async (
    kind: "holiday" | "salary",
    id: string,
    value: boolean
  ) => {
    setBusyId(id);
    try {
      const res = await fetch("/api/life-tracker", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ kind, id, value }),
      });
      if (!res.ok) throw new Error("save failed");
      const data = (await res.json()) as {
        item?: StatutoryHolidayItem | SalaryPaymentItem;
      };
      if (kind === "holiday" && data.item) {
        setHolidays((prev) =>
          prev.map((h) => (h.id === id ? (data.item as StatutoryHolidayItem) : h))
        );
      }
      if (kind === "salary" && data.item) {
        setSalaries((prev) =>
          prev.map((s) => (s.id === id ? (data.item as SalaryPaymentItem) : s))
        );
      }
    } catch {
      // revert optimistic by reloading from content prop snapshot
      if (kind === "holiday") {
        setHolidays(content.statutoryHolidays ?? []);
      } else {
        setSalaries(content.salaryPayments ?? []);
      }
    } finally {
      setBusyId(null);
    }
  };

  const onToggleHoliday = (id: string, next: boolean) => {
    setHolidays((prev) =>
      prev.map((h) => (h.id === id ? { ...h, taken: next } : h))
    );
    void syncTracker("holiday", id, next);
  };

  const onToggleSalary = (id: string, next: boolean) => {
    setSalaries((prev) =>
      prev.map((s) => (s.id === id ? { ...s, received: next } : s))
    );
    void syncTracker("salary", id, next);
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
  const holidaysTaken = holidays.filter(
    (h) => isHolidayEntitled(h) && h.taken
  ).length;
  const holidaysEntitled = holidays.filter((h) => isHolidayEntitled(h)).length;
  const salariesReceived = salaries.filter((s) => s.received).length;

  return (
    <div className="space-y-3">
      <div className="rounded-xl bg-stone-100 px-3 py-2.5 ring-1 ring-stone-200">
        <h2 className="text-sm font-bold text-stone-900">
          {ui.title[lang]}
          {content.homeArea ? (
            <span className="font-normal text-stone-500">
              {" "}
              · {localized(content.homeArea, lang)}
            </span>
          ) : null}
        </h2>
        <p className="mt-0.5 text-xs text-stone-600">{ui.subtitle[lang]}</p>
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

      {places.some((p) => p.mapsUrl?.trim()) && (
        <Accordion
          id="places-maps"
          open={openIds.includes("places-maps")}
          onToggle={onToggleSection}
          title={
            <span className="inline-flex items-center gap-2">
              <span aria-hidden>🗺️</span>
              {ui.places[lang]}
            </span>
          }
          subtitle={ui.placesHint[lang]}
          tone="bg-gradient-to-br from-teal-50 to-sky-50 ring-teal-100"
        >
          <PlacesMaps places={places} />
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

      {(holidays.length > 0 || salaries.length > 0) && (
        <div className="space-y-2 pt-1">
          <h3 className="px-0.5 text-xs font-bold uppercase tracking-wide text-stone-500">
            {ui.records[lang]}
          </h3>
          <p className="px-0.5 text-[11px] text-stone-400">{ui.recordsHint[lang]}</p>
          {holidays.length > 0 && (
            <Accordion
              id="statutory-holidays"
              open={openIds.includes("statutory-holidays")}
              onToggle={onToggleSection}
              title={
                <span className="inline-flex items-center gap-2">
                  <span aria-hidden>📅</span>
                  {ui.holidays[lang]}
                </span>
              }
              subtitle={`${ui.entitledOf[lang](holidaysTaken, holidaysEntitled)} · ${ui.holidaysHint[lang]}`}
              tone="bg-amber-50/70 ring-amber-100"
            >
              <HolidayRows
                items={holidays}
                onToggle={onToggleHoliday}
                busyId={busyId}
              />
            </Accordion>
          )}
          {salaries.length > 0 && (
            <Accordion
              id="salary-receipts"
              open={openIds.includes("salary-receipts")}
              onToggle={onToggleSection}
              title={
                <span className="inline-flex items-center gap-2">
                  <span aria-hidden>💵</span>
                  {ui.salary[lang]}
                </span>
              }
              subtitle={`${ui.doneOf[lang](salariesReceived, salaries.length)} · ${ui.salaryHint[lang]}`}
              tone="bg-emerald-50/70 ring-emerald-100"
            >
              <SalaryRows
                items={salaries}
                onToggle={onToggleSalary}
                busyId={busyId}
              />
            </Accordion>
          )}
        </div>
      )}
    </div>
  );
}
