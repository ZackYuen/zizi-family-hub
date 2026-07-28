"use client";

import type { AppContent, HkLifeCategory, Lang } from "@/lib/types";
import { adminT } from "@/lib/admin-i18n";
import { TrilingualFieldEditor } from "./TrilingualFieldEditor";
import { emptyBilingual } from "@/lib/localized-text";
import {
  buildSalaryPayments2026,
  buildStatutoryHolidays2026,
} from "@/lib/life-trackers";

const CATEGORIES: HkLifeCategory[] = [
  "emergency",
  "rights",
  "weather",
  "money",
  "transport",
  "shopping",
  "health",
  "culture",
];

const WEATHER_LEVELS = ["none", "t3", "t8", "black-rain", "other"] as const;

interface Props {
  content: AppContent;
  setContent: (c: AppContent) => void;
  lang: Lang;
  saving: boolean;
  onSave: () => void;
}

export function HkLifeAdmin({ content, setContent, lang, saving, onSave }: Props) {
  const guides = content.hkLifeGuides ?? [];
  const checklist = content.settlingChecklist ?? [];
  const holidays = content.statutoryHolidays ?? [];
  const salaries = content.salaryPayments ?? [];
  const contacts = content.emergencyContacts ?? [];
  const weather = content.hkWeather ?? {
    alertActive: false,
    level: "none" as const,
    note: emptyBilingual(),
  };

  const patch = (partial: Partial<AppContent>) => {
    setContent({ ...content, ...partial });
  };

  const updateGuide = (index: number, next: (typeof guides)[0]) => {
    const list = [...guides];
    list[index] = next;
    patch({ hkLifeGuides: list });
  };

  const addGuide = () => {
    patch({
      hkLifeGuides: [
        ...guides,
        {
          id: `life-${Date.now()}`,
          category: "culture",
          priority: guides.length + 1,
          area: "kwun-tong",
          title: { en: "New tip", fil: "Bagong tip", zh: "新貼士" },
          body: emptyBilingual(),
          lastReviewed: new Date().toISOString().slice(0, 10),
        },
      ],
    });
  };

  const deleteGuide = (index: number) => {
    const list = [...guides];
    list.splice(index, 1);
    patch({ hkLifeGuides: list });
  };

  const updateContact = (index: number, next: (typeof contacts)[0]) => {
    const list = [...contacts];
    list[index] = next;
    patch({ emergencyContacts: list });
  };

  const addContact = () => {
    patch({
      emergencyContacts: [
        ...contacts,
        {
          id: `ec-${Date.now()}`,
          name: { en: "New contact", fil: "Bagong contact", zh: "新聯絡" },
          phone: "",
          note: emptyBilingual(),
        },
      ],
    });
  };

  const deleteContact = (index: number) => {
    const list = [...contacts];
    list.splice(index, 1);
    patch({ emergencyContacts: list });
  };

  const updateCheck = (index: number, next: (typeof checklist)[0]) => {
    const list = [...checklist];
    list[index] = next;
    patch({ settlingChecklist: list });
  };

  const addCheck = () => {
    patch({
      settlingChecklist: [
        ...checklist,
        {
          id: `settle-${Date.now()}`,
          title: { en: "New item", fil: "Bagong item", zh: "新項目" },
          done: false,
        },
      ],
    });
  };

  const deleteCheck = (index: number) => {
    const list = [...checklist];
    list.splice(index, 1);
    patch({ settlingChecklist: list });
  };

  const updateHoliday = (index: number, next: (typeof holidays)[0]) => {
    const list = [...holidays];
    list[index] = next;
    patch({ statutoryHolidays: list });
  };

  const deleteHoliday = (index: number) => {
    const list = [...holidays];
    list.splice(index, 1);
    patch({ statutoryHolidays: list });
  };

  const updateSalary = (index: number, next: (typeof salaries)[0]) => {
    const list = [...salaries];
    list[index] = next;
    patch({ salaryPayments: list });
  };

  const deleteSalary = (index: number) => {
    const list = [...salaries];
    list.splice(index, 1);
    patch({ salaryPayments: list });
  };

  return (
    <div className="space-y-6">
      <div className="rounded-xl bg-amber-50 px-3 py-2 text-xs text-amber-950 ring-1 ring-amber-100">
        {adminT("hkLifeHint", lang)}
      </div>

      {/* Weather alert */}
      <section className="rounded-xl bg-white p-4 ring-1 ring-stone-200">
        <h2 className="mb-3 text-sm font-bold text-stone-800">
          {adminT("weatherAlert", lang)}
        </h2>
        <label className="mb-3 flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            checked={weather.alertActive}
            onChange={(e) =>
              patch({
                hkWeather: { ...weather, alertActive: e.target.checked },
              })
            }
          />
          {adminT("weatherAlertOn", lang)}
        </label>
        <label className="mb-1 block text-xs font-medium text-stone-500">
          {adminT("weatherLevel", lang)}
        </label>
        <select
          value={weather.level}
          onChange={(e) =>
            patch({
              hkWeather: {
                ...weather,
                level: e.target.value as (typeof WEATHER_LEVELS)[number],
              },
            })
          }
          className="mb-3 w-full rounded-lg border border-stone-200 px-3 py-2 text-sm"
        >
          {WEATHER_LEVELS.map((l) => (
            <option key={l} value={l}>
              {l}
            </option>
          ))}
        </select>
        <p className="mb-1 text-xs font-medium text-stone-500">
          {adminT("weatherNote", lang)}
        </p>
        <TrilingualFieldEditor
          value={weather.note}
          onChange={(note) => patch({ hkWeather: { ...weather, note } })}
          multiline
        />
      </section>

      {/* Home area */}
      <section className="rounded-xl bg-white p-4 ring-1 ring-stone-200">
        <h2 className="mb-2 text-sm font-bold text-stone-800">
          {adminT("homeArea", lang)}
        </h2>
        <TrilingualFieldEditor
          value={content.homeArea ?? emptyBilingual()}
          onChange={(homeArea) => patch({ homeArea })}
        />
      </section>

      {/* Emergency contacts */}
      <section className="space-y-3">
        <h2 className="text-sm font-bold text-stone-800">
          {adminT("emergencyContacts", lang)}
        </h2>
        {contacts.map((c, i) => (
          <div key={c.id} className="rounded-xl bg-white p-4 ring-1 ring-stone-200">
            <div className="mb-2 flex justify-between">
              <span className="text-xs text-stone-400">{c.id}</span>
              <button
                type="button"
                onClick={() => deleteContact(i)}
                className="text-xs text-red-500"
              >
                {adminT("delete", lang)}
              </button>
            </div>
            <TrilingualFieldEditor
              value={c.name}
              onChange={(name) => updateContact(i, { ...c, name })}
            />
            <label className="mb-1 mt-2 block text-xs font-medium text-stone-500">
              {adminT("phone", lang)}
            </label>
            <input
              value={c.phone}
              onChange={(e) => updateContact(i, { ...c, phone: e.target.value })}
              placeholder="e.g. 999"
              className="mb-2 w-full rounded-lg border border-stone-200 px-3 py-2 text-sm"
            />
            <TrilingualFieldEditor
              value={c.note ?? emptyBilingual()}
              onChange={(note) => updateContact(i, { ...c, note })}
              multiline
            />
          </div>
        ))}
        <button
          type="button"
          onClick={addContact}
          className="rounded-xl bg-white px-4 py-2 text-sm font-medium text-teal-700 ring-1 ring-teal-200"
        >
          {adminT("addContact", lang)}
        </button>
      </section>

      {/* Checklist */}
      <section className="space-y-3">
        <h2 className="text-sm font-bold text-stone-800">
          {adminT("settlingChecklist", lang)}
        </h2>
        {checklist.map((item, i) => (
          <div key={item.id} className="rounded-xl bg-white p-4 ring-1 ring-stone-200">
            <div className="mb-2 flex items-center justify-between">
              <label className="flex items-center gap-2 text-xs text-stone-600">
                <input
                  type="checkbox"
                  checked={item.done}
                  onChange={(e) =>
                    updateCheck(i, { ...item, done: e.target.checked })
                  }
                />
                {adminT("markDone", lang)}
              </label>
              <button
                type="button"
                onClick={() => deleteCheck(i)}
                className="text-xs text-red-500"
              >
                {adminT("delete", lang)}
              </button>
            </div>
            <TrilingualFieldEditor
              value={item.title}
              onChange={(title) => updateCheck(i, { ...item, title })}
            />
          </div>
        ))}
        <button
          type="button"
          onClick={addCheck}
          className="rounded-xl bg-white px-4 py-2 text-sm font-medium text-teal-700 ring-1 ring-teal-200"
        >
          {adminT("addChecklistItem", lang)}
        </button>
      </section>

      {/* Statutory holidays */}
      <section className="space-y-3">
        <h2 className="text-sm font-bold text-stone-800">
          {adminT("statutoryHolidays", lang)}
        </h2>
        <p className="text-xs text-stone-500">{adminT("statutoryHolidaysHint", lang)}</p>
        {holidays.map((h, i) => (
          <div key={h.id} className="rounded-xl bg-white p-4 ring-1 ring-stone-200">
            <div className="mb-2 flex items-center justify-between gap-2">
              <div className="flex flex-wrap items-center gap-3 text-xs text-stone-600">
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={h.entitled !== false}
                    onChange={(e) =>
                      updateHoliday(i, {
                        ...h,
                        entitled: e.target.checked,
                        taken: e.target.checked ? h.taken : false,
                      })
                    }
                  />
                  {adminT("markEntitled", lang)}
                </label>
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={h.taken}
                    disabled={h.entitled === false}
                    onChange={(e) =>
                      updateHoliday(i, { ...h, taken: e.target.checked })
                    }
                  />
                  {adminT("markTaken", lang)}
                </label>
              </div>
              <button
                type="button"
                onClick={() => deleteHoliday(i)}
                className="text-xs text-red-500"
              >
                {adminT("delete", lang)}
              </button>
            </div>
            <TrilingualFieldEditor
              value={h.name}
              onChange={(name) => updateHoliday(i, { ...h, name })}
            />
            <label className="mb-1 mt-2 block text-xs font-medium text-stone-500">
              {adminT("holidayDate", lang)}
            </label>
            <input
              value={h.date}
              onChange={(e) => updateHoliday(i, { ...h, date: e.target.value })}
              className="mb-2 w-full rounded-lg border border-stone-200 px-3 py-2 text-sm"
            />
            <label className="mb-1 block text-xs font-medium text-stone-500">
              {adminT("altDate", lang)}
            </label>
            <input
              value={h.altDate ?? ""}
              onChange={(e) =>
                updateHoliday(i, {
                  ...h,
                  altDate: e.target.value || undefined,
                })
              }
              className="mb-2 w-full rounded-lg border border-stone-200 px-3 py-2 text-sm"
            />
            <TrilingualFieldEditor
              value={h.notes ?? emptyBilingual()}
              onChange={(notes) => updateHoliday(i, { ...h, notes })}
              multiline
            />
          </div>
        ))}
        <button
          type="button"
          onClick={() => patch({ statutoryHolidays: buildStatutoryHolidays2026() })}
          className="rounded-xl bg-white px-4 py-2 text-sm font-medium text-teal-700 ring-1 ring-teal-200"
        >
          {adminT("seedHolidays2026", lang)}
        </button>
      </section>

      {/* Salary receipts */}
      <section className="space-y-3">
        <h2 className="text-sm font-bold text-stone-800">
          {adminT("salaryPayments", lang)}
        </h2>
        <p className="text-xs text-stone-500">{adminT("salaryPaymentsHint", lang)}</p>
        {salaries.map((s, i) => (
          <div key={s.id} className="rounded-xl bg-white p-4 ring-1 ring-stone-200">
            <div className="mb-2 flex items-center justify-between gap-2">
              <label className="flex items-center gap-2 text-xs text-stone-600">
                <input
                  type="checkbox"
                  checked={s.received}
                  onChange={(e) =>
                    updateSalary(i, { ...s, received: e.target.checked })
                  }
                />
                {adminT("markReceived", lang)}
              </label>
              <button
                type="button"
                onClick={() => deleteSalary(i)}
                className="text-xs text-red-500"
              >
                {adminT("delete", lang)}
              </button>
            </div>
            <TrilingualFieldEditor
              value={s.label}
              onChange={(label) => updateSalary(i, { ...s, label })}
            />
            <label className="mb-1 mt-2 block text-xs font-medium text-stone-500">
              {adminT("amountHkd", lang)}
            </label>
            <input
              type="number"
              value={s.amountHkd}
              onChange={(e) =>
                updateSalary(i, {
                  ...s,
                  amountHkd: Number(e.target.value) || 0,
                })
              }
              className="mb-2 w-full rounded-lg border border-stone-200 px-3 py-2 text-sm"
            />
            <label className="mb-1 block text-xs font-medium text-stone-500">
              {adminT("payDate", lang)}
            </label>
            <input
              value={s.payDate ?? ""}
              onChange={(e) =>
                updateSalary(i, {
                  ...s,
                  payDate: e.target.value || undefined,
                })
              }
              placeholder="YYYY-MM-DD"
              className="mb-2 w-full rounded-lg border border-stone-200 px-3 py-2 text-sm"
            />
          </div>
        ))}
        <button
          type="button"
          onClick={() => patch({ salaryPayments: buildSalaryPayments2026(5100) })}
          className="rounded-xl bg-white px-4 py-2 text-sm font-medium text-teal-700 ring-1 ring-teal-200"
        >
          {adminT("seedSalary2026", lang)}
        </button>
      </section>

      {/* Guides */}
      <section className="space-y-3">
        <h2 className="text-sm font-bold text-stone-800">
          {adminT("lifeGuides", lang)}
        </h2>
        {guides.map((g, i) => (
          <div key={g.id} className="rounded-xl bg-white p-4 ring-1 ring-stone-200">
            <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
              <span className="text-xs text-stone-400">
                #{g.priority} · {g.id}
              </span>
              <button
                type="button"
                onClick={() => deleteGuide(i)}
                className="text-xs text-red-500"
              >
                {adminT("delete", lang)}
              </button>
            </div>
            <div className="mb-2 grid grid-cols-2 gap-2 sm:grid-cols-4">
              <label className="text-xs text-stone-500">
                {adminT("category", lang)}
                <select
                  value={g.category}
                  onChange={(e) =>
                    updateGuide(i, {
                      ...g,
                      category: e.target.value as HkLifeCategory,
                    })
                  }
                  className="mt-0.5 w-full rounded-lg border border-stone-200 px-2 py-1.5 text-sm"
                >
                  {CATEGORIES.map((c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                </select>
              </label>
              <label className="text-xs text-stone-500">
                {adminT("area", lang)}
                <select
                  value={g.area}
                  onChange={(e) =>
                    updateGuide(i, {
                      ...g,
                      area: e.target.value as "hk-general" | "kwun-tong",
                    })
                  }
                  className="mt-0.5 w-full rounded-lg border border-stone-200 px-2 py-1.5 text-sm"
                >
                  <option value="hk-general">hk-general</option>
                  <option value="kwun-tong">kwun-tong</option>
                </select>
              </label>
              <label className="text-xs text-stone-500">
                {adminT("priority", lang)}
                <input
                  type="number"
                  value={g.priority}
                  onChange={(e) =>
                    updateGuide(i, {
                      ...g,
                      priority: Number(e.target.value) || 0,
                    })
                  }
                  className="mt-0.5 w-full rounded-lg border border-stone-200 px-2 py-1.5 text-sm"
                />
              </label>
              <label className="text-xs text-stone-500">
                {adminT("sourceUrl", lang)}
                <input
                  value={g.sourceUrl ?? ""}
                  onChange={(e) =>
                    updateGuide(i, {
                      ...g,
                      sourceUrl: e.target.value || undefined,
                    })
                  }
                  className="mt-0.5 w-full rounded-lg border border-stone-200 px-2 py-1.5 text-sm"
                />
              </label>
            </div>
            <p className="mb-1 text-xs font-medium text-stone-500">
              {adminT("titleEn", lang).replace("English", "…")}
            </p>
            <TrilingualFieldEditor
              value={g.title}
              onChange={(title) => updateGuide(i, { ...g, title })}
            />
            <p className="mb-1 mt-2 text-xs font-medium text-stone-500">
              {adminT("descEn", lang).replace("English", "…")}
            </p>
            <TrilingualFieldEditor
              value={g.body}
              onChange={(body) => updateGuide(i, { ...g, body })}
              multiline
            />
          </div>
        ))}
        <button
          type="button"
          onClick={addGuide}
          className="rounded-xl bg-white px-4 py-2 text-sm font-medium text-teal-700 ring-1 ring-teal-200"
        >
          {adminT("addGuide", lang)}
        </button>
      </section>

      <button
        type="button"
        disabled={saving}
        onClick={onSave}
        className="w-full rounded-xl bg-teal-600 py-3 text-sm font-semibold text-white disabled:opacity-50"
      >
        {saving ? adminT("saving", lang) : adminT("saveHkLife", lang)}
      </button>
    </div>
  );
}
