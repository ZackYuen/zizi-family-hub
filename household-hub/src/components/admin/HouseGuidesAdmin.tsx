"use client";

import type {
  AppContent,
  ApplianceKind,
  Lang,
  PreferenceCategory,
} from "@/lib/types";
import { adminT } from "@/lib/admin-i18n";
import { TrilingualFieldEditor } from "./TrilingualFieldEditor";
import { emptyBilingual } from "@/lib/localized-text";

const PREF_CATEGORIES: PreferenceCategory[] = [
  "shopping",
  "food",
  "kitchen",
  "general",
];

const APPLIANCE_KINDS: ApplianceKind[] = [
  "vacuum",
  "rice-cooker",
  "pressure-cooker",
  "washing-machine",
  "bread-machine",
  "air-fryer",
  "other",
];

interface PrefProps {
  content: AppContent;
  setContent: (c: AppContent) => void;
  lang: Lang;
}

/** Soft preferences CRUD — embed under Admin Rules section */
export function PreferencesAdmin({ content, setContent, lang }: PrefProps) {
  const tips = content.familyPreferences ?? [];

  const patch = (familyPreferences: AppContent["familyPreferences"]) => {
    setContent({ ...content, familyPreferences });
  };

  return (
    <div className="space-y-3 rounded-xl bg-teal-50/80 p-4 ring-1 ring-teal-100">
      <div>
        <h3 className="text-sm font-bold text-teal-950">
          {adminT("preferences", lang)}
        </h3>
        <p className="mt-0.5 text-xs text-teal-800">
          {adminT("preferencesHint", lang)}
        </p>
      </div>
      {tips.map((tip, i) => (
        <div key={tip.id} className="rounded-xl bg-white p-3 ring-1 ring-stone-200">
          <div className="mb-2 flex items-center justify-between gap-2">
            <select
              className="rounded border border-stone-200 px-2 py-1 text-xs"
              value={tip.category}
              onChange={(e) => {
                const list = [...tips];
                list[i] = {
                  ...tip,
                  category: e.target.value as PreferenceCategory,
                };
                patch(list);
              }}
            >
              {PREF_CATEGORIES.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
            <button
              type="button"
              className="text-xs text-red-500"
              onClick={() => {
                const list = [...tips];
                list.splice(i, 1);
                patch(list);
              }}
            >
              {adminT("delete", lang)}
            </button>
          </div>
          <div className="space-y-2">
            <TrilingualFieldEditor
              value={tip.title}
              onChange={(v) => {
                const list = [...tips];
                list[i] = { ...tip, title: v };
                patch(list);
              }}
            />
            <TrilingualFieldEditor
              value={tip.body}
              onChange={(v) => {
                const list = [...tips];
                list[i] = { ...tip, body: v };
                patch(list);
              }}
              multiline
            />
          </div>
        </div>
      ))}
      <button
        type="button"
        onClick={() =>
          patch([
            ...tips,
            {
              id: `pref-${Date.now()}`,
              category: "general",
              priority: tips.length + 1,
              title: {
                en: "New preference",
                fil: "Bagong preference",
                zh: "新偏好",
              },
              body: emptyBilingual(),
            },
          ])
        }
        className="rounded-lg bg-white px-3 py-1.5 text-sm font-medium text-teal-700 ring-1 ring-teal-200"
      >
        {adminT("addPreference", lang)}
      </button>
    </div>
  );
}

interface ToolsProps {
  content: AppContent;
  setContent: (c: AppContent) => void;
  lang: Lang;
  saving: boolean;
  onSave: () => void;
}

export function AppliancesAdmin({
  content,
  setContent,
  lang,
  saving,
  onSave,
}: ToolsProps) {
  const list = content.appliances ?? [];

  const patch = (appliances: AppContent["appliances"]) => {
    setContent({ ...content, appliances });
  };

  return (
    <div className="space-y-4">
      <p className="text-xs text-stone-600">{adminT("appliancesHint", lang)}</p>
      {list.map((item, i) => (
        <div key={item.id} className="rounded-xl bg-white p-4 ring-1 ring-stone-200">
          <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
            <select
              className="rounded border border-stone-200 px-2 py-1 text-xs"
              value={item.kind}
              onChange={(e) => {
                const next = [...list];
                next[i] = { ...item, kind: e.target.value as ApplianceKind };
                patch(next);
              }}
            >
              {APPLIANCE_KINDS.map((k) => (
                <option key={k} value={k}>
                  {k}
                </option>
              ))}
            </select>
            <button
              type="button"
              className="text-xs text-red-500"
              onClick={() => {
                const next = [...list];
                next.splice(i, 1);
                patch(next);
              }}
            >
              {adminT("delete", lang)}
            </button>
          </div>
          <div className="space-y-3">
            <TrilingualFieldEditor
              value={item.title}
              onChange={(v) => {
                const next = [...list];
                next[i] = { ...item, title: v };
                patch(next);
              }}
            />
            <div>
              <p className="mb-1 text-xs font-medium text-stone-500">
                {adminT("applianceTips", lang)}
              </p>
              <TrilingualFieldEditor
                value={item.tips}
                onChange={(v) => {
                  const next = [...list];
                  next[i] = { ...item, tips: v };
                  patch(next);
                }}
                multiline
              />
            </div>
            <div>
              <p className="mb-1 text-xs font-medium text-amber-800">
                {adminT("applianceWarnings", lang)}
              </p>
              <TrilingualFieldEditor
                value={item.warnings ?? emptyBilingual()}
                onChange={(v) => {
                  const next = [...list];
                  next[i] = { ...item, warnings: v };
                  patch(next);
                }}
                multiline
              />
            </div>
          </div>
        </div>
      ))}
      <button
        type="button"
        onClick={() =>
          patch([
            ...list,
            {
              id: `app-${Date.now()}`,
              kind: "other",
              priority: list.length + 1,
              title: {
                en: "New appliance",
                fil: "Bagong appliance",
                zh: "新家電",
              },
              tips: emptyBilingual(),
              warnings: emptyBilingual(),
            },
          ])
        }
        className="rounded-xl bg-white px-4 py-2 text-sm font-medium text-teal-700 ring-1 ring-teal-200"
      >
        {adminT("addAppliance", lang)}
      </button>
      <button
        type="button"
        disabled={saving}
        onClick={onSave}
        className="ml-2 rounded-xl bg-teal-600 px-4 py-2 text-sm font-semibold text-white disabled:opacity-50"
      >
        {saving ? adminT("saving", lang) : adminT("saveAppliances", lang)}
      </button>
    </div>
  );
}
