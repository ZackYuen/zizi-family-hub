"use client";

import type {
  AppContent,
  ApplianceGuide,
  ApplianceKind,
  Lang,
  PreferenceCategory,
} from "@/lib/types";
import {
  APPLIANCE_CATEGORY_ORDER,
  applianceCategory,
  applianceCategoryLabel,
} from "@/lib/appliance-categories";
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
  "water-dispenser",
  "range-hood",
  "gas-hob",
  "dehumidifier",
  "air-purifier",
  "iron",
  "shower",
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
    <div className="space-y-3">
      <div className="rounded-xl border-2 border-teal-300 bg-teal-50 px-3 py-2 text-xs text-teal-950">
        <p className="font-bold">{adminT("preferences", lang)}</p>
        <p className="mt-0.5">{adminT("preferencesHint", lang)}</p>
      </div>
      {tips.map((tip, i) => (
        <div
          key={tip.id}
          className="rounded-xl bg-white p-3 ring-2 ring-teal-100"
        >
          <div className="mb-2 flex items-center justify-between gap-2">
            <span className="rounded-full bg-teal-100 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-teal-800">
              Preference tip
            </span>
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

function sortToolsForAdmin(list: ApplianceGuide[]): ApplianceGuide[] {
  return [...list].sort((a, b) => {
    const ca = APPLIANCE_CATEGORY_ORDER.indexOf(applianceCategory(a.kind));
    const cb = APPLIANCE_CATEGORY_ORDER.indexOf(applianceCategory(b.kind));
    if (ca !== cb) return ca - cb;
    if (a.priority !== b.priority) return a.priority - b.priority;
    return a.id.localeCompare(b.id);
  });
}

/** Reorder one tool within its category; renumbers that category’s priorities 1…n. */
function moveToolInCategory(
  list: ApplianceGuide[],
  id: string,
  dir: -1 | 1
): ApplianceGuide[] {
  const sorted = sortToolsForAdmin(list);
  const item = sorted.find((a) => a.id === id);
  if (!item) return list;
  const cat = applianceCategory(item.kind);
  const peers = sorted.filter((a) => applianceCategory(a.kind) === cat);
  const peerIdx = peers.findIndex((a) => a.id === id);
  const nextIdx = peerIdx + dir;
  if (peerIdx < 0 || nextIdx < 0 || nextIdx >= peers.length) return list;

  const reordered = [...peers];
  const [moved] = reordered.splice(peerIdx, 1);
  reordered.splice(nextIdx, 0, moved);
  const priorityById = new Map(reordered.map((a, i) => [a.id, i + 1]));

  return list.map((a) =>
    priorityById.has(a.id) ? { ...a, priority: priorityById.get(a.id)! } : a
  );
}

function nextPriorityInCategory(
  list: ApplianceGuide[],
  kind: ApplianceKind
): number {
  const cat = applianceCategory(kind);
  const peers = list.filter((a) => applianceCategory(a.kind) === cat);
  if (!peers.length) return 1;
  return Math.max(...peers.map((a) => a.priority || 0)) + 1;
}

export function AppliancesAdmin({
  content,
  setContent,
  lang,
  saving,
  onSave,
}: ToolsProps) {
  const list = content.appliances ?? [];
  const sorted = sortToolsForAdmin(list);

  const patch = (appliances: AppContent["appliances"]) => {
    setContent({ ...content, appliances });
  };

  const updateById = (id: string, next: ApplianceGuide) => {
    patch(list.map((a) => (a.id === id ? next : a)));
  };

  return (
    <div className="space-y-4">
      <p className="text-xs text-stone-600">{adminT("appliancesHint", lang)}</p>
      {sorted.map((item, sortedIndex) => {
        const cat = applianceCategory(item.kind);
        const peers = sorted.filter((a) => applianceCategory(a.kind) === cat);
        const peerIdx = peers.findIndex((a) => a.id === item.id);
        const prevCat =
          sortedIndex > 0
            ? applianceCategory(sorted[sortedIndex - 1].kind)
            : null;
        const showCategory = cat !== prevCat;

        return (
          <div key={item.id}>
            {showCategory ? (
              <p className="mb-2 mt-1 text-[11px] font-bold uppercase tracking-wide text-stone-500">
                {applianceCategoryLabel(cat, lang)}
              </p>
            ) : null}
            <div className="rounded-xl bg-white p-4 ring-1 ring-stone-200">
              <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
                <select
                  className="rounded border border-stone-200 px-2 py-1 text-xs"
                  value={item.kind}
                  onChange={(e) => {
                    const kind = e.target.value as ApplianceKind;
                    updateById(item.id, {
                      ...item,
                      kind,
                      priority: nextPriorityInCategory(
                        list.filter((a) => a.id !== item.id),
                        kind
                      ),
                    });
                  }}
                >
                  {APPLIANCE_KINDS.map((k) => (
                    <option key={k} value={k}>
                      {k} · {applianceCategoryLabel(applianceCategory(k), lang)}
                    </option>
                  ))}
                </select>
                <label className="flex items-center gap-1 text-[11px] text-stone-500">
                  {adminT("priority", lang)}
                  <input
                    type="number"
                    min={0}
                    className="w-14 rounded border border-stone-200 px-1.5 py-0.5 text-xs"
                    value={item.priority}
                    onChange={(e) =>
                      updateById(item.id, {
                        ...item,
                        priority: Number(e.target.value) || 0,
                      })
                    }
                  />
                </label>
                <div className="flex items-center gap-0.5">
                  <button
                    type="button"
                    onClick={() => patch(moveToolInCategory(list, item.id, -1))}
                    disabled={peerIdx <= 0}
                    className="rounded px-1.5 py-0.5 text-xs text-stone-500 ring-1 ring-stone-200 disabled:opacity-30"
                    aria-label={adminT("moveUp", lang)}
                    title={adminT("moveUp", lang)}
                  >
                    ▲
                  </button>
                  <button
                    type="button"
                    onClick={() => patch(moveToolInCategory(list, item.id, 1))}
                    disabled={peerIdx < 0 || peerIdx >= peers.length - 1}
                    className="rounded px-1.5 py-0.5 text-xs text-stone-500 ring-1 ring-stone-200 disabled:opacity-30"
                    aria-label={adminT("moveDown", lang)}
                    title={adminT("moveDown", lang)}
                  >
                    ▼
                  </button>
                </div>
                <button
                  type="button"
                  className="text-xs text-red-500"
                  onClick={() => patch(list.filter((a) => a.id !== item.id))}
                >
                  {adminT("delete", lang)}
                </button>
              </div>
              <input
                className="mb-2 w-full rounded border border-stone-200 px-2 py-1 text-xs"
                placeholder="Model (e.g. Dyson V12)"
                value={item.model || ""}
                onChange={(e) =>
                  updateById(item.id, { ...item, model: e.target.value })
                }
              />
              <input
                className="mb-2 w-full rounded border border-stone-200 px-2 py-1 text-xs"
                placeholder="Manual / support URL"
                value={item.sourceUrl || ""}
                onChange={(e) =>
                  updateById(item.id, { ...item, sourceUrl: e.target.value })
                }
              />
              <p className="mb-1 text-[11px] font-medium text-stone-500">
                Panel buttons are edited in seed / patch (inline Tools diagram).
                Optional photo URL below is fallback only.
              </p>
              <input
                className="mb-3 w-full rounded border border-stone-200 px-2 py-1 text-xs"
                placeholder="Optional photo URL (prefer inline panelButtons)"
                value={item.imageUrl || ""}
                onChange={(e) =>
                  updateById(item.id, { ...item, imageUrl: e.target.value })
                }
              />
              <div className="space-y-3">
                <TrilingualFieldEditor
                  value={item.title}
                  onChange={(v) => updateById(item.id, { ...item, title: v })}
                />
                <div>
                  <p className="mb-1 text-xs font-medium text-stone-500">
                    {adminT("applianceTips", lang)}
                  </p>
                  <TrilingualFieldEditor
                    value={item.tips}
                    onChange={(v) => updateById(item.id, { ...item, tips: v })}
                    multiline
                  />
                </div>
                <div>
                  <p className="mb-1 text-xs font-medium text-amber-800">
                    {adminT("applianceWarnings", lang)}
                  </p>
                  <TrilingualFieldEditor
                    value={item.warnings ?? emptyBilingual()}
                    onChange={(v) =>
                      updateById(item.id, { ...item, warnings: v })
                    }
                    multiline
                  />
                </div>
              </div>
            </div>
          </div>
        );
      })}
      <button
        type="button"
        onClick={() => {
          const kind: ApplianceKind = "other";
          patch([
            ...list,
            {
              id: `app-${Date.now()}`,
              kind,
              priority: nextPriorityInCategory(list, kind),
              title: {
                en: "New appliance",
                fil: "Bagong appliance",
                zh: "新家電",
              },
              tips: emptyBilingual(),
              warnings: emptyBilingual(),
            },
          ]);
        }}
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
